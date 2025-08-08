import { useMemo, useState } from "react";

/** Wähle die FARBE des Wortes (nicht den Inhalt). */
const COLORS = ["red", "green", "blue", "purple"];
const WORDS  = ["ROT", "GRÜN", "BLAU", "LILA"];
const MAP = { red: "ROT", green: "GRÜN", blue: "BLAU", purple: "LILA" };

function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

export default function Stroop({ onComplete }) {
  const trials = useMemo(() => Array.from({ length: 12 }).map(() => {
    const color = rnd(COLORS);
    const word  = rnd(WORDS);
    return { color, word };
  }), []);
  const [i, setI] = useState(0);
  const [acc, setAcc] = useState(0);

  function choose(c) {
    const t = trials[i];
    const correct = c === t.color;
    if (correct) setAcc(a => a + 1);
    const next = i + 1;
    if (next >= trials.length) {
      onComplete?.({ accuracy: Number((acc + (correct ? 1 : 0)) / trials.length).toFixed(2), total: trials.length });
    } else setI(next);
  }

  const t = trials[i];
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Inhibition (Stroop)</h3>
      <p className="text-sm text-gray-600">Tippe die <b>Farbe</b> des Wortes – <i>nicht</i> den Inhalt.</p>

      <div className="my-6 text-center">
        <div className="text-5xl font-extrabold" style={{ color: t.color }}>{t.word}</div>
        <p className="mt-2 text-xs text-gray-500">{i + 1}/{trials.length}</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {COLORS.map(c => (
          <button
            key={c}
            onClick={() => choose(c)}
            className="rounded-xl border px-3 py-3 font-medium capitalize hover:bg-gray-50"
          >
            {MAP[c]}
          </button>
        ))}
      </div>
    </div>
  );
}
