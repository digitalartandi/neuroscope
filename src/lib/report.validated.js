// src/lib/report.validated.js
// Erweiterte Auswertung: validierte Kerne + Cluster + Konfidenzen + Red-Flags.
// UI bleibt unverändert (gleiche Felder), zusätzlich dx/red_flags/quality/meds.

import { scoreMetric } from "./scoring";           // nutzt: scoreMetric("PHQ9" | "GAD7" | "PCL5", ans)
import { BENZO_EQ } from "../data/meds";
import { BANK } from "../data/bank";
import WEIGHTS from "../data/weights.json";

// ---------- Helper aus Bestand ----------
const getModule = (id) => BANK.find((m) => m.id === id);
const scaleRange = (m) => {
  const vals = (m?.scale || []).map((o) => o.value);
  if (!vals.length) return [0, 1];
  return [Math.min(...vals), Math.max(...vals)];
};

// ---------- Generisches Modul-Scoring (wie gehabt) ----------
function scoreBankModule(id, ans, { uiMax = 16, positive = false, filterPrefix = null } = {}) {
  const mod = getModule(id);
  if (!mod?.items?.length) return { raw: null, band: 1, completeness: 0, pct: 0, positive };

  const [minV, maxV] = scaleRange(mod);
  const width = maxV - minV;
  if (width <= 0) return { raw: null, band: 1, completeness: 0, pct: 0, positive };

  const groupKey = id.toUpperCase();
  const G = (WEIGHTS && WEIGHTS[groupKey] && WEIGHTS[groupKey].weights) || {};

  let sum = 0, denom = 0, answered = 0, applicable = 0;
  for (const it of mod.items) {
    if (filterPrefix && !String(it.key).startsWith(filterPrefix)) continue;
    applicable++;
    const val = ans[it.key];
    if (val == null) continue;
    const w = typeof G[it.key] === "number" ? G[it.key] : 1;
    sum += (val - minV) * w;
    denom += width * w;
    answered++;
  }

  const totalApplicable = applicable || (filterPrefix
    ? mod.items.filter((i) => String(i.key).startsWith(filterPrefix)).length
    : mod.items.length);

  const completeness = totalApplicable ? answered / totalApplicable : 0;
  if (answered === 0 || denom === 0) return { raw: null, band: 1, completeness: 0, pct: 0, positive };

  const pct = Math.max(0, Math.min(1, sum / denom));
  const rawUi = Math.round(pct * uiMax);
  const band = Math.min(4, Math.floor(pct * 5));
  return { raw: rawUi, band, completeness, pct, positive };
}

// ---------- Werte je Modul (0..1) für CI/Qualität ----------
function normalizedAnswersForModule(id, ans, filterPrefix = null) {
  const mod = getModule(id);
  if (!mod?.items?.length) return [];
  const [minV, maxV] = scaleRange(mod);
  const width = maxV - minV || 1;
  const vals = [];
  for (const it of mod.items) {
    if (filterPrefix && !String(it.key).startsWith(filterPrefix)) continue;
    const v = ans[it.key];
    if (v == null) continue;
    vals.push((v - minV) / width); // 0..1
  }
  return vals;
}

// ---------- simple Bootstrap-CI auf 0..1 Skala ----------
function ci01(values, reps = 200) {
  const arr = (values || []).map(Number).filter((v) => Number.isFinite(v));
  if (!arr.length) return null;
  const n = arr.length;
  const sims = [];
  for (let r = 0; r < reps; r++) {
    let s = 0;
    for (let i = 0; i < n; i++) s += arr[Math.floor(Math.random() * n)];
    sims.push(s / n);
  }
  sims.sort((a, b) => a - b);
  const lo = sims[Math.floor(reps * 0.025)];
  const hi = sims[Math.floor(reps * 0.975)];
  return [Math.max(0, lo), Math.min(1, hi)];
}

