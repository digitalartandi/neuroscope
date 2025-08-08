import { useEffect, useState } from "react";
import { BANK } from "../data/bank";

export function useAssessmentStore() {
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState(() => {
    try { return JSON.parse(localStorage.getItem("answers")||"{}"); } catch { return {}; }
  });
  const [visited, setVisited] = useState(() => {
    try { return JSON.parse(localStorage.getItem("visited")||"[]"); } catch { return []; }
  });

  const current = BANK[idx];

  function setAnswer(key, value) {
    setAns((p) => {
      const next = { ...p, [key]: value };
      localStorage.setItem("answers", JSON.stringify(next));
      return next;
    });
  }

  function goToModuleId(id) {
    const i = BANK.findIndex(m => m.id === id);
    if (i !== -1) {
      setIdx(i);
      setVisited((v) => {
        const next = Array.from(new Set([...v, id]));
        localStorage.setItem("visited", JSON.stringify(next));
        return next;
      });
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function next() {
    const nextIdx = Math.min(idx + 1, BANK.length - 1);
    goToModuleId(BANK[nextIdx].id);
  }
  function back() {
    const prevIdx = Math.max(idx - 1, 0);
    goToModuleId(BANK[prevIdx].id);
  }

  // Fortschritt je Modul (answered ratio)
  function completionFor(module) {
    if (!module?.items) return visited.includes(module.id) ? 1 : 0;
    const total = module.items.length;
    const done = module.items.filter(it => ans[it.key] !== undefined).length;
    return total ? done / total : (visited.includes(module.id) ? 1 : 0);
  }

  const overall = Math.round((idx / (BANK.length - 1)) * 100);

  // init visited
  useEffect(() => { if (!visited.includes(BANK[0].id)) goToModuleId(BANK[0].id); /* eslint-disable-next-line */ }, []);

  return { idx, setIdx, ans, setAnswer, current, next, back, goToModuleId, completionFor, overall, BANK, visited };
}
