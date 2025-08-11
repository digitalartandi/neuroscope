import { useState } from "react";

// Funktion für traumasensible, wertschätzende Texte
function traumaSensitiveText(report) {
  const texts = [];

  if (report.progress < 80) {
    texts.push(
      "⚠️ Bitte beachte: Für eine verlässliche Einschätzung sollten mindestens 80% des Tests abgeschlossen sein."
    );
  }

  if (report.ptsd.band >= 3) {
    texts.push(
      "🔴 Deutliche Hinweise auf mögliche Belastungen durch Trauma. Professionelle Unterstützung kann hilfreich sein."
    );
  } else if (report.ptsd.band === 2) {
    texts.push(
      "🟠 Moderate Anzeichen für Traumafolgen. Achte auf deine psychische Gesundheit."
    );
  } else {
    texts.push("🟢 Aktuell keine auffälligen Trauma-Anzeichen.");
  }

  if (report.mood.band >= 3) {
    texts.push(
      "🔴 Starke Belastungen in der Stimmung. Eine weitere Abklärung durch Fachpersonen wird empfohlen."
    );
  } else if (report.mood.band === 2) {
    texts.push("🟠 Leichte bis moderate Stimmungsschwankungen sind vorhanden.");
  } else {
    texts.push("🟢 Stimmung wirkt stabil.");
  }

  // Hier können weitere traumasensible Hinweise je nach Skalen ergänzt werden.

  return texts;
}

const COLOR_MAP = {
  indigo: "bg-indigo-50 border-indigo-300",
  emerald: "bg-emerald-50 border-emerald-300",
  amber: "bg-amber-50 border-amber-300",
  sky: "bg-sky-50 border-sky-300",
  violet: "bg-violet-50 border-violet-300",
  blue: "bg-blue-50 border-blue-300",
};

// ICD-11 Einschätzung basierend auf Skalen im Report
function icd11Assessment(report) {
  const conditions = [];

  if (report.mood.band >= 3) {
    conditions.push("Depressive Episode oder Major Depression");
  }
  if (report.anx.band >= 3) {
    conditions.push("Generalisierte Angststörung oder andere Angststörungen");
  }
  if (report.ptsd.band >= 3) {
    conditions.push("Posttraumatische Belastungsstörung (PTBS)");
  }
  if (report.ocd.band >= 3) {
    conditions.push("Zwangsstörung");
  }
  if (report.bp && report.bp.band >= 3) {
    conditions.push("Bipolare Störung");
  }
  if (report.psychosis && report.psychosis.band >= 3) {
    conditions.push("Psychotische Störung");
  }
  if (report.stress && report.stress.band >= 3) {
    conditions.push("Anpassungsstörung / Belastungsstörung");
  }
  if (conditions.length === 0) {
    conditions.push("Keine eindeutigen Hinweise auf eine psychische Erkrankung im Sinne von ICD-11.");
  }

  return conditions;
}

