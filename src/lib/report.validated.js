// src/lib/report.validated.js
// Drop-in-Report: validierte Kerne (PHQ-9, GAD-7, PCL-5) + gewichtete Module + Medikations-Kontext.
// Keine UI-Änderung erforderlich.

import { METRICS } from "../data/metrics";
import { scoreMetric } from "./scoring";
import { calibratedRaw } from "./calibration";
import { BENZO_EQ } from "../data/meds";      // für grobe Diazepam-Äquivalente
import { BANK } from "../data/bank";
import WEIGHTS from "../data/weights.json";

// ---------- Helpers ----------
const getModule = (id) => BANK.find((m) => m.id === id);
const scaleRange = (m) => {
  const vals = (m?.scale || []).map((o) => o.value);
  if (!vals.length) return [0, 1];
  return [Math.min(...vals), Math.max(...vals)];
};

// generisches, gewichtetes Scoring für Bank-Module (keine Hochrechnung bei Skips!)
function scoreBankModule(
  id,
  ans,
  { uiMax = 16, positive = false, filterPrefix = null } = {}
) {
  const mod = getModule(id);
  if (!mod?.items?.length) return { raw: null, band: 1, completeness: 0, pct: 0 };

  const [minV, maxV] = scaleRange(mod);
  const width = maxV - minV;
  if (width <= 0) return { raw: null, band: 1, completeness: 0, pct: 0 };

  // optionale Gewichte pro Modul/Item aus weights.json (z. B. "OCD", "SELF", ...)
  const groupKey = id.toUpperCase();
  const G = (WEIGHTS && WEIGHTS[groupKey] && WEIGHTS[groupKey].weights) || {};

  let sum = 0;
  let denom = 0;   // max erreichbare Punktzahl über **beantwortete** Items
  let answered = 0;
  let applicable = 0;

  for (const it of mod.items) {
    if (filterPrefix && !String(it.key).startsWith(filterPrefix)) continue;
    applicable++;
    const val = ans[it.key];
    if (val == null) continue; // Skips nicht hochrechnen
    const w = typeof G[it.key] === "number" ? G[it.key] : 1;
    sum += (val - minV) * w;
    denom += width * w;
    answered++;
  }

  const totalApplicable = applicable || (filterPrefix
    ? mod.items.filter((i) => String(i.key).startsWith(filterPrefix)).length
    : mod.items.length);

  const completeness = totalApplicable ? answered / totalApplicable : 0;
  if (answered === 0 || denom === 0) return { raw: null, band: 1, completeness: 0, pct: 0 };

  // Prozentwert nur auf Basis der **beantworteten** Items (fair bei Skips)
  const pct = Math.max(0, Math.min(1, sum / denom));
  const rawUi = Math.round(pct * uiMax);

  // Bänder: 0..4 in 20%-Schritten – UI interpretiert positive/negative Konstrukte über Text
  const band = Math.min(4, Math.floor(pct * 5));

  return { raw: rawUi, band, completeness, pct, positive };
}

// konservative Medikations-Interpretation (Kontext, keine Score-Manipulation)
function deriveMedImpact(ans, anxRaw) {
  const meds = Array.isArray(ans.meds_list) ? ans.meds_list : [];
  const classes = (cls) => meds.filter((m) => (m.class || "").toUpperCase() === cls);

  const has = {
    SSRI: classes("SSRI").length > 0,
    SNRI: classes("SNRI").length > 0,
    BENZO: classes("BENZO").length > 0,
    STIM: classes("STIM").length > 0,
    APS: classes("APS").length > 0,
    MS: classes("MS").length > 0,
    ZDRUG: classes("ZDRUG").length > 0,
    OPIOID: classes("OPIOID").length > 0,
  };

  // grobe Diazepam-Äquivalente/Tag
  const benzoDiazEq = meds
    .filter((m) => (m.class || "").toUpperCase() === "BENZO")
    .reduce((sum, m) => {
      const f = BENZO_EQ[m.name] ?? 0;
      const dose = Number(m.doseMgPerDay) || 0;
      return sum + f * dose;
    }, 0);

  const notes = [];
  const ddxHints = [];

  // frühe SSRI/SNRI-Phase → mögliche Aktivierung
  const earlySerotonergic = meds.some(
    (m) =>
      ["SSRI", "SNRI"].includes((m.class || "").toUpperCase()) &&
      (Number(m.durationWeeks) || 0) < 3
  );
  if (earlySerotonergic) {
    notes.push("Frühe SSRI/SNRI-Phase (<3 Wochen): vorübergehende Aktivierung/Unruhe möglich.");
    if ((anxRaw ?? 0) >= 10)
      ddxHints.push("Erhöhte Angstwerte können durch frühe SSRI/SNRI-Phase mitbedingt sein.");
  }

  // Benzodiazepine → können Angst maskieren
  if (has.BENZO) {
    notes.push(
      `Benzodiazepine gemeldet; geschätzte Diazepam-Äquivalente ~${Math.round(
        benzoDiazEq
      )} mg/Tag (sehr grob).`
    );
    if (benzoDiazEq >= 10) {
      ddxHints.push(
        "Angst-Scores könnten durch Benzodiazepine maskiert sein (klinische Verlaufskontrolle sinnvoll)."
      );
    }
  }

  // Stimulanzien → Angst/Unruhe ↑ möglich
  if (has.STIM) {
    ddxHints.push(
      "Stimulanzien können Angst/Unruhe verstärken – Differenzial: ADHS vs. angstbedingte Aktivierung."
    );
  }

  // Sedativa (APS/Z-Drug/Opioid) → beeinflussen Schlaf/Körperstress
  if (has.APS || has.ZDRUG || has.OPIOID) {
    notes.push("Sedierende Medikation gemeldet – kann Schlaf/Körperstress beeinflussen.");
  }

  // Lithium (Kontext, kein Score-Ersatz)
  if (meds.some((m) => (m.name || "").toLowerCase().includes("lithium"))) {
    notes.push(
      "Lithium gemeldet – suizidprotektiver Effekt bekannt (Kontextinformation, kein Score-Ersatz)."
    );
  }

  return {
    list: meds.map((m) => ({
      name: m.name,
      class: m.class,
      doseMgPerDay: Number(m.doseMgPerDay) || null,
      freqPerDay: Number(m.freqPerDay) || null,
      durationWeeks: Number(m.durationWeeks) || null,
    })),
    notes,
    ddxHints,
    diazepamEqMgPerDay: Math.round(benzoDiazEq) || 0,
  };
}

