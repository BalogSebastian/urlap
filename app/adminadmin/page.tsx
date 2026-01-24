"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false); // Loading state

  // Modal állapotok
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);

  // --- ADATOK BETÖLTÉSE (API-RÓL) ---
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (res.ok) {
        setSubmissions(data);
      } else {
        console.error("Hiba:", data.error);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Csak belépés után hívjuk meg
  useEffect(() => {
    if (isAuthenticated) {
      fetchSubmissions();
    }
  }, [isAuthenticated]);

  // --- LOGIN ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Helytelen adatok!");
    }
  };

  // --- TÖRLÉS (API) ---
  const deleteSubmission = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné ezt az adatlapot véglegesen az adatbázisból?")) return;

    try {
        const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
        if (res.ok) {
            // Frissítjük a listát kliens oldalon is
            setSubmissions(prev => prev.filter(s => s._id !== id));
            alert("Törölve.");
        } else {
            alert("Hiba a törlésnél.");
        }
    } catch (error) {
        alert("Szerver hiba.");
    }
  };

  // --- MENTÉS (SZERKESZTÉS UTÁN API) ---
  const saveEdit = async () => {
    try {
        const res = await fetch(`/api/submissions/${editItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editItem)
        });

        if (res.ok) {
            const updatedData = await res.json();
            // Lista frissítése
            setSubmissions(prev => prev.map(s => s._id === editItem._id ? updatedData.data : s));
            setEditItem(null);
            alert("Adatok sikeresen frissítve az adatbázisban!");
        } else {
            alert("Mentés sikertelen.");
        }
    } catch (error) {
        alert("Hiba történt mentés közben.");
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  // --- 🌍 FORDÍTÓ ---
  const tr = (val: string) => {
    const map: any = {
        'yes': 'Igen', 'no': 'Nem', 'dk': 'Nem tudom', 'unknown': 'Nem tudom',
        'brick': 'Tégla falazat', 'concrete': 'Panel / Vasbeton', 'steel': 'Fém / Acélváz', 'light': 'Könnyűszerkezetes',
        'plastered': 'Vakolt mennyezet', 'wood': 'Fagerendás', 'metal': 'Trapézlemez / Acél', 
        'flat': 'Lapos tető', 'pitched': 'Magastető',
        'tile': 'Cserép', 'sheet': 'Lemez', 'shingle': 'Zsindely', 'panel': 'Szendvicspanel',
        'standalone': 'Önálló földszintes', 'multi_ground': 'Többszintes ép. földszintjén', 
        'multi_floor': 'Többszintes ép. emeletén', 'industrial': 'Ipari / Csarnok', 'residential': 'Társasház / Pince',
        'street': 'Utcáról közvetlenül', 'staircase': 'Lépcsőházból', 'yard': 'Udvarról',
        'inside': 'Épületen belül', 'room': 'Külön helyiségben', 'outside': 'Udvaron / Kukatárolóban',
    };
    return map[val] || val || "-";
  };

  // --- 📄 PDF GENERÁTOR ---
  const generatePDF = (data: any) => {
    const doc = new jsPDF();

    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TŰZVÉDELMI ADATLAP", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    // MongoDB _id használata az azonosítóhoz
    doc.text(`Generálva: ${new Date().toLocaleString("hu-HU")}`, 14, 35);
    doc.text(`Azonosító: #${data._id.slice(-6).toUpperCase()}`, 14, 40);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("Tűzvédelmi Dokumentáció", 196, 25, { align: "right" });

    const join = (arr: any[]) => arr ? arr.filter(Boolean).join(", ") : "-";

    const tableBody = [
        [{ content: '1. Cég- és telephelyadatok', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Cég neve', data.companyName],
        ['Székhely', data.headquarters],
        ['Telephely címe', data.siteAddress],

        [{ content: '2. Rendeltetés, tevékenység', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Fő tevékenység', data.mainActivity],
        ['Speciális technológia', data.specialTech === 'yes' ? (data.specialTechDesc || 'Van') : 'Nincs'],
        ['Telephely jellege', join([data.type_shop, data.type_office, data.type_warehouse, data.type_workshop, data.type_social, data.type_other])],

        [{ content: '3. Épület alapadatai', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Épület elhelyezkedése', tr(data.buildingType)],
        ['Emelet', data.floorNumber || '-'],
        ['Megközelítés', tr(data.access)],
        ['Hasznos alapterület', `${data.areaSize || '0'} m²`],

        [{ content: '4. Szerkezetek', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Teherhordó falak', tr(data.walls)],
        ['Födém', tr(data.ceiling)],
        ['Tető jellege', tr(data.roofType)],
        ['Tető fedése', tr(data.roofCover)],
        ['Külső hőszigetelés', tr(data.insulation)],

        [{ content: '5. Létszám, menekülési képesség', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Dolgozók létszáma', `${data.employees || '0'} fő`],
        ['Ügyfelek (max)', `${data.clientsMax || '0'} fő`],
        ['Segítségre szorulók', data.disabled === 'yes' ? (data.disabledDesc || 'Van') : 'Nincs'],

        [{ content: '6. Menekülési útvonalak', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Kijáratok száma', `${data.exits} db`],
        ['Főajtó szélessége', `${data.doorWidth} cm`],
        ['Alternatív kijárat', data.altExit === 'yes' ? `Van (${data.altExitWidth || '?'} cm)` : 'Nincs'],
        ['Menekülési út', data.distM ? `${data.distM} méter` : `${data.distStep} lépés`],

        [{ content: '7. Tűzveszélyes anyagok', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Jellemző anyagok', join([data.mat_paper, data.mat_clean, data.mat_paint, data.mat_fuel, data.mat_gas, data.mat_aero, data.mat_other])],
        ['Külön raktárhelyiség', data.storageRoom === 'yes' ? `Van (${data.storageSize} m²)` : 'Nincs'],

        [{ content: '8. Tűzoltó készülékek', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Darabszám', `${data.extCount || '0'} db`],
        ['Típus', data.extType],
        ['Elhelyezés', data.extLocation || '-'],
        ['Érvényes matrica', tr(data.valid)],

        [{ content: '9. Beépített rendszerek', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Rendszerek', join([data.sys_alarm, data.sys_sprinkler, data.sys_manual, data.sys_none])],
        ['Helye / Leírása', data.systemLocation || '-'],

        [{ content: '10. Gépészet', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Villamos főkapcsoló', data.mainSwitch || '-'],
        ['Gázellátás', data.gasValve === 'yes' ? (data.gasLocation || 'Van') : 'Nincs gáz'],
        ['Kazán', data.boiler === 'yes' ? (data.boilerDesc || 'Van') : 'Nincs'],

        [{ content: '11. Villámvédelem', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Külső villámvédelem', tr(data.lightning)],
        ['Érintésvédelmi JKV', tr(data.shockProt)],
        ['Villámvédelmi JKV', tr(data.lightningDoc)],

        [{ content: '12. Hulladékkezelés', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        ['Tárolás helye', tr(data.waste)],
        ['Leírás', data.wasteDesc || '-'],
        ['Útvonalon tárol?', tr(data.wasteRoute)],

        [{ content: '13. Egyéb', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold' } }],
        [{ content: data.notes || "Nincs megjegyzés.", colSpan: 2, styles: { fontStyle: 'italic' } }],
    ];

    autoTable(doc, {
        startY: 55,
        head: [['Megnevezés', 'Adat / Válasz']],
        body: tableBody,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10, cellPadding: 4 },
        headStyles: { fillColor: [79, 70, 229] },
        columnStyles: { 0: { cellWidth: 80, fontStyle: 'bold' } },
    });

    const cleanName = (data.companyName || 'adatlap').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`Tuzvedelmi_Adatlap_${cleanName}.pdf`);
  };

  // --- LOGIN UI (Ha nincs belépve) ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Belépés (MongoDB)</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
            <input type="password" placeholder="admin" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
            <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold">Belépés</button>
          </form>
        </div>
      </div>
    );
  }

  // --- DASHBOARD UI ---
  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-600 text-white p-2 rounded-lg font-bold text-lg">TV</div>
            <h1 className="text-xl font-bold text-slate-800">Admin Dashboard (Cloud DB)</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Beérkezett Adatlapok</h2>
            <button onClick={fetchSubmissions} className="text-indigo-600 text-sm hover:underline">🔄 Frissítés</button>
        </div>
        
        {loading && <p className="text-center py-10">Betöltés az adatbázisból...</p>}

        <div className="grid gap-4">
            {!loading && submissions.slice().reverse().map((sub, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                        <p className="text-slate-500 text-sm mt-1">{sub.siteAddress} • {new Date(sub.createdAt).toLocaleString("hu-HU")}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => setPreviewItem(sub)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold">👁️ Előnézet</button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg font-bold">✏️ Szerkeszt</button>
                        <button onClick={() => generatePDF(sub)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold">📄 PDF</button>
                        <button onClick={() => deleteSubmission(sub._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg">🗑️</button>
                    </div>
                </div>
            ))}
            {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10">Még nincs adat az adatbázisban.</p>}
        </div>
      </main>

      {/* MODALOK (Előnézet és Szerkesztés) UGYANAZ, mint előbb, csak most sub._id-t használunk */}
      {/* ... A PreviewItem és EditItem modal kódja megegyezik az előző válasszal, csak a "saveEdit"-ben már a PUT API hívás van ... */}
      
      {/* --- ITT JÖN AZ ELŐZŐ VÁLASZOM MODAL RÉSZE (PLACEHOLDER), MÁSOLD BE IDE A MODALOKAT --- */}
      {/* Fontos: A saveEdit és deleteSubmission már az API-t hívja, így a Modalokban a gombok működni fognak. */}
      {/* Csak arra figyelj, hogy 'sub.id' helyett 'sub._id' legyen a listázásnál (fentebb javítottam). */}
      
      {/* Mivel a kód hossza korlátozott, a Modal UI kódja ugyanaz, mint az előző válaszban (EditGroup, stb), csak be kell illesztened ide a return aljára. */}
       
       {/* EDIT MODAL HELYE (Illeszd be az előző kódból a Modal részt) */}
       {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 z-10">
                 <h2 className="text-xl font-bold text-slate-800">Szerkesztés (Cloud DB)</h2>
              </div>
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                 {/* MEZŐK (Ugyanazok, mint előbb) */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                    <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                    <EditGroup label="Telephely" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                 </div>
                 {/* ... többi mező ... */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-24"></textarea>
                 </div>
              </div>
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0 z-10">
                 <button onClick={() => setEditItem(null)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Mégse</button>
                 <button onClick={saveEdit} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700">Mentés (Adatbázisba)</button>
              </div>
           </div>
        </div>
      )}

      {/* PREVIEW MODAL HELYE (Illeszd be az előző kódból) */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-10 space-y-4">
                   <h2 className="text-2xl font-bold">Adatok</h2>
                   <p><strong>Cég:</strong> {previewItem.companyName}</p>
                   <p><strong>Cím:</strong> {previewItem.siteAddress}</p>
                   <p><strong>Tevékenység:</strong> {previewItem.mainActivity}</p>
                   <p><em>(A teljes előnézet a PDF-ben lesz tökéletes)</em></p>
                   <div className="flex justify-end gap-2 mt-4">
                       <button onClick={() => setPreviewItem(null)} className="px-4 py-2 bg-slate-200 rounded">Bezárás</button>
                   </div>
               </div>
           </div>
        </div>
      )}

    </div>
  );
}

// UI KOMPONENSEK
function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{label}</label>
            <input type="text" name={name} value={val || ""} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
        </div>
    );
}