// /models/Submission.ts
import mongoose, { Schema, models } from "mongoose";

const SubmissionSchema = new Schema({
  // --- 0. ŰRLAP TÍPUSA (ÚJ) ---
  // Ez dönti el, hogy Tűzvédelmi ('fire') vagy VBS ('vbs') adatlap
  formType: { type: String, default: 'fire' }, 

  // --- VBS SPECIFIKUS MEZŐK (ÚJ) ---
  vbs_services: { type: String }, // Milyen vizsgálatot kér (vesszővel elválasztva)
  vbs_prev_doc: { type: String }, // Rendelkezik korábbi dokumentummal? (Igen/Nem)

  // ==========================================================
  // --- KÖZÖS ÉS TŰZVÉDELMI MEZŐK ---
  // ==========================================================

  // --- 1. Cégadatok és Kapcsolattartás ---
  companyName: { type: String, required: true }, // Cég neve (Közös)
  headquarters: { type: String }, // Székhely (Közös)
  siteAddress: { type: String }, // Telephely címe (Közös)
  taxNumber: { type: String },
  
  // Ügyvezető adatai
  managerName: { type: String }, // Képviselő neve (Közös)
  managerPhone: { type: String }, // Képviselő telefon (Közös)
  managerEmail: { type: String },

  // --- 2. Tevékenység és Működés ---
  mainActivity: { type: String }, // Tevékenységi kör (Közös)
  dailyActivity: { type: String },
  
  employees: { type: Number, default: 0 },
  subcontractors: { type: Number, default: 0 },
  clientsMax: { type: Number, default: 0 },
  
  toolsUsed: { type: String },
  
  specialTech: { type: String, default: 'no' }, // yes / no
  specialTechDesc: { type: String },

  // Jelleg (Checkboxok)
  type_shop: { type: String },
  type_office: { type: String },
  type_warehouse: { type: String },
  type_workshop: { type: String },
  type_social: { type: String },
  type_education: { type: String },
  type_other: { type: String },

  // --- 3. Munkakörülmények ---
  screenWork: { type: String },
  homeOffice: { type: String },
  highWork: { type: String },

  // --- 4. Épület és Higiénia ---
  buildingType: { type: String },
  floorNumber: { type: String },
  access: { type: String },
  areaSize: { type: Number }, // Telephely mérete (Közös)

  // Helyiségek (Checkboxok)
  room_office: { type: String },
  room_guest: { type: String },
  room_kitchen: { type: String },
  room_warehouse: { type: String },
  room_social: { type: String },
  room_workshop: { type: String },

  // Higiénia
  restroom: { type: String },
  handSanitizer: { type: String },
  ac: { type: String },

  // --- 5. Szerkezetek ---
  walls: { type: String },
  ceiling: { type: String },
  roofType: { type: String },
  roofCover: { type: String },
  insulation: { type: String },

  // --- 6. Menekülés ---
  exits: { type: String },
  doorWidth: { type: String },
  altExit: { type: String },
  altExitWidth: { type: String },
  
  disabled: { type: String, default: 'no' },
  disabledDesc: { type: String },
  
  distM: { type: Number },
  distStep: { type: Number },

  // --- 7. Biztonság és Táblák ---
  firstAid: { type: String },
  extCount: { type: Number, default: 0 },
  extType: { type: String },
  extLocation: { type: String },
  valid: { type: String },

  // Táblák (Checkboxok)
  sign_firstaid: { type: String },
  sign_extinguisher: { type: String },
  sign_gas: { type: String },
  sign_emergency: { type: String },
  sign_no_smoking: { type: String },
  sign_escape: { type: String },
  sign_shelf: { type: String },
  sign_camera: { type: String },

  chemicals: { type: String },

  // --- 8. Rendszerek ---
  sys_alarm: { type: String },
  sys_sprinkler: { type: String },
  sys_smoke: { type: String },
  sys_manual: { type: String },
  sys_none: { type: String },
  systemLocation: { type: String },

  // --- 10. Gépészet ---
  mainSwitch: { type: String },
  gasValve: { type: String },
  gasLocation: { type: String },
  boiler: { type: String },
  boilerDesc: { type: String },

  // --- 11. Villámvédelem ---
  lightning: { type: String },
  shockProt: { type: String },
  lightningDoc: { type: String },

  // --- 12. Hulladékkezelés ---
  waste_communal: { type: String },
  waste_select: { type: String },
  waste_hazard: { type: String },
  waste_industrial: { type: String },
  
  waste: { type: String }, 
  wasteDesc: { type: String },
  wasteRoute: { type: String },

  // --- 13. Raktározás és Egyéb ---
  shelfLoad: { type: Number },
  shelfLabelMissing: { type: String },
  storageRoom: { type: String },
  storageSize: { type: Number },

  // Vegyes anyagok
  mat_paper: { type: String },
  mat_clean: { type: String },
  mat_paint: { type: String },
  mat_fuel: { type: String },
  mat_gas: { type: String },
  mat_aero: { type: String },
  mat_other: { type: String },

  notes: { type: String }, // Megjegyzés (Közös)

  // Rendszer adat
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ha már létezik a model, ne definiálja újra (Next.js hot reload miatt fontos)
const Submission = models.Submission || mongoose.model("Submission", SubmissionSchema);

export default Submission;