import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Inhibition – Stroop (Deutsch)
 * Profi-Version mit:
 *  - 2 Blöcke à 24 Trials (48 gesamt), balanciert: 50% kongruent / 50% inkongruent, Farben gleich verteilt
 *  - Fixes Button-Layout pro Block (randomisiert je Block), Tastatur (F–G–J–K)
 *  - Reaktionszeiten (nur korrekte Trials), Miss-Handling (Timeout)
 *  - Ergebnis: Gesamt-Accuracy (für App), plus Detailmetriken (pro Block & Bedingung)
 *
 * onComplete({ accuracy, total, blocks: [...], rt: { congMs, incongMs, stroopMs } })
 *  -> App nutzt accuracy + total; Extras sind optional
 */

const COLORS = ["red", "green", "blue", "purple"];
const WORDS  = ["ROT", "GRÜN", "BLAU", "LILA"];
const MAP = { red: "ROT", green: "GRÜN", blue: "BLAU", purple: "LILA" };
const KEY_HINTS = { 0: "F", 1: "G", 2: "J", 3: "K" };

const DEFAULTS = {
  blocks: 2,
  trialsPerBlock: 24,
  responseMs: 3000,   // Zeitfenster pro Trial
  isiMs: 250,         // kurze Leerstelle zwischen Trials
};

