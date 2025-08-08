import { useEffect, useMemo, useState } from "react";

/** Trails A – tippe die Zahlen 1..12 in Reihenfolge. Misst Zeit & Fehler. */
export default function Trails({ onComplete }) {
  const targets = useMemo(() => Array.from({ length: 12 }, (_, i) => i + 1), []);
  const [order, setOrder] = useState([]);
  const [next, setNext] = useState(1);
  const [errors, setErrors] = useState(0);
  const [start, setStart] = useState(null);

  useEffect(() => {
    // zufällig verteilen
    setOrder([...targets].sort(() => Math.random() - 0.5));
  }, [targets]);

  function handle(n) {
    if (start == null) setStart(Date.now());
    if (n === next) {
      const nn = next + 1;
      setNext(nn);
      if (nn > targets.length) {
        const ms = Date.now() - (start ?? Date.now());
        onComplete?.({ timeMs: ms, errors });
      }
    } else {
      setErrors(e => e + 1);
    }
  }

  return (
    <div className="p-4">
      <h3 className="text-lg font-semibold">Aufmerksamkeit (Trails A)</h3>
      <p className="text-sm text-gray-600">Tippe die Zahlen in der richtigen Reihenfolge, so schnell wie möglich.</p>

      <div className="mt-4 grid grid-cols-4 gap-2">
        {order.map(n => (
          <button
            key={n}
            onClick={() => handle(n)}
            className={
              "rounded-xl border px-3 py-3 text-lg " +
              (n < next ? "bg-emerald-50 border-emerald-300" : "bg-white border-gray-200 hover:bg-gray-50")
            }
          >
            {n}
          </button>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-600 flex justify-between">
        <span>Nächste Zahl: <b>{next <= targets.length ? next : "-"}</b></span>
        <span>Fehler: <b>{errors}</b></span>
      </div>
    </div>
  );
}
