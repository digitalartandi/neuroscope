import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Trails (A & B)
 * - Pro Block zuerst **Übungsrunde** (mit Hint, nicht gewertet), danach **wertbarer Test** (ohne Hint)
 * - Block A: 1..12 · Block B: 1-A-2-B-...-12-L (Alternation)
 * - Zufällige, kollisionsfreie Positionierung (responsive)
 * - Präzise Zeitmessung (performance.now); Start erst beim ersten KORREKTEN Tap
 * - Fehler zählen (nur nach Start); klares Klick-Feedback (✔/✗ + Farbring)
 * - App-kompatibles onComplete: { timeMs, errors, perBlock }
 */

const LETTERS = Array.from({ length: 12 }, (_, i) => String.fromCharCode(65 + i)); // A..L

function makeTokens(kind) {
  if (kind === "A") return Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), type: "num", value: i + 1 }));
  // B: 1,A,2,B,...
  const arr = [];
  for (let i = 1; i <= 12; i++) {
    arr.push({ label: String(i), type: "num", value: i });
    arr.push({ label: LETTERS[i - 1], type: "let", value: LETTERS[i - 1] });
  }
  return arr; // Länge 24
}

function expectedOrder(kind) {
  if (kind === "A") return Array.from({ length: 12 }, (_, i) => String(i + 1));
  const seq = [];
  for (let i = 1; i <= 12; i++) { seq.push(String(i)); seq.push(LETTERS[i - 1]); }
  return seq; // 24
}

