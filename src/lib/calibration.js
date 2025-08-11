// src/lib/calibration.js
// Optionale Feinjustierung via externen Gewichten (Ridge/Lasso), ohne UI-Anpassung.
// Wenn keine weights.json vorliegt, passiert nichts – Base-Score bleibt bestehen.

import WEIGHTS from "../data/weights.json";

export function calibratedRaw(baseRaw, familyKey, ans) {
  const cfg = WEIGHTS?.[familyKey];
  if (!cfg || baseRaw == null) return baseRaw;
  let adj = cfg.intercept || 0;
  const W = cfg.weights || {};
  for (const k of Object.keys(W)) {
    const v = ans[k];
    if (typeof v === "number") adj += W[k] * v;
  }
  return Math.round(baseRaw + adj);
}
