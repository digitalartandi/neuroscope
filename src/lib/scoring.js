// src/lib/scoring.js
// Robustes Scoring für validierte Kernskalen (PHQ-9, GAD-7, PCL-5).
// Behandelt Missing Values (anteiliges Hochrechnen) & Reverse-Coding.
// Liefert zusätzlich eine grobe SE (Unsicherheitsmaß).

import { METRICS } from "../data/metrics";

const clamp = (x, a, b) => Math.max(a, Math.min(b, x));

export function scoreMetric(metricId, ans) {
  const def = METRICS[metricId];
  if (!def) return { raw: null, completeness: 0, band: 0, se: null };

  const { items, range } = def;
  const answered = items.filter((it) => ans[it.key] != null);
  const completeness = items.length ? answered.length / items.length : 0;

  // Summe mit Reverse-Coding
  let sum = 0;
  for (const it of items) {
    const v = ans[it.key];
    if (v == null) continue;
    const vv = clamp(v, range[0], range[1]);
    const scored = it.reverse ? range[1] - vv : vv;
    sum += scored;
  }

  // Anteilig hochrechnen (konservativ runden)
  const raw = completeness > 0 ? Math.round(sum * (items.length / answered.length)) : null;

  // Grobe SE: abhängig von fehlenden Items (konservativ)
  const missing = items.length - answered.length;
  const se = completeness > 0 ? Math.max(1, Math.sqrt(missing)) : null;

  // Bänder über Cutoffs
  let band = 0;
  if (Array.isArray(def.cutoffs)) {
    band = def.cutoffs.reduce((b, c) => (raw != null && raw >= c ? b + 1 : b), 0);
    band = Math.min(band, 4); // 0..4
  } else if (typeof def.cutoff === "number") {
    band = raw != null && raw >= def.cutoff ? 3 : 1; // grob: unter/über Grenzwert
  }

  return { raw, completeness, band, se };
}
