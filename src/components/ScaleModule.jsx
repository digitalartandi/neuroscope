import React from "react";

export default function ScaleModule({ module, answers, onAnswer, onNext, onBack, isFirst }) {
  // nur echte Antworten zählen (null = bewusst übersprungen)
  const unanswered = (module.items || []).filter((it) => answers[it.key] == null);

  function handleNext() {
    // nicht mehr blockieren – weiter geht's auch bei offenen Items
    onNext();
  }

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-xl font-semibold">{module.title}</h2>

      <div className="mt-3 space-y-3">
        {(module.items || []).map((it) => {
          const isUnanswered = answers[it.key] == null;
          return (
            <fieldset
              key={it.key}
              className={`rounded-2xl border p-3 ${
                isUnanswered ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
              }`}
            >
              <legend className="text-[15px] font-medium">{it.q}</legend>
              <div role="radiogroup" aria-label={it.q} className="mt-3 space-y-2">
                { (it.scale || module.scale || []).map((opt) => {
                  const id = `${it.key}-${opt.value}`;
                  const selected = answers[it.key] === opt.value;
                  return (
                    <label
                      key={opt.value}
                      htmlFor={id}
                      className={`block w-full text-left px-4 py-3 rounded-xl border cursor-pointer transition-all ${
                        selected
                          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg scale-[1.01] border-transparent"
                          : "bg-white hover:bg-gray-50 border-gray-200 text-gray-800"
                      }`}
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
                    onClick={() => onAnswer(it.key, null)}  // <— bewusst übersprungen
                    className="text-xs text-gray-500 underline"
                    aria-label={`Antwort für Frage '${it.q}' überspringen`}
                  >
                    Überspringen
                  </button>
                </div>
              </div>
            </fieldset>
          );
        })}
      </div>

      <div className="mt-5 flex justify-between gap-3">
        <button
          onClick={onBack}
          disabled={isFirst}
          className="rounded-xl border px-4 py-2 text-sm font-medium disabled:opacity-50 hover:bg-gray-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-300"
        >
          Zurück
        </button>
        <button
          onClick={handleNext}
          className="btn-gradient w-full rounded-xl px-4 py-3 text-white font-semibold shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-300 active:scale-[0.99] transition"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