// ---------- Medikation (deine Basis leicht erweitert) ----------
function deriveMedImpact(ans, anxRaw) {
  const meds = Array.isArray(ans.meds_list) ? ans.meds_list : [];
  const classes = (cls) => meds.filter((m) => (m.class || "").toUpperCase() === cls);

  const has = {
    SSRI: classes("SSRI").length > 0,
    SNRI: classes("SNRI").length > 0,
    BENZO: classes("BENZO").length > 0,
    STIM: classes("STIM").length > 0,
    APS: classes("APS").length > 0,
  };

  const benzoDiazEq = meds
    .filter((m) => (m.class || "").toUpperCase() === "BENZO")
    .reduce((sum, m) => {
      const f = BENZO_EQ[m.name] ?? 0;
      const dose = Number(m.doseMgPerDay) || 0;
      return sum + f * dose;
    }, 0);

  const notes = [];
  const ddxHints = [];

  const earlySerotonergic = meds.some(
    (m) =>
      ["SSRI", "SNRI"].includes((m.class || "").toUpperCase()) &&
      (Number(m.durationWeeks) || 0) < 3
  );
  if (earlySerotonergic) {
    notes.push("Frühe SSRI/SNRI-Phase (<3 Wochen): vorübergehende Aktivierung/Unruhe möglich.");
    if ((anxRaw ?? 0) >= 10) ddxHints.push("Erhöhte Angstwerte können durch frühe SSRI/SNRI-Phase mitbedingt sein.");
  }
  if (has.BENZO) {
    notes.push(`Benzodiazepine gemeldet; grobe Diazepam-Äquivalente ~${Math.round(benzoDiazEq)} mg/Tag (sehr grob).`);
    ddxHints.push("Benzodiazepine können Angst/Anspannung temporär maskieren.");
  }
  if (has.STIM) ddxHints.push("Stimulanzien können Unruhe/Angst verstärken – Kontext beachten.");
  if (has.APS) ddxHints.push("Antipsychotika können Psychose-Symptome maskieren – Konfidenz vorsichtig interpretieren.");

  return { notes, ddxHints, has, benzoDiazEq };
}

// ---------- Response-Qualität (sanfte Konfidenz-Dämpfung) ----------
function responseQuality(ans, moduleId) {
  const mod = getModule(moduleId);
  if (!mod?.items?.length) return { straightlining: false, inconsistency: 0 };
  const vals = mod.items.map((it) => ans[it.key]).filter((v) => v != null);
  if (!vals.length) return { straightlining: false, inconsistency: 0 };
  const straightlining = vals.length >= 6 && vals.every((v) => v === vals[0]);
  // Mini-Inkonsequenz: extrem geringe Varianz über viele Items
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const varc = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
  const inconsistency = varc < 0.01 ? 0.1 : 0; // 0..1 (kleine Dämpfung)
  return { straightlining, inconsistency };
}

// ---------- Konsistenz-Indizes für Dep/Anx ----------
function consistencyIndices({ mood, sleep, func, som, cog }) {
  const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const depCI = avg([sleep?.pct, func?.pct, som?.pct, cog?.pct].filter((v) => Number.isFinite(v)));
  const anxCI = avg([som?.pct, sleep?.pct].filter((v) => Number.isFinite(v)));
  return { depCI, anxCI };
}

const clamp01 = (x) => Math.max(0, Math.min(1, x));
const pctToBand = (p) => Math.min(4, Math.floor(clamp01(p) * 5));
function confidence({ band, completeness, support = 0.5 }) {
  const b = (band ?? 0) / 4, c = clamp01(completeness ?? 0), s = clamp01(support);
  return clamp01(0.5 * b + 0.3 * s + 0.2 * c);
}