function shuffle(a) { const arr = [...a]; for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// Erzeuge balancierten Block: pro Farbe 3 kongruent + 3 inkongruent (bei 24 Trials)
function makeBalancedBlock(n = 24) {
  const perColor = n / COLORS.length; // 6 bei 24
  const congPerColor = perColor / 2;  // 3 bei 24
  const list = [];
  for (const color of COLORS) {
    // kongruent
    for (let i = 0; i < congPerColor; i++) list.push({ color, word: MAP[color], congruent: true });
    // inkongruent (3 verschiedene Gegensätze, soweit möglich)
    const others = COLORS.filter((c) => c !== color);
    const words = shuffle(others).slice(0, congPerColor).map((c) => MAP[c]);
    for (const w of words) list.push({ color, word: w, congruent: false });
  }

  // sanfte Anti-Run-Constraints beim Shufflen: vermeide identische Farbe/Word direkt hintereinander
  let trials = shuffle(list);
  const maxTries = 800;
  for (let t = 0; t < maxTries; t++) {
    let ok = true;
    for (let i = 1; i < trials.length; i++) {
      const a = trials[i - 1], b = trials[i];
      if (a.color === b.color || a.word === b.word) { ok = false; break; }
    }
    if (ok) break;
    // kleine lokale Swaps zur Entflechtung
    const i = (Math.random() * (trials.length - 1)) | 0;
    const j = Math.min(trials.length - 1, i + 1 + ((Math.random() * 3) | 0));
    [trials[i], trials[j]] = [trials[j], trials[i]];
  }
  return trials;
}

function mean(arr) { const v = arr.filter((x) => Number.isFinite(x)); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; }

export default function Stroop({ onComplete, blocks = DEFAULTS.blocks, trialsPerBlock = DEFAULTS.trialsPerBlock, responseMs = DEFAULTS.responseMs, isiMs = DEFAULTS.isiMs }) {
  // Vorbereiten: Blockpläne & Button-Layouts
  const plans = useMemo(() => Array.from({ length: blocks }, () => makeBalancedBlock(trialsPerBlock)), [blocks, trialsPerBlock]);
  const layouts = useMemo(() => Array.from({ length: blocks }, () => shuffle([...COLORS])), [blocks]); // pro Block neue Button-Reihenfolge

  // Laufzeit-States
  const [block, setBlock] = useState(0);
  const [idx, setIdx] = useState(-1); // -1 = Pause/ISI
  const [phase, setPhase] = useState("idle"); // idle | show | gap | blockEnd | done
  const [announce, setAnnounce] = useState("");
  const [tick, setTick] = useState(false);

  // Metriken
  const [accTotals, setAccTotals] = useState([]); // [{acc, hits, errors, misses, congRt, incongRt}]

  // Timing & Flags
  const tRef = useRef(null);
  const startRef = useRef(0);
  const answeredRef = useRef(false);

  // Tastatursteuerung: F,G,J,K -> Buttons 0..3
  useEffect(() => {
    function onKey(e) {
      if (phase !== "show") return;
      const k = e.key.toUpperCase();
      const order = layouts[block];
      if (k === "F") choose(order[0]);
      else if (k === "G") choose(order[1]);
      else if (k === "J") choose(order[2]);
      else if (k === "K") choose(order[3]);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, block, layouts]);

  function startBlock() {
    clearTimeout(tRef.current);
    setIdx(-1);
    setPhase("gap");
    setAnnounce(`Block ${block + 1} startet.`);
    tRef.current = setTimeout(() => nextTrial(-1), Math.min(isiMs, 160));
  }

  function nextTrial(prev) {
    clearTimeout(tRef.current);
    const plan = plans[block];
    const next = prev + 1;
    if (next >= plan.length) { finishBlock(); return; }

    setIdx(next);
    setPhase("show");
    setTick(true); setTimeout(() => setTick(false), 110);
    startRef.current = performance.now();
    answeredRef.current = false;
    setAnnounce(`${plan[next].word} in ${plan[next].color}`);

    // Timeout -> Miss
    tRef.current = setTimeout(() => {
      if (!answeredRef.current) recordAnswer(null, false, performance.now() - startRef.current);
      setPhase("gap"); setIdx(-1); setAnnounce("Pause");
      tRef.current = setTimeout(() => nextTrial(next), isiMs);
    }, responseMs);
  }

  function choose(color) {
    if (phase !== "show" || answeredRef.current) return;
    answeredRef.current = true;
    clearTimeout(tRef.current);
    const plan = plans[block];
    const t = plan[idx];
    const rt = performance.now() - startRef.current;
    const correct = color === t.color;
    recordAnswer(color, correct, rt);
    setPhase("gap");
    setIdx(-1);
    setAnnounce(correct ? "Richtig" : "Falsch");
    tRef.current = setTimeout(() => nextTrial(idx), isiMs);
  }

  function recordAnswer(respColor, correct, rt) {
    // Speichere aggregiert (pro Block), granular wäre via Ref-List möglich
    const t = plans[block][Math.max(0, idx)];
    setAccTotals((prev) => {
      const cur = prev[block] || { hits: 0, errors: 0, misses: 0, congRts: [], incongRts: [] };
      if (respColor == null) cur.misses += 1; else if (correct) cur.hits += 1; else cur.errors += 1;
      if (correct) (t.congruent ? cur.congRts : cur.incongRts).push(rt);
      const copy = [...prev]; copy[block] = cur; return copy;
    });
  }

  function finishBlock() {
    clearTimeout(tRef.current);
    setPhase("blockEnd");
    setIdx(-1);
    setAnnounce(`Block ${block + 1} beendet.`);
  }

  function continueOrFinish() {
    if (block + 1 < blocks) {
      setBlock((b) => b + 1);
      setPhase("idle");
      setIdx(-1);
    } else {
      // Gesamtergebnis berechnen
      const totals = accTotals.reduce((a, b) => ({
        hits: a.hits + (b?.hits || 0),
        errors: a.errors + (b?.errors || 0),
        misses: a.misses + (b?.misses || 0),
        congRts: [...a.congRts, ...((b?.congRts) || [])],
        incongRts: [...a.incongRts, ...((b?.incongRts) || [])],
      }), { hits: 0, errors: 0, misses: 0, congRts: [], incongRts: [] });

      const totalTrials = blocks * trialsPerBlock;
      const accuracy = totalTrials ? Number((totals.hits / totalTrials).toFixed(2)) : 0;
      const congMs = mean(totals.congRts);
      const incongMs = mean(totals.incongRts);
      const stroopMs = (Number.isFinite(incongMs) && Number.isFinite(congMs)) ? incongMs - congMs : null;

      setPhase("done");
      setAnnounce("Stroop abgeschlossen.");
      onComplete?.({ accuracy, total: totalTrials, blocks: accTotals.map((b, i) => ({ block: i + 1, acc: ((b?.hits || 0) / trialsPerBlock) || 0, hits: b?.hits || 0, errors: b?.errors || 0, misses: b?.misses || 0, congRtMs: mean(b?.congRts || []), incongRtMs: mean(b?.incongRts || []) })), rt: { congMs, incongMs, stroopMs } });
    }
  }

  // UI Bits
  const plan = plans[block];
  const t = plan[Math.max(0, idx)] || { color: COLORS[0], word: WORDS[0], congruent: true };
  const order = layouts[block]; // Reihenfolge der Buttons in diesem Block

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Inhibition (Stroop)</h3>
      <p className="text-sm text-gray-600">Wähle die <b>FARBE</b> des Wortes – <i>nicht</i> den Inhalt. Tasten: <b>F</b>/<b>G</b>/<b>J</b>/<b>K</b>.</p>

      {/* Stimulus */}
      <div className="my-6 text-center">
        <div
          className={[
            "mx-auto h-24 w-64 grid place-items-center rounded-2xl",
            "text-5xl font-extrabold tracking-wide",
            phase === "show" ? "bg-white text-gray-900" : "bg-gray-50 text-gray-400",
            tick ? "ring-2 ring-blue-200 scale-[1.02]" : "ring-1 ring-gray-200",
            "transition-all duration-150",
          ].join(" ")}
          style={{ color: t.color }}
          aria-live="polite"
          aria-atomic="true"
        >
          {phase === "show" ? t.word : ""}
        </div>
        <p className="mt-2 text-xs text-gray-500">Block {block + 1}/{blocks} · {Math.max(0, idx + 1)}/{trialsPerBlock}</p>
      </div>

      {/* Buttons (fix pro Block, random Reihenfolge) */}
      <div className="grid grid-cols-2 gap-2">
        {order.map((c, i) => (
          <button
            key={c}
            onClick={() => choose(c)}
            disabled={phase !== "show"}
            className={[
              "rounded-xl border px-3 py-3 font-medium capitalize transition",
              phase === "show" ? "hover:scale-[1.01]" : "opacity-70 pointer-events-none",
            ].join(" ")}
            style={{ borderColor: c, color: c }}
          >
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-3 w-3 rounded-full" style={{ background: c }} />
              {MAP[c]} <span className="text-[11px] text-gray-500">({KEY_HINTS[i]})</span>
            </span>
          </button>
        ))}
      </div>

      {/* Controls */}
      {phase === "idle" && (
        <div className="mt-4">
          <button onClick={startBlock} className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50">Block {block + 1} starten</button>
        </div>
      )}

      {phase === "blockEnd" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm">
            <div>Ergebnis Block {block + 1}</div>
            <div className="mt-1 flex flex-wrap gap-3 text-gray-700">
              <span>Treffer: <b>{accTotals[block]?.hits ?? 0}</b></span>
              <span>Fehler: <b>{accTotals[block]?.errors ?? 0}</b></span>
              <span>Miss: <b>{accTotals[block]?.misses ?? 0}</b></span>
              <span>RT kongruent: <b>{Math.round((mean(accTotals[block]?.congRts || []) || 0))} ms</b></span>
              <span>RT inkongruent: <b>{Math.round((mean(accTotals[block]?.incongRts || []) || 0))} ms</b></span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={continueOrFinish} className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-medium hover:bg-blue-700">
              {block + 1 < blocks ? `Weiter zu Block ${block + 2}` : "Gesamtergebnis anzeigen"}
            </button>
            <button onClick={() => { setPhase("idle"); }} className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50">
              Block {block + 1} wiederholen
            </button>
          </div>
        </div>
      )}

      <div className="sr-only" aria-live="polite">{announce}</div>
    </div>
  );
}
