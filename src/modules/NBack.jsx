import { useEffect, useRef, useState } from "react";

/**
 * N-Back (1-Back) – 4 manuell startbare Läufe
 * - "Treffer"-Button bleibt immer sichtbar (nur disabled).
 * - Klarer Stimuluswechsel (kurze Gap + sanfter Frame-Impuls).
 * - Accuracy pro Lauf: hits / targets
 * - Gesamt-Accuracy (gewichtet): Sum(hits) / Sum(targets)
 *
 * onComplete({ runs, perRun: [{hits,falseAlarms,targets,misses,accuracy}], hits, falseAlarms, accuracy })
 */

const LETTERS = "BCDFGHJKLMNPQRSTVWXYZ".split(""); // keine Vokale

function makeSequence(n = 24) {
  const seq = [];
  let last = "";
  for (let i = 0; i < n; i++) {
    if (i > 0 && Math.random() < 0.28) {
      // ~28% Targets (Wiederholung)
      seq.push(last);
    } else {
      let c;
      do c = LETTERS[(Math.random() * LETTERS.length) | 0];
      while (c === last);
      seq.push(c);
      last = c;
    }
  }
  return seq;
}
function countTargets(seq) {
  let t = 0;
  for (let i = 1; i < seq.length; i++) if (seq[i] === seq[i - 1]) t++;
  return t;
}

