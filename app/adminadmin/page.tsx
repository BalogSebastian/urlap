"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Állapotok a modálokhoz
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // --- BETÖLTÉS ---
  useEffect(() => {
    const data = localStorage.getItem("fireSafetySubmissions");
    if (data) {
      setSubmissions(JSON.parse(data));
    }
  }, []);

  // --- ADMIN MŰVELETEK ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Helytelen adatok!");
    }
  };

  const deleteSubmission = (id: string) => {
    if (confirm("Biztosan törölni szeretné ezt az adatlapot?")) {
      const updated = submissions.filter((s) => s.id !== id);
      setSubmissions(updated);
      localStorage.setItem("fireSafetySubmissions", JSON.stringify(updated));
    }
  };

  const saveEdit = () => {
    const updatedList = submissions.map((s) => (s.id === editItem.id ? editItem : s));
    setSubmissions(updatedList);
    localStorage.setItem("fireSafetySubmissions", JSON.stringify(updatedList));
    setEditItem(null);
    alert("Adatok sikeresen frissítve!");
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  // --- PDF & FORDÍTÓ LOGIKA ---
  const tr = (val: string) => {
    const map: any = {
        'brick': 'Tégla', 'concrete': 'Beton/Panel', 'steel': 'Acél', 'light': 'Könnyűszerk.', 'unknown': 'Nem tudom',
        'plastered': 'Vakolt', 'wood': 'Fa', 'metal': 'Fém/Trapéz',
        'flat': 'Lapos', 'pitched': 'Magastető',
        'tile': 'Cserép', 'sheet': 'Lemez', 'shingle': 'Zsindely', 'panel': 'Panel',
        'yes': 'Igen', 'no': 'Nem', 'dk': 'Nem tudom',
        'street': 'Utca', 'staircase': 'Lépcsőház', 'yard': 'Udvar',
        'standalone': 'Önálló', 'multi_ground': 'Többszintes fszt.', 'multi_floor': 'Emelet', 'industrial': 'Ipari', 'residential': 'Lakóház',
        'inside': 'Épületen belül', 'room': 'Külön helyiség', 'outside': 'Udvaron/Kint'
    };
    return map[val] || val || "-";
  };

  const generatePDF = (data: any) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("Tűzvédelmi Adatlap", 20, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Generálva: ${new Date().toLocaleString("hu-HU")}`, 20, 28);
    doc.text(`Azonosító: ${data.id}`, 20, 33);
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 38, 190, 38);

    let y = 50;

    const addSection = (title: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFontSize(14);
        doc.setTextColor(79, 70, 229);
        doc.setFont("helvetica", "bold");
        doc.text(title, 20, y);
        y += 8;
        doc.setTextColor(0,0,0);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(11);
    };

    const addLine = (label: string, value: string) => {
        if (y > 280) { doc.addPage(); y = 20; }
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, 20, y);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(value || "-", 110);
        doc.text(splitText, 75, y);
        y += (splitText.length * 6) + 2;
    };

    // --- PDF TARTALOM ÖSSZEÁLLÍTÁSA ---
    addSection("1. Cég- és Telephelyadatok");
    addLine("Cég neve", data.companyName);
    addLine("Székhely", data.headquarters);
    addLine("Telephely címe", data.siteAddress);

    addSection("2. Tevékenység");
    addLine("Fő tevékenység", data.mainActivity);
    addLine("Spec. technológia", data.specialTech === 'yes' ? (data.specialTechDesc || 'Van') : 'Nincs');
    const types = [data.type_shop, data.type_office, data.type_warehouse, data.type_workshop, data.type_social, data.type_other].filter(Boolean).join(", ");
    addLine("Jelleg", types);

    addSection("3. Épület Alapadatai");
    addLine("Épület típusa", tr(data.buildingType));
    if(data.buildingType === 'multi_floor') addLine("Emelet", data.floorNumber);
    addLine("Megközelítés", tr(data.access));
    addLine("Alapterület", `${data.areaSize || '-'} m²`);

    addSection("4. Szerkezetek");
    addLine("Falak", tr(data.walls));
    addLine("Födém", tr(data.ceiling));
    addLine("Tető jellege", tr(data.roofType));
    addLine("Tető fedése", tr(data.roofCover));
    addLine("Külső szigetelés", tr(data.insulation));

    addSection("5. Létszám & Menekülés");
    addLine("Dolgozók", `${data.employees || '0'} fő`);
    addLine("Ügyfelek (átlag)", `${data.clientsAvg || '0'} fő`);
    addLine("Ügyfelek (max)", `${data.clientsMax || '0'} fő`);
    addLine("Segítségre szorul", data.disabled === 'yes' ? (data.disabledDesc || 'Van') : 'Nincs');
    addLine("Kijáratok száma", `${data.exits} db`);
    addLine("Főajtó szélesség", `${data.doorWidth} cm`);
    addLine("Menekülési út", data.distM ? `${data.distM} méter` : `${data.distStep} lépés`);

    addSection("7. Tűzveszélyes Anyagok");
    const materials = [data.mat_paper, data.mat_clean, data.mat_paint, data.mat_fuel, data.mat_gas, data.mat_aero].filter(Boolean).join(", ");
    addLine("Jellemző anyagok", materials || "Nincs megjelölve");
    addLine("Külön raktár", data.storageRoom === 'yes' ? "Van" : 'Nincs');

    addSection("8. Tűzoltó Készülékek");
    addLine("Darabszám", `${data.extCount || '0'} db`);
    addLine("Típus", data.extType);
    addLine("Elhelyezés", data.extLocation);
    addLine("Érvényes matrica", tr(data.valid));

    addSection("9. Beépített Rendszerek");
    const systems = [data.sys_alarm, data.sys_sprinkler, data.sys_manual, data.sys_none].filter(Boolean).join(", ");
    addLine("Rendszerek", systems || "-");
    addLine("Helye/Leírása", data.systemLocation);

    addSection("10. Gépészet & Villámvédelem");
    addLine("Villamos főkapcs.", data.mainSwitch);
    addLine("Gáz főelzáró", data.gasValve);
    addLine("Külső villámvéd.", tr(data.lightning));
    addLine("Érintésvéd. Jkv.", tr(data.shockProt));
    addLine("Villámvéd. Jkv.", tr(data.lightningDoc));

    addSection("11. Hulladékkezelés");
    addLine("Tárolás helye", tr(data.waste));
    addLine("Útvonalon tárol?", tr(data.wasteRoute));

    addSection("Egyéb megjegyzés");
    addLine("Leírás", data.notes);

    const cleanName = (data.companyName || 'adatlap').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`tuzvedelem_${cleanName}.pdf`);
  };

  // --- LOGIN NÉZET ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <div className="text-center mb-6">
             <h1 className="text-2xl font-bold text-slate-800">Admin Belépés</h1>
             <p className="text-slate-500 text-sm">Tűzvédelmi Rendszer</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="Felhasználónév (admin)" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
            <input type="password" placeholder="Jelszó (admin)" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
            <button className="w-full bg-slate-900 text-white p-3 rounded-lg font-bold">Belépés</button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD NÉZET ---
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
            <span className="bg-indigo-600 text-white p-1.5 rounded-lg font-bold text-sm">TV</span>
            <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <h2 className="text-2xl font-bold text-slate-900 mb-6">Beérkezett Adatlapok</h2>
        
        <div className="grid gap-4">
            {submissions.slice().reverse().map((sub, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                        <p className="text-slate-500 text-sm mt-1">{sub.siteAddress} • {sub.submittedAt}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => setPreviewItem(sub)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                             👁️ Előnézet
                        </button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                             ✏️ Szerkesztés
                        </button>
                        <button onClick={() => generatePDF(sub)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
                             📄 PDF
                        </button>
                        <button onClick={() => deleteSubmission(sub.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors">
                             🗑️
                        </button>
                    </div>
                </div>
            ))}
            {submissions.length === 0 && <p className="text-center text-slate-400 py-10">Még nincs adat.</p>}
        </div>
      </main>

      {/* --- ELŐNÉZET MODAL (TELJES) --- */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center z-10">
                 <h2 className="text-xl font-bold text-slate-800">Adatlap Előnézet</h2>
                 <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              
              <div className="p-6 md:p-10 space-y-8 text-slate-800">
                 <PreviewSection title="1. Cégadatok">
                    <PreviewRow label="Cég neve" value={previewItem.companyName} />
                    <PreviewRow label="Székhely" value={previewItem.headquarters} />
                    <PreviewRow label="Telephely" value={previewItem.siteAddress} />
                 </PreviewSection>
                 
                 <PreviewSection title="2. Tevékenység">
                    <PreviewRow label="Fő tevékenység" value={previewItem.mainActivity} />
                    <PreviewRow label="Spec. Tech." value={previewItem.specialTech === 'yes' ? previewItem.specialTechDesc : "Nincs"} />
                    <PreviewRow label="Jelleg" value={[previewItem.type_shop, previewItem.type_office, previewItem.type_warehouse, previewItem.type_workshop, previewItem.type_social].filter(Boolean).join(", ")} />
                 </PreviewSection>

                 <PreviewSection title="3-4. Épület és Szerkezet">
                    <PreviewRow label="Típus" value={tr(previewItem.buildingType)} />
                    <PreviewRow label="Emelet" value={previewItem.floorNumber} />
                    <PreviewRow label="Megközelítés" value={tr(previewItem.access)} />
                    <PreviewRow label="Terület" value={`${previewItem.areaSize} m²`} />
                    <PreviewRow label="Falak" value={tr(previewItem.walls)} />
                    <PreviewRow label="Födém" value={tr(previewItem.ceiling)} />
                    <PreviewRow label="Tető" value={`${tr(previewItem.roofType)} / ${tr(previewItem.roofCover)}`} />
                    <PreviewRow label="Szigetelés" value={tr(previewItem.insulation)} />
                 </PreviewSection>

                 <PreviewSection title="5-6. Létszám és Menekülés">
                    <PreviewRow label="Dolgozók" value={previewItem.employees} />
                    <PreviewRow label="Ügyfelek" value={previewItem.clientsMax} />
                    <PreviewRow label="Segítségre szorul" value={previewItem.disabled === 'yes' ? previewItem.disabledDesc : "Nincs"} />
                    <PreviewRow label="Kijáratok" value={previewItem.exits} />
                    <PreviewRow label="Ajtó szélesség" value={`${previewItem.doorWidth} cm`} />
                    <PreviewRow label="Távolság" value={previewItem.distM ? `${previewItem.distM} m` : `${previewItem.distStep} lépés`} />
                 </PreviewSection>

                 <PreviewSection title="7-8. Anyagok és Eszközök">
                    <PreviewRow label="Anyagok" value={[previewItem.mat_paper, previewItem.mat_clean, previewItem.mat_paint, previewItem.mat_fuel, previewItem.mat_gas].filter(Boolean).join(", ")} />
                    <PreviewRow label="Külön raktár" value={previewItem.storageRoom === 'yes' ? "Van" : "Nincs"} />
                    <PreviewRow label="Oltókészülék" value={`${previewItem.extCount} db (${previewItem.extType})`} />
                    <PreviewRow label="Elhelyezés" value={previewItem.extLocation} />
                    <PreviewRow label="Matrica" value={tr(previewItem.valid)} />
                 </PreviewSection>

                 <PreviewSection title="9-11. Rendszerek és Gépészet">
                     <PreviewRow label="Rendszerek" value={[previewItem.sys_alarm, previewItem.sys_sprinkler, previewItem.sys_manual].filter(Boolean).join(", ")} />
                     <PreviewRow label="Rendszer helye" value={previewItem.systemLocation} />
                     <PreviewRow label="Vill. főkapcs." value={previewItem.mainSwitch} />
                     <PreviewRow label="Gáz" value={previewItem.gasValve} />
                     <PreviewRow label="Villámvédelem" value={tr(previewItem.lightning)} />
                     <PreviewRow label="Érintésvéd. JKV" value={tr(previewItem.shockProt)} />
                     <PreviewRow label="Villámvéd. JKV" value={tr(previewItem.lightningDoc)} />
                     <PreviewRow label="Hulladék helye" value={tr(previewItem.waste)} />
                 </PreviewSection>

                 <PreviewSection title="Egyéb">
                    <p className="col-span-2 text-slate-600 italic bg-slate-50 p-3 rounded">{previewItem.notes || "Nincs megjegyzés"}</p>
                 </PreviewSection>
              </div>
           </div>
        </div>
      )}

      {/* --- SZERKESZTÉS MODAL (TELJES) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 z-10">
                 <h2 className="text-xl font-bold text-slate-800">Adatlap Teljes Szerkesztése</h2>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                 
                 {/* 1. Szekció */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                    <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                    <EditGroup label="Telephely címe" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                 </div>

                 {/* 2. Szekció */}
                 <div className="bg-slate-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditGroup label="Fő tevékenység" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                    <EditGroup label="Spec. Technológia (ha van)" name="specialTechDesc" val={editItem.specialTechDesc} onChange={handleEditChange} />
                 </div>

                 {/* 3. Szekció */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditGroup label="Épület típus (kód)" name="buildingType" val={editItem.buildingType} onChange={handleEditChange} />
                    <EditGroup label="Emelet száma" name="floorNumber" val={editItem.floorNumber} onChange={handleEditChange} />
                    <EditGroup label="Megközelítés (kód)" name="access" val={editItem.access} onChange={handleEditChange} />
                    <EditGroup label="Terület (m2)" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} />
                 </div>

                 {/* 4. Szekció */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditGroup label="Falazat (kód)" name="walls" val={editItem.walls} onChange={handleEditChange} />
                    <EditGroup label="Födém (kód)" name="ceiling" val={editItem.ceiling} onChange={handleEditChange} />
                    <EditGroup label="Tető (kód)" name="roofType" val={editItem.roofType} onChange={handleEditChange} />
                    <EditGroup label="Szigetelés (yes/no)" name="insulation" val={editItem.insulation} onChange={handleEditChange} />
                 </div>

                 {/* 5-6. Szekció */}
                 <div className="border-t pt-6 grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditGroup label="Dolgozók" name="employees" val={editItem.employees} onChange={handleEditChange} />
                    <EditGroup label="Ügyfelek (Max)" name="clientsMax" val={editItem.clientsMax} onChange={handleEditChange} />
                    <EditGroup label="Kijáratok (db)" name="exits" val={editItem.exits} onChange={handleEditChange} />
                    <EditGroup label="Távolság (m)" name="distM" val={editItem.distM} onChange={handleEditChange} />
                 </div>

                 {/* 8. Szekció */}
                 <div className="bg-indigo-50 p-4 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Készülék db" name="extCount" val={editItem.extCount} onChange={handleEditChange} />
                    <EditGroup label="Típus" name="extType" val={editItem.extType} onChange={handleEditChange} />
                    <EditGroup label="Hely" name="extLocation" val={editItem.extLocation} onChange={handleEditChange} />
                 </div>

                 {/* 10. Szekció */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <EditGroup label="Villamos főkapcsoló" name="mainSwitch" val={editItem.mainSwitch} onChange={handleEditChange} />
                    <EditGroup label="Gáz elzáró" name="gasValve" val={editItem.gasValve} onChange={handleEditChange} />
                 </div>

                 {/* Megjegyzés */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-indigo-500"></textarea>
                 </div>

              </div>
              
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0 z-10">
                 <button onClick={() => setEditItem(null)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Mégse</button>
                 <button onClick={saveEdit} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700">Mentés</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// --- UI HELPERS ---

function PreviewSection({ title, children }: any) {
    return (
        <div className="border-b border-slate-100 pb-4 last:border-0">
            <h3 className="text-indigo-600 font-bold mb-3 uppercase text-sm tracking-wider">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6">
                {children}
            </div>
        </div>
    );
}

function PreviewRow({ label, value }: any) {
    return (
        <div className="flex flex-col border-l-2 border-slate-100 pl-3">
            <span className="text-xs text-slate-400 font-semibold uppercase">{label}</span>
            <span className="text-slate-800 font-medium break-words">{value || "-"}</span>
        </div>
    );
}

function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{label}</label>
            <input type="text" name={name} value={val || ""} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
        </div>
    );
}