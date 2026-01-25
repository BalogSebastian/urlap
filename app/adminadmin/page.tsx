"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- MODAL ÁLLAPOTOK ---
  const [previewItem, setPreviewItem] = useState<any>(null);
  const [editItem, setEditItem] = useState<any>(null);
  const [emailItem, setEmailItem] = useState<any>(null); // Email küldéshez
  
  // Email form state
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);

  // --- ADATOK BETÖLTÉSE (API) ---
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (res.ok) setSubmissions(data);
      else console.error("API Hiba:", data.error);
    } catch (err) {
      console.error("Hálózati hiba:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) fetchSubmissions();
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

  // --- TÖRLÉS ---
  const deleteSubmission = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné véglegesen az adatbázisból?")) return;
    try {
        const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
        if (res.ok) {
            setSubmissions(prev => prev.filter(s => s._id !== id));
            alert("Törölve.");
        } else alert("Hiba a törlésnél.");
    } catch (error) {
        alert("Szerver hiba.");
    }
  };

  // --- MENTÉS (SZERKESZTÉS) ---
  const saveEdit = async () => {
    try {
        const res = await fetch(`/api/submissions/${editItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editItem)
        });
        if (res.ok) {
            const updated = await res.json();
            setSubmissions(prev => prev.map(s => s._id === editItem._id ? updated.data : s));
            setEditItem(null);
            alert("Sikeres mentés!");
        } else alert("Mentés sikertelen.");
    } catch (error) {
        alert("Hiba történt.");
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  // --- EMAIL KÜLDÉS ---
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
        // 1. PDF generálása memóriában (blob)
        const pdfBlob = generatePDF(emailItem, true) as Blob;

        // 2. Adatok formázása
        const formData = new FormData();
        formData.append("file", pdfBlob, "adatlap.pdf");
        formData.append("email", targetEmail);
        formData.append("companyName", emailItem.companyName);

        // 3. Küldés a szervernek
        const res = await fetch("/api/send-email", {
            method: "POST",
            body: formData
        });

        if (res.ok) {
            alert("Email sikeresen elküldve!");
            setEmailItem(null);
            setTargetEmail("");
        } else {
            const err = await res.json();
            alert("Hiba: " + err.error);
        }
    } catch (error) {
        console.error(error);
        alert("Szerver hiba az email küldésnél.");
    } finally {
        setSending(false);
    }
  };

  // --- FORDÍTÓ ---
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

  // --- PDF GENERÁTOR (Dual Mode: Download or Blob) ---
  const generatePDF = (data: any, returnBlob = false) => {
    const doc = new jsPDF();

    // Design
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 45, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("TŰZVÉDELMI ADATLAP", 14, 25);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(203, 213, 225);
    doc.text(`Generálva: ${new Date().toLocaleString("hu-HU")}`, 14, 35);
    doc.text(`Azonosító: #${data._id.slice(-6).toUpperCase()}`, 14, 40);

    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255);
    doc.text("Tűzvédelmi Dokumentáció", 196, 25, { align: "right" });

    const join = (arr: any[]) => arr ? arr.filter(Boolean).join(", ") : "-";

    const tableBody = [
        [{ content: '1. Cég- és telephelyadatok', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Cég neve', data.companyName],
        ['Székhely', data.headquarters],
        ['Telephely címe', data.siteAddress],

        [{ content: '2. Tevékenység', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Fő tevékenység', data.mainActivity],
        ['Speciális technológia', data.specialTech === 'yes' ? (data.specialTechDesc || 'Van') : 'Nincs'],
        ['Jelleg', join([data.type_shop, data.type_office, data.type_warehouse, data.type_workshop, data.type_social, data.type_other])],

        [{ content: '3. Épület alapadatai', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Típus', tr(data.buildingType)],
        ['Emelet', data.floorNumber || '-'],
        ['Megközelítés', tr(data.access)],
        ['Terület', `${data.areaSize || '0'} m²`],

        [{ content: '4. Szerkezetek', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Falak', tr(data.walls)],
        ['Födém', tr(data.ceiling)],
        ['Tető jelleg', tr(data.roofType)],
        ['Tető fedés', tr(data.roofCover)],
        ['Szigetelés', tr(data.insulation)],

        [{ content: '5. Létszám, menekülés', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Dolgozók', `${data.employees || '0'} fő`],
        ['Ügyfelek (Max)', `${data.clientsMax || '0'} fő`],
        ['Segítségre szorul', data.disabled === 'yes' ? (data.disabledDesc || 'Van') : 'Nincs'],
        ['Kijáratok', `${data.exits} db`],
        ['Ajtó szélesség', `${data.doorWidth} cm`],
        ['Menekülési út', data.distM ? `${data.distM} méter` : `${data.distStep} lépés`],

        [{ content: '7-8. Anyagok és Eszközök', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Anyagok', join([data.mat_paper, data.mat_clean, data.mat_paint, data.mat_fuel, data.mat_gas, data.mat_aero, data.mat_other])],
        ['Raktár', data.storageRoom === 'yes' ? `Van (${data.storageSize} m²)` : 'Nincs'],
        ['Oltókészülék', `${data.extCount || '0'} db (${data.extType})`],
        ['Helye', data.extLocation || '-'],
        ['Matrica', tr(data.valid)],

        [{ content: '9-11. Rendszerek és Gépészet', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Rendszerek', join([data.sys_alarm, data.sys_sprinkler, data.sys_manual, data.sys_none])],
        ['Vill. főkapcsoló', data.mainSwitch || '-'],
        ['Gáz', data.gasValve === 'yes' ? (data.gasLocation || 'Van') : 'Nincs'],
        ['Villámvédelem', tr(data.lightning)],
        ['Jegyzőkönyvek', `ÉV: ${tr(data.shockProt)} | VV: ${tr(data.lightningDoc)}`],

        [{ content: '12. Hulladék', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        ['Tárolás', tr(data.waste)],
        ['Útvonalon?', tr(data.wasteRoute)],

        [{ content: 'Egyéb', colSpan: 2, styles: { fillColor: [241, 245, 249], fontStyle: 'bold', textColor: [30, 41, 59] } }],
        [{ content: data.notes || "Nincs megjegyzés.", colSpan: 2, styles: { fontStyle: 'italic' } }],
    ];

    autoTable(doc, {
        startY: 55,
        head: [['Megnevezés', 'Adat / Érték']],
        body: tableBody,
        theme: 'grid',
        styles: { font: "helvetica", fontSize: 10, cellPadding: 4, lineColor: [200, 200, 200] },
        headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: 'bold' },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold', textColor: [70, 70, 70] } },
        alternateRowStyles: { fillColor: [252, 252, 252] },
    });

    if (returnBlob) {
        return doc.output("blob");
    } else {
        const cleanName = (data.companyName || 'adatlap').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        doc.save(`Tuzvedelem_${cleanName}.pdf`);
    }
  };

  // --- LOGIN UI ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Admin Belépés (Cloud)</h1>
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
            <h1 className="text-xl font-bold text-slate-800">Admin Dashboard</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
      </nav>

      <main className="max-w-6xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Beérkezett Adatlapok</h2>
            <button onClick={fetchSubmissions} className="text-indigo-600 text-sm hover:underline">🔄 Frissítés</button>
        </div>
        
        {loading && <p className="text-center py-10">Betöltés...</p>}

        <div className="grid gap-4">
            {!loading && submissions.slice().reverse().map((sub, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                        <p className="text-slate-500 text-sm mt-1">{sub.siteAddress} • {new Date(sub.createdAt).toLocaleString("hu-HU")}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                        {/* EMAIL GOMB */}
                        <button onClick={() => setEmailItem(sub)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-2 border border-emerald-200">
                             ✉️ Küldés
                        </button>

                        <button onClick={() => setPreviewItem(sub)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-2 border border-blue-200">
                             👁️
                        </button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-100 border border-yellow-200">
                             ✏️
                        </button>
                        <button onClick={() => generatePDF(sub)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md">
                             📄 PDF
                        </button>
                        <button onClick={() => deleteSubmission(sub._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200">
                             🗑️
                        </button>
                    </div>
                </div>
            ))}
            {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10">Még nincs adat az adatbázisban.</p>}
        </div>
      </main>

      {/* --- EMAIL KÜLDÉS MODAL --- */}
      {emailItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
               <h2 className="text-xl font-bold text-slate-800 mb-2">PDF Küldése Emailben</h2>
               <p className="text-sm text-slate-500 mb-6">A rendszer automatikusan generálja és csatolja a PDF-et a(z) <strong>{emailItem.companyName}</strong> részére.</p>
               
               <form onSubmit={handleSendEmail} className="space-y-4">
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Címzett Email Címe</label>
                       <input 
                         type="email" 
                         required
                         placeholder="ugyfel@pelda.hu" 
                         value={targetEmail}
                         onChange={(e) => setTargetEmail(e.target.value)}
                         className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
                       />
                   </div>
                   
                   <div className="flex justify-end gap-3 pt-4">
                       <button type="button" onClick={() => setEmailItem(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Mégse</button>
                       <button 
                         type="submit" 
                         disabled={sending}
                         className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-70 flex items-center gap-2"
                       >
                           {sending ? "Küldés..." : "🚀 Küldés Most"}
                       </button>
                   </div>
               </form>
           </div>
        </div>
      )}

      {/* --- PREVIEW MODAL --- */}
      {previewItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setPreviewItem(null)}>
           <div className="bg-white w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="p-8 space-y-4">
                   <h2 className="text-2xl font-bold text-slate-800 mb-4 border-b pb-2">Előnézet</h2>
                   <div className="grid grid-cols-2 gap-4 text-sm">
                       <div><strong>Cég:</strong> {previewItem.companyName}</div>
                       <div><strong>Cím:</strong> {previewItem.siteAddress}</div>
                       <div><strong>Tevékenység:</strong> {previewItem.mainActivity}</div>
                       <div><strong>Létszám:</strong> {previewItem.employees} fő</div>
                       <div><strong>Rögzítve:</strong> {new Date(previewItem.createdAt).toLocaleString()}</div>
                       <div className="col-span-2 mt-4 p-3 bg-yellow-50 text-yellow-700 rounded border border-yellow-200">
                           💡 Ez csak egy gyors nézet. A teljes adatlapot a <strong>PDF gombbal</strong> töltheted le formázva.
                       </div>
                   </div>
                   <div className="flex justify-end pt-4">
                       <button onClick={() => setPreviewItem(null)} className="px-4 py-2 bg-slate-200 rounded hover:bg-slate-300 font-bold">Bezárás</button>
                   </div>
               </div>
           </div>
        </div>
      )}

      {/* --- EDIT MODAL (TELJES, MINDEN MEZŐVEL) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl flex flex-col">
              <div className="sticky top-0 bg-white border-b border-slate-100 p-5 z-10">
                 <h2 className="text-xl font-bold text-slate-800">Szerkesztés (Cloud DB)</h2>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto">
                 
                 {/* 1. Cégadatok */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                    <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                    <EditGroup label="Telephely címe" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                 </div>

                 {/* 2. Tevékenység */}
                 <div className="bg-slate-50 p-4 rounded-xl space-y-4">
                    <h3 className="font-bold text-slate-500 uppercase text-xs">Tevékenység</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <EditGroup label="Fő tevékenység" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                        <div className="flex gap-4">
                            <EditGroup label="Spec. Tech (yes/no)" name="specialTech" val={editItem.specialTech} onChange={handleEditChange} />
                            <EditGroup label="Ha van, mi?" name="specialTechDesc" val={editItem.specialTechDesc} onChange={handleEditChange} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
                        {/* Checkboxok szerkesztése egyszerűsítve inputként */}
                        <EditGroup label="Üzlet" name="type_shop" val={editItem.type_shop} onChange={handleEditChange} />
                        <EditGroup label="Iroda" name="type_office" val={editItem.type_office} onChange={handleEditChange} />
                        <EditGroup label="Raktár" name="type_warehouse" val={editItem.type_warehouse} onChange={handleEditChange} />
                        <EditGroup label="Műhely" name="type_workshop" val={editItem.type_workshop} onChange={handleEditChange} />
                        <EditGroup label="Szociális" name="type_social" val={editItem.type_social} onChange={handleEditChange} />
                        <EditGroup label="Egyéb" name="type_other" val={editItem.type_other} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 3. Épület */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditGroup label="Épület típus (kód)" name="buildingType" val={editItem.buildingType} onChange={handleEditChange} />
                    <EditGroup label="Emelet száma" name="floorNumber" val={editItem.floorNumber} onChange={handleEditChange} />
                    <EditGroup label="Megközelítés (kód)" name="access" val={editItem.access} onChange={handleEditChange} />
                    <EditGroup label="Terület (m2)" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} />
                 </div>

                 {/* 4. Szerkezet */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <EditGroup label="Falazat (kód)" name="walls" val={editItem.walls} onChange={handleEditChange} />
                    <EditGroup label="Födém (kód)" name="ceiling" val={editItem.ceiling} onChange={handleEditChange} />
                    <EditGroup label="Tető jelleg" name="roofType" val={editItem.roofType} onChange={handleEditChange} />
                    <EditGroup label="Tető fedés" name="roofCover" val={editItem.roofCover} onChange={handleEditChange} />
                    <EditGroup label="Szigetelés" name="insulation" val={editItem.insulation} onChange={handleEditChange} />
                 </div>

                 {/* 5. Létszám */}
                 <div className="border-t pt-6 grid grid-cols-2 md:grid-cols-5 gap-6">
                    <EditGroup label="Dolgozók" name="employees" val={editItem.employees} onChange={handleEditChange} />
                    <EditGroup label="Ügyfél Átlag" name="clientsAvg" val={editItem.clientsAvg} onChange={handleEditChange} />
                    <EditGroup label="Ügyfél Max" name="clientsMax" val={editItem.clientsMax} onChange={handleEditChange} />
                    <EditGroup label="Segítség? (yes/no)" name="disabled" val={editItem.disabled} onChange={handleEditChange} />
                    <EditGroup label="Kik?" name="disabledDesc" val={editItem.disabledDesc} onChange={handleEditChange} />
                 </div>

                 {/* 6. Menekülés */}
                 <div className="grid grid-cols-2 md:grid-cols-6 gap-6">
                    <EditGroup label="Kijáratok (db)" name="exits" val={editItem.exits} onChange={handleEditChange} />
                    <EditGroup label="Ajtó (cm)" name="doorWidth" val={editItem.doorWidth} onChange={handleEditChange} />
                    <EditGroup label="Alt. kijárat?" name="altExit" val={editItem.altExit} onChange={handleEditChange} />
                    <EditGroup label="Alt. szélesség" name="altExitWidth" val={editItem.altExitWidth} onChange={handleEditChange} />
                    <EditGroup label="Távolság (m)" name="distM" val={editItem.distM} onChange={handleEditChange} />
                    <EditGroup label="Lépés" name="distStep" val={editItem.distStep} onChange={handleEditChange} />
                 </div>

                 {/* 7. Anyagok */}
                 <div className="bg-slate-50 p-4 rounded-xl">
                    <h3 className="font-bold text-slate-500 uppercase text-xs mb-3">Veszélyes Anyagok</h3>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        <EditGroup label="Papír" name="mat_paper" val={editItem.mat_paper} onChange={handleEditChange} />
                        <EditGroup label="Tisztító" name="mat_clean" val={editItem.mat_clean} onChange={handleEditChange} />
                        <EditGroup label="Festék" name="mat_paint" val={editItem.mat_paint} onChange={handleEditChange} />
                        <EditGroup label="Üzemanyag" name="mat_fuel" val={editItem.mat_fuel} onChange={handleEditChange} />
                        <EditGroup label="Gáz" name="mat_gas" val={editItem.mat_gas} onChange={handleEditChange} />
                        <EditGroup label="Aeroszol" name="mat_aero" val={editItem.mat_aero} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-4">
                        <EditGroup label="Raktár? (yes/no)" name="storageRoom" val={editItem.storageRoom} onChange={handleEditChange} />
                        <EditGroup label="Raktár méret (m2)" name="storageSize" val={editItem.storageSize} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 8. Eszközök */}
                 <div className="bg-indigo-50 p-4 rounded-xl grid grid-cols-2 md:grid-cols-4 gap-6">
                    <EditGroup label="Oltó db" name="extCount" val={editItem.extCount} onChange={handleEditChange} />
                    <EditGroup label="Típus" name="extType" val={editItem.extType} onChange={handleEditChange} />
                    <EditGroup label="Hely" name="extLocation" val={editItem.extLocation} onChange={handleEditChange} />
                    <EditGroup label="Matrica ok?" name="valid" val={editItem.valid} onChange={handleEditChange} />
                 </div>

                 {/* 9. Rendszerek */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <EditGroup label="Tűzjelző" name="sys_alarm" val={editItem.sys_alarm} onChange={handleEditChange} />
                    <EditGroup label="Sprinkler" name="sys_sprinkler" val={editItem.sys_sprinkler} onChange={handleEditChange} />
                    <EditGroup label="Kézi jelzés" name="sys_manual" val={editItem.sys_manual} onChange={handleEditChange} />
                    <EditGroup label="Nincs semmi" name="sys_none" val={editItem.sys_none} onChange={handleEditChange} />
                    <EditGroup label="Helyszín leírás" name="systemLocation" val={editItem.systemLocation} onChange={handleEditChange} />
                 </div>

                 {/* 10. Gépészet */}
                 <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
                    <EditGroup label="Főkapcsoló" name="mainSwitch" val={editItem.mainSwitch} onChange={handleEditChange} />
                    <EditGroup label="Gáz van?" name="gasValve" val={editItem.gasValve} onChange={handleEditChange} />
                    <EditGroup label="Gáz elzáró helye" name="gasLocation" val={editItem.gasLocation} onChange={handleEditChange} />
                    <EditGroup label="Kazán?" name="boiler" val={editItem.boiler} onChange={handleEditChange} />
                    <EditGroup label="Kazán leírás" name="boilerDesc" val={editItem.boilerDesc} onChange={handleEditChange} />
                 </div>

                 {/* 11. Villámvédelem */}
                 <div className="border-t pt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Külső villámvédelem?" name="lightning" val={editItem.lightning} onChange={handleEditChange} />
                    <EditGroup label="Érintésvédelmi JKV" name="shockProt" val={editItem.shockProt} onChange={handleEditChange} />
                    <EditGroup label="Villámvédelmi JKV" name="lightningDoc" val={editItem.lightningDoc} onChange={handleEditChange} />
                 </div>

                 {/* 12. Hulladék */}
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <EditGroup label="Hulladék helye" name="waste" val={editItem.waste} onChange={handleEditChange} />
                    <EditGroup label="Hulladék leírás" name="wasteDesc" val={editItem.wasteDesc} onChange={handleEditChange} />
                    <EditGroup label="Útvonalon tárol?" name="wasteRoute" val={editItem.wasteRoute} onChange={handleEditChange} />
                 </div>

                 {/* 13. Egyéb */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés (13. pont)</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700"></textarea>
                 </div>

              </div>
              
              <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50 sticky bottom-0 z-10">
                 <button onClick={() => setEditItem(null)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Mégse</button>
                 <button onClick={saveEdit} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-green-700">Mentés (Adatbázisba)</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}

// UI Segéd
function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase truncate" title={label}>{label}</label>
            <input type="text" name={name} value={val || ""} onChange={onChange} className="w-full border border-gray-300 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 font-medium" />
        </div>
    );
}