"use client";

import React, { useState, useEffect } from "react";
import { jsPDF } from "jspdf";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  
  // Állapotok a modálokhoz (ablakokhoz)
  const [previewItem, setPreviewItem] = useState<any>(null); // Ha ez nem null, akkor megnyílik az előnézet
  const [editItem, setEditItem] = useState<any>(null);       // Ha ez nem null, akkor megnyílik a szerkesztő

  // Betöltés
  useEffect(() => {
    const data = localStorage.getItem("fireSafetySubmissions");
    if (data) {
      setSubmissions(JSON.parse(data));
    }
  }, []);

  // --- MŰVELETEK ---

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Helytelen adatok!");
    }
  };

  const deleteSubmission = (id: string) => {
    if (confirm("Valóban törölni szeretné ezt a beküldést?")) {
      const updated = submissions.filter((s) => s.id !== id);
      setSubmissions(updated);
      localStorage.setItem("fireSafetySubmissions", JSON.stringify(updated));
    }
  };

  const saveEdit = () => {
    // Megkeressük az eredetit és kicseréljük a szerkesztettre
    const updatedList = submissions.map((s) => (s.id === editItem.id ? editItem : s));
    setSubmissions(updatedList);
    localStorage.setItem("fireSafetySubmissions", JSON.stringify(updatedList));
    setEditItem(null); // Bezárjuk az ablakot
    alert("Sikeres mentés!");
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  // --- PDF GENERÁTOR (Ugyanaz, mint eddig, csak a tr() függvényt kiemeltem) ---
  
  // Magyarosító segédfüggvény (ezt használjuk a HTML előnézetben is!)
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
    
    // Fejléc
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

    // Adatok beírása (ugyanaz a logika, mint az előző verzióban)
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
    addLine("Külön raktár", data.storageRoom === 'yes' ? `${data.storageSize} m²` : 'Nincs');

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
    addLine("Gáz főelzáró", data.gasValve === 'yes' ? (data.gasLocation || 'Van') : 'Nincs');
    addLine("Kazán/Hőtermelő", data.boiler === 'yes' ? (data.boilerDesc || 'Van') : 'Nincs');
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

  // --- LOGIN KÉPERNYŐ ---
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

  // --- ADMIN DASHBOARD ---
  return (
    <div className="min-h-screen bg-slate-50 relative">
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
                    
                    {/* GOMBOK SORA */}
                    <div className="flex flex-wrap gap-2 justify-end">
                        
                        {/* 1. ELŐNÉZET GOMB */}
                        <button onClick={() => setPreviewItem(sub)} className="bg-blue-50 text-blue-600 hover:bg-blue-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                            Előnézet
                        </button>

                        {/* 2. SZERKESZTÉS GOMB */}
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 hover:bg-yellow-100 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 00 2 2h11a2 2 0 00 2-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            Szerkeszt
                        </button>

                        {/* 3. PDF GOMB */}
                        <button onClick={() => generatePDF(sub)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium shadow-md transition-colors flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            PDF
                        </button>

                        {/* 4. TÖRLÉS GOMB */}
                        <button onClick={() => deleteSubmission(sub.id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors" title="Törlés">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a2 2 0 00-1-1h-4a2 2 0 00-1 1v3M4 7h16"></path></svg>
                        </button>
                    </div>
                </div>
            ))}
            {submissions.length === 0 && <p className="text-center text-slate-400 py-10">Még nincs adat.</p>}
        </div>
      </main>

      {/* --- ELŐNÉZET MODAL (ABLAK) --- */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800">Adatlap Előnézet</h2>
                 <button onClick={() => setPreviewItem(null)} className="p-2 hover:bg-slate-100 rounded-full">✕</button>
              </div>
              <div className="p-6 md:p-10 space-y-6 text-slate-800">
                 {/* Itt jelenítjük meg az adatokat struktúráltan */}
                 <PreviewSection title="1. Cégadatok">
                    <PreviewRow label="Cég neve" value={previewItem.companyName} />
                    <PreviewRow label="Székhely" value={previewItem.headquarters} />
                    <PreviewRow label="Telephely címe" value={previewItem.siteAddress} />
                 </PreviewSection>
                 
                 <PreviewSection title="2. Tevékenység">
                    <PreviewRow label="Fő tevékenység" value={previewItem.mainActivity} />
                    <PreviewRow label="Jelleg" value={[previewItem.type_shop, previewItem.type_office, previewItem.type_warehouse].filter(Boolean).join(", ")} />
                 </PreviewSection>

                 <PreviewSection title="3-4. Épület és Szerkezet">
                    <PreviewRow label="Épület típus" value={tr(previewItem.buildingType)} />
                    <PreviewRow label="Falazat" value={tr(previewItem.walls)} />
                    <PreviewRow label="Födém" value={tr(previewItem.ceiling)} />
                    <PreviewRow label="Tető" value={`${tr(previewItem.roofType)} / ${tr(previewItem.roofCover)}`} />
                 </PreviewSection>

                 <PreviewSection title="Technikai adatok">
                    <PreviewRow label="Oltókészülékek" value={`${previewItem.extCount} db (${previewItem.extType})`} />
                    <PreviewRow label="Főkapcsoló" value={previewItem.mainSwitch} />
                    <PreviewRow label="Villámvédelem" value={tr(previewItem.lightning)} />
                    <PreviewRow label="Megjegyzés" value={previewItem.notes} />
                 </PreviewSection>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                 <button onClick={() => generatePDF(previewItem)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">PDF Letöltés innen</button>
                 <button onClick={() => setPreviewItem(null)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold">Bezárás</button>
              </div>
           </div>
        </div>
      )}

      {/* --- SZERKESZTÉS MODAL (ABLAK) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5">
                 <h2 className="text-xl font-bold text-slate-800">Adatlap Szerkesztése</h2>
                 <p className="text-sm text-slate-500">A módosítások mentés után a PDF-ben is frissülnek.</p>
              </div>
              <div className="p-6 space-y-4">
                 <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                 <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                 <EditGroup label="Telephely címe" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                 
                 <div className="grid grid-cols-2 gap-4">
                    <EditGroup label="Dolgozók száma" name="employees" val={editItem.employees} onChange={handleEditChange} />
                    <EditGroup label="Oltókészülék (db)" name="extCount" val={editItem.extCount} onChange={handleEditChange} />
                 </div>

                 <EditGroup label="Fő tevékenység" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                 <EditGroup label="Villamos főkapcsoló helye" name="mainSwitch" val={editItem.mainSwitch} onChange={handleEditChange} />
                 
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border p-2 rounded-lg h-24"></textarea>
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0">
                 <button onClick={() => setEditItem(null)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Mégse</button>
                 <button onClick={saveEdit} className="bg-green-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700">Mentés</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// --- KISEBB UI KOMPONENSEK ---

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
        <div className="flex flex-col">
            <span className="text-xs text-slate-400 font-semibold">{label}</span>
            <span className="text-slate-800 font-medium">{value || "-"}</span>
        </div>
    );
}

function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">{label}</label>
            <input type="text" name={name} value={val || ""} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none" />
        </div>
    );
}