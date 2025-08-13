import { useMemo, useState, useEffect } from "react";

/**
 * Tower of London (ToL)
 * - Jetzt 10 Level mit steigendem Schwierigkeitsgrad
 * - Späte Level sind "knackig" durch asymmetrische Kapazitäten und 4 Kugeln
 * - Robust: minimale Züge via BFS (keine Hardcodes)
 * - Rückgabe bleibt App-kompatibel: { reached, moves, efficiency, levels }
 */

// tiefe Kopie für 2D-Arrays
const deep = (s) => s.map((p) => [...p]);

// --- BFS über den Zustandsraum (nur Top-Element bewegen, Kapazitäten beachten) ---
function serialize(state) {
  return JSON.stringify(state);
}
function* successors(state, cap) {
  for (let i = 0; i < 3; i++) {
    if (!state[i].length) continue;
    const disk = state[i][state[i].length - 1];
    for (let j = 0; j < 3; j++) {
      if (i === j) continue;
      if (state[j].length < cap[j]) {
        const next = deep(state);
        next[i] = next[i].slice(0, -1);
        next[j] = [...next[j], disk];
        yield next;
      }
    }
  }
}
function shortestMoves(start, goal, cap) {
  const s0 = serialize(start);
  const sg = serialize(goal);
  if (s0 === sg) return 0;
  const seen = new Set([s0]);
  const q = [[start, 0]];
  while (q.length) {
    const [s, d] = q.shift();
    for (const nxt of successors(s, cap)) {
      const key = serialize(nxt);
      if (seen.has(key)) continue;
      if (key === sg) return d + 1;
      seen.add(key);
      q.push([nxt, d + 1]);
    }
  }
  return null; // sollte bei gültigen Zuständen nicht vorkommen
}

// --- Level-Definitionen ---
// Hinweis: 3 Pegs fest, Kapazitäten/Start/Ziel je Level unterschiedlich.
const LEVELS = [
  // 1–6: 3 Kugeln, symmetrische Kapazitäten – klassische Aufwärmphase
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[3], [2], [1]] }, // sehr leicht
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[3], [], [2, 1]] },
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[2], [1], [3]] },
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[2, 1], [], [3]] },
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[1, 2], [], [3]] },
  { cap: [3, 3, 3], start: [[3, 2, 1], [], []], goal: [[1, 2, 3], [], []] }, // Maximum-Distanz im 3x3x3-Setup

  // 7–8: 3 Kugeln, asymmetrische Kapazitäten – erzwingen Umwege
  { cap: [3, 2, 2], start: [[3, 2, 1], [], []], goal: [[], [3, 2], [1]] },
  { cap: [3, 2, 2], start: [[3, 2, 1], [], []], goal: [[2], [3, 1], []] },

  // 9–10: 4 Kugeln, engere Flaschenhälse – deutlich knackiger
  { cap: [4, 3, 3], start: [[4, 3, 2, 1], [], []], goal: [[], [4, 2, 1], [3]] },
  { cap: [4, 3, 3], start: [[4, 3, 2, 1], [], []], goal: [[3, 1], [2, 4], []] },
];

