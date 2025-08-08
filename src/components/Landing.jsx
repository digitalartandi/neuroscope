import React, { useState } from "react";

export default function Landing({ onStart }) {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <>
      <div className="min-h-[76vh] grid place-items-center px-4">
        <div className="max-w-xl sm:max-w-2xl lg:max-w-3xl w-full">
          <div className="hero-card rounded-3xl p-6 sm:p-8">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight">
              Neuroscope
            </h1>
            <p className="mt-3 text-gray-700 text-base sm:text-lg leading-relaxed">
              Eine traumasensible, ICD-11-orientierte Reise zu deiner Psyche – klar,
              respektvoll, in deinem Tempo.
            </p>
            <div className="mt-6 flex max-w-sm gap-4">
              <button
                onClick={onStart}
                className="btn-gradient w-full rounded-xl px-4 py-3 text-white font-semibold shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-300 active:scale-[0.99] transition"
              >
                Jetzt starten
              </button>
              <button
                onClick={() => setShowInfo(true)}
                className="rounded-xl border border-blue-600 px-4 py-3 text-blue-600 font-semibold hover:bg-blue-50 focus:outline-none focus-visible:ring focus-visible:ring-blue-300"
                aria-haspopup="dialog"
              >
                Info
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              Deine Antworten bleiben lokal auf deinem Gerät, bis du sie bewusst exportierst.
            </p>
          </div>
        </div>
      </div>

      {showInfo && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
        >
          <div className="max-w-lg w-full rounded-xl bg-white p-6 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Wie funktionieren die Skalen?</h2>
            <p className="mb-4 text-gray-700 leading-relaxed">
              Die Skalen geben Auskunft über Häufigkeiten oder Intensitäten, die du bei
              den Fragen auswählst. Du kannst Fragen auch überspringen, wenn du möchtest.
            </p>
            <button
              onClick={() => setShowInfo(false)}
              className="btn-gradient rounded-xl px-4 py-2 text-white font-semibold shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-300"
            >
              Schließen
            </button>
          </div>
        </div>
      )}
    </>
  );
}
