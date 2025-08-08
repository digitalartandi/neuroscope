// src/App.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { BANK } from "./data/bank";
import Nav from "./components/Nav";
import TowerOfLondon from "./modules/TowerOfLondon";
import NBack from "./modules/NBack";
import Stroop from "./modules/Stroop";
import Trails from "./modules/Trails";

/* ============ small helpers ============ */
const isScale = (m) => m?.kind === "scale";
const answerableCount = (bank) =>
  bank.filter(isScale).reduce((n, m) => n + (m.items?.length ?? 0), 0);
const answeredCount = (ans, bank) => {
  const keys = bank
    .filter(isScale)
    .flatMap((m) => m.items?.map((it) => it.key) ?? []);
  return keys.filter((k) => ans[k] !== undefined).length;
};

/* ============ UI atoms ============ */
function Header({ onSave, onRequestReset }) {
  return (
    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-gray-200">
      <div className="mx-auto max-w-xl sm:max-w-2xl lg:max-w-3xl px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span aria-hidden className="inline-block h-3 w-3 rounded-full bg-blue-500" />
          <span className="text-sm font-medium">Innere Reise</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onSave}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
            title="Fortschritt lokal speichern"
          >
            Speichern
          </button>
          <button
            onClick={onRequestReset}
            className="rounded-lg border px-2 py-1 text-xs hover:bg-gray-50"
            title="Neu starten"
          >
            Neu starten
          </button>
        </div>
      </div>
    </header>
  );
}
function Footer() {
  return (
    <footer className="fixed bottom-0 inset-x-0 border-t border-gray-200 bg-white/80 backdrop-blur z-10">
      <div className="mx-auto max-w-xl sm:max-w-2xl lg:max-w-3xl px-4 py-2 text-center text-xs text-gray-500">
        Orientierung & Selbstreflexion. Keine klinische Diagnose. In Notfällen 112.
      </div>
    </footer>
  );
}
function Card({ className = "", children }) {
  return (
    <div className={`rounded-2xl bg-white shadow-lg ring-1 ring-black/5 p-4 sm:p-5 ${className}`}>
      {children}
    </div>
  );
}
function PrimaryButton({ onClick, children, className = "" }) {
  return (
    <button
      onClick={onClick}
      className={`btn-gradient w-full rounded-xl px-4 py-3 text-white font-semibold shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-300 active:scale-[0.99] transition ${className}`}
    >
      {children}
    </button>
  );
}
function OutlineButton({ onClick, children, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-300 ${className}`}
    >
      {children}
    </button>
  );
}
function Progress({ percent, label }) {
  return (
    <div aria-live="polite">
      <div className="flex justify-between">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-gray-500"><span className="font-semibold">{percent}%</span></p>
      </div>
      <div
        className="mt-2 h-2 w-full rounded-full bg-gray-200"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div
          className="h-2 rounded-full bg-blue-600 transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

/* ===== Background FX (openai-like moving blur) ===== */
function BackgroundFX(){
  return (
    <div className="fx-wrap" aria-hidden="true">
      <span className="fx-blur fx-a"></span>
      <span className="fx-blur fx-b"></span>
      <span className="fx-blur fx-c"></span>
    </div>
  );
}

/* ============ minimal intro (clean) ============ */
function Landing({ onStart }) {
  return (
    <div className="min-h-[76vh] grid place-items-center px-4">
      <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl w-full">
        <div className="hero-card rounded-3xl p-6 sm:p-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
            Willkommen
          </h1>
          <p className="mt-3 text-gray-700 text-base sm:text-lg leading-relaxed">
            Eine traumasensible, ICD-11-orientierte Reise zu deiner Psyche – klar,
            respektvoll, in deinem Tempo.
          </p>
          <div className="mt-6 max-w-sm">
            <PrimaryButton onClick={onStart}>Jetzt starten</PrimaryButton>
          </div>
          <p className="mt-3 text-xs text-gray-500">
            Deine Antworten bleiben lokal auf deinem Gerät, bis du sie bewusst exportierst.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ============ app ============ */
export default function App() {
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [ans, setAns] = useState({});
  const [safety, setSafety] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [announce, setAnnounce] = useState(""); // aria-live
  const focusRef = useRef(null);

  /* ---- DM Sans einbinden (ohne index.html) ---- */
  useEffect(() => {
    const pre1 = document.createElement("link");
    pre1.rel = "preconnect";
    pre1.href = "https://fonts.googleapis.com";
    const pre2 = document.createElement("link");
    pre2.rel = "preconnect";
    pre2.href = "https://fonts.gstatic.com";
    pre2.crossOrigin = "anonymous";
    const font = document.createElement("link");
    font.rel = "stylesheet";
    font.href =
      "https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
    document.head.append(pre1, pre2, font);
    return () => { pre1.remove(); pre2.remove(); font.remove(); };
  }, []);

  // bg + fx + utilities
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      :root{
        --ui-accent:#3b82f6;
        --ui-accent-strong:#1d4ed8;
      }
      html, body, button, input, select, textarea{
        font-family:"DM Sans", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, "Helvetica Neue", Arial, "Apple Color Emoji","Segoe UI Emoji";
        -webkit-font-smoothing:antialiased; -moz-osx-font-smoothing:grayscale;
      }
      .app-gradient{
        background: radial-gradient(80% 60% at 50% -10%, #eef2ff 0%, #ffffff 60%);
      }
      .btn-gradient{
        background-image: linear-gradient(135deg, var(--ui-accent), #7c3aed);
        color:#fff;
      }
      .btn-gradient:hover{ filter:brightness(1.05) }
      .btn-gradient:focus{ outline:none; box-shadow:0 0 0 3px rgba(59,130,246,.35) }
      .animate-fade-in{ animation:fadein .35s ease-out both }
      @keyframes fadein{ from{opacity:0; transform: translateY(6px)} to{opacity:1; transform: translateY(0)} }

      /* ---- Moving Blur FX ---- */
      .fx-wrap{ position:absolute; inset:0; overflow:hidden; pointer-events:none; }
      .fx-blur{ position:absolute; border-radius:9999px; filter:blur(60px); opacity:.7; mix-blend-mode: normal; will-change:transform, opacity, filter; }
      .fx-a{
        width:45vw; height:45vw; left:-10vw; top:-6vw;
        background: radial-gradient(35% 35% at 50% 50%, #6EE7B7 0%, rgba(110,231,183,0) 60%),
                    radial-gradient(30% 30% at 70% 40%, #60A5FA 0%, rgba(96,165,250,0) 60%),
                    radial-gradient(28% 28% at 30% 60%, #F472B6 0%, rgba(244,114,182,0) 60%);
        animation: morph-a 26s ease-in-out infinite alternate, float 18s ease-in-out infinite;
      }
      .fx-b{
        width:55vw; height:55vw; right:-8vw; top:-2vw;
        background: radial-gradient(35% 35% at 40% 50%, #C4B5FD 0%, rgba(196,181,253,0) 60%),
                    radial-gradient(30% 30% at 70% 60%, #93C5FD 0%, rgba(147,197,253,0) 60%),
                    radial-gradient(28% 28% at 30% 30%, #FDBA74 0%, rgba(253,186,116,0) 60%);
        animation: morph-b 28s ease-in-out infinite alternate, float 22s ease-in-out infinite reverse;
      }
      .fx-c{
        width:48vw; height:48vw; left:15vw; bottom:-12vw;
        background: radial-gradient(35% 35% at 50% 50%, #FCA5A5 0%, rgba(252,165,165,0) 60%),
                    radial-gradient(30% 30% at 65% 35%, #86EFAC 0%, rgba(134,239,172,0) 60%),
                    radial-gradient(28% 28% at 30% 70%, #A5B4FC 0%, rgba(165,180,252,0) 60%);
        animation: morph-c 24s ease-in-out infinite alternate, float 20s ease-in-out infinite;
      }
      @keyframes morph-a{ 0%{transform:translate3d(0,0,0) rotate(0) scale(1)} 100%{transform:translate3d(4vw,-2vw,0) rotate(15deg) scale(1.08)} }
      @keyframes morph-b{ 0%{transform:translate3d(0,0,0) rotate(0) scale(1)} 100%{transform:translate3d(-3vw,1vw,0) rotate(-12deg) scale(1.1)} }
      @keyframes morph-c{ 0%{transform:translate3d(0,0,0) rotate(0) scale(1)} 100%{transform:translate3d(2vw,-2vw,0) rotate(10deg) scale(1.06)} }
      @keyframes float{ 0%,100%{ transform: translateY(0) } 50%{ transform: translateY(-0.6vw) } }

      /* Glass Card für Hero */
      .hero-card{
        backdrop-filter: blur(8px);
        background: rgba(255,255,255,.72);
        border: 1px solid rgba(255,255,255,.5);
        box-shadow: 0 10px 30px rgba(2,6,23,.08);
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  // restore progress
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("psyche_state") || "{}");
      if (saved.answers) setAns(saved.answers);
      if (Number.isFinite(saved.idx)) setIdx(saved.idx);
      if (saved.started) setStarted(true);
    } catch {}
  }, []);
  // autosave
  useEffect(() => {
    localStorage.setItem("psyche_state", JSON.stringify({ started, idx, answers: ans }));
  }, [started, idx, ans]);

  const current = BANK[idx];
  const total = useMemo(() => answerableCount(BANK), []);
  const completed = useMemo(() => answeredCount(ans, BANK), [ans]);
  const progress = total ? Math.round((completed / total) * 100) : 0;

  useEffect(() => {
    // move focus to section header for SR users
    if (focusRef.current) focusRef.current.focus();
  }, [idx]);

  function setAnswer(key, value) {
    setAns((p) => ({ ...p, [key]: value }));
  }
  function jumpTo(id) {
    const i = BANK.findIndex((m) => m.id === id);
    if (i !== -1) {
      setIdx(i);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }
  function completionFor(module) {
    const items = module?.items || [];
    if (!items.length) return 0;
    const done = items.filter((it) => ans[it.key] !== undefined).length;
    return done / items.length;
  }

  function next() {
    // contextual safety ping (e.g. suicide item)
    if (current?.id === "mood" && (ans["m_suicide"] ?? 0) >= 1) {
      setSafety(true);
    }
    const nextId = current?.next;
    if (nextId) {
      const i = BANK.findIndex((m) => m.id === nextId);
      if (i !== -1) setIdx(i);
    } else {
      setIdx((i) => Math.min(i + 1, BANK.length - 1));
    }
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }
  function back() {
    if (idx > 0) setIdx(idx - 1);
  }
  function saveNow() {
    localStorage.setItem("psyche_state", JSON.stringify({ started, idx, answers: ans }));
    setAnnounce("Gespeichert.");
    setTimeout(() => setAnnounce(""), 1500);
  }
  function resetAll() {
    setAns({});
    setIdx(0);
    setStarted(false);
    localStorage.removeItem("psyche_state");
    setConfirmReset(false);
    setTimeout(() => window.scrollTo({ top: 0, behavior: "smooth" }), 0);
  }

  const report = useMemo(() => buildReport(ans), [ans]);

  // landing (clean)
  if (!started) {
    return (
      <div className="min-h-dvh app-gradient text-gray-900 relative">
        <BackgroundFX />
        <Header onSave={saveNow} onRequestReset={() => setConfirmReset(true)} />
        <main className="mx-auto max-w-xl sm:max-w-2xl lg:max-w-3xl px-4">
          <Landing onStart={() => setStarted(true)} />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-dvh app-gradient text-gray-900 relative">
      <BackgroundFX />
      <Header onSave={saveNow} onRequestReset={() => setConfirmReset(true)} />

      {/* Mobile-first nav with icons + quick picker */}
      <Nav
        modules={BANK.filter((m) => m.id !== "intro" && m.id !== "summary")}
        currentId={current?.id}
        onJump={jumpTo}
        completionFor={completionFor}
      />

      <main className="relative mx-auto max-w-xl sm:max-w-2xl lg:max-w-3xl px-4 pb-28 pt-4 sm:pt-6">
        <h1
          ref={focusRef}
          tabIndex={-1}
          className="sr-only"
        >
          {current?.title || "Abschnitt"}
        </h1>

        <Progress percent={progress} label="Gesamtfortschritt" />
        <div className="sr-only" aria-live="polite">{announce}</div>

        {/* Info/Intro stepper AFTER start if present */}
        {(current?.kind === "info" || current?.kind === "intro") && (
          <Card className="mt-4">
            <h2 className="text-xl font-semibold">{current.title}</h2>
            <ol className="mt-3 space-y-3">
              {(current.bullets || []).map((t, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                    {i + 1}
                  </span>
                  <p className="text-sm text-gray-700">{t}</p>
                </li>
              ))}
            </ol>
            <PrimaryButton onClick={next} className="mt-4">Weiter</PrimaryButton>
          </Card>
        )}

        {/* Scales (accessible radios styled as chips) */}
        {current?.kind === "scale" && (
          <ScaleModule
            module={current}
            answers={ans}
            onAnswer={setAnswer}
            onNext={next}
            onBack={back}
            isFirst={idx === 0}
          />
        )}

        {/* yes/no */}
        {current?.kind === "yesno" && (
          <YesNoModule
            module={current}
            answers={ans}
            onAnswer={setAnswer}
            onNext={next}
            onBack={back}
            isFirst={idx === 0}
          />
        )}

        {/* Interactive cognitive tests */}
        {current?.kind === "interactive" && current.id === "tol" && (
          <Card className="mt-4">
            <TowerOfLondon
              onComplete={(res) => {
                setAnswer("tol_reached", res?.reached ? 1 : 0);
                if (typeof res?.moves === "number") setAnswer("tol_moves", res.moves);
                if (typeof res?.efficiency === "number") setAnswer("tol_eff", Number(res.efficiency.toFixed(2)));
                next();
              }}
              ariaLabel="Tower of London Planungsaufgabe"
            />
          </Card>
        )}
        {current?.kind === "interactive" && current.id === "nback" && (
          <Card className="mt-4">
            <NBack
              onComplete={(res) => {
                setAnswer("nback_hits", res?.hits ?? 0);
                setAnswer("nback_false", res?.falseAlarms ?? 0);
                setAnswer("nback_acc", res?.accuracy ?? 0);
                next();
              }}
            />
          </Card>
        )}
        {current?.kind === "interactive" && current.id === "stroop" && (
          <Card className="mt-4">
            <Stroop
              onComplete={(res) => {
                setAnswer("stroop_acc", Number(res?.accuracy ?? 0));
                setAnswer("stroop_trials", Number(res?.total ?? 0));
                next();
              }}
            />
          </Card>
        )}
        {current?.kind === "interactive" && current.id === "trails" && (
          <Card className="mt-4">
            <Trails
              onComplete={(res) => {
                setAnswer("trails_ms", Number(res?.timeMs ?? 0));
                setAnswer("trails_err", Number(res?.errors ?? 0));
                next();
              }}
            />
          </Card>
        )}

        {/* Summary */}
        {current?.kind === "summary" && (
          <SummaryCard
            report={report}
            onRestart={() => setConfirmReset(true)}
            onSave={saveNow}
          />
        )}
      </main>

      <Footer />

      {/* safety */}
      {safety && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold">Danke für dein Vertrauen</h3>
            <p className="mt-2 text-sm">
              Deine Angabe zeigt, dass es dir gerade schwer geht. Du bist nicht allein.
              Wenn akute Gefahr besteht: Notruf 112. Du kannst fortfahren – bitte achte gut auf dich.
            </p>
            <div className="mt-4 flex gap-2">
              <OutlineButton onClick={() => setSafety(false)}>Weiter</OutlineButton>
              <a
                className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                href="https://www.telefonseelsorge.de/"
                target="_blank"
                rel="noreferrer"
              >
                Soforthilfe (extern)
              </a>
            </div>
          </Card>
        </div>
      )}

      {/* reset confirm */}
      {confirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
          <Card className="max-w-md w-full">
            <h3 className="text-lg font-semibold">Alles zurücksetzen?</h3>
            <p className="mt-2 text-sm">Deine Antworten und dein Fortschritt werden gelöscht. Bist du sicher?</p>
            <div className="mt-4 flex gap-2">
              <OutlineButton onClick={() => setConfirmReset(false)}>Abbrechen</OutlineButton>
              <button
                onClick={resetAll}
                className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Ja, neu starten
              </button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

/* ============ Scale module (accessible radios) ============ */
function ScaleModule({ module, answers, onAnswer, onNext, onBack, isFirst }) {
  return (
    <Card className="mt-4">
      <h2 className="text-xl font-semibold">{module.title}</h2>

      <div className="mt-3 space-y-3">
        {(module.items || []).map((it) => (
          <fieldset key={it.key} className="rounded-2xl border border-gray-200 bg-white p-3">
            <legend className="text-[15px] font-medium">{it.q}</legend>
            <div role="radiogroup" aria-label={it.q} className="mt-3 space-y-2">
              {(module.scale || []).map((opt) => {
                const id = `${it.key}-${opt.value}`;
                const selected = answers[it.key] === opt.value;
                return (
                  <label
                    key={opt.value}
                    htmlFor={id}
                    className={
                      "block w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer " +
                      (selected
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.01] border-transparent"
                        : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800")
                    }
                  >
                    <input
                      id={id}
                      type="radio"
                      name={it.key}
                      className="sr-only"
                      checked={selected || false}
                      onChange={() => onAnswer(it.key, opt.value)}
                      aria-checked={selected}
                    />
                    {opt.label}
                  </label>
                );
              })}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onAnswer(it.key, undefined)}
                  className="text-xs text-gray-500 underline"
                >
                  Überspringen
                </button>
              </div>
            </div>
          </fieldset>
        ))}
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <OutlineButton onClick={onBack} disabled={isFirst}>Zurück</OutlineButton>
        <PrimaryButton onClick={onNext}>Weiter</PrimaryButton>
      </div>
    </Card>
  );
}

/* ============ Yes/No ============ */
function YesNoModule({ module, answers, onAnswer, onNext, onBack, isFirst }) {
  return (
    <Card className="mt-4">
      <h2 className="text-xl font-semibold">{module.title}</h2>
      <div className="mt-3 space-y-3">
        {(module.items || []).map((it) => (
          <fieldset key={it.key} className="rounded-2xl border border-gray-200 bg-white p-3">
            <legend className="text-[15px] font-medium">{it.q}</legend>
            <div role="radiogroup" aria-label={it.q} className="mt-3 space-y-2">
              {[
                { value: 1, label: "Ja" },
                { value: 0, label: "Nein" },
              ].map((opt) => {
                const id = `${it.key}-${opt.value}`;
                const selected = answers[it.key] === opt.value;
                return (
                  <label
                    key={opt.value}
                    htmlFor={id}
                    className={
                      "block w-full text-left px-4 py-3 rounded-xl border transition-all cursor-pointer " +
                      (selected
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.01] border-transparent"
                        : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800")
                    }
                  >
                    <input
                      id={id}
                      type="radio"
                      name={it.key}
                      className="sr-only"
                      checked={selected || false}
                      onChange={() => onAnswer(it.key, opt.value)}
                      aria-checked={selected}
                    />
                    {opt.label}
                  </label>
                );
              })}
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => onAnswer(it.key, undefined)}
                  className="text-xs text-gray-500 underline"
                >
                  Überspringen
                </button>
              </div>
            </div>
          </fieldset>
        ))}
      </div>
      <div className="mt-5 flex justify-between gap-3">
        <OutlineButton onClick={onBack} disabled={isFirst}>Zurück</OutlineButton>
        <PrimaryButton onClick={onNext}>Weiter</PrimaryButton>
      </div>
    </Card>
  );
}

/* ============ Report + personalised text ============ */
function bandIdx(v, cut) {
  let i = 0;
  while (i < cut.length && v >= cut[i]) i++;
  return i; // 0..n
}
function labelBand(i, higherIsBetter = false) {
  const L = higherIsBetter
    ? ["sehr niedrig", "niedrig", "moderat", "gut", "sehr gut"]
    : ["niedrig", "leicht", "mäßig", "deutlich", "hoch"];
  return L[Math.min(i, L.length - 1)];
}

function buildReport(a) {
  // sums per domain (aligned with existing BANK keys)
  const sum = (keys) => keys.reduce((s, k) => s + (a[k] ?? 0), 0);
  const mood = sum(["m_interest","m_down","m_sleep","m_energy","m_appetite","m_selfworth","m_focus","m_psycho","m_suicide"]);
  const anx  = sum(["a_nervous","a_control","a_broad","a_relax","a_restless","a_irrit","a_fear"]);
  const ptsd = sum(["t_intrusions","t_avoid","t_negative","t_arousal"]);
  const ocd  = sum(["o_obs","o_comp","o_control","o_impuls"]);
  const self = sum(["s_worth","s_coherence","s_goals","s_selfcomp"]);
  const rel  = sum(["r_trust","r_closeness","r_conflict","r_support"]);
  const som  = sum(["k_pain","k_fatigue","k_gi","k_veget"]);
  const cog  = sum(["c_rumination","c_catastrophe","c_blackwhite","c_mindread"]);
  const res  = sum(["res_energy","res_calm","res_interest","res_active","res_meaning"]);
  const funcVals = ["f_understand","f_mobility","f_selfcare","f_social","f_life","f_participation"].map(k => a[k]).filter(Number.isFinite);
  const func01 = funcVals.length ? (funcVals.reduce((x,y)=>x+y,0)/funcVals.length - 1)/4 : null;

  // cognitive tasks (simple mapping)
  const tolEff = a["tol_eff"] ?? null;
  const nbackAcc = a["nback_acc"] ?? null;
  const stroopAcc = a["stroop_acc"] ?? null;
  const trailsMs = a["trails_ms"] ?? null;

  return {
    mood: { raw: mood, band: bandIdx(mood,[5,10,15,20,27]) },
    anx:  { raw: anx,  band: bandIdx(anx,[5,10,15,21]) },
    ptsd: { raw: ptsd, band: bandIdx(ptsd,[4,8,12,16]) },
    ocd:  { raw: ocd,  band: bandIdx(ocd,[2,4,6,8]) },
    self: { raw: self, band: bandIdx(self,[5,10,13,15]), higher: true },
    rel:  { raw: rel,  band: bandIdx(rel,[5,10,13,15]), higher: true },
    som:  { raw: som,  band: bandIdx(som,[2,4,6,8]) },
    cog:  { raw: cog,  band: bandIdx(cog,[2,4,6,8]) },
    res:  { raw: res,  band: bandIdx(res,[5,10,15,20]), higher: true },
    func: { raw: func01 }, // 0..1 where higher = worse; we map below
    tasks: { tolEff, nbackAcc, stroopAcc, trailsMs },
    safety: { risk: (a["m_suicide"] ?? 0) >= 1 }
  };
}

function SummaryCard({ report, onRestart, onSave }) {
  const blocks = [];
  const add = (title, desc, color="blue") => blocks.push({title,desc,color});

  // personalised hints per domain
  const d = report;

  const mk = (name, obj) => {
    const txt = obj.higher ? labelBand(obj.band, true) : labelBand(obj.band, false);
    return `${name}: ${txt}.`;
  };
  add("Emotionen", [
    mk("Stimmung", d.mood),
    mk("Anspannung/Angst", d.anx),
    `Trauma-Hinweise: ${labelBand(d.ptsd.band)}.`,
    `Zwänge/Impulse: ${labelBand(d.ocd.band)}.`
  ].join(" "), "indigo");

  add("Selbst & Beziehungen", [
    `Selbstbild: ${labelBand(d.self.band, true)} (höher = besser).`,
    `Beziehungen: ${labelBand(d.rel.band, true)} (höher = besser).`
  ].join(" "), "emerald");

  add("Körper & Denken", [
    `Körperlicher Stress: ${labelBand(d.som.band)}.`,
    `Kognitive Muster: ${labelBand(d.cog.band)}.`
  ].join(" "), "amber");

  add("Ressourcen & Alltag", [
    `Resilienz: ${labelBand(d.res.band, true)} (höher = besser).`,
    d.func.raw == null ? "Funktion: n/a." : `Funktionieren: ${d.func.raw > 0.66 ? "deutlich" : d.func.raw > 0.33 ? "mäßig" : "gering"}e Einschränkungen.`
  ].join(" "), "sky");

  // cognitive tasks qualitative text
  const taskTxt = [];
  if (d.tasks.tolEff != null) taskTxt.push(`Planung (ToL): ${d.tasks.tolEff >= 0.8 ? "effizient" : d.tasks.tolEff >= 0.5 ? "mittel" : "ausbaufähig"}.`);
  if (d.tasks.nbackAcc != null) taskTxt.push(`Arbeitsgedächtnis (N-Back): ${Math.round((d.tasks.nbackAcc||0)*100)}% Genauigkeit.`);
  if (d.tasks.stroopAcc != null) taskTxt.push(`Inhibition (Stroop): ${Math.round((d.tasks.stroopAcc||0)*100)}% korrekt.`);
  if (d.tasks.trailsMs != null) taskTxt.push(`Aufmerksamkeit/Tempo (Trails A): ${Math.round(d.tasks.trailsMs/1000)}s.`);

  if (taskTxt.length) add("Kognitive Leistung", taskTxt.join(" "), "violet");

  // accessible bars (no chart deps)
  const bars = [
    ["Stimmung", d.mood.raw, 27],
    ["Angst", d.anx.raw, 21],
    ["Trauma", d.ptsd.raw, 16],
    ["Zwänge", d.ocd.raw, 8],
    ["Selbst (↑gut)", d.self.raw, 16, true],
    ["Beziehungen (↑gut)", d.rel.raw, 16, true],
    ["Körperstress", d.som.raw, 8],
    ["Kognitionen", d.cog.raw, 8],
    ["Resilienz (↑gut)", d.res.raw, 20, true],
  ];

  // Tailwind-Purge-sichere Farben
  const COLOR_MAP = {
    indigo: "bg-indigo-50 border-indigo-200",
    emerald: "bg-emerald-50 border-emerald-200",
    amber: "bg-amber-50 border-amber-200",
    sky: "bg-sky-50 border-sky-200",
    violet: "bg-violet-50 border-violet-200",
    blue: "bg-blue-50 border-blue-200",
  };

  return (
    <Card className="mt-4 animate-fade-in">
      <h2 className="text-2xl font-bold">Zusammenfassung</h2>
      <p className="mt-1 text-sm text-gray-600">
        Individuelle Orientierung – kein Ersatz für eine klinische Diagnose. Teile die PDF bei Bedarf mit Fachpersonen.
      </p>

      {/* bars */}
      <div className="mt-4 space-y-3" aria-label="Profilübersicht">
        {bars.map(([label, raw, max, higherIsBetter=false]) => {
          const pct = Math.max(0, Math.min(100, Math.round(((raw ?? 0) / max) * 100)));
          return (
            <div key={label}>
              <div className="flex justify-between text-xs">
                <span>{label}</span>
                <span>{raw ?? 0}/{max}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full ${higherIsBetter ? "bg-emerald-600" : "bg-blue-600"}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* personalised text blocks */}
      <div className="mt-6 space-y-3">
        {blocks.map((b, i) => {
          const cls = COLOR_MAP[b.color] || "bg-gray-50 border-gray-200";
          return (
            <div key={i} className={`rounded-xl ${cls} p-3 text-sm`}>
              <p className="leading-relaxed">{b.desc}</p>
            </div>
          );
        })}
        {d.safety.risk && (
          <div className="rounded-xl bg-amber-50 border border-amber-300 p-3 text-sm">
            <strong>Wichtig:</strong> Du hast belastende Gedanken angegeben. Hol dir bitte Unterstützung.
            In akuten Situationen: 112. Krisenhilfe: telefonseelsorge.de
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <OutlineButton onClick={onSave}>Speichern</OutlineButton>
        <button
          onClick={() => window.print()}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
        >
          Als PDF speichern
        </button>
        <button
          onClick={onRestart}
          className="rounded-xl px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700"
        >
          Neu starten
        </button>
      </div>
    </Card>
  );
}