export default function SummaryCard({ report, onRestart, onSave }) {
  const blocks = [];
  const add = (title, desc, color = "blue") => blocks.push({ title, desc, color });

  // Persönliche Einschätzungen mit den passenden Beschreibungen
  add(
    "Emotionen",
    [
      `Stimmung: ${labelBand(report.mood.band, false)}.`,
      `Angst: ${labelBand(report.anx.band, false)}.`,
      `Trauma: ${labelBand(report.ptsd.band, false)}.`,
      `Zwänge/Impulse: ${labelBand(report.ocd.band, false)}.`,
    ].join(" "),
    "indigo"
  );

  add(
    "Selbst & Beziehungen",
    [
      `Selbstbild: ${labelBand(report.self.band, true)} (höher = besser).`,
      `Beziehungen: ${labelBand(report.rel.band, true)} (höher = besser).`,
    ].join(" "),
    "emerald"
  );

  add(
    "Körper & Denken",
    [
      `Körperlicher Stress: ${labelBand(report.som.band, false)}.`,
      `Kognitive Muster: ${labelBand(report.cog.band, false)}.`,
    ].join(" "),
    "amber"
  );

  add(
    "Ressourcen & Alltag",
    [
      `Resilienz: ${labelBand(report.res.band, true)} (höher = besser).`,
      report.func.raw == null
        ? "Funktion: n/a."
        : `Funktionieren: ${
            report.func.raw > 0.66
              ? "deutlich"
              : report.func.raw > 0.33
              ? "mäßig"
              : "gering"
          }e Einschränkungen.`,
    ].join(" "),
    "sky"
  );

  add(
    "Kognitive Leistung",
    [
      report.tasks.tolEff != null
        ? `Planung (ToL): ${
            report.tasks.tolEff >= 0.8
              ? "effizient"
              : report.tasks.tolEff >= 0.5
              ? "mittel"
              : "ausbaufähig"
          }.`
        : null,
      report.tasks.nbackAcc != null
        ? `Arbeitsgedächtnis (N-Back): ${Math.round(
            (report.tasks.nbackAcc || 0) * 100
          )}% Genauigkeit.`
        : null,
      report.tasks.stroopAcc != null
        ? `Inhibition (Stroop): ${Math.round(
            (report.tasks.stroopAcc || 0) * 100
          )}% korrekt.`
        : null,
      report.tasks.trailsMs != null
        ? `Aufmerksamkeit/Tempo (Trails A): ${Math.round(
            report.tasks.trailsMs / 1000
          )}s.`
        : null,
    ]
      .filter(Boolean)
      .join(" "),
    "violet"
  );

  // Trauma-sensitive Texte
  const traumaTexts = traumaSensitiveText(report);

  // ICD-11 Einschätzung
  const icdConditions = icd11Assessment(report);

  // Balkenanzeige für den Report
  const bars = [
    ["Stimmung", report.mood.raw, 27],
    ["Angst", report.anx.raw, 21],
    ["Trauma", report.ptsd.raw, 16],
    ["Zwänge", report.ocd.raw, 8],
    ["Selbst (↑gut)", report.self.raw, 16, true],
    ["Beziehungen (↑gut)", report.rel.raw, 16, true],
    ["Körperstress", report.som.raw, 8],
    ["Kognitionen", report.cog.raw, 8],
    ["Resilienz (↑gut)", report.res.raw, 20, true],
  ];

  function labelBand(i, higherIsBetter = false) {
    const L = higherIsBetter
      ? ["sehr niedrig", "niedrig", "moderat", "gut", "sehr gut"]
      : ["niedrig", "leicht", "mäßig", "deutlich", "hoch"];
    return L[Math.min(i, L.length - 1)];
  }

  return (
    <div className="mt-4 animate-fade-in max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Zusammenfassung & Dashboard</h2>

      <p className="mb-3 text-gray-600">
        Individuelle Orientierung – kein Ersatz für eine klinische Diagnose. Bitte beachte, dass mindestens 80% des Tests ausgefüllt sein sollten.
      </p>

      {/* Fortschritt */}
      <p className="mb-6 font-semibold text-gray-700">
        Testfortschritt: {report.progress}%
      </p>

      {/* Balken-Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
        {bars.map(([label, raw, max, higher]) => {
          const pct = Math.max(
            0,
            Math.min(100, Math.round(((raw ?? 0) / max) * 100))
          );
          return (
            <div
              key={label}
              className={`p-4 rounded-lg border ${
                higher ? "border-emerald-400 bg-emerald-50" : "border-blue-400 bg-blue-50"
              }`}
            >
              <div className="flex justify-between font-semibold mb-1">
                <span>{label}</span>
                <span>
                  {raw ?? 0}/{max} ({pct}%)
                </span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className={`h-4 rounded-full transition-all duration-500 ease-in-out ${
                    higher ? "bg-emerald-600" : "bg-blue-600"
                  }`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Trauma-sensitive Hinweise */}
      <div className="space-y-4 mb-8">
        {traumaTexts.map((text, idx) => (
          <div
            key={idx}
            className="p-4 bg-amber-50 border border-amber-300 rounded-lg text-sm"
          >
            {text}
          </div>
        ))}
      </div>

      {/* Persönliche Textblöcke */}
      <div className="space-y-3 mb-8">
        {blocks.map((b, i) => {
          const cls = COLOR_MAP[b.color] || "bg-gray-50 border-gray-200";
          return (
            <div key={i} className={`rounded-xl ${cls} p-4 text-sm`}>
              <h3 className="font-semibold mb-1">{b.title}</h3>
              <p>{b.desc}</p>
            </div>
          );
        })}
      </div>

      {/* ICD-11 Einschätzung */}
      <div className="mb-8 p-4 rounded-lg border border-gray-300 bg-gray-50">
        <h3 className="text-xl font-semibold mb-2">Mögliche ICD-11-Erkrankungen</h3>
        <ul className="list-disc list-inside text-sm text-gray-700">
          {icdConditions.map((cond, idx) => (
            <li key={idx}>{cond}</li>
          ))}
        </ul>
      </div>

      {/* Abschließender Hinweis */}
      <div className="mb-8 p-4 rounded-lg border border-blue-300 bg-blue-50 text-sm text-blue-900">
        <p>
          Hinweis: Das heruntergeladene PDF kann für eine vertiefte Analyse bei ChatGPT hochgeladen werden. Dort kann eine weiterführende Einschätzung und mögliche Hilfestellung angeboten werden.
        </p>
      </div>

      {/* Tipps & Unterstützung */}
      <div className="mb-8 p-4 rounded-lg bg-indigo-50 text-indigo-900">
        <h3 className="font-semibold mb-2">Tipps & Unterstützung</h3>
        <p>
          Wenn du Unterstützung suchst, findest du hier hilfreiche Ressourcen:{" "}
          <a href="https://www.telefonseelsorge.de/" target="_blank" rel="noopener noreferrer" className="underline">
            Telefonseelsorge
          </a>,{" "}
          <a href="https://www.psychiatrie.de/" target="_blank" rel="noopener noreferrer" className="underline">
            Psychiatrische Hilfen
          </a> und weitere.
        </p>
      </div>

      {/* Aktionen */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={onSave}
          className="px-5 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        >
          Speichern
        </button>
        <button
          onClick={() => window.print()}
          className="px-5 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          Als PDF speichern
        </button>
        <button
          onClick={onRestart}
          className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Neu starten
        </button>
      </div>

      <p className="mt-2 text-xs text-gray-500">
        Hinweis: Deine Daten werden lokal auf deinem Gerät gespeichert. Bitte behandele die exportierte Datei vertraulich.
      </p>

{report.debugValidated && (
  <div className="mt-6 text-center text-[11px] text-green-600">
    ✅ Validated scoring is LIVE • PCL-5 true raw: {report.ptsdTrueRaw ?? "n/a"} • UI raw: {report.ptsd?.raw ?? "n/a"}
  </div>
)}

    </div>
  );
}
