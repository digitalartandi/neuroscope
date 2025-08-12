// Klassen + typische Dosen + (optional) Äquivalenzen (z.B. Diazepam-Äquivalente)
export const MED_CLASSES = {
  SSRI: ["Sertralin", "Escitalopram", "Citalopram", "Fluoxetin", "Paroxetin", "Fluvoxamin"],
  SNRI: ["Venlafaxin", "Duloxetin", "Desvenlafaxin"],
  BENZO: ["Lorazepam", "Diazepam", "Alprazolam", "Clonazepam", "Oxazepam"],
  STIM: ["Methylphenidat", "Lisdexamfetamin", "Dexamfetamin"],
  APS: ["Quetiapin", "Olanzapin", "Risperidon", "Aripiprazol", "Ziprasidon", "Haloperidol"],
  MS:  ["Lithium", "Valproat", "Lamotrigin", "Carbamazepin"],
  ZDRUG: ["Zolpidem", "Zopiclon"],
  OPIOID: ["Tilidin", "Tramadol", "Codein", "Morphin", "Oxycodon", "Hydromorphon", "Fentanyl"],
  OTHER: ["Amitriptylin", "Mirtazapin", "Trazodon", "Agomelatin"]
};

export const MED_LIST = Object.entries(MED_CLASSES).flatMap(([cls, names]) =>
  names.map((name) => ({
    id: `${cls}_${name}`.toLowerCase().replace(/\s+/g, "_"),
    name,
    class: cls,
    // grobe Spannen für Tagesdosis (mg) zur UI-Hilfe – nicht restriktiv
    range: (() => {
      switch (cls) {
        case "SSRI": return [10, 200];
        case "SNRI": return [20, 300];
        case "BENZO": return [0.25, 10];
        case "STIM": return [5, 100];
        case "APS": return [1, 800];
        case "MS": return [25, 1500];
        case "ZDRUG": return [2.5, 20];
        case "OPIOID": return [5, 400];
        default: return [1, 200];
      }
    })()
  }))
);

// sehr grobe Diazepam-Äquivalenzfaktoren (mg diazepam pro mg Substanz)
// Quelle: klinische Faustregeln; NUR zur Kontextinterpretation (kein Behandlungsrat!)
export const BENZO_EQ = {
  Lorazepam: 5,       // 1 mg LZP ≈ 5 mg diazepam
  Alprazolam: 20,     // 0.5 mg APZ ≈ 10 mg diazepam → 1 mg ≈ 20 mg
  Clonazepam: 20,     // 0.5 mg CLZ ≈ 10 mg → 1 mg ≈ 20 mg
  Diazepam: 1,
  Oxazepam: 0.5       // grob
};
