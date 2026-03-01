// /models/Submission.ts
import mongoose, { Schema, models } from "mongoose";

const SubmissionSchema = new Schema({
  // --- 0. ŰRLAP TÍPUSA (ÚJ) ---
  // Ez dönti el, hogy Tűzvédelmi ('fire') vagy VBF ('vbf') adatlap
  formType: { type: String, default: 'fire' },

  // --- VBF SPECIFIKUS MEZŐK (ÚJ) ---
  vbf_services: { type: String }, // Milyen vizsgálatot kér (vesszővel elválasztva)
  vbf_prev_doc: { type: String }, // Rendelkezik korábbi dokumentummal? (Igen/Nem)

  // --- HACCP SPECIFIKUS MEZŐK (BŐVÍTETT) ---
  haccp_services: { type: String }, // Szolgáltatás kiválasztása
  haccp_prev_doc: { type: String }, // Van korábbi?
  haccp_unit_type: { type: String }, // Egység típusa
  haccp_manager: { type: String }, // Üzletvezető/Ügyvezető
  haccp_food_types: { type: String }, // Forgalmazott ételek

  // Helyiségek & Berendezések
  haccp_rooms: { type: String }, // Iroda, Vendégtér, Műhely...
  haccp_equipment: { type: String }, // Sprinkler, Füstérzékelő...
  haccp_gas: { type: String }, // Gáz használat
  haccp_first_aid: { type: String }, // Elsősegély
  haccp_extinguishers: { type: Number }, // Tűzoltó db
  haccp_signs: { type: String }, // Táblák szűrve

  // Beszerzés & Alapanyagok
  haccp_suppliers: { type: String }, // Kitől érkezik liszt, tej...
  haccp_supplier_verify: { type: String }, // Számla/Nyilatkozat
  haccp_packaging: { type: String }, // Csomagolóanyag honnan
  haccp_allergen_separation: { type: String }, // Külön van?
  haccp_allergen_labeling: { type: String }, // Jelölés módja
  haccp_product_groups: { type: String }, // 1.1 - 1.12 kategóriák

  // Egység azonosítók (HACCP kiegészítés)
  companyRegNumber: { type: String }, // Cégjegyzékszám / EV nyilvántartási szám
  foodChainId: { type: String }, // Élelmiszerlánc-felügyeleti azonosító
  siteId: { type: String }, // Telephely azonosító

  // Helyiségek (funkció szerint) és higiénia
  haccp_rooms_functional: { type: String }, // Áruátvétel, raktár, hűtő, stb.
  haccp_handwash_prep: { type: String }, // Külön kézmosó az előkészítőben (igen/nem)
  haccp_handwash_hotcold: { type: String }, // Hideg–meleg víz biztosított (igen/nem)
  haccp_washing_system: { type: String }, // Egyfázisú, Kétfázisú, Hárommedencés, Ipari mosogatógép

  // Működés
  haccp_pest_control: { type: String }, // Rágcsálóirtás
  haccp_staff_area: { type: String }, // Személyzeti rész
  haccp_sales_method: { type: String }, // Önkiszolgáló / Pult
  haccp_preparation_rooms: { type: String }, // Előkészítők
  haccp_production_rooms: { type: String }, // Melegkonyha stb.
  haccp_workflow: { type: String }, // Műveleti lépések
  haccp_delivery: { type: String }, // Kiszállítás (Wolt, saját...)
  haccp_delivery_method: { type: String }, // Saját/Alvállalkozó
  haccp_oil_transport: { type: String }, // Olajszállítás
  haccp_waste_transport: { type: String }, // Hulladék elszállítás
  haccp_pasta_production: { type: String }, // Tészta
  haccp_other_pasta: { type: String }, // Egyéb tészta

  // Beszerzési mátrixok (JSON stringként vagy egyszerű szövegként)
  haccp_meat_sourcing: { type: String },
  haccp_veg_sourcing: { type: String },
  haccp_fish_sourcing: { type: String },
  haccp_egg_sourcing: { type: String },

  // Termék és alapanyag részletek
  haccp_hotcold_prepared: { type: String }, // Helyben készül / Félkész
  haccp_meat_operations: { type: String }, // Forgalmaz / Feldolgoz / Mindkettő
  haccp_allergen_handling: { type: String }, // Tárolás elkülönítve, jelölt edény, külön eszköz
  haccp_suppliers_list: { type: String }, // JSON lista: Cégnév|Cím|Adószám|Termék|Rendszeres/Eseti|Szerződés
  haccp_packaging_foodgrade: { type: String }, // Élelmiszerrel érintkezhető minősítés (igen/nem)
  haccp_packaging_compliance: { type: String }, // Megfelelőségi nyilatkozat (igen/nem)
  haccp_packaging_reuse: { type: String }, // Egyszer használatos / Újrahasználatos

  // Kiszállítás részletek
  haccp_delivery_happens: { type: String }, // Igen/Nem
  haccp_delivery_mode: { type: String }, // Saját jármű, Külső platform, Alvállalkozó
  haccp_delivery_temp_control: { type: String }, // Hőtartó doboz, aktív, hűtőtáska stb.
  haccp_delivery_time_avg: { type: String }, // Percek

  // Hulladékkezelés kiegészítések
  haccp_used_oil_company: { type: String }, // Cégnév
  haccp_used_oil_contract: { type: String }, // Szerződés (igen/nem)
  haccp_used_oil_frequency: { type: String }, // Szállítás gyakorisága
  haccp_food_waste_handling: { type: String }, // Zárt tároló, napi elszállítás stb.
  haccp_grease_trap: { type: String }, // Zsírfogó (igen/nem)
  haccp_grease_trap_maintenance: { type: String }, // Karbantartás gyakorisága

  // Kártevőirtás részletek
  haccp_pest_external: { type: String }, // Külső szolgáltató (igen/nem)
  haccp_pest_company: { type: String }, // Cégnév
  haccp_pest_contract: { type: String }, // Szerződés száma
  haccp_pest_last_date: { type: String }, // Utolsó irtás dátuma
  haccp_pest_log: { type: String }, // Dokumentált ellenőrzési napló (igen/nem)
  haccp_pest_trap_count: { type: Number }, // Rovarcsapdák száma

  // Egyéb
  haccp_commercial_groups: { type: String }, // Kereskedelmi csoportok
  haccp_haccp_supervisor: { type: String }, // Felügyelő személy
  haccp_floor_plan: { type: String }, // Alaprajz (fájl név vagy url)
  haccp_menu_photo: { type: String }, // Étlap fotó

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
