// src/components/SummaryCard.jsx
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
  if (report.mood.band >= 3) conditions.push("Depressive Episode oder Major Depression");
  if (report.anx.band >= 3) conditions.push("Generalisierte Angststörung oder andere Angststörungen");
  if (report.ptsd.band >= 3) conditions.push("Posttraumatische Belastungsstörung (PTBS)");
  if (report.ocd?.band >= 3) conditions.push("Zwangsstörung");
  if (report.bp?.band >= 3) conditions.push("Bipolare Störung");
  if (report.psychosis?.band >= 3) conditions.push("Psychotische Störung");
  if (report.stress?.band >= 3) conditions.push("Anpassungs-/Belastungsstörung");
  if (conditions.length === 0) {
    conditions.push("Keine eindeutigen Hinweise auf eine psychische Erkrankung im Sinne von ICD-11.");
  }
  return conditions;
}

function Pill({ children, tone = "gray" }) {
  const toneMap = {
    gray: "bg-gray-100 text-gray-700 border-gray-200",
    red: "bg-red-50 text-red-700 border-red-200",
    orange: "bg-amber-50 text-amber-700 border-amber-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
  };
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${toneMap[tone]}`}>
      {children}
    </span>
  );
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-left"
      >
        <span className="font-semibold">{title}</span>
        <span className="text-gray-500">{open ? "▴" : "▾"}</span>
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

function Bar({ label, raw, max, higherIsBetter }) {
  const pct = Math.max(0, Math.min(100, Math.round(((raw ?? 0) / max) * 100)));
  return (
    <div className="p-3 rounded-lg border border-gray-200 bg-white">
      <div className="flex justify-between text-sm font-medium mb-1">
        <span>{label}</span>
        <span>
          {raw ?? 0}/{max} ({pct}%)
        </span>
      </div>
      <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-3.5 rounded-full transition-all duration-500 ${
            higherIsBetter ? "bg-emerald-600" : "bg-blue-600"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function labelBand(i, higherIsBetter = false) {
  const L = higherIsBetter
    ? ["sehr niedrig", "niedrig", "moderat", "gut", "sehr gut"]
    : ["niedrig", "leicht", "mäßig", "deutlich", "hoch"];
  return L[Math.min(i ?? 0, L.length - 1)];
}

// Kompakte Gesamt-Einschätzung (1–2 Sätze)
function overallAssessment(report, icdConditions) {
  const severes = [
    report.mood.band >= 3 ? "Stimmung" : null,
    report.anx.band >= 3 ? "Angst" : null,
    report.ptsd.band >= 3 ? "Trauma" : null,
    report.ocd?.band >= 3 ? "Zwänge" : null,
  ].filter(Boolean);

  const moderates = [
    report.mood.band === 2 ? "Stimmung" : null,
    report.anx.band === 2 ? "Angst" : null,
    report.ptsd.band === 2 ? "Trauma" : null,
    report.ocd?.band === 2 ? "Zwänge" : null,
  ].filter(Boolean);

  if (severes.length) {
    return `Gesamtbild: deutliche Belastung (${severes.join(
      ", "
    )}). Eine fachliche Abklärung wird empfohlen. Mögliche ICD-11-Bereiche (Screening): ${icdConditions.join(", ")}.`;
  }
  if (moderates.length) {
    return `Gesamtbild: moderate Belastung (${moderates.join(
      ", "
    )}). Achte auf Selbstfürsorge und erwäge Beratung. Mögliche ICD-11-Bereiche (Screening): ${icdConditions.join(", ")}.`;
  }
  return `Gesamtbild: aktuell keine auffälligen Belastungen. Mögliche ICD-11-Bereiche (Screening): ${icdConditions.join(
    ", "
  )}.`;
}

/* ---------- Hauptkomponente ---------- */
export default function SummaryCard({ report, onRestart, onSave }) {
  const traumaTexts = traumaSensitiveText(report);
  const icdConditions = icd11Assessment(report);

  // Kritische Hinweise sofort zeigen; weitere Hinweise optional
  const criticalNotes = traumaTexts.filter((t) => t.startsWith("🔴"));
  const otherNotes = traumaTexts.filter((t) => !t.startsWith("🔴"));
  const [showAllNotes, setShowAllNotes] = useState(false);

  // Kernaussagen (kompakte Chips)
  const corePills = [
    ["Stimmung", labelBand(report.mood.band, false)],
    ["Angst", labelBand(report.anx.band, false)],
    ["Trauma", labelBand(report.ptsd.band, false)],
    ["Zwänge/Impulse", labelBand(report.ocd.band, false)],
  ];

  // Balken-Definition (bestehende Inhalte/Maxima bleiben)
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

  return (
    <div className="mt-4 animate-fade-in max-w-4xl mx-auto">
      {/* Headline */}
      <h2 className="text-2xl sm:text-3xl font-bold mb-2">Deine Ergebnisse &amp; Orientierung</h2>

      {/* Dezenter 80%-Hinweis (immer sichtbar, aber leise) */}
      {report.progress < 80 && (
        <div className="mb-4 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2">
          Bitte beachte: Für eine verlässliche Einschätzung sollten mindestens 80% des Tests abgeschlossen sein.
        </div>
      )}

      {/* Validated + kompakte Screenings */}
      <div className="mb-5 rounded-xl border border-gray-300 bg-white p-4">
        {/* Badge */}
        <div className="mb-2 text-[11px] text-gray-500 text-right">
          ✅ Validated scoring aktiv (PHQ-9 • GAD-7 • PCL-5)
        </div>

        {/* 1) Gesamt-Einschätzung */}
        <div className="text-sm text-gray-800">{overallAssessment(report, icdConditions)}</div>

        {/* 2) Klinische Screenings – kompakt */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
          {/* PHQ-9 */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="font-semibold">PHQ-9 (Depression)</div>
            <div className="mt-1 text-gray-800">Score: {report.mood?.raw ?? "n/a"} / 27</div>
            <div className="text-gray-600">Schweregrad: {labelBand(report.mood?.band, false)}</div>
          </div>

          {/* GAD-7 */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="font-semibold">GAD-7 (Angst)</div>
            <div className="mt-1 text-gray-800">Score: {report.anx?.raw ?? "n/a"} / 21</div>
            <div className="text-gray-600">Schweregrad: {labelBand(report.anx?.band, false)}</div>
          </div>

          {/* PCL-5 */}
          <div className="rounded-lg border border-gray-200 p-3">
            <div className="font-semibold">PCL-5 (Traumafolgen)</div>
            <div className="mt-1 text-gray-800">Score: {report.ptsdTrueRaw ?? "n/a"} / 80</div>
            <div
              className={
                "text-gray-600 " +
                ((report.ptsd?.band ?? 1) >= 3 ? "text-red-700 font-medium" : "")
              }
            >
              {(report.ptsd?.band ?? 1) >= 3 ? "Über Screening-Grenzwert (≥33)" : "Unter Screening-Grenzwert"}
            </div>
          </div>
        </div>

        {/* 3) Kernaussagen als Chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          {corePills.map(([k, v]) => (
            <Pill key={k} tone="blue">
              {k}: {v}
            </Pill>
          ))}
        </div>
      </div>

      {/* Kritische Hinweise sofort sichtbar */}
      {criticalNotes.length > 0 && (
        <div className="mb-5 rounded-xl border border-red-300 bg-red-50 p-4">
          <div className="font-semibold text-red-800 mb-1">Wichtige Hinweise</div>
          <ul className="list-disc list-inside text-sm text-red-900">
            {criticalNotes.map((t, i) => (
              <li key={i}>{t}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Weitere Hinweise (optional ausklappbar) */}
      {otherNotes.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4">
          <div className="font-semibold text-amber-900">Hinweise &amp; Selbstfürsorge</div>
          {!showAllNotes ? (
            <button
              className="mt-2 text-xs underline text-amber-900"
              onClick={() => setShowAllNotes(true)}
            >
              Weitere Hinweise anzeigen
            </button>
          ) : (
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm text-amber-900">
              {otherNotes.map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Überblick (Balken) */}
      <Section title="Überblick (Skalen)" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {bars.map(([label, raw, max, higher]) => (
            <Bar key={label} label={label} raw={raw} max={max} higherIsBetter={!!higher} />
          ))}
        </div>
      </Section>

      {/* Thematische Detailabschnitte – Inhalte beibehalten */}
      <div className="mt-6 space-y-4">
        <Section title="Emotionen">
          <div className={`rounded-xl ${COLOR_MAP.indigo} p-4 text-sm`}>
            <h3 className="font-semibold mb-1">Emotionen</h3>
            <p>
              Stimmung: {labelBand(report.mood.band, false)}.{" "}
              Angst: {labelBand(report.anx.band, false)}.{" "}
              Trauma: {labelBand(report.ptsd.band, false)}.{" "}
              Zwänge/Impulse: {labelBand(report.ocd.band, false)}.
            </p>
          </div>
        </Section>

        <Section title="Selbst & Beziehungen">
          <div className={`rounded-xl ${COLOR_MAP.emerald} p-4 text-sm`}>
            <h3 className="font-semibold mb-1">Selbst & Beziehungen</h3>
            <p>
              Selbstbild: {labelBand(report.self.band, true)} (höher = besser).{" "}
              Beziehungen: {labelBand(report.rel.band, true)} (höher = besser).
            </p>
          </div>
        </Section>

        <Section title="Körper & Denken">
          <div className={`rounded-xl ${COLOR_MAP.amber} p-4 text-sm`}>
            <h3 className="font-semibold mb-1">Körper & Denken</h3>
            <p>
              Körperlicher Stress: {labelBand(report.som.band, false)}.{" "}
              Kognitive Muster: {labelBand(report.cog.band, false)}.
            </p>
          </div>
        </Section>

        <Section title="Ressourcen & Alltag">
          <div className={`rounded-xl ${COLOR_MAP.sky} p-4 text-sm`}>
            <h3 className="font-semibold mb-1">Ressourcen & Alltag</h3>
            <p>
              Resilienz: {labelBand(report.res.band, true)} (höher = besser).{" "}
              {report.func.raw == null
                ? "Funktion: n/a."
                : `Funktionieren: ${
                    report.func.raw > 0.66 ? "deutlich" : report.func.raw > 0.33 ? "mäßig" : "gering"
                  }e Einschränkungen.`}
            </p>
          </div>
        </Section>

        <Section title="Kognitive Leistung">
          <div className={`rounded-xl ${COLOR_MAP.violet} p-4 text-sm`}>
            <h3 className="font-semibold mb-1">Kognitive Leistung</h3>
            <p className="space-y-1">
              {report.tasks.tolEff != null && (
                <span className="block">
                  Planung (ToL):{" "}
                  {report.tasks.tolEff >= 0.8 ? "effizient" : report.tasks.tolEff >= 0.5 ? "mittel" : "ausbaufähig"}.
                </span>
              )}
              {report.tasks.nbackAcc != null && (
                <span className="block">
                  Arbeitsgedächtnis (N-Back): {Math.round((report.tasks.nbackAcc || 0) * 100)}% Genauigkeit.
                </span>
              )}
              {report.tasks.stroopAcc != null && (
                <span className="block">
                  Inhibition (Stroop): {Math.round((report.tasks.stroopAcc || 0) * 100)}% korrekt.
                </span>
              )}
              {report.tasks.trailsMs != null && (
                <span className="block">
                  Aufmerksamkeit/Tempo (Trails A): {Math.round((report.tasks.trailsMs || 0) / 1000)}s.
                </span>
              )}
            </p>
          </div>
        </Section>

        <Section title="Mögliche ICD-11-Erkrankungen (Screening)">
          <div className="p-4 rounded-lg border border-gray-200 bg-white">
            <ul className="list-disc list-inside text-sm text-gray-700">
              {icd11Assessment(report).map((cond, idx) => (
                <li key={idx}>{cond}</li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-gray-500">Hinweis: Screening-Hinweis – ersetzt keine fachliche Diagnose.</p>
          </div>
        </Section>
      </div>

      {/* Abschließender Hinweis (bestehend) */}
      <div className="mt-6 p-4 rounded-lg border border-blue-200 bg-blue-50 text-sm text-blue-900">
        <p>
          Hinweis: Das heruntergeladene PDF kann für eine vertiefte Analyse bei ChatGPT hochgeladen werden. Dort kann
          eine weiterführende Einschätzung und mögliche Hilfestellung angeboten werden.
        </p>
      </div>

      {/* Tipps & Unterstützung */}
      <div className="mt-6 p-4 rounded-lg bg-indigo-50 text-indigo-900">
        <h3 className="font-semibold mb-2">Tipps & Unterstützung</h3>
        <p>
          Wenn du Unterstützung suchst, findest du hier hilfreiche Ressourcen:{" "}
          <a href="https://www.telefonseelsorge.de/" target="_blank" rel="noopener noreferrer" className="underline">
            Telefonseelsorge
          </a>
          ,{" "}
          <a href="https://www.psychiatrie.de/" target="_blank" rel="noopener noreferrer" className="underline">
            Psychiatrische Hilfen
          </a>{" "}
          und weitere.
        </p>
      </div>

      {/* Aktionen */}
      <div className="mt-6 flex flex-wrap gap-3">
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
        Hinweis: Deine Daten werden lokal auf deinem Gerät gespeichert. Bitte behandele die exportierte Datei
        vertraulich.
      </p>
    </div>
  );
}
