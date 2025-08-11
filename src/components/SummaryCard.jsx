{/* Gesamt-Einschätzung + validierte Screenings */}
<div className="mb-5 rounded-xl border border-gray-300 bg-white p-4">
  {/* Badge */}
  <div className="mb-2 text-[11px] text-gray-500 text-right">
    ✅ Validated scoring aktiv (PHQ-9 • GAD-7 • PCL-5)
  </div>

  {/* 1) Gesamt-Einschätzung in 1–2 Sätzen */}
  <div className="text-sm text-gray-800">
    {overallAssessment(report, icdConditions)}
  </div>

  {/* 2) Klinische Screenings (kompakt, relevant für weitere Abklärung) */}
  <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
    {/* PHQ-9 */}
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="font-semibold">PHQ-9 (Depression)</div>
      <div className="mt-1 text-gray-800">
        Score: {report.mood?.raw ?? "n/a"} / 27
      </div>
      <div className="text-gray-600">
        Schweregrad: {labelBand(report.mood?.band, false)}
      </div>
    </div>

    {/* GAD-7 */}
    <div className="rounded-lg border border-gray-2 00 p-3">
      <div className="font-semibold">GAD-7 (Angst)</div>
      <div className="mt-1 text-gray-800">
        Score: {report.anx?.raw ?? "n/a"} / 21
      </div>
      <div className="text-gray-600">
        Schweregrad: {labelBand(report.anx?.band, false)}
      </div>
    </div>

    {/* PCL-5 */}
    <div className="rounded-lg border border-gray-200 p-3">
      <div className="font-semibold">PCL-5 (Traumafolgen)</div>
      <div className="mt-1 text-gray-800">
        Score: {report.ptsdTrueRaw ?? "n/a"} / 80
      </div>
      <div
        className={
          "text-gray-600 " +
          ((report.ptsd?.band ?? 1) >= 3 ? "text-red-700 font-medium" : "")
        }
      >
        {(report.ptsd?.band ?? 1) >= 3
          ? "Über Screening-Grenzwert (≥33)"
          : "Unter Screening-Grenzwert"}
      </div>
    </div>
  </div>

  {/* 3) Kernaussagen als Chips (kurzer Überblick) */}
  <div className="mt-3 flex flex-wrap gap-2">
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
      Stimmung: {labelBand(report.mood.band, false)}
    </span>
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
      Angst: {labelBand(report.anx.band, false)}
    </span>
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
      Trauma: {labelBand(report.ptsd.band, false)}
    </span>
    <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-700 border-blue-200">
      Zwänge/Impulse: {labelBand(report.ocd.band, false)}
    </span>
  </div>
</div>
