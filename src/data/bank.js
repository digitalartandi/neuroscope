// src/data/bank.js

/* ====== SCALES (Antwortskalen) ====== */
const FREQ_0_3 = [
  { value: 0, label: "Nie" },
  { value: 1, label: "An einzelnen Tagen" },
  { value: 2, label: "Mehr als die Hälfte der Tage" },
  { value: 3, label: "Fast jeden Tag" },
];

const FREQ_0_4 = [
  { value: 0, label: "Gar nicht" },
  { value: 1, label: "Selten" },
  { value: 2, label: "Manchmal" },
  { value: 3, label: "Oft" },
  { value: 4, label: "Sehr oft" },
];

const IMPACT_1_5 = [
  { value: 1, label: "Keine" },
  { value: 2, label: "Geringe" },
  { value: 3, label: "Mäßige" },
  { value: 4, label: "Starke" },
  { value: 5, label: "Extreme" },
];

const POS_0_4 = [
  { value: 0, label: "Nie" },
  { value: 1, label: "Selten" },
  { value: 2, label: "Manchmal" },
  { value: 3, label: "Oft" },
  { value: 4, label: "Immer" },
];

/* ====== BANK (Ablauf & Inhalte) ======
   Hinweis: 'kind' steuert das Rendering in App.jsx:
   - "intro"/"info": IntroCard
   - "scale": ModuleScaleVertical (items: [{key,q}], scale: [...] )
   - "yesno": ModuleYesNoVertical (items: [{key,q}] -> 0/1)
   - "interactive": externe Module (tol/nback/stroop/trails)
   - "summary": Zusammenfassung
*/
export const BANK = [
  /* ---------- Intro ---------- */
  {
    id: "intro",
    kind: "intro",
    title: "Willkommen zu deiner inneren Reise",
    bullets: [
      "Traumasensibel & wertschätzend – du bestimmst das Tempo.",
      "Mehrere Bereiche: Stimmung, Angst, Trauma, Kognition, Ressourcen, Funktion u.v.m.",
      "Du kannst jederzeit Fragen überspringen oder später zurückkehren."
    ],
    next: "mood",
  },

  /* ---------- Stimmung (PHQ-ähnlich) ---------- */
  {
    id: "mood",
    kind: "scale",
    title: "Stimmung & Antrieb",
    scale: FREQ_0_3,
    items: [
      { key: "m_interest", q: "Wenig Interesse oder Freude an Tätigkeiten?" },
      { key: "m_down", q: "Niedergeschlagenheit, Depression, Hoffnungslosigkeit?" },
      { key: "m_sleep", q: "Schlafprobleme (ein-/durchschlafen oder zu viel Schlaf)?" },
      { key: "m_energy", q: "Energie-/Antriebsmangel?" },
      { key: "m_appetite", q: "Appetitveränderungen?" },
      { key: "m_selfworth", q: "Gefühle von Versagen oder Selbstabwertung?" },
      { key: "m_focus", q: "Konzentrationsschwierigkeiten?" },
      { key: "m_psycho", q: "Innere Unruhe oder Verlangsamung?" },
      { key: "m_suicide", q: "Gedanken, dir zu schaden oder nicht mehr leben zu wollen?" },
    ],
    next: "mood_func",
  },
  {
    id: "mood_func",
    kind: "scale",
    title: "Funktionsniveau (Stimmung)",
    scale: IMPACT_1_5,
    items: [
      { key: "mf_work", q: "Beeinträchtigung: Arbeit/Haushalt/Schule" },
      { key: "mf_social", q: "Beeinträchtigung: Soziale Kontakte" },
      { key: "mf_selfcare", q: "Beeinträchtigung: Selbstversorgung" },
    ],
    next: "anx",
  },

  /* ---------- Angst (GAD-ähnlich) ---------- */
  {
    id: "anx",
    kind: "scale",
    title: "Innere Anspannung & Sorgen",
    scale: FREQ_0_3,
    items: [
      { key: "a_nervous", q: "Nervosität, Angst oder Anspannung" },
      { key: "a_control", q: "Schwierigkeiten, Sorgen zu kontrollieren" },
      { key: "a_broad", q: "Viele Lebensbereiche bereiten übermäßige Sorgen" },
      { key: "a_relax", q: "Erschwertes Entspannen" },
      { key: "a_restless", q: "Ruhelosigkeit" },
      { key: "a_irrit", q: "Reizbarkeit" },
      { key: "a_fear", q: "Befürchtung, dass Schlimmes passieren könnte" },
    ],
    next: "anx_func",
  },
  {
    id: "anx_func",
    kind: "scale",
    title: "Funktionsniveau (Angst)",
    scale: IMPACT_1_5,
    items: [
      { key: "af_work", q: "Beeinträchtigung: Arbeit/Haushalt/Schule" },
      { key: "af_social", q: "Beeinträchtigung: Soziale Kontakte" },
    ],
    next: "ptsd",
  },

  /* ---------- Trauma (PCL-ähnlich) + Safety ---------- */
  {
    id: "ptsd",
    kind: "scale",
    title: "Stress & Trauma-Folgen",
    scale: FREQ_0_4,
    items: [
      { key: "t_intrusions", q: "Ungewollte Erinnerungen/Träume/Flashbacks" },
      { key: "t_avoid", q: "Vermeidung von Erinnerungen/Orten/Gesprächen" },
      { key: "t_negative", q: "Negative Gedanken/Gefühle über dich/Welt" },
      { key: "t_arousal", q: "Übererregung (Wachsamkeit, Schlaf, Reizbarkeit, Schreckhaftigkeit)" },
    ],
    next: "ptsd_safety",
  },
  {
    id: "ptsd_safety",
    kind: "yesno",
    title: "Sicherheit & Stabilisierung",
    items: [
      { key: "safe_now", q: "Fühlst du dich aktuell körperlich und emotional sicher?" },
    ],
    next: "ocd",
  },

  /* ---------- Zwang/Impuls ---------- */
  {
    id: "ocd",
    kind: "scale",
    title: "Zwänge & Impulse",
    scale: FREQ_0_4,
    items: [
      { key: "o_obs", q: "Aufdringliche, belastende Gedanken/Grübelschleifen" },
      { key: "o_comp", q: "Wiederholte Handlungen zur Beruhigung (z. B. Waschen, Zählen)" },
      { key: "o_control", q: "Kontroll- oder Ordnungszwang" },
      { key: "o_impuls", q: "Impulsdurchbrüche (Wut, Kaufdrang etc.)" },
    ],
    next: "self",
  },

  /* ---------- Selbstbild/Identität ---------- */
  {
    id: "self",
    kind: "scale",
    title: "Selbstbild & Identität",
    scale: FREQ_0_4,
    items: [
      { key: "s_worth", q: "Stabiles, wohlwollendes Selbstwertgefühl" },
      { key: "s_coherence", q: "Gefühl innerer Stimmigkeit/Kohärenz" },
      { key: "s_goals", q: "Klarheit über Werte/Ziele" },
      { key: "s_selfcomp", q: "Selbstmitgefühl in schwierigen Zeiten" },
    ],
    next: "rel",
  },

  /* ---------- Beziehungen ---------- */
  {
    id: "rel",
    kind: "scale",
    title: "Beziehungen & Bindung",
    scale: FREQ_0_4,
    items: [
      { key: "r_trust", q: "Grundvertrauen in andere" },
      { key: "r_closeness", q: "Nähe zulassen/halten" },
      { key: "r_conflict", q: "Konstruktiver Umgang mit Konflikten" },
      { key: "r_support", q: "Erlebte soziale Unterstützung" },
    ],
    next: "som",
  },

  /* ---------- Körperliche Stressreaktionen ---------- */
  {
    id: "som",
    kind: "scale",
    title: "Körperliche Stressreaktionen",
    scale: FREQ_0_4,
    items: [
      { key: "k_pain", q: "Kopf-/Spannungsschmerz oder diffuser Schmerz" },
      { key: "k_fatigue", q: "Müdigkeit/Erschöpfung" },
      { key: "k_gi", q: "Magen/Darm-Beschwerden (z. B. Übelkeit, Reizdarm)" },
      { key: "k_veget", q: "Herzrasen/Schwitzen/Schwindel" },
    ],
    next: "cog",
  },

  /* ---------- Kognitive Muster ---------- */
  {
    id: "cog",
    kind: "scale",
    title: "Gedankenmuster",
    scale: FREQ_0_4,
    items: [
      { key: "c_rumination", q: "Grübeln statt Handeln" },
      { key: "c_catastrophe", q: "Katastrophisieren" },
      { key: "c_blackwhite", q: "Schwarz-Weiß-Denken" },
      { key: "c_mindread", q: "Gedankenlesen/Zuschreiben" },
    ],
    next: "res",
  },

  /* ---------- Resilienz (positiv gepolt) ---------- */
  {
    id: "res",
    kind: "scale",
    title: "Resilienz & Ressourcen",
    scale: POS_0_4,
    items: [
      { key: "res_energy", q: "Energie & Vitalität" },
      { key: "res_calm", q: "Innere Ruhe/Gelassenheit" },
      { key: "res_interest", q: "Interesse/Neugier" },
      { key: "res_active", q: "Aktivität/Wirksamkeitserleben" },
      { key: "res_meaning", q: "Sinn & Richtung" },
    ],
    next: "func",
  },

  /* ---------- Funktion (WHODAS-nah) ---------- */
  {
    id: "func",
    kind: "scale",
    title: "Funktionieren im Alltag",
    scale: IMPACT_1_5,
    items: [
      { key: "f_understand", q: "Verstehen/Konzentrieren" },
      { key: "f_mobility", q: "Fortbewegen" },
      { key: "f_selfcare", q: "Selbstversorgung" },
      { key: "f_social", q: "Zwischenmenschliches" },
      { key: "f_life", q: "Lebensaktivitäten (Arbeit/Haushalt/Schule)" },
      { key: "f_participation", q: "Teilhabe (gesellschaftliches Leben)" },
    ],
    next: "sleep",
  },

  /* ---------- Schlaf ---------- */
  {
    id: "sleep",
    kind: "scale",
    title: "Schlafqualität",
    scale: FREQ_0_4,
    items: [
      { key: "sl_latency", q: "Einschlafprobleme" },
      { key: "sl_maintenance", q: "Durchschlafprobleme/Frühes Erwachen" },
      { key: "sl_dayfatigue", q: "Tagesmüdigkeit/Leistungsabfall" },
      { key: "sl_rhythm", q: "Unregelmäßiger Schlaf-Wach-Rhythmus" },
    ],
    next: "adhd",
  },

  /* ---------- ADHS-Screen (Erwachsene, Kurz) ---------- */
  {
    id: "adhd",
    kind: "scale",
    title: "Aufmerksamkeit & Impulsivität (ADHS-Screen)",
    scale: FREQ_0_4,
    items: [
      { key: "ad_inattn", q: "Unaufmerksamkeit (leicht ablenkbar, Flüchtigkeitsfehler)" },
      { key: "ad_organize", q: "Organisation/Planung fällt schwer" },
      { key: "ad_restless", q: "Innere Unruhe/„getrieben“ fühlen" },
      { key: "ad_impulse", q: "Impulsivität (voreilig handeln/antworten)" },
      { key: "ad_wait", q: "Schwierigkeiten zu warten/auszusitzen" },
      { key: "ad_finish", q: "Schwierigkeiten Aufgaben zu Ende zu bringen" },
    ],
    next: "diss",
  },

  /* ---------- Dissoziation ---------- */
  {
    id: "diss",
    kind: "scale",
    title: "Dissoziation & Entfremdung",
    scale: FREQ_0_4,
    items: [
      { key: "ds_depersonal", q: "Gefühl, von sich selbst losgelöst zu sein" },
      { key: "ds_dereal", q: "Umgebung wirkt unwirklich/fern" },
      { key: "ds_memory", q: "Gedächtnislücken für Alltagsereignisse" },
      { key: "ds_absorb", q: "Starkes Aufgehen in Tätigkeiten (Zeitverlust)" },
    ],
    next: "eat",
  },

  /* ---------- Essverhalten (SCOFF-nah) ---------- */
  {
    id: "eat",
    kind: "scale",
    title: "Essverhalten & Körperbild",
    scale: FREQ_0_4,
    items: [
      { key: "e_restrict", q: "Stark restriktives Essverhalten/Diäten" },
      { key: "e_binge", q: "Essanfälle" },
      { key: "e_compensate", q: "Kompensation (Erbrechen, Abführmittel, übermäßiger Sport)" },
      { key: "e_bodyimage", q: "Unzufriedenheit/Leidensdruck durch Körperbild" },
    ],
    next: "bp",
  },

  /* ---------- Bipolar-Hinweise (Hypomanie/Manie-Screen) ---------- */
  {
    id: "bp",
    kind: "scale",
    title: "Hochphasen (Bipolar-Hinweise)",
    scale: FREQ_0_4,
    items: [
      { key: "bp_sleepneed", q: "Weniger Schlafbedürfnis ohne Müdigkeit" },
      { key: "bp_activity", q: "Gesteigerte Aktivität/Unruhe" },
      { key: "bp_talk", q: "Vermehrtes Reden/Rededrang" },
      { key: "bp_ideas", q: "Ideenflut/Gedankenrasen" },
      { key: "bp_risk", q: "Risikoverhalten (Geld, Sex, Fahren etc.)" },
    ],
    next: "psy",
  },

  /* ---------- Psychose-Screen (sehr niedrigschwellig) ---------- */
  {
    id: "psy",
    kind: "scale",
    title: "Wahrnehmung & Realitätsprüfung (Screen)",
    scale: FREQ_0_4,
    items: [
      { key: "ps_unusual", q: "Ungewöhnliche Wahrnehmungen/Erlebnisse schwer erklärbar" },
      { key: "ps_paranoia", q: "Befürchtung, beobachtet/verfolgt zu werden" },
      { key: "ps_beliefs", q: "Stark ungewöhnliche Überzeugungen" },
      { key: "ps_thought", q: "Gedanken wirken fremd/beeinflusst" },
    ],
    next: "stress",
  },

  /* ---------- Stress/Belastungen ---------- */
  {
    id: "stress",
    kind: "scale",
    title: "Aktuelle Belastungen",
    scale: FREQ_0_4,
    items: [
      { key: "st_role", q: "Rollenüberlastung (Job/Familie/Pflege)" },
      { key: "st_fin", q: "Finanzielle Belastung" },
      { key: "st_social", q: "Soziale Konflikte/Isolation" },
      { key: "st_health", q: "Körperliche Erkrankungen/Diagnosen" },
    ],
    next: "pain",
  },

  /* ---------- Schmerzinterferenz ---------- */
  {
    id: "pain",
    kind: "scale",
    title: "Schmerz & Interferenz",
    scale: IMPACT_1_5,
    items: [
      { key: "p_intensity", q: "Schmerzintensität (subjektiv)" },
      { key: "p_interfere", q: "Beeinträchtigung durch Schmerz" },
      { key: "p_activity", q: "Einschränkung von Aktivität/Bewegung" },
      { key: "p_sleep", q: "Beeinträchtigung des Schlafs durch Schmerz" },
    ],
    next: "sub",
  },

  /* ---------- Substanzen (Kurzscreen) ---------- */
  {
    id: "sub",
    kind: "scale",
    title: "Substanzgebrauch (Kurzscreen)",
    scale: [
      { value: 0, label: "Nie" },
      { value: 1, label: "Monatlich oder seltener" },
      { value: 2, label: "2–4× pro Monat" },
      { value: 3, label: "2–3× pro Woche" },
      { value: 4, label: "≥4× pro Woche" },
    ],
    items: [
      { key: "s_alc", q: "Alkohol: Konsumhäufigkeit" },
      { key: "s_binge", q: "Alkohol: 4–5+ Getränke bei einer Gelegenheit" },
      { key: "s_drugs", q: "Andere Substanzen (nicht ärztlich verordnet)" },
    ],
    next: "tol",
  },

  /* ---------- Interaktive kognitive Tests ---------- */
  { id: "tol",    kind: "interactive", title: "Tower of London (Planung)",        next: "nback" },
  { id: "nback",  kind: "interactive", title: "Arbeitsgedächtnis (N-Back 1)",     next: "stroop" },
  { id: "stroop", kind: "interactive", title: "Inhibition (Stroop)",              next: "trails" },
  { id: "trails", kind: "interactive", title: "Aufmerksamkeit (Trails A)",        next: "summary" },

  /* ---------- Summary ---------- */
  { id: "summary", kind: "summary", title: "Zusammenfassung" },
];
