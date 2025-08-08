// src/components/Nav.jsx
import { useMemo, useState } from "react";

/** tiny emoji icons per section (swap for your icon set if you like) */
const ICONS = {
  mood: "😊", mood_func: "🧭",
  anx: "😟", anx_func: "🧭",
  ptsd: "⚡", ptsd_safety: "🛡️",
  ocd: "🔁",
  self: "🧑‍🦱",
  rel: "👥",
  som: "🫀",
  cog: "🧠",
  res: "🌱",
  func: "📊",
  sleep: "😴",
  adhd: "⚙️",
  diss: "🌫️",
  eat: "🍽️",
  bp: "🔋",
  psy: "👁️",
  stress: "💼",
  pain: "🩹",
  sub: "🍷",
  tol: "🗼",
  nback: "🔤",
  stroop: "🎨",
  trails: "🔢",
};

export default function Nav({ modules, currentId, onJump, completionFor }) {
  const [open, setOpen] = useState(false);

  const items = useMemo(
    () =>
      modules.map((m) => {
        const c = Math.round((completionFor(m) || 0) * 100);
        return { id: m.id, title: m.title || m.id, icon: ICONS[m.id] || "▫️", c };
      }),
    [modules, completionFor]
  );

  // compact mobile picker
  return (
    <nav className="sticky top-[48px] z-20 bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-md px-4 py-2 hidden sm:block">
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {items.map((it) => {
            const active = it.id === currentId;
            return (
              <button
                key={it.id}
                onClick={() => onJump(it.id)}
                className={
                  "shrink-0 rounded-full px-3 py-1.5 text-sm border transition whitespace-nowrap " +
                  (active ? "border-blue-600 text-blue-700 bg-blue-50" : "border-gray-200 hover:bg-gray-50")
                }
                title={`${it.c}% erledigt`}
              >
                <span className="mr-1">{it.icon}</span>
                <span className="font-medium">{it.title}</span>
                <span
                  className={
                    "ml-2 inline-block h-2.5 w-2.5 rounded-full " +
                    (it.c === 100 ? "bg-emerald-500" : it.c > 0 ? "bg-amber-400" : "bg-gray-300")
                  }
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* mobile: dropdown sheet */}
      <div className="mx-auto max-w-md px-4 py-2 sm:hidden border-b border-gray-200">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-full rounded-xl border px-3 py-2 text-sm flex items-center justify-between"
          aria-expanded={open}
          aria-controls="nav-mobile-list"
        >
          <span className="flex items-center gap-2">
            <span>Abschnitte</span>
          </span>
          <span>▾</span>
        </button>
        {open && (
          <ul id="nav-mobile-list" className="mt-2 max-h-64 overflow-auto rounded-xl border bg-white">
            {items.map((it) => {
              const active = it.id === currentId;
              return (
                <li key={it.id}>
                  <button
                    onClick={() => {
                      onJump(it.id);
                      setOpen(false);
                    }}
                    className={
                      "w-full text-left px-3 py-2 text-sm flex items-center justify-between " +
                      (active ? "bg-blue-50" : "hover:bg-gray-50")
                    }
                  >
                    <span className="flex items-center gap-2">
                      <span className="text-base">{it.icon}</span>
                      <span>{it.title}</span>
                    </span>
                    <span
                      className={
                        "inline-block h-2.5 w-2.5 rounded-full " +
                        (it.c === 100 ? "bg-emerald-500" : it.c > 0 ? "bg-amber-400" : "bg-gray-300")
                      }
                      aria-label={`${it.c}% erledigt`}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </nav>
  );
}