// ---------- Cluster/Hinweise ----------
function ptssClusters(ans) {
  const yes = (k) => (ans[k] ?? 0) >= 2;
  const B = ["t_intrusions","t_nightmares","t_flashbacks","t_intrusive_thoughts"].some(yes);
  const C = ["t_avoid","t_avoidance_of_people"].some(yes);
  const D = ["t_negative","t_guilt","t_shame","t_detachment","t_emotional_numbness"].filter(yes).length >= 2;
  const E = ["t_hypervigilance","t_irritability","t_sleep_disturbance","t_concentration_problems","t_hyperarousal"].filter(yes).length >= 2;
  return { B, C, D, E, ok: B && C && D && E };
}
function ocdHeuristics(ans) {
  const highObs = (ans["o_obs"] ?? 0) >= 2;
  const rituals = ["o_comp","o_checking","o_cleaning","o_counting","o_ordering"].filter(k => (ans[k] ?? 0) >= 2).length >= 1;
  const burden = (ans["o_time_consuming"] ?? 0) >= 2 || (ans["o_functional_impairment"] ?? 0) >= 2 || (ans["o_emotional_distress"] ?? 0) >= 2;
  return { highObs, rituals, burden, ok: highObs && rituals && burden };
}
function bpdHints(ans, selfPct, relPct) {
  const idDisturb = (ans["s_identity_confusion"] ?? 0) >= 2 || (ans["s_coherence"] ?? 0) <= 1;
  const emoInstab = (ans["s_emotional_instability"] ?? 0) >= 2;
  const abandonment = (ans["r_fear_of_abandonment"] ?? 0) >= 2;
  const rejectionFear = (ans["r_fear_of_rejection"] ?? 0) >= 2;
  const relInstab = abandonment || rejectionFear || (relPct ?? 0) >= 0.6;
  return { idDisturb, emoInstab, relInstab, ok: (idDisturb && emoInstab && relInstab) };
}
function bipolarHints(ans) {
  const yes = (k) => (ans[k] ?? 0) >= 2;
  const core = ["bp_sleepneed","bp_activity","bp_talk","bp_ideas","bp_risk"].filter(yes).length >= 3;
  const impulse = ["bp_impulsivity","bp_spending_spree","bp_high_risk_taking","bp_sexual_activity"].filter(yes).length >= 2;
  return { core, impulse, ok: core || impulse };
}
function psychosisHints(ans) {
  const yes = (k) => (ans[k] ?? 0) >= 2;
  const positive = ["ps_hallucinations","ps_delusions","ps_passivity_experience"].some(yes);
  const disorg = ["ps_disorganized_speech","ps_incoherent_thoughts","ps_bizarre_behavior"].some(yes);
  return { positive, disorg, ok: positive || disorg };
}

// ---------- Konfidenz-Adjustments ----------
function adjustConfidence(base, { medsCtx, quality }) {
  let c = base;
  if (medsCtx?.has?.BENZO) c -= 0.10;
  if (medsCtx?.has?.APS) c -= 0.10;
  if (quality?.straightlining) c -= 0.08;
  c -= quality?.inconsistency || 0;
  return clamp01(c);
}

/* =========================
   H A U P T - F U N K T I O N
   ========================= */
