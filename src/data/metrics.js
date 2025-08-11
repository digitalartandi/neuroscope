// src/data/metrics.js
// Mapping vorhandener BANK-Keys auf validierte Kernskalen.
// ⚠️ UI/Flow wird NICHT verändert – dies ist nur Scoring-Metadaten.

export const METRICS = {
  // PHQ-9 (0..27)
  PHQ9: {
    range: [0, 3],
    // Eure vorhandenen Keys, 1:1 auf PHQ9-Items gemappt
    items: [
      { key: "m_interest",   reverse: false }, // wenig Interesse/Anhedonie
      { key: "m_down",       reverse: false }, // niedergeschlagen
      { key: "m_sleep",      reverse: false }, // Schlaf
      { key: "m_energy",     reverse: false }, // Energie/Müdigkeit
      { key: "m_appetite",   reverse: false }, // Appetit
      { key: "m_selfworth",  reverse: false }, // schlecht über sich selbst
      { key: "m_focus",      reverse: false }, // Konzentration
      { key: "m_psycho",     reverse: false }, // psychomotorisch
      { key: "m_suicide",    reverse: false }, // Suizidgedanken
    ],
    // Standard-Cutoffs PHQ-9
    // 0-4 minimal, 5-9 mild, 10-14 moderate, 15-19 mod.-schwer, 20-27 schwer
    cutoffs: [5, 10, 15, 20],
    uiMax: 27,
  },

  // GAD-7 (0..21)
  GAD7: {
    range: [0, 3],
    // Mapped auf eure a_* Items; 'a_relax' ist als "Wie selten ..." formuliert => reverse
    items: [
      { key: "a_nervous",         reverse: false }, // nervös/ängstlich
      { key: "a_worry",           reverse: false }, // Sorgen schwer zu kontrollieren
      { key: "a_broad",           reverse: false }, // generell angespannt
      { key: "a_relax",           reverse: true  }, // schwer zu entspannen
      { key: "a_restless",        reverse: false }, // rastlos
      { key: "a_irrit",           reverse: false }, // gereizt
      { key: "a_sense_of_dread",  reverse: false }, // schlimme Befürchtungen
    ],
    // 5/10/15 = mild/moderate/severe
    cutoffs: [5, 10, 15],
    uiMax: 21,
  },

  // PCL-5 (20 Items, 0..80). Wir wählen 20 passende t_* Keys aus eurer Bank.
  // Für die UI-Balken skaliert buildReportUpgraded den Rohscore auf 0..16,
  // damit eure SummaryCard-Maxima unverändert bleiben.
  PCL5: {
    range: [0, 4],
    items: [
      // Intrusion (5)
      { key: "t_intrusions",            reverse: false },
      { key: "t_nightmares",            reverse: false },
      { key: "t_flashbacks",            reverse: false },
      { key: "t_intrusive_thoughts",    reverse: false },
      { key: "t_fear_of_sleeping",      reverse: false }, // Schlafbezogen (ersetzt "distress reminders")
      // Avoidance (2)
      { key: "t_avoid",                 reverse: false },
      { key: "t_avoidance_of_people",   reverse: false },
      // Negative alterations (7)
      { key: "t_negative",              reverse: false },
      { key: "t_guilt",                 reverse: false },
      { key: "t_shame",                 reverse: false },
      { key: "t_detachment",            reverse: false },
      { key: "t_emotional_numbness",    reverse: false },
      { key: "t_concentration_problems",reverse: false },
      { key: "t_sleep_disturbance",     reverse: false },
      // Arousal (6)
      { key: "t_irritability",          reverse: false },
      { key: "t_hypervigilance",        reverse: false },
      { key: "t_sense_of_danger",       reverse: false },
      { key: "t_emotional_outbursts",   reverse: false },
      { key: "t_hyperarousal",          reverse: false },
      { key: "t_panic_attacks",         reverse: false },
    ],
    // Häufig verwendeter Screening-Grenzwert (Literaturabhängig; ggf. projektweit konfigurierbar)
    cutoff: 33,
    uiMax: 16, // nur für Balken in eurer SummaryCard
    trueMax: 80,
  },
};