// ---------- Hauptfunktion ----------
export function buildReportUpgraded(ans, progressPct = 0) {
  // 1) Validierte Kerne
  const phq = scoreMetric("PHQ9", ans); // 0..27
  const gad = scoreMetric("GAD7", ans); // 0..21
  const pcl = scoreMetric("PCL5", ans); // 0..80

  // 2) Optionale Kalibrierung (bewahrt Rohskalen-Logik, feinjustiert via weights.json)
  const moodRaw = calibratedRaw(phq.raw, "PHQ9X", ans) ?? phq.raw;
  const anxRaw  = calibratedRaw(gad.raw, "GAD7X", ans) ?? gad.raw;
  const ptsdRawTrue = calibratedRaw(pcl.raw, "PCL5X", ans) ?? pcl.raw;

  // 3) UI-Skalierung für PCL-5 (0..80 → 0..16), Bänder bleiben anhand des echten Scores
  const pclUiMax = METRICS.PCL5.uiMax || 16;
  const pclTrueMax = METRICS.PCL5.trueMax || 80;
  const ptsdRawUi = ptsdRawTrue == null
    ? null
    : Math.round((ptsdRawTrue / pclTrueMax) * pclUiMax);

  const mood = { ...phq, raw: moodRaw };
  const anx  = { ...gad, raw: anxRaw };
  const ptsd = { ...pcl, raw: ptsdRawUi };

  // 4) Erweiterte Module (gewichtetes Prozent-Scoring, keine Hochrechnung)
  const ocd  = scoreBankModule("ocd",  ans, { uiMax: 8,  positive: false });

  // Selbstbild (nur s_*)
  const self = scoreBankModule("self", ans, { uiMax: 16, positive: true,  filterPrefix: "s_" });

  // Beziehungen: r_* (in self und/oder rel)
  const relSelf = scoreBankModule("self", ans, { uiMax: 16, positive: true,  filterPrefix: "r_" });
  const relRel  = scoreBankModule("rel",  ans, { uiMax: 16, positive: true,  filterPrefix: "r_" });
  const rel = (() => {
    if (relSelf.raw == null) return relRel;
    if (relRel.raw == null)  return relSelf;
    const raw = Math.round((relSelf.raw + relRel.raw) / 2);
    const band = Math.round((relSelf.band + relRel.band) / 2);
    const completeness = Math.max(relSelf.completeness, relRel.completeness);
    const pct = (relSelf.pct + relRel.pct) / 2;
    return { raw, band, completeness, pct, positive: true };
  })();

  const som  = scoreBankModule("som",  ans, { uiMax: 8,  positive: false });
  const cog  = scoreBankModule("cog",  ans, { uiMax: 8,  positive: false });
  const res  = scoreBankModule("res",  ans, { uiMax: 20, positive: true  });

  // 5) Medikation (Kontext, konservative Regeln)
  const medImpact = deriveMedImpact(ans, anxRaw);

  // 6) Ergebnisobjekt (UI-kompatibel)
  return {
    progress: progressPct,
    mood,
    anx,
    ptsd,
    ptsdTrueRaw: ptsdRawTrue, // für die Validated-Anzeige
    ocd,
    self,
    rel,
    som,
    cog,
    res,
    func: { raw: null },       // Platzhalter – kann später valide skaliert werden
    tasks: {},
    medImpact,                 // für SummaryCard (Anzeige & DDX-Hinweise)
  };
}
