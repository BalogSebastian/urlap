"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- SEGÉDFÜGGVÉNY: Buffer konvertálása Base64-re ---
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- MODAL ÁLLAPOTOK ---
  const [editItem, setEditItem] = useState<any>(null);
  const [emailItem, setEmailItem] = useState<any>(null);
  
  // EMAIL OPCIÓK ÁLLAPOTAI
  const [targetEmail, setTargetEmail] = useState("sebimbalog@gmail.com");
  const [selectedOrders, setSelectedOrders] = useState<string[]>(["Kockázatértékelés"]); 
  const [senderName, setSenderName] = useState("Jani");
  
  const [sending, setSending] = useState(false);

  // --- ADATOK BETÖLTÉSE (CSAK TŰZVÉDELEM) ---
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (res.ok) {
          const fireData = data.filter((item: any) => item.formType !== 'vbs');
          setSubmissions(fireData);
      }
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

  // --- MŰVELETEK (JAVÍTVA) ---
  const deleteSubmission = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné véglegesen az adatbázisból?")) return;
    try {
        const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
        const result = await res.json();
        if (res.ok) {
            setSubmissions(prev => prev.filter(s => s._id !== id));
            alert("Sikeresen törölve.");
        } else {
            alert("Hiba a törlésnél: " + (result.error || "Ismeretlen hiba"));
        }
    } catch (error) {
        alert("Szerver hiba.");
    }
  };

  const saveEdit = async () => {
    if (!editItem) return;
    try {
        const res = await fetch(`/api/submissions/${editItem._id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(editItem)
        });
        const result = await res.json();
        if (res.ok && result.success) {
            setSubmissions(prev => prev.map(s => s._id === editItem._id ? result.data : s));
            setEditItem(null);
            alert("Sikeres mentés az adatbázisba!");
        } else {
            alert("Mentés sikertelen: " + (result.error || "Hiba történt"));
        }
    } catch (error) {
        alert("Hiba történt a hálózati kommunikáció során.");
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
        const pdfBlob = await generatePDF(emailItem, true);
        if (!pdfBlob) {
             setSending(false);
             return;
        }

        const formData = new FormData();
        formData.append("file", pdfBlob as Blob, `Adatlap_${emailItem.companyName}.pdf`);
        formData.append("email", targetEmail);
        formData.append("companyName", emailItem.companyName || "-");
        formData.append("headquarters", emailItem.headquarters || "-");
        formData.append("siteAddress", emailItem.siteAddress || "-");
        formData.append("managerName", emailItem.managerName || "-");
        
        const orderString = selectedOrders.length > 0 ? selectedOrders.join(", ") : "-";
        formData.append("orderType", orderString);
        formData.append("senderName", senderName);

        const res = await fetch("/api/send-email", { method: "POST", body: formData });

        if (res.ok) {
            alert(`Email sikeresen elküldve a(z) ${targetEmail} címre!\nFeladó: ${senderName}`);
            setEmailItem(null);
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

  const toggleOrder = (option: string) => {
      if (selectedOrders.includes(option)) {
          setSelectedOrders(prev => prev.filter(item => item !== option));
      } else {
          setSelectedOrders(prev => [...prev, option]);
      }
  };

  const tr = (val: string) => {
    const map: any = {
        'yes': 'Igen', 'no': 'Nem', 'dk': 'Nem tudom', 'unknown': 'Nem tudom',
        'brick': 'Tégla falazat', 'concrete': 'Panel / Vasbeton', 'steel': 'Fém / Acélváz', 'light': 'Könnyűszerkezetes',
        'plastered': 'Vakolt mennyezet', 'wood': 'Fagerendás', 'metal': 'Trapézlemez / Acél', 
        'flat': 'Lapos tető (bitumen)', 'pitched': 'Magastető', 
        'tile': 'Cserép', 'sheet': 'Lemez', 'shingle': 'Zsindely', 'panel': 'Szendvicspanel',
        'standalone': 'Önálló földszintes', 'multi_ground': 'Többszintes ép. földszintjén', 
        'multi_floor': 'Többszintes ép. emeletén', 'industrial': 'Ipari / Csarnok', 'residential': 'Társasház / Pince',
        'street': 'Utcáról közvetlenül', 'staircase': 'Lépcsőházból', 'yard': 'Udvarról',
        'inside': 'Épületen belül', 'room': 'Külön helyiségben', 'outside': 'Udvaron / Kukatárolóban',
        'pb': 'PB Gázpalack',
    };
    return map[val] || val || "-";
  };

  const generatePDF = async (data: any, returnBlob = false) => {
    const doc = new jsPDF();
    const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
    let fontLoaded = false;

    try {
        const response = await fetch(fontUrl);
        if (!response.ok) throw new Error("Hálózati hiba a font letöltésekor");
        const fontBuffer = await response.arrayBuffer();
        const base64Font = arrayBufferToBase64(fontBuffer);
        doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
        doc.setFont("Roboto", "normal"); 
        fontLoaded = true;
    } catch (e) {
        console.error("FONT HIBA:", e);
    }

    const primaryColor = [20, 50, 120] as [number, number, number];
    if (fontLoaded) doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Trident Shield Group Kft.", 20, 20);
    
    if (fontLoaded) doc.setFont("Roboto", "normal");
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text("Tűz- és Munkavédelmi Adatlap", 20, 28);
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 190, 33);

    const join = (arr: any[]) => arr ? arr.filter(Boolean).join(", ") : "-";
    const activityTypes = join([data.type_shop, data.type_office, data.type_warehouse, data.type_workshop, data.type_social, data.type_education, data.type_other]);
    const rooms = join([data.room_office, data.room_guest, data.room_kitchen, data.room_warehouse, data.room_social, data.room_workshop]);
    const wastes = join([data.waste_communal, data.waste_select, data.waste_hazard, data.waste_industrial]);
    const signs = join([data.sign_firstaid, data.sign_extinguisher, data.sign_gas, data.sign_emergency, data.sign_no_smoking, data.sign_escape, data.sign_shelf, data.sign_camera]);

    const sectionStyle = {
        fillColor: [245, 247, 250] as [number, number, number],
        textColor: primaryColor,
        fontStyle: 'bold' as 'bold',
        fontSize: 11,
        cellPadding: { top: 6, bottom: 6, left: 2 } 
    };

    const tableBody = [
        [{ content: '1. Cégadatok és Kapcsolattartás', colSpan: 2, styles: sectionStyle }],
        ['Cég neve', data.companyName || '-'],
        ['Székhely', data.headquarters || '-'],
        ['Telephely', data.siteAddress || '-'],
        ['Adószám', data.taxNumber || '-'],
        ['Ügyvezető neve', data.managerName || '-'],
        ['Ügyvezető tel.', data.managerPhone || '-'],
        ['Ügyvezető email', data.managerEmail || '-'],
        [{ content: '2. Tevékenység', colSpan: 2, styles: sectionStyle }],
        ['Fő tevékenység', data.mainActivity || '-'],
        ['Napi leírás', data.dailyActivity || '-'],
        ['Működés jellege', activityTypes],
        ['Eszközök', data.toolsUsed || '-'],
        ['Spec. technológia', data.specialTech === 'yes' ? (data.specialTechDesc || 'Van') : 'Nincs'],
        ['Alvállalkozók', `${data.subcontractors || '0'} fő`],
        [{ content: '3. Munkakörülmények', colSpan: 2, styles: sectionStyle }],
        ['Képernyős munka', tr(data.screenWork)],
        ['Home Office', tr(data.homeOffice)],
        ['Magasban végzett', tr(data.highWork)],
        [{ content: '4. Épület és Helyiségek', colSpan: 2, styles: sectionStyle }],
        ['Típus', tr(data.buildingType)],
        ['Emelet / Szintek', data.floorNumber || '-'],
        ['Terület', `${data.areaSize || '0'} m²`],
        ['Helyiségek', rooms || '-'],
        ['WC / Mosdó', tr(data.restroom)],
        ['Kézmosó/Fertőtlenítő', tr(data.handSanitizer)],
        ['Klíma / Fan-coil', tr(data.ac)],
        [{ content: '5. Szerkezetek', colSpan: 2, styles: sectionStyle }],
        ['Falazat', tr(data.walls)],
        ['Födém', tr(data.ceiling)],
        ['Tető típusa', tr(data.roofType)],
        ['Tető fedése', tr(data.roofCover)],
        ['Szigetelés (Dryvit)', tr(data.insulation)],
        [{ content: '6. Létszám és Menekülés', colSpan: 2, styles: sectionStyle }],
        ['Dolgozók', `${data.employees || '0'} fő`],
        ['Ügyfelek (max)', `${data.clientsMax || '0'} fő`],
        ['Kijáratok', `${data.exits || '0'} db`],
        ['Főajtó', `${data.doorWidth || '0'} cm`],
        ['Menekülési út', data.distM ? `${data.distM} méter` : `${data.distStep || '0'} lépés`],
        ['Segítségre szoruló', data.disabled === 'yes' ? (data.disabledDesc || 'Van') : 'Nincs'],
        [{ content: '7. Biztonsági felszerelések', colSpan: 2, styles: sectionStyle }],
        ['Elsősegély doboz', tr(data.firstAid)],
        ['Tűzoltó készülék', `${data.extCount || '0'} db`],
        ['Kifüggesztett táblák', signs || '-'],
        ['Vegyszerek', data.chemicals || 'Nincs megadva'],
        [{ content: '8. Rendszerek és Gépészet', colSpan: 2, styles: sectionStyle }],
        ['Rendszerek', join([data.sys_alarm, data.sys_sprinkler, data.sys_smoke, data.sys_manual])],
        ['Vill. főkapcsoló', data.mainSwitch || '-'],
        ['Gázellátás', tr(data.gasValve) + (data.gasLocation ? ` (${data.gasLocation})` : '')],
        ['Kazán', data.boiler === 'yes' ? (data.boilerDesc || 'Van') : 'Nincs'],
        [{ content: '9. Hulladék és Raktározás', colSpan: 2, styles: sectionStyle }],
        ['Hulladék típusok', wastes || 'Nincs megadva'],
        ['Polc teherbírás', data.shelfLoad ? `${data.shelfLoad} kg` : '-'],
        ['Polc jelölés hiány', data.shelfLabelMissing ? 'Jelölés hiányzik!' : 'Rendben'],
        ['Raktár helyiség', data.storageRoom === 'yes' ? `Van (${data.storageSize} m²)` : 'Nincs'],
        [{ content: 'Egyéb megjegyzés', colSpan: 2, styles: sectionStyle }],
        [{ content: data.notes || "Nincs.", colSpan: 2, styles: { fontStyle: 'italic', textColor: 80 } }],
    ];

    autoTable(doc, {
        startY: 40,
        body: tableBody,
        theme: 'grid',
        pageBreak: 'auto',
        margin: { top: 25, bottom: 30, left: 20, right: 14 }, 
        styles: { font: fontLoaded ? "Roboto" : undefined, fontSize: 10, cellPadding: 4 },
        columnStyles: { 0: { cellWidth: 70, fontStyle: 'bold' } },
        didDrawPage: (d) => {
            const h = doc.internal.pageSize.height;
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 8, h, "F");
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Trident Shield Group Kft. | ${d.pageNumber}. oldal`, 20, h - 10);
        }
    });

    if (returnBlob) return doc.output("blob");
    doc.save(`Trident_${data.companyName || 'adatlap'}.pdf`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Trident Admin Belépés</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
            <input type="password" placeholder="admin" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
            <button className="w-full bg-indigo-600 text-white p-3 rounded-lg font-bold">Belépés</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-indigo-900 text-white p-2 rounded-lg font-bold text-lg">TSG</div>
            <h1 className="text-xl font-bold text-slate-800">Trident Admin Dashboard</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Beérkezett Adatlapok</h2>
            <button onClick={fetchSubmissions} className="text-indigo-600 text-sm hover:underline">🔄 Frissítés</button>
        </div>
        
        {loading && <p className="text-center py-10">Betöltés...</p>}

        <div className="grid gap-4">
            {!loading && submissions.slice().reverse().map((sub, i) => (
                <div key={sub._id || i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                            {sub.notes && <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full">Megjegyzés</span>}
                        </div>
                        <p className="text-slate-500 text-sm mt-1">{sub.siteAddress} • Beküldve: {new Date(sub.createdAt).toLocaleString("hu-HU")}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => {setEmailItem(sub); setTargetEmail("sebimbalog@gmail.com"); setSelectedOrders(["Kockázatértékelés"]); setSenderName("Jani");}} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-2 border border-emerald-200">✉️ Email</button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-100 border border-yellow-200">✏️ Szerkesztés</button>
                        <button onClick={() => generatePDF(sub)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 shadow-md">📄 PDF</button>
                        <button onClick={() => deleteSubmission(sub._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200">🗑️</button>
                    </div>
                </div>
            ))}
        </div>
      </main>

      {/* --- EMAIL MODAL --- */}
      {emailItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
               <div className="flex justify-between items-start mb-4">
                   <h2 className="text-xl font-bold">Email küldése</h2>
                   <button onClick={() => setEmailItem(null)} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
               </div>
               <form onSubmit={handleSendEmail} className="space-y-4">
                   <label className="block text-sm font-bold">Címzett</label>
                   <select value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50">
                       <option value="sebimbalog@gmail.com">sebimbalog@gmail.com</option>
                       <option value="nemeth.janos21@gmail.com">nemeth.janos21@gmail.com</option>
                   </select>
                   <label className="block text-sm font-bold">Megrendelés típusa</label>
                   <div className="bg-slate-50 border p-3 rounded-lg space-y-2 max-h-40 overflow-y-auto">
                       {["Kockázatértékelés", "Komplex Tűzvédelem", "Komplex Munkavédelem", "Tűzvédelmi Szabályzat", "Munkavédelmi Szabályzat"].map((option) => (
                           <label key={option} className="flex items-center gap-2">
                               <input type="checkbox" checked={selectedOrders.includes(option)} onChange={() => toggleOrder(option)} className="w-4 h-4" />
                               <span className="text-sm">{option}</span>
                           </label>
                       ))}
                   </div>
                   <label className="block text-sm font-bold">Ki küldi?</label>
                   <select value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full border p-3 rounded-lg bg-slate-50">
                       <option value="Jani">Jani</option>
                       <option value="Márk">Márk</option>
                   </select>
                   <div className="flex justify-end gap-3 pt-4 border-t">
                       <button type="button" onClick={() => setEmailItem(null)} className="px-4 py-2 bg-slate-100 rounded-lg">Mégse</button>
                       <button type="submit" disabled={sending} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold">{sending ? "Küldés..." : "🚀 Mehet"}</button>
                   </div>
               </form>
           </div>
        </div>
      )}

      {/* --- EDIT MODAL (100% COMPLETE) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
              <div className="bg-white border-b p-5 flex justify-between items-center sticky top-0 z-10">
                 <h2 className="text-xl font-bold text-slate-800">Adatlap Szerkesztése</h2>
                 <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-slate-50/50">
                 {/* 1. Cégadatok */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">1. Cég és Vezetés</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                        <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                        <EditGroup label="Telephely" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                        <EditGroup label="Adószám" name="taxNumber" val={editItem.taxNumber} onChange={handleEditChange} />
                        <EditGroup label="Ügyvezető neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} />
                        <EditGroup label="Ügyvezető tel" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} />
                        <EditGroup label="Ügyvezető email" name="managerEmail" val={editItem.managerEmail} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 2. Tevékenység */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">2. Tevékenység</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <EditGroup label="Fő tevékenység" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                        <EditGroup label="Napi leírás" name="dailyActivity" val={editItem.dailyActivity} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                        <EditGroup label="Üzlet?" name="type_shop" val={editItem.type_shop} onChange={handleEditChange} />
                        <EditGroup label="Iroda?" name="type_office" val={editItem.type_office} onChange={handleEditChange} />
                        <EditGroup label="Raktár?" name="type_warehouse" val={editItem.type_warehouse} onChange={handleEditChange} />
                        <EditGroup label="Műhely?" name="type_workshop" val={editItem.type_workshop} onChange={handleEditChange} />
                        <EditGroup label="Szociális?" name="type_social" val={editItem.type_social} onChange={handleEditChange} />
                        <EditGroup label="Oktatás?" name="type_education" val={editItem.type_education} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <EditGroup label="Eszközök" name="toolsUsed" val={editItem.toolsUsed} onChange={handleEditChange} />
                        <EditGroup label="Spec Tech (yes/no)" name="specialTech" val={editItem.specialTech} onChange={handleEditChange} />
                        <EditGroup label="Spec Tech Leírás" name="specialTechDesc" val={editItem.specialTechDesc} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 3. Munkakörülmények */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">3. Munkakörülmények</h3>
                    <div className="grid grid-cols-3 gap-4">
                         <EditGroup label="Képernyő (yes/no)" name="screenWork" val={editItem.screenWork} onChange={handleEditChange} />
                         <EditGroup label="Home Office (yes/no)" name="homeOffice" val={editItem.homeOffice} onChange={handleEditChange} />
                         <EditGroup label="Magasban (yes/no)" name="highWork" val={editItem.highWork} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 4. Épület */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">4. Épület és Higiénia</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <EditGroup label="Típus" name="buildingType" val={editItem.buildingType} onChange={handleEditChange} />
                        <EditGroup label="Emelet" name="floorNumber" val={editItem.floorNumber} onChange={handleEditChange} />
                        <EditGroup label="Terület" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} />
                        <EditGroup label="Megközelítés" name="access" val={editItem.access} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
                        <EditGroup label="Hely: Iroda" name="room_office" val={editItem.room_office} onChange={handleEditChange} />
                        <EditGroup label="Hely: Vendég" name="room_guest" val={editItem.room_guest} onChange={handleEditChange} />
                        <EditGroup label="Hely: Konyha" name="room_kitchen" val={editItem.room_kitchen} onChange={handleEditChange} />
                        <EditGroup label="Hely: Raktár" name="room_warehouse" val={editItem.room_warehouse} onChange={handleEditChange} />
                        <EditGroup label="Hely: Szoc." name="room_social" val={editItem.room_social} onChange={handleEditChange} />
                        <EditGroup label="Hely: Műhely" name="room_workshop" val={editItem.room_workshop} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <EditGroup label="WC (yes/no)" name="restroom" val={editItem.restroom} onChange={handleEditChange} />
                         <EditGroup label="Kézmosó (yes/no)" name="handSanitizer" val={editItem.handSanitizer} onChange={handleEditChange} />
                         <EditGroup label="Klíma (yes/no)" name="ac" val={editItem.ac} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 5. Szerkezet */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">5. Szerkezetek</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <EditGroup label="Falazat" name="walls" val={editItem.walls} onChange={handleEditChange} />
                        <EditGroup label="Födém" name="ceiling" val={editItem.ceiling} onChange={handleEditChange} />
                        <EditGroup label="Tető típus" name="roofType" val={editItem.roofType} onChange={handleEditChange} />
                        <EditGroup label="Tető fedés" name="roofCover" val={editItem.roofCover} onChange={handleEditChange} />
                        <EditGroup label="Szigetelés" name="insulation" val={editItem.insulation} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 6. Menekülés */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">6. Létszám és Menekülés</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <EditGroup label="Dolgozók" name="employees" val={editItem.employees} onChange={handleEditChange} />
                        <EditGroup label="Ügyfél Max" name="clientsMax" val={editItem.clientsMax} onChange={handleEditChange} />
                        <EditGroup label="Kijáratok" name="exits" val={editItem.exits} onChange={handleEditChange} />
                        <EditGroup label="Ajtó (cm)" name="doorWidth" val={editItem.doorWidth} onChange={handleEditChange} />
                        <EditGroup label="Távolság (m)" name="distM" val={editItem.distM} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 7. Biztonság */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">7. Biztonság és Táblák</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <EditGroup label="Elsősegély (yes/no)" name="firstAid" val={editItem.firstAid} onChange={handleEditChange} />
                        <EditGroup label="Oltó db" name="extCount" val={editItem.extCount} onChange={handleEditChange} />
                        <EditGroup label="Vegyszerek" name="chemicals" val={editItem.chemicals} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                         <EditGroup label="Elsősegély tábla" name="sign_firstaid" val={editItem.sign_firstaid} onChange={handleEditChange} />
                         <EditGroup label="Oltó tábla" name="sign_extinguisher" val={editItem.sign_extinguisher} onChange={handleEditChange} />
                         <EditGroup label="Menekülés" name="sign_escape" val={editItem.sign_escape} onChange={handleEditChange} />
                         <EditGroup label="Gáz elzáró" name="sign_gas" val={editItem.sign_gas} onChange={handleEditChange} />
                         <EditGroup label="Dohányozni Tilos" name="sign_no_smoking" val={editItem.sign_no_smoking} onChange={handleEditChange} />
                         <EditGroup label="Kamera" name="sign_camera" val={editItem.sign_camera} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 8. Rendszerek */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">8. Rendszerek és Gépészet</h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                        <EditGroup label="Tűzjelző" name="sys_alarm" val={editItem.sys_alarm} onChange={handleEditChange} />
                        <EditGroup label="Füstérzékelő" name="sys_smoke" val={editItem.sys_smoke} onChange={handleEditChange} />
                        <EditGroup label="Sprinkler" name="sys_sprinkler" val={editItem.sys_sprinkler} onChange={handleEditChange} />
                        <EditGroup label="Kézi jelzés" name="sys_manual" val={editItem.sys_manual} onChange={handleEditChange} />
                        <EditGroup label="Nincs" name="sys_none" val={editItem.sys_none} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <EditGroup label="Főkapcsoló" name="mainSwitch" val={editItem.mainSwitch} onChange={handleEditChange} />
                        <EditGroup label="Gáz (no/yes/pb)" name="gasValve" val={editItem.gasValve} onChange={handleEditChange} />
                        <EditGroup label="Gáz helye" name="gasLocation" val={editItem.gasLocation} onChange={handleEditChange} />
                        <EditGroup label="Kazán (yes/no)" name="boiler" val={editItem.boiler} onChange={handleEditChange} />
                        <EditGroup label="Kazán Leírás" name="boilerDesc" val={editItem.boilerDesc} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 9. Hulladék */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-indigo-900 uppercase mb-4 border-b pb-2 tracking-wide">9. Hulladék és Raktár</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                         <EditGroup label="Kommunális" name="waste_communal" val={editItem.waste_communal} onChange={handleEditChange} />
                         <EditGroup label="Szelektív" name="waste_select" val={editItem.waste_select} onChange={handleEditChange} />
                         <EditGroup label="Veszélyes" name="waste_hazard" val={editItem.waste_hazard} onChange={handleEditChange} />
                         <EditGroup label="Ipari" name="waste_industrial" val={editItem.waste_industrial} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <EditGroup label="Polc terhelés (kg)" name="shelfLoad" val={editItem.shelfLoad} onChange={handleEditChange} />
                         <EditGroup label="Jelölés hiány?" name="shelfLabelMissing" val={editItem.shelfLabelMissing} onChange={handleEditChange} />
                         <EditGroup label="Raktár helyiség?" name="storageRoom" val={editItem.storageRoom} onChange={handleEditChange} />
                         <EditGroup label="Raktár méret" name="storageSize" val={editItem.storageSize} onChange={handleEditChange} />
                    </div>
                 </div>

                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide">Megjegyzés</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-32 outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
                 </div>
              </div>
              
              <div className="p-5 border-t bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-10">
                 <button onClick={() => setEditItem(null)} className="bg-white border px-4 py-2 rounded-lg font-bold">Mégse</button>
                 <button onClick={saveEdit} className="bg-green-600 text-white px-8 py-2 rounded-lg font-bold hover:bg-green-700 shadow-lg">Szerver Mentés</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate" title={label}>{label}</label>
            <input 
                type="text" 
                name={name} 
                value={val || ""} 
                onChange={onChange} 
                className="w-full border border-gray-200 bg-slate-50 rounded-lg px-2 py-1.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 text-sm font-medium transition-all" 
            />
        </div>
    );
}