function shuffle(a) { const arr = [...a]; for (let i = arr.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }

// Kollisionsfreie, responsive Positionierung via Rejection Sampling
function layOutPositions(n, w, h, r, border = 8, maxTries = 6000) {
  const pts = [];
  let tries = 0;
  while (pts.length < n && tries < maxTries) {
    tries++;
    const x = border + r + Math.random() * (w - 2 * (border + r));
    const y = border + r + Math.random() * (h - 2 * (border + r));
    if (pts.every((p) => (p.x - x) ** 2 + (p.y - y) ** 2 >= (r * 2.2) ** 2)) {
      pts.push({ x, y });
    }
  }
  if (pts.length < n) {
    // Fallback: Gitter
    const cols = Math.ceil(Math.sqrt(n));
    const rows = Math.ceil(n / cols);
    for (let i = 0; i < n; i++) {
      const c = i % cols, r0 = (i / cols) | 0;
      const gx = ((c + 0.5) / cols) * w, gy = ((r0 + 0.5) / rows) * h;
      pts[i] = { x: gx, y: gy };
    }
  }
  return pts;
}

export default function Trails({ onComplete, blocks = ["A", "B"], practicePerBlock = true }) {
  const [blockIdx, setBlockIdx] = useState(0); // 0..blocks.length-1
  const [isPractice, setIsPractice] = useState(true); // pro Block zuerst Übung
  const [phase, setPhase] = useState("idle"); // idle | running | blockEnd | done
  const [errors, setErrors] = useState(0);
  const [perBlock, setPerBlock] = useState([]); // { kind, timeMs, errors } – nur wertbar
  const [lastTap, setLastTap] = useState(null); // { label, ok }

  const kind = blocks[blockIdx];
  const tokens = useMemo(() => makeTokens(kind), [kind]);
  const targetSeq = useMemo(() => expectedOrder(kind), [kind]);

  // Board-Geometrie & Positionen
  const boardRef = useRef(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [pos, setPos] = useState([]);
  const R = kind === "A" ? 26 : 23; // Radius der Kreise

  // Laufvariablen
  const [nextIdx, setNextIdx] = useState(0); // 0..targetSeq.length-1
  const startRef = useRef(null);

  // Re-measure on resize
  useEffect(() => {
    function measure() {
      const el = boardRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBox({ w: rect.width, h: Math.max(320, rect.height) });
    }
    measure();
    const ro = new ResizeObserver(measure); ro.observe(document.body);
    return () => ro.disconnect();
  }, []);

  function relayout() {
    const w = box.w || 0, h = box.h || 380;
    if (!w) return;
    const pts = layOutPositions(tokens.length, w, h, R);
    const shuffled = shuffle(tokens).map((t, i) => ({ ...t, ...pts[i] }));
    setPos(shuffled);
    setNextIdx(0);
  }

  // Positionen neu layouten bei Blockwechsel oder Größe
  useEffect(() => {
    relayout();
    setPhase("idle");
  }, [kind, box.w, box.h]);

  // --- Steuerung ---
  function start() {
    setErrors(0);
    setNextIdx(0);
    setLastTap(null);
    startRef.current = null;
    setPhase("running");
  }

  function restartBlock() {
    setErrors(0);
    setNextIdx(0);
    setLastTap(null);
    startRef.current = null;
    setPhase("idle");
  }

  function finishBlock() {
    const stop = performance.now();
    const tMs = Math.round(stop - (startRef.current ?? stop));
    if (!isPractice) {
      const entry = { kind, timeMs: tMs, errors };
      setPerBlock((prev) => { const arr = [...prev]; arr[blockIdx] = entry; return arr; });
    }
    setPhase("blockEnd");
  }

  function continueOrFinish() {
    if (isPractice) {
      // von Übung -> Test (gleicher Block)
      setIsPractice(false);
      relayout(); // neues Layout für den Test
      setErrors(0);
      setNextIdx(0);
      setLastTap(null);
      startRef.current = null;
      setPhase("idle");
    } else if (blockIdx + 1 < blocks.length) {
      // nächster Block (wieder mit Übung)
      setBlockIdx((i) => i + 1);
      setIsPractice(true);
      setErrors(0);
      setNextIdx(0);
      setLastTap(null);
      startRef.current = null;
      setPhase("idle");
    } else {
      // Gesamtergebnis
      const totalMs = perBlock.reduce((a, b) => a + (b?.timeMs || 0), 0);
      const totalErr = perBlock.reduce((a, b) => a + (b?.errors || 0), 0);
      setPhase("done");
      onComplete?.({ timeMs: totalMs, errors: totalErr, perBlock });
    }
  }

  // --- Interaktion ---
  function handleClick(label) {
    if (phase !== "running") return;
    const expected = targetSeq[nextIdx];
    const correct = label === expected;
    setLastTap({ label, ok: correct });
    setTimeout(() => setLastTap((lt) => (lt && lt.label === label ? null : lt)), 200);

    if (correct) {
      if (startRef.current == null) startRef.current = performance.now();
      const ni = nextIdx + 1;
      setNextIdx(ni);
      if (ni >= targetSeq.length) finishBlock();
    } else {
      if (startRef.current != null) setErrors((e) => e + 1);
    }
  }

  // Tastatur-Input
  useEffect(() => {
    function onKey(e) {
      if (phase !== "running") return;
      const k = e.key.toUpperCase();
      if (k >= "1" && k <= "9") return handleClick(k);
      if (k === "0") return handleClick("10");
      if (k === "-") return handleClick("11");
      if (k === "=" || k === "+") return handleClick("12");
      if (k.length === 1 && k >= "A" && k <= "L") return handleClick(k);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase, nextIdx, targetSeq]);

  // Darstellung
  const nextLabel = targetSeq[nextIdx] ?? "-";
  const doneCount = nextIdx;
  const showHint = isPractice; // nur in der Übung markieren

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Aufmerksamkeit (Trails {kind})</h3>
      <p className="text-sm text-gray-600">
        {kind === "A" ? (
          <>Tippe die Zahlen in der richtigen Reihenfolge, so schnell wie möglich.</>
        ) : (
          <>Tippe abwechselnd <b>Zahl–Buchstabe</b>: 1–A–2–B–…–12–L.</>
        )}
      </p>

      {/* Hinweisbalken */}
      {isPractice ? (
        <div className="mt-2 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 px-3 py-2 text-sm">
          <b>Übungsrunde:</b> Hinweise sind eingeblendet und dieser Durchlauf wird <b>nicht</b> gewertet.
        </div>
      ) : (
        <div className="mt-2 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-800 px-3 py-2 text-sm">
          <b>Wertbarer Test:</b> Keine Hinweise. Jeder Klick wird markiert (✔/✗).
        </div>
      )}

      {/* Board */}
      <div ref={boardRef} className="relative mt-4 h-[420px] rounded-2xl border border-gray-200 bg-white overflow-hidden">
        {/* Verbindungslinie */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {doneCount > 0 && (
            <polyline
              fill="none"
              stroke="rgba(59,130,246,.6)"
              strokeWidth="3"
              points={(() => {
                const pts = [];
                for (let i = 0; i < doneCount; i++) {
                  const lab = targetSeq[i];
                  const p = pos.find((t) => t.label === lab);
                  if (p) pts.push(`${p.x},${p.y}`);
                }
                return pts.join(" ");
              })()}
            />
          )}
        </svg>

        {pos.map((t) => {
          const isNext = showHint && t.label === nextLabel && phase === "running";
          const isDone = targetSeq.indexOf(t.label) < nextIdx;
          const isFlash = lastTap && lastTap.label === t.label;
          const flashOk = isFlash && lastTap.ok;
          const flashBad = isFlash && !lastTap.ok;
          return (
            <button
              key={t.label}
              onClick={() => handleClick(t.label)}
              className={[
                "absolute -translate-x-1/2 -translate-y-1/2 rounded-full border grid place-items-center select-none",
                "w-14 h-14 text-lg font-semibold",
                isDone ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-gray-300 hover:bg-gray-50",
                isNext ? "ring-2 ring-blue-300 animate-pulse" : "",
                flashOk ? "ring-2 ring-emerald-400" : "",
                flashBad ? "ring-2 ring-rose-400" : "",
              ].join(" ")}
              style={{ left: t.x, top: t.y }}
              aria-label={`Punkt ${t.label}${isNext ? " – als nächstes" : ""}`}
            >
              <span className="relative">
                {t.label}
                {isFlash && (
                  <span className={[
                    "absolute -top-3 -right-4 text-base font-bold",
                    flashOk ? "text-emerald-600" : "text-rose-600",
                  ].join(" ")}>{flashOk ? "✔" : "✗"}</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {phase === "idle" && (
        <div className="mt-3">
          <button onClick={start} className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50">
            {isPractice ? `Übungsrunde Block ${blockIdx + 1} starten` : `Test Block ${blockIdx + 1} starten`}
          </button>
        </div>
      )}

      {phase === "running" && (
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {showHint ? (
            <div className="rounded-lg bg-blue-50 px-3 py-2">Nächstes Ziel: <b>{nextLabel}</b></div>
          ) : (
            <div className="rounded-lg bg-blue-50 px-3 py-2">Fortschritt: <b>{doneCount}/{targetSeq.length}</b></div>
          )}
          <div className="rounded-lg bg-amber-50 px-3 py-2">Fehler: <b>{errors}</b></div>
        </div>
      )}

      {phase === "blockEnd" && (
        <div className="mt-4 space-y-3">
          <div className="rounded-lg bg-gray-50 border px-3 py-2 text-sm">
            <div>{isPractice ? `Übungsrunde Block ${blockIdx + 1} beendet (nicht gewertet)` : `Ergebnis Block ${blockIdx + 1} (${kind})`}</div>
            {!isPractice && (
              <div className="mt-1 text-gray-700">Zeit: <b>{perBlock[blockIdx]?.timeMs ?? 0} ms</b> · Fehler: <b>{perBlock[blockIdx]?.errors ?? 0}</b></div>
            )}
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <button onClick={continueOrFinish} className="w-full rounded-xl bg-blue-600 text-white px-4 py-3 font-medium hover:bg-blue-700">
              {isPractice ? "Zum wertbaren Test (ohne Hinweise)" : (blockIdx + 1 < blocks.length ? `Weiter zu Block ${blockIdx + 2}` : "Gesamtergebnis anzeigen")}
            </button>
            <button onClick={restartBlock} className="w-full rounded-xl border px-4 py-3 text-sm hover:bg-gray-50">{isPractice ? "Übung wiederholen" : "Block wiederholen"}</button>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="mt-4 text-sm rounded-lg bg-white border p-3">
          <div className="font-medium">Gesamt (A+B)</div>
          <ul className="mt-1 list-disc pl-5 space-y-1">
            <li>Zeit gesamt: <b>{perBlock.reduce((a,b)=>a+(b?.timeMs||0),0)} ms</b></li>
            <li>Fehler gesamt: <b>{perBlock.reduce((a,b)=>a+(b?.errors||0),0)}</b></li>
          </ul>
        </div>
      )}
    </div>
  );
}
