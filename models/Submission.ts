import mongoose, { Schema, models } from "mongoose";

const SubmissionSchema = new Schema({
  // 1. Cégadatok
  companyName: { type: String, required: true },
  headquarters: { type: String, required: true },
  siteAddress: { type: String, required: true },

  // 2. Tevékenység
  mainActivity: { type: String, required: true },
  specialTech: { type: String, default: 'no' }, // yes / no
  specialTechDesc: { type: String }, // Ha van
  // Jelleg (checkboxok, tömbként tároljuk)
  type_shop: { type: String },
  type_office: { type: String },
  type_warehouse: { type: String },
  type_workshop: { type: String },
  type_social: { type: String },
  type_other: { type: String },

  // 3. Épület
  buildingType: { type: String }, // standalone, multi_ground, etc.
  floorNumber: { type: String }, // Ha emeletes
  access: { type: String }, // street, staircase, yard
  areaSize: { type: Number }, // m2

  // 4. Szerkezet
  walls: { type: String }, // brick, concrete...
  ceiling: { type: String }, // plastered, wood...
  roofType: { type: String }, // flat, pitched
  roofCover: { type: String }, // tile, sheet...
  insulation: { type: String }, // yes, no, unknown

  // 5. Létszám
  employees: { type: Number, default: 0 },
  clientsAvg: { type: Number, default: 0 },
  clientsMax: { type: Number, default: 0 },
  disabled: { type: String, default: 'no' }, // yes / no
  disabledDesc: { type: String },

  // 6. Menekülés
  exits: { type: String }, // 1, 2, 3+
  doorWidth: { type: String }, // 90, 140, 250
  altExit: { type: String, default: 'no' },
  altExitWidth: { type: String },
  distM: { type: Number }, // méter
  distStep: { type: Number }, // lépés

  // 7. Anyagok (Checkboxok)
  mat_paper: { type: String },
  mat_clean: { type: String },
  mat_paint: { type: String },
  mat_fuel: { type: String },
  mat_gas: { type: String },
  mat_aero: { type: String },
  mat_other: { type: String },
  
  storageRoom: { type: String, default: 'no' }, // yes / no
  storageSize: { type: Number }, // m2

  // 8. Tűzoltó készülékek
  extCount: { type: Number, default: 0 },
  extType: { type: String },
  extLocation: { type: String },
  valid: { type: String }, // yes, no, unknown

  // 9. Rendszerek
  sys_alarm: { type: String },
  sys_sprinkler: { type: String },
  sys_manual: { type: String },
  sys_none: { type: String },
  systemLocation: { type: String },

  // 10. Gépészet
  mainSwitch: { type: String },
  gasValve: { type: String }, // yes (van gáz), no (nincs gáz)
  gasLocation: { type: String },
  boiler: { type: String }, // yes / no
  boilerDesc: { type: String },

  // 11. Villámvédelem
  lightning: { type: String }, // yes, no, dk
  shockProt: { type: String }, // yes, no
  lightningDoc: { type: String }, // yes, no

  // 12. Hulladék
  waste: { type: String }, // inside, room, outside
  wasteDesc: { type: String },
  wasteRoute: { type: String }, // yes, no

  // 13. Egyéb
  notes: { type: String },

  // Rendszer adat
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// Ha már létezik a model, ne definiálja újra (Next.js hot reload miatt fontos)
const Submission = models.Submission || mongoose.model("Submission", SubmissionSchema);

export default Submission;