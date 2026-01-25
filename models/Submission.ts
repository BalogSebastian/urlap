// /models/Submission.ts
import mongoose, { Schema, models } from "mongoose";

const SubmissionSchema = new Schema({
  // --- 1. Cégadatok és Kapcsolattartás ---
  companyName: { type: String, required: true },
  headquarters: { type: String, required: true },
  siteAddress: { type: String, required: true },
  taxNumber: { type: String }, // ÚJ: Adószám
  
  // Ügyvezető adatai (ÚJ)
  managerName: { type: String },
  managerPhone: { type: String },
  managerEmail: { type: String },

  // --- 2. Tevékenység és Működés ---
  mainActivity: { type: String, required: true },
  dailyActivity: { type: String }, // ÚJ: Napi tevékenység leírása
  
  employees: { type: Number, default: 0 },
  subcontractors: { type: Number, default: 0 }, // ÚJ: Alvállalkozók
  clientsMax: { type: Number, default: 0 }, // Ügyfélforgalom
  
  toolsUsed: { type: String }, // ÚJ: Használt eszközök
  
  specialTech: { type: String, default: 'no' }, // yes / no
  specialTechDesc: { type: String },

  // Jelleg (Checkboxok)
  type_shop: { type: String },
  type_office: { type: String },
  type_warehouse: { type: String },
  type_workshop: { type: String },
  type_social: { type: String },
  type_education: { type: String }, // ÚJ: Oktatás
  type_other: { type: String },

  // --- 3. Munkakörülmények (ÚJ SZEKCIÓ) ---
  screenWork: { type: String }, // Képernyős munka
  homeOffice: { type: String }, // Otthoni munka
  highWork: { type: String },   // Magasban végzett munka

  // --- 4. Épület és Higiénia ---
  buildingType: { type: String },
  floorNumber: { type: String },
  access: { type: String },
  areaSize: { type: Number },

  // Helyiségek (ÚJ Checkboxok)
  room_office: { type: String },
  room_guest: { type: String },
  room_kitchen: { type: String },
  room_warehouse: { type: String },
  room_social: { type: String },
  room_workshop: { type: String },

  // Higiénia (ÚJ)
  restroom: { type: String },      // WC/Mosdó
  handSanitizer: { type: String }, // Kézmosó/Fertőtlenítő
  ac: { type: String },            // Klíma

  // --- 5. Szerkezetek ---
  walls: { type: String },
  ceiling: { type: String },
  roofType: { type: String },
  roofCover: { type: String },
  insulation: { type: String }, // Külső szigetelés

  // --- 6. Menekülés ---
  exits: { type: String },
  doorWidth: { type: String },
  altExit: { type: String },
  altExitWidth: { type: String },
  
  disabled: { type: String, default: 'no' },
  disabledDesc: { type: String },
  
  distM: { type: Number },    // Távolság méterben
  distStep: { type: Number }, // Távolság lépésben

  // --- 7. Biztonság és Táblák ---
  firstAid: { type: String }, // ÚJ: Elsősegély doboz
  extCount: { type: Number, default: 0 },
  extType: { type: String }, // Régi mező, megtartjuk kompatibilitásnak
  extLocation: { type: String }, // Régi mező
  valid: { type: String }, // Régi mező

  // Táblák (ÚJ Checkboxok)
  sign_firstaid: { type: String },
  sign_extinguisher: { type: String },
  sign_gas: { type: String },
  sign_emergency: { type: String },
  sign_no_smoking: { type: String },
  sign_escape: { type: String },
  sign_shelf: { type: String },
  sign_camera: { type: String },

  chemicals: { type: String }, // ÚJ: Vegyszerek felsorolása

  // --- 8. Rendszerek ---
  sys_alarm: { type: String },
  sys_sprinkler: { type: String },
  sys_smoke: { type: String }, // ÚJ: Füstérzékelő
  sys_manual: { type: String },
  sys_none: { type: String },
  systemLocation: { type: String },

  // --- 10. Gépészet (A számozás követi az űrlapot) ---
  mainSwitch: { type: String },
  gasValve: { type: String }, // no / yes / pb
  gasLocation: { type: String },
  boiler: { type: String },
  boilerDesc: { type: String },

  // --- 11. Villámvédelem (Régi űrlapról maradt mezők) ---
  lightning: { type: String },
  shockProt: { type: String },
  lightningDoc: { type: String },

  // --- 12. Hulladékkezelés ---
  // Új checkboxos rendszer
  waste_communal: { type: String },
  waste_select: { type: String },
  waste_hazard: { type: String },
  waste_industrial: { type: String },
  
  // Régi mezők (hogy ne vesszenek el a régi adatok)
  waste: { type: String }, 
  wasteDesc: { type: String },
  wasteRoute: { type: String },

  // --- 13. Raktározás és Egyéb ---
  shelfLoad: { type: Number }, // ÚJ: Polc teherbírás
  shelfLabelMissing: { type: String }, // ÚJ: Nincs jelölés
  storageRoom: { type: String },
  storageSize: { type: Number },

  // Vegyes
  mat_paper: { type: String },
  mat_clean: { type: String },
  mat_paint: { type: String },
  mat_fuel: { type: String },
  mat_gas: { type: String },
  mat_aero: { type: String },
  mat_other: { type: String },

  notes: { type: String }, // Megjegyzés

  // Rendszer adat
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ha már létezik a model, ne definiálja újra (Next.js hot reload miatt fontos)
const Submission = models.Submission || mongoose.model("Submission", SubmissionSchema);

export default Submission;