export default function NBack({
  totalRuns = 4,
  paceMs = 750,
  isiMs = 160,
  targetExtraMs = 220,
  itemsPerRun = 24,
  onComplete,
}) {
  // Phasen: idle | show | gap | finishedRun | done
  const [phase, setPhase] = useState("idle");
  const [run, setRun] = useState(0); // 0..totalRuns-1
  const [idx, setIdx] = useState(-1);
  const [char, setChar] = useState("");
  const [hits, setHits] = useState(0);
  const [falseAlarms, setFalseAlarms] = useState(0);
  const [results, setResults] = useState([]); // pro Run: {hits,falseAlarms,targets,misses,accuracy}
  const [tick, setTick] = useState(false);    // sanfter Rahmen-Impuls
  const [announce, setAnnounce] = useState("");

  // stabile Taktung
  const seqRef = useRef([]);
  const expectRef = useRef(false);
  const targetsInRunRef = useRef(0);
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  /* ---------- Lauf-Steuerung ---------- */
  function startRun() {
    clearTimeout(timerRef.current);
    setPhase("gap"); // beginne mit Gap -> Wechsel klar sichtbar
    setIdx(-1);
    setChar("");
    setHits(0);
    setFalseAlarms(0);
    setAnnounce(`Lauf ${run + 1} startet.`);
    const seq = makeSequence(itemsPerRun);
    seqRef.current = seq;
    targetsInRunRef.current = countTargets(seq);
    // erste Gap kurz
    timerRef.current = setTimeout(() => nextStim(-1), Math.min(isiMs, 120));
  }

  function finishRunAndWait() {
    const targets = targetsInRunRef.current;
    const accuracy = targets > 0 ? Number((hits / targets).toFixed(2)) : 0;
    const misses = Math.max(0, targets - hits);
    const runRes = { hits, falseAlarms, targets, misses, accuracy };
    setResults((prev) => {
      const copy = [...prev];
      copy[run] = runRes;
      return copy;
    });
    setPhase("finishedRun");
    setAnnounce(`Lauf ${run + 1} beendet.`);
  }

  function proceedAfterFinishedRun() {
    if (run + 1 >= totalRuns) {
      // gewichtete Gesamtgenauigkeit
      const totals = results.reduce(
        (a, r) => ({
          hits: a.hits + (r?.hits || 0),
          fa: a.fa + (r?.falseAlarms || 0),
          targets: a.targets + (r?.targets || 0),
        }),
        { hits: 0, fa: 0, targets: 0 }
      );
      const accWeighted = totals.targets > 0 ? Number((totals.hits / totals.targets).toFixed(2)) : 0;
      setPhase("done");
      setAnnounce("Aufgabe abgeschlossen.");
      onComplete?.({
        runs: totalRuns,
        perRun: results,
        hits: Math.round(totals.hits / totalRuns),      // Ø Hits pro Lauf
        falseAlarms: Math.round(totals.fa / totalRuns), // Ø FAs pro Lauf
        accuracy: accWeighted,                           // gewichtete Genauigkeit
      });
    } else {
      setRun((r) => r + 1);
      setPhase("idle");
      setIdx(-1);
      setChar("");
    }
  }

  function restartCurrentRun() {
    clearTimeout(timerRef.current);
    setPhase("idle");
    setIdx(-1);
    setChar("");
    setHits(0);
    setFalseAlarms(0);
    setAnnounce("Aktueller Lauf wird neu vorbereitet.");
  }

  /* ---------- Stimulus-Takt ---------- */
  function nextStim(prevIndex) {
    clearTimeout(timerRef.current);

    const seq = seqRef.current;
    const next = prevIndex + 1;

    if (next >= seq.length) {
      finishRunAndWait();
      return;
    }

    const cur = seq[next];
    const prev = seq[next - 1];
    const isTarget = next > 0 && cur === prev;
    expectRef.current = isTarget;

    setPhase("show");
    setChar(cur);
    setIdx(next);
    setAnnounce(`Buchstabe ${cur}`);
    setTick(true);
    setTimeout(() => setTick(false), 120); // sanfter Impuls

    const showMs = isTarget ? paceMs + targetExtraMs : paceMs;

    timerRef.current = setTimeout(() => {
      setPhase("gap");
      setChar("");
      setIdx(-1);
      setAnnounce("Pause");
      timerRef.current = setTimeout(() => nextStim(next), isiMs);
    }, showMs);
  }

  function onHit() {
    // Button bleibt sichtbar; nur klickbar, wenn Stimulus angezeigt wird.
    if (phase !== "show") return;
    if (expectRef.current) setHits((h) => h + 1);
    else setFalseAlarms((f) => f + 1);
  }

  const totalLen = seqRef.current.length || itemsPerRun;
  const canPress = phase === "show";

  /* ---------- UI ---------- */
  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Arbeitsgedächtnis (1-Back)</h3>
      <p className="text-sm text-gray-600">
        Drücke <b>Treffer</b>, wenn der aktuelle Buchstabe <i>gleich dem vorherigen</i> ist.
        Jeder neue Buchstabe wird durch eine kurze Pause und einen sanften Rahmen-Impuls klar erkennbar.
      </p>

      {/* Stimulus/Status */}
      <div className="my-6 text-center">
        <div
          className={[
            "mx-auto w-28 h-24 grid place-items-center rounded-2xl",
            "text-6xl font-extrabold tracking-widest",
            "transition-transform duration-150",
            canPress ? "ring-2 ring-blue-200" : "ring-1 ring-gray-200",
            tick ? "scale-105" : "",
            phase === "show" ? "bg-white text-gray-900" : "bg-gray-50 text-gray-400",
            "motion-reduce:transition-none motion-reduce:transform-none",
          ].join(" ")}
          aria-live="polite"
          aria-atomic="true"
        >
          {phase === "show" ? char : ""}
        </div>

        {phase !== "done" && (
          <p className="mt-2 text-xs text-gray-500">
            Lauf {run + 1} von {totalRuns} · {Math.max(0, idx + 1)}/{totalLen}
          </p>
        )}
      </div>

      {/* Konstanter Treffer-Button */}
      <button
        onClick={onHit}
        disabled={!canPress}
        className={[
          "w-full rounded-xl px-4 py-3 font-medium transition",
          "text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99]",
          !canPress ? "opacity-80 pointer-events-none" : "",
        ].join(" ")}
        aria-disabled={!canPress}
      >
        Treffer
      </button>

      {/* Sekundär-Aktionen */}
      {phase === "idle" && (
        <div className="mt-3">
          <button
            onClick={startRun}
            className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
          >
            Lauf {run + 1} starten
          </button>
        </div>
      )}

      {phase === "finishedRun" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm">
            <div>Ergebnis Lauf {run + 1}</div>
            <div className="mt-1 flex flex-wrap gap-3 text-gray-700">
              <span>Targets: <b>{results[run]?.targets ?? countTargets(seqRef.current)}</b></span>
              <span>Treffer: <b>{hits}</b></span>
              <span>Verpasst: <b>{(results[run]?.targets ?? countTargets(seqRef.current)) - hits}</b></span>
              <span>Fehlalarme: <b>{falseAlarms}</b></span>
              <span>Genauigkeit: <b>{((results[run]?.targets ?? countTargets(seqRef.current)) > 0 ? Math.round((hits / (results[run]?.targets ?? countTargets(seqRef.current))) * 100) : 0)}%</b></span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={proceedAfterFinishedRun}
              className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-medium hover:bg-blue-700"
            >
              {run + 1 >= totalRuns ? "Gesamtergebnis anzeigen" : `Weiter zu Lauf ${run + 2}`}
            </button>
            <button
              onClick={restartCurrentRun}
              className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50"
            >
              Lauf {run + 1} neu starten
            </button>
          </div>
        </div>
      )}

      {/* Livewerte während eines Runs */}
      {(phase === "show" || phase === "gap") && (
        <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div className="rounded-lg bg-emerald-50 px-3 py-2">Treffer: <b>{hits}</b></div>
          <div className="rounded-lg bg-amber-50 px-3 py-2">Fehlalarme: <b>{falseAlarms}</b></div>
        </div>
      )}

      {/* Gesamtergebnis */}
      {phase === "done" && (
        <FinalSummary results={results} onRestart={() => { setRun(0); setResults([]); setPhase("idle"); }} />
      )}

      <div className="sr-only" aria-live="polite">{announce}</div>
    </div>
  );
}

function FinalSummary({ results, onRestart }) {
  const totals = results.reduce(
    (a, r) => ({
      hits: a.hits + (r?.hits || 0),
      fa: a.fa + (r?.falseAlarms || 0),
      targets: a.targets + (r?.targets || 0),
    }),
    { hits: 0, fa: 0, targets: 0 }
  );
  const accWeighted = totals.targets > 0 ? totals.hits / totals.targets : 0;

  return (
    <div className="mt-4 text-sm">
      <p className="font-medium">Durchschnitt über alle Läufe (gewichtete Genauigkeit):</p>
      <ul className="mt-2 list-disc pl-5 space-y-1">
        <li>Gesamt-Targets: <b>{totals.targets}</b></li>
        <li>Treffer gesamt: <b>{totals.hits}</b></li>
        <li>Fehlalarme gesamt: <b>{totals.fa}</b></li>
        <li>Genauigkeit gesamt: <b>{Math.round(accWeighted * 100)}%</b></li>
      </ul>
      <div className="mt-3">
        <button onClick={onRestart} className="rounded-xl border px-3 py-2 hover:bg-gray-50">
          Nochmals durchführen
        </button>
      </div>
    </div>
  );
}
