// src/lib/report.validated.js
// Drop-in-Ersatz für eure bisherige Report-Erzeugung.
// UI/Flow bleibt unverändert; wir liefern dieselbe Struktur zurück,
// aber die Kerne (mood/anx/ptsd) basieren jetzt auf validierten Skalen.

import { METRICS } from "../data/metrics";
import { scoreMetric } from "./scoring";
import { calibratedRaw } from "./calibration";

// ⬇️ NEU: Cutoffs aus JSON laden
import CUTS from "../data/norms/cutoffs.json";

// Dynamische Anpassung der METRICS anhand von cutoffs.json
if (CUTS?.PHQ9?.cutoffs) {
  METRICS.PHQ9.cutoffs = CUTS.PHQ9.cutoffs.map(c => c.min);
}
if (CUTS?.GAD7?.cutoffs) {
  METRICS.GAD7.cutoffs = CUTS.GAD7.cutoffs.map(c => c.min);
}
const pclRule = CUTS?.PCL5?.cutoff_rules?.find(
  r => r.rule === "screen_positive_if_score_ge"
);
if (pclRule) {
  METRICS.PCL5.cutoff = pclRule.value;
}

export function buildReportUpgraded(ans, progressPct = 0) {
  // 1) Validierte Kernskalen berechnen
  const phq = scoreMetric("PHQ9", ans);
  const gad = scoreMetric("GAD7", ans);
  const pcl = scoreMetric("PCL5", ans);

  // 2) Optionale Kalibrierung mit Zusatz-Items (falls Gewichte vorhanden)
  const moodRaw = calibratedRaw(phq.raw, "PHQ9X", ans) ?? phq.raw;
  const anxRaw  = calibratedRaw(gad.raw, "GAD7X", ans) ?? gad.raw;
  const ptsdRaw = calibratedRaw(pcl.raw, "PCL5X", ans) ?? pcl.raw;

  // 3) UI-Kompatibilität: Für eure Balken nutzt SummaryCard feste Maxima.
  //    PHQ9 (0..27) & GAD7 (0..21) passen bereits.
  //    PCL-5 hat 0..80 – wir skalieren für die UI-Balken linear auf 0..16,
  //    damit sich an der Optik nichts ändert. Bänder bleiben vom echten Rohscore abhängig.
  const pclUiMax = METRICS.PCL5.uiMax || 16;
  const pclTrueMax = METRICS.PCL5.trueMax || 80;
  const ptsdRawUi = ptsdRaw == null ? null : Math.round((ptsdRaw / pclTrueMax) * pclUiMax);

  // 4) Struktur beibehalten, damit SummaryCard.jsx ohne Änderungen funktioniert
  const mood = { ...phq, raw: moodRaw };
  const anx  = { ...gad, raw: anxRaw };
  const ptsd = { ...pcl, raw: ptsdRawUi }; // UI-raw für Balken; Band aus echtem Score

  // Platzhalter für weitere Bereiche, bis sie ähnlich „geankert“ sind.
  const o = (raw=null, band=1) => ({ raw, band });

  return {
    progress: progressPct,
    mood,
    anx,
    ptsd,
    ocd:  o(null, 1),
    self: o(null, 2),
    rel:  o(null, 2),
    som:  o(null, 1),
    cog:  o(null, 1),
    res:  o(null, 2),
    func: { raw: null },
    tasks: {}
  };
}