export function buildReportUpgraded(ans = {}) {
  // 1) Validierte Kerne (neue scoring-Signatur: ID + Antworten)
  const phq9 = scoreMetric("PHQ9", ans);  // raw: 0..27, band, completeness, se
  const gad7 = scoreMetric("GAD7", ans);  // raw: 0..21, band, completeness, se
  const pcl5 = scoreMetric("PCL5", ans);  // raw: 0..80, band, completeness, se

  // Prozentwerte & UI-kompatible raw-Werte berechnen (Balken bleiben 27/21/16)
  const moodPct = phq9.raw != null ? phq9.raw / 27 : 0;
  const anxPct  = gad7.raw != null ? gad7.raw / 21 : 0;
  const pclPct  = pcl5.raw != null ? pcl5.raw / 80 : 0;

  const mood = { raw: phq9.raw ?? 0, band: phq9.band, completeness: phq9.completeness, pct: moodPct, positive: false, se: phq9.se };
  const anx  = { raw: gad7.raw ?? 0, band: gad7.band, completeness: gad7.completeness, pct: anxPct,  positive: false, se: gad7.se  };
  // PCL-5 wird für die UI-Balken auf 0..16 skaliert, band bleibt aus scoring():
  const ptsd = { raw: Math.round(pclPct * 16), band: pcl5.band, completeness: pcl5.completeness, pct: pclPct, positive: false, se: pcl5.se };

  // 2) Bank-Module
  const ocd   = scoreBankModule("ocd", ans, { uiMax: 8 });
  const self  = scoreBankModule("self", ans, { uiMax: 16, positive: true });
  const rel   = scoreBankModule("rel",  ans, { uiMax: 16, positive: true });
  const som   = scoreBankModule("som",  ans, { uiMax: 8 });
  const cog   = scoreBankModule("cog",  ans, { uiMax: 8 });
  const res   = scoreBankModule("res",  ans, { uiMax: 20, positive: true });
  const func  = scoreBankModule("func", ans, { uiMax: 16, positive: true });
  const sleep = scoreBankModule("sleep",ans, { uiMax: 16 });
  const adhd  = scoreBankModule("adhd", ans, { uiMax: 16 });
  const diss  = scoreBankModule("diss", ans, { uiMax: 16 });
  const eat   = scoreBankModule("eat",  ans, { uiMax: 16 });
  const bp    = scoreBankModule("bp",   ans, { uiMax: 16 });
  const psychosis = scoreBankModule("psy", ans, { uiMax: 16 });
  const stress = scoreBankModule("stress", ans, { uiMax: 16 });
  const pain   = scoreBankModule("pain", ans, { uiMax: 16 });

  // 3) Zusatz: CI und Qualität
  const ci_mood = ci01(normalizedAnswersForModule("mood", ans));
  const ci_anx = ci01(normalizedAnswersForModule("anx", ans));
  const ci_ptsd = ci01(normalizedAnswersForModule("ptsd", ans));
  const quality_mood = responseQuality(ans, "mood");
  const quality_anx = responseQuality(ans, "anx");
  const quality_ptsd = responseQuality(ans, "ptsd");

  // 4) Medikation/Kontext (anxRaw sinnvollerweise aus GAD-7)
  const medCtx = deriveMedImpact(ans, gad7?.raw);

  // 5) Konsistenz-Indizes & Cluster
  const { depCI, anxCI } = consistencyIndices({ mood, sleep, func, som, cog });
  const ptss = ptssClusters(ans);
  const ocdH = ocdHeuristics(ans);
  const bpdH = bpdHints(ans, self?.pct, rel?.pct);
  const bpH  = bipolarHints(ans);
  const psyH = psychosisHints(ans);

  // 6) Red Flags
  const red_flags = [];
  const acuteSuicide = (ans["m_suicide"] ?? 0) >= 2 || (ans["m_suicide_ideation"] ?? 0) >= 2;
  if (acuteSuicide) red_flags.push("Akute Suizidgedanken gemeldet (Screening).");
  if (psyH.ok && (psychosis.band >= 3)) red_flags.push("Psychose-Hinweise (Screening).");

  // 7) Differentialdiagnosen (Konfidenzen)
  const dx = [];

  // Depression
  {
    let conf = confidence({ band: mood.band, completeness: mood.completeness, support: depCI });
    conf = adjustConfidence(conf, { medsCtx: medCtx, quality: quality_mood });
    dx.push({
      code: "DEP",
      label: "Depressive Störung/Episode (Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `PHQ-9 Band ${mood.band}`,
        depCI >= .5 ? "Konsistenz: Schlaf/Funktion/Kognition stützen" : "Begrenzte Stützung (Schlaf/Funktion/Kognition)",
      ],
    });
  }

  // Angst
  {
    let conf = confidence({ band: anx.band, completeness: anx.completeness, support: anxCI });
    conf = adjustConfidence(conf, { medsCtx: medCtx, quality: quality_anx });
    dx.push({
      code: "ANX",
      label: "Angststörung (GAS/unspez.) (Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `GAD-7 Band ${anx.band}`,
        anxCI >= .5 ? "Somatik/Schlaf konsistent" : "Somatik/Schlaf wenig konsistent",
        ...(medCtx.ddxHints || []),
      ],
    });
  }

  // PTBS
  {
    let conf = confidence({ band: ptsd.band, completeness: ptsd.completeness, support: ptss.ok ? 0.9 : 0.4 });
    conf = adjustConfidence(conf, { medsCtx: medCtx, quality: quality_ptsd });
    dx.push({
      code: "PTSD",
      label: "Posttraumatische Belastungsstörung (Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `PCL-nahe Band ${ptsd.band}`,
        ptss.ok ? "Kriterien-Cluster erfüllt (B/C/D/E)." : "Kriterien-Cluster unvollständig.",
      ],
    });
  }

  // Zwang
  {
    let conf = confidence({ band: ocd.band, completeness: ocd.completeness, support: ocdH.ok ? 0.9 : 0.4 });
    dx.push({
      code: "OCD",
      label: "Zwangsstörung (Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `Zwänge Band ${ocd.band}`,
        ocdH.ok ? "Zwangsgedanken + Rituale + Leidensdruck/Interferenz gegeben." : "Hinweise unvollständig.",
      ],
    });
  }

  // Bipolar
  {
    let conf = confidence({ band: bp.band, completeness: bp.completeness, support: bpH.ok ? 0.8 : 0.3 });
    dx.push({
      code: "BP",
      label: "Bipolare Störung (Hinweis, Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `Hochphasen Band ${bp.band}`,
        bpH.ok ? "Kerncluster (Schlaf↓/Aktivität↑/Risiko) erfüllt." : "Kerncluster unklar.",
      ],
    });
  }

  // Psychose
  {
    let conf = confidence({ band: psychosis.band, completeness: psychosis.completeness, support: psyH.ok ? 0.8 : 0.3 });
    dx.push({
      code: "PSY",
      label: "Psychotische Störung (Hinweis, Screening)",
      confidence: Math.round(conf * 100),
      rationale: [
        `Psychose-Screen Band ${psychosis.band}`,
        psyH.ok ? "Positive Symptome / Desorganisation gemeldet." : "Hinweise unspezifisch.",
      ],
    });
  }

  // BPD-Hinweis
  {
    const support = bpdH.ok ? 0.8 : 0.4;
    const proxyBand = pctToBand(((self?.pct ?? 0) + (rel?.pct ?? 0)) / 2);
    let conf = confidence({ band: proxyBand, completeness: Math.min(self.completeness, rel.completeness), support });
    dx.push({
      code: "BPD_HINT",
      label: "Hinweise auf Borderline-Muster (Screening, kein Diagnoseersatz)",
      confidence: Math.round(conf * 100),
      rationale: [
        bpdH.ok
          ? "Identitätsstörung/Emotionsinstabilität + Beziehungsinstabilität vorhanden."
          : "Einzelhinweise ohne klares Muster.",
      ],
    });
  }

  // 8) Progress
  const totalItems = BANK.filter((m) => m.kind === "scale").reduce((n, m) => n + (m.items?.length ?? 0), 0);
  const answered = BANK.filter((m) => m.kind === "scale").flatMap((m) => m.items?.map((it) => it.key) ?? [])
    .filter((k) => ans[k] != null).length;
  const progress = totalItems ? Math.round((answered / totalItems) * 100) : 0;


const tasks = {
  tolEff: Number.isFinite(ans["tol_eff"]) ? Number(ans["tol_eff"]) : null,
  nbackAcc: Number.isFinite(ans["nback_acc"]) ? Number(ans["nback_acc"]) : null, // 0..1
  stroopAcc: Number.isFinite(ans["stroop_acc"]) ? Number(ans["stroop_acc"]) : null, // 0..1
  trailsMs: Number.isFinite(ans["trails_ms"]) ? Number(ans["trails_ms"]) : null,   // ms
};


  // 9) Rückgabe
return {
  progress,
  mood, anx, ptsd, ocd,
  self, rel, som, cog, res, func, sleep, adhd, diss, eat, bp, psychosis, stress, pain,
  meds: medCtx,
  red_flags,
  dx: dx.sort((a,b) => b.confidence - a.confidence),
  quality: { mood: quality_mood, anx: quality_anx, ptsd: quality_ptsd },
  ci: { mood: ci_mood, anx: ci_anx, ptsd: ci_ptsd },

  // ⬇️ neu
  tasks,
  ptsdTrueRaw: pcl5.raw ?? 0,
};