export default function TowerOfLondon({ onComplete, ariaLabel = "Tower of London" }) {
  const [lvl, setLvl] = useState(0);
  const cfg = LEVELS[lvl];

  // State je Level
  const [pegs, setPegs] = useState(deep(cfg.start));
  const [held, setHeld] = useState(null); // { disk, from }
  const [moves, setMoves] = useState(0);
  const [summary, setSummary] = useState([]); // {level, reached, moves, minMoves, efficiency}
  const [announce, setAnnounce] = useState(""); // SR-only Feedback

  // Bei Level-Wechsel sauber zurücksetzen
  useEffect(() => {
    setPegs(deep(cfg.start));
    setHeld(null);
    setMoves(0);
  }, [lvl]);

  // Minimale Züge (via BFS; memoisiert)
  const minMoves = useMemo(() => shortestMoves(cfg.start, cfg.goal, cfg.cap) ?? 0, [cfg.start, cfg.goal, cfg.cap]);

  const isGoal = useMemo(() => serialize(pegs) === serialize(cfg.goal), [pegs, cfg.goal]);

  function resetLevel() {
    setPegs(deep(LEVELS[lvl].start));
    setHeld(null);
    setMoves(0);
    setAnnounce("Level zurückgesetzt.");
  }

  function pickOrDrop(idx) {
    // Ablegen?
    if (held) {
      // Klick auf Ursprungs-Peg = Abbruch ohne Move
      if (idx === held.from) {
        const next = deep(pegs);
        next[idx] = [...next[idx], held.disk];
        setPegs(next);
        setHeld(null);
        setAnnounce("Ablage abgebrochen.");
        return;
      }
      // Kapazität prüfen
      if (pegs[idx].length >= cfg.cap[idx]) {
        setAnnounce(`Stift ${idx + 1} ist voll.`);
        return;
      }
      const next = deep(pegs);
      next[idx] = [...next[idx], held.disk];
      setPegs(next);
      setHeld(null);
      setMoves((m) => m + 1);
      return;
    }

    // Aufnehmen?
    if (!pegs[idx].length) {
      setAnnounce("Kein Stein zum Aufnehmen.");
      return;
    }
    const next = deep(pegs);
    const disk = next[idx].pop();
    setPegs(next);
    setHeld({ disk, from: idx });
  }

  function nextLevelOrFinish() {
    const eff = isGoal && moves > 0 ? Math.min(1, (minMoves || 0) / moves) : 0;
    const entry = { level: lvl + 1, reached: isGoal, moves, minMoves, efficiency: Number(eff.toFixed(2)) };
    const s = [...summary, entry];
    setSummary(s);

    if (lvl + 1 < LEVELS.length) {
      setLvl((n) => n + 1);
    } else {
      // fertig: Gesamtwerte berechnen
      const totalMoves = s.reduce((a, b) => a + (b.moves || 0), 0);
      const totalOptimal = s.reduce((a, b) => a + (b.minMoves || 0), 0);
      const overallEff = totalMoves > 0 ? Math.min(1, totalOptimal / totalMoves) : 0;
      const allReached = s.every((r) => r.reached);
      onComplete?.({
        reached: allReached,
        moves: totalMoves,
        efficiency: Number(overallEff.toFixed(2)),
        levels: s,
      });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white" aria-label={ariaLabel}>
      <h3 className="text-lg font-semibold">
        Tower of London (Planung) – Level {lvl + 1}/{LEVELS.length}
      </h3>
      <p className="mt-1 text-sm text-gray-600">
        Bringe die Anordnung in die Zielkonfiguration – mit möglichst wenigen Zügen.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            onClick={() => pickOrDrop(i)}
            className="rounded-xl border bg-gray-50 p-3 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-300"
            aria-label={`Stift ${i + 1}`}
          >
            <PegView peg={pegs[i]} cap={cfg.cap[i]} active={held?.from === i} />
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">
          Züge: {moves} {isGoal && "✓ Ziel erreicht"}
        </span>
        <div className="flex gap-2">
          <button onClick={resetLevel} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">
            Zurücksetzen
          </button>
          <button
            onClick={nextLevelOrFinish}
            className="rounded-xl px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700"
          >
            {lvl + 1 < LEVELS.length ? "Level abschließen" : "Fertig"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-lg border bg-white p-3">
        <p className="text-sm font-medium">Zielkonfiguration</p>
        <div className="mt-2 grid grid-cols-3 gap-3 opacity-80 pointer-events-none">
          <PegView peg={cfg.goal[0]} cap={cfg.cap[0]} />
          <PegView peg={cfg.goal[1]} cap={cfg.cap[1]} />
          <PegView peg={cfg.goal[2]} cap={cfg.cap[2]} />
        </div>
      </div>

      {summary.length > 0 && (
        <div className="mt-4 text-xs text-gray-600">
          {summary.map((s) => (
            <div key={s.level}>
              Level {s.level}: Züge {s.moves} (optimal {s.minMoves}) · Effizienz {Math.round((s.efficiency || 0) * 100)}% {s.reached ? "✓" : "✗"}
            </div>
          ))}
        </div>
      )}

      <div className="sr-only" aria-live="polite">{announce}</div>
    </div>
  );
}

function PegView({ peg, cap, active }) {
  const empty = Array.from({ length: Math.max(0, cap - peg.length) });
  const heightPx = 18 + cap * 22; // dynamische Höhe je nach Kapazität
  return (
    <div
      className={"relative flex flex-col-reverse items-center " + (active ? "ring-2 ring-blue-300 rounded-lg" : "")}
      style={{ height: heightPx }}
    >
      {peg.map((d, idx) => (
        <Disk key={idx} size={d} />
      ))}
      {empty.map((_, i) => (
        <div key={i} className="h-4" />
      ))}
      <div className="absolute inset-x-6 bottom-1 h-1 bg-gray-400 rounded-full" />
    </div>
  );
}

function Disk({ size }) {
  let w = "w-10";
  let grad = "from-sky-400 to-blue-500";
  if (size === 2) {
    w = "w-16"; grad = "from-blue-500 to-indigo-500";
  } else if (size === 3) {
    w = "w-24"; grad = "from-indigo-500 to-violet-500";
  } else if (size === 4) {
    w = "w-32"; grad = "from-violet-600 to-purple-600";
  }
  return <div className={`h-4 ${w} bg-gradient-to-r ${grad} rounded-full shadow-sm mb-1`} />;
}
