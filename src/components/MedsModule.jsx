import React, { useMemo } from "react";
import { MED_LIST, MED_CLASSES } from "../data/meds";

export default function MedsModule({ answers, onChange, onNext, onBack, isFirst }) {
  const meds = answers?.meds_list ?? [];

  function updateRow(i, patch) {
    const next = meds.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    onChange(next);
  }
  function addRow() {
    onChange([
      ...meds,
      { name: "", class: "", doseMgPerDay: "", freqPerDay: 1, durationWeeks: "" },
    ]);
  }
  function removeRow(i) {
    const next = meds.filter((_, idx) => idx !== i);
    onChange(next);
  }

  const grouped = useMemo(() => {
    const byClass = Object.keys(MED_CLASSES);
    const options = {};
    byClass.forEach((cls) => {
      options[cls] = MED_LIST.filter((m) => m.class === cls);
    });
    return options;
  }, []);

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 shadow ring-1 ring-black/5">
      <h2 className="text-xl font-semibold">Medikation (optional)</h2>
      <p className="mt-1 text-sm text-gray-600">
        Füge hier aktuelle Medikamente hinzu (Mehrfachauswahl). Angaben beeinflussen die spätere Interpretation.
      </p>

      <div className="mt-4 space-y-3">
        {meds.map((row, i) => (
          <div key={i} className="rounded-xl border border-gray-200 p-3">
            <div className="grid grid-cols-1 sm:grid-cols-6 gap-3 items-end">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-gray-700">Medikament</label>
                <select
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={row.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const found = MED_LIST.find((m) => m.name === name);
                    updateRow(i, { name, class: found?.class || "" });
                  }}
                >
                  <option value="">— auswählen —</option>
                  {Object.keys(grouped).map((cls) => (
                    <optgroup key={cls} label={cls}>
                      {grouped[cls].map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Klasse</label>
                <input
                  className="mt-1 w-full rounded-lg border-gray-300 bg-gray-50"
                  value={row.class}
                  readOnly
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Dosis (mg/Tag)</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={row.doseMgPerDay}
                  onChange={(e) => updateRow(i, { doseMgPerDay: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Einnahme (x/Tag)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={row.freqPerDay}
                  onChange={(e) => updateRow(i, { freqPerDay: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Dauer (Wochen)</label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  className="mt-1 w-full rounded-lg border-gray-300"
                  value={row.durationWeeks}
                  onChange={(e) => updateRow(i, { durationWeeks: e.target.value })}
                />
              </div>

              <div className="sm:col-span-1 flex justify-end">
                <button
                  type="button"
                  onClick={() => removeRow(i)}
                  className="mt-6 rounded-lg border px-3 py-2 text-sm hover:bg-gray-50"
                >
                  Entfernen
                </button>
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addRow}
          className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
        >
          + Medikament hinzufügen
        </button>
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
          onClick={onNext}
          className="btn-gradient w-full rounded-xl px-4 py-3 text-white font-semibold shadow-sm focus:outline-none focus-visible:ring focus-visible:ring-blue-300 active:scale-[0.99] transition"
        >
          Weiter
        </button>
      </div>
    </div>
  );
}
