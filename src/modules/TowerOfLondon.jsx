import { useMemo, useState } from "react";

/**
 * Tower of London – Mehrere Level mit steigender Schwierigkeit.
 * - Alle Pegs Kapazität 3 (touchfreundlich)
 * - Level 1: Ziel auf Peg 2, Level 2: Ziel auf Peg 3,
 *   Level 3: gestaffeltes Ziel (2/1 und 3 getrennt)
 */

const CAP = [3, 3, 3];

const LEVELS = [
  // Level 1
  {
    start: [[3,2,1], [], []],
    goal:  [[], [3,2,1], []],
    minMoves: 3,
  },
  // Level 2
  {
    start: [[3,2,1], [], []],
    goal:  [[], [], [3,2,1]],
    minMoves: 4,
  },
  // Level 3 (etwas trickreicher)
  {
    start: [[3,2,1], [], []],
    goal:  [[2,1], [3], []],
    minMoves: 5,
  },
];

export default function TowerOfLondon({ onComplete, ariaLabel = "Tower of London" }) {
  const [lvl, setLvl] = useState(0);
  const cfg = LEVELS[lvl];

  const [pegs, setPegs] = useState(cfg.start);
  const [held, setHeld] = useState(null); // {disk, from}
  const [moves, setMoves] = useState(0);
  const [summary, setSummary] = useState([]); // Ergebnisse je Level

  const isGoal = useMemo(
    () => JSON.stringify(pegs) === JSON.stringify(cfg.goal),
    [pegs, cfg.goal]
  );

  function resetLevel() {
    setPegs(LEVELS[lvl].start.map(p=>[...p]));
    setHeld(null);
    setMoves(0);
  }

  function pickOrDrop(idx) {
    if (held) {
      const canDrop = pegs[idx].length < CAP[idx];
      if (!canDrop) return;
      const next = pegs.map((p) => [...p]);
      next[idx] = [...next[idx], held.disk];
      setPegs(next);
      setHeld(null);
      setMoves((m) => m + 1);
      return;
    }
    if (!pegs[idx].length) return;
    const next = pegs.map((p) => [...p]);
    const disk = next[idx].pop();
    setPegs(next);
    setHeld({ disk, from: idx });
  }

  function nextLevelOrFinish() {
    const eff = isGoal ? Math.min(1, cfg.minMoves / Math.max(cfg.minMoves, moves)) : 0;
    const entry = { level: lvl + 1, reached: isGoal, moves, efficiency: eff };
    const s = [...summary, entry];
    setSummary(s);

    if (lvl + 1 < LEVELS.length) {
      const nl = lvl + 1;
      setLvl(nl);
      // auf neues Level umstellen
      setPegs(LEVELS[nl].start.map(p=>[...p]));
      setHeld(null);
      setMoves(0);
    } else {
      // fertig
      const avgEff = s.length ? Number((s.reduce((a,b)=>a+b.efficiency,0)/s.length).toFixed(2)) : 0;
      const allReached = s.every(r=>r.reached);
      onComplete?.({
        levels: s,
        avgEfficiency: avgEff,
        allReached,
      });
    }
  }

  return (
    <div className="rounded-2xl border border-gray-200 p-4 bg-white" aria-label={ariaLabel}>
      <h3 className="text-lg font-semibold">Tower of London (Planung) – Level {lvl + 1}/{LEVELS.length}</h3>
      <p className="mt-1 text-sm text-gray-600">
        Bringe die Anordnung in die Zielkonfiguration – mit möglichst wenigen Zügen.
      </p>

      <div className="mt-4 grid grid-cols-3 gap-3">
        {[0,1,2].map(i => (
          <button
            key={i}
            onClick={() => pickOrDrop(i)}
            className="rounded-xl border bg-gray-50 p-3 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-blue-300"
            aria-label={`Stift ${i+1}`}
          >
            <PegView peg={pegs[i]} cap={CAP[i]} active={held?.from===i} />
          </button>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-gray-600">Züge: {moves} {isGoal && "✓ Ziel erreicht"}</span>
        <div className="flex gap-2">
          <button onClick={resetLevel} className="rounded-xl border px-3 py-1.5 text-sm hover:bg-gray-50">Zurücksetzen</button>
          <button onClick={nextLevelOrFinish} className="rounded-xl px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700">
            {lvl + 1 < LEVELS.length ? "Level abschließen" : "Fertig"}
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-lg border bg-white p-3">
        <p className="text-sm font-medium">Zielkonfiguration</p>
        <div className="mt-2 grid grid-cols-3 gap-3 opacity-80 pointer-events-none">
          <PegView peg={cfg.goal[0]} cap={CAP[0]} />
          <PegView peg={cfg.goal[1]} cap={CAP[1]} />
          <PegView peg={cfg.goal[2]} cap={CAP[2]} />
        </div>
      </div>

      {summary.length > 0 && (
        <div className="mt-4 text-xs text-gray-600">
          {summary.map(s => (
            <div key={s.level}>
              Level {s.level}: Züge {s.moves} · Effizienz {Math.round(s.efficiency*100)}% {s.reached ? "✓" : "✗"}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PegView({ peg, cap, active }) {
  const empty = Array.from({ length: cap - peg.length });
  return (
    <div className={"relative h-28 flex flex-col-reverse items-center " + (active ? "ring-2 ring-blue-300 rounded-lg" : "")}>
      {peg.map((d, idx) => <Disk key={idx} size={d} />)}
      {empty.map((_,i) => <div key={i} className="h-4" />)}
      <div className="absolute inset-x-6 bottom-1 h-1 bg-gray-400 rounded-full" />
    </div>
  );
}
function Disk({ size }) {
  const w = size === 3 ? "w-24" : size === 2 ? "w-16" : "w-10";
  const grad = size === 3 ? "from-indigo-500 to-violet-500" : size === 2 ? "from-blue-500 to-indigo-500" : "from-sky-400 to-blue-500";
  return <div className={`h-4 ${w} bg-gradient-to-r ${grad} rounded-full shadow-sm mb-1`} />;
}
