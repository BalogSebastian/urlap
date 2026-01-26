// /app/adminvbs/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// --- SEGÉDFÜGGVÉNY: Buffer konvertálása Base64-re (PDF-hez) ---
function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function AdminVBSPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // --- MODAL ÁLLAPOTOK ---
  const [editItem, setEditItem] = useState<any>(null);
  const [emailItem, setEmailItem] = useState<any>(null);
  
  const [targetEmail, setTargetEmail] = useState("");
  const [sending, setSending] = useState(false);

  // --- ADATOK BETÖLTÉSE (CSAK VBS) ---
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (res.ok) {
        // SZŰRÉS: Csak a 'vbs' típusúakat jelenítjük meg
        const vbsData = data.filter((item: any) => item.formType === 'vbs');
        setSubmissions(vbsData);
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
    // Ugyanaz a jelszó, mint a másik adminnál
    if (username === "admin" && password === "admin") {
      setIsAuthenticated(true);
    } else {
      alert("Helytelen adatok!");
    }
  };

  // --- MŰVELETEK ---
  const deleteSubmission = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné ezt a megrendelést?")) return;
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

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

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
        formData.append("file", pdfBlob as Blob, "VBS_Megrendelo.pdf");
        formData.append("email", targetEmail);
        formData.append("companyName", emailItem.companyName);

        const res = await fetch("/api/send-email", { method: "POST", body: formData });

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

  // --- 🔥 VBS SPECIFIKUS PDF GENERÁTOR 🔥 ---
  const generatePDF = async (data: any, returnBlob = false) => {
    const doc = new jsPDF();
    
    // Roboto font betöltése (Ugyanaz a logika)
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

    // --- ARCULAT (SÁRGA/NARANCS VBS STÍLUS) ---
    const primaryColor = [220, 100, 0] as [number, number, number]; // VBS Narancs

    if (fontLoaded) doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Trident Shield Group Kft.", 20, 20);
    
    if (fontLoaded) doc.setFont("Roboto", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("Villamos Biztonsági Megrendelő Adatlap", 20, 28);
    
    doc.setDrawColor(220, 100, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 190, 33);

    // --- TÁBLÁZAT ---
    const sectionStyle = {
        fillColor: [255, 248, 240] as [number, number, number], // Világos narancs háttér
        textColor: primaryColor,
        fontStyle: 'bold' as 'bold',
        fontSize: 11,
        cellPadding: { top: 6, bottom: 6, left: 2 } 
    };

    const tableBody = [
        [{ content: '1. Megrendelt Szolgáltatások', colSpan: 2, styles: sectionStyle }],
        ['Típusok', data.vbs_services || 'Nincs kiválasztva'],

        [{ content: '2. Ügyfél Adatai', colSpan: 2, styles: sectionStyle }],
        ['Cég neve', data.companyName || '-'],
        ['Képviselő neve', data.managerName || '-'],
        ['Képviselő telefon', data.managerPhone || '-'],
        ['Székhely', data.headquarters || '-'],
        ['Adószám', data.taxNumber || '-'],

        [{ content: '3. Telephely és Működés', colSpan: 2, styles: sectionStyle }],
        ['Telephely címe', data.siteAddress || '-'],
        ['Tevékenységi kör', data.mainActivity || '-'],
        ['Telephely mérete', data.areaSize ? `${data.areaSize} m²` : '-'],

        [{ content: '4. Előzmények', colSpan: 2, styles: sectionStyle }],
        ['Van korábbi dokumentum?', data.vbs_prev_doc || '-'],

        [{ content: 'Egyéb megjegyzés', colSpan: 2, styles: sectionStyle }],
        [{ content: data.notes || "Nincs megjegyzés.", colSpan: 2, styles: { fontStyle: 'italic', textColor: 80 } }],
    ];

    autoTable(doc, {
        startY: 40,
        body: tableBody,
        theme: 'grid',
        styles: {
            font: fontLoaded ? "Roboto" : undefined,
            fontSize: 10,
            textColor: [40, 40, 40],
            cellPadding: 4, 
            valign: 'middle',
            lineColor: [230, 230, 230],
        },
        columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] }, 
            1: { cellWidth: 'auto', fontStyle: 'normal' }
        },
        didDrawPage: function (data) {
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            // NARANCS SÁV OLDALT
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 6, pageHeight, "F"); 
            
            doc.setFontSize(8);
            doc.setTextColor(150);
            if(fontLoaded) doc.setFont("Roboto", "normal");
            doc.text(`Trident Shield Group Kft. | VBS Megrendelő | ${data.pageNumber}. oldal`, 20, pageHeight - 10);
        },
    });

    if (returnBlob) return doc.output("blob");
    const cleanName = (data.companyName || 'vbs_megrendelo').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`VBS_${cleanName}.pdf`);
  };

  // --- UI ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
          <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Trident VBS Admin</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
            <input type="password" placeholder="admin" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
            <button className="w-full bg-orange-600 text-white p-3 rounded-lg font-bold">Belépés</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-2">
            <div className="bg-orange-600 text-white p-2 rounded-lg font-bold text-lg">TSG</div>
            <h1 className="text-xl font-bold text-slate-800">VBS Admin Dashboard</h1>
        </div>
        <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
      </nav>

      <main className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-900">Beérkezett VBS Megrendelések</h2>
            <button onClick={fetchSubmissions} className="text-orange-600 text-sm hover:underline">🔄 Frissítés</button>
        </div>
        
        {loading && <p className="text-center py-10">Betöltés...</p>}

        <div className="grid gap-4">
            {!loading && submissions.slice().reverse().map((sub, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                             <span className="text-2xl">⚡</span>
                             <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 ml-9">{sub.vbs_services}</p>
                        <p className="text-slate-400 text-xs mt-1 ml-9">{new Date(sub.createdAt).toLocaleString("hu-HU")}</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => setEmailItem(sub)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-2 border border-emerald-200">
                             ✉️ Küldés
                        </button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-100 border border-yellow-200">
                             ✏️ Szerkesztés
                        </button>
                        <button onClick={() => generatePDF(sub)} className="bg-orange-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-orange-700 shadow-md">
                             📄 PDF
                        </button>
                        <button onClick={() => deleteSubmission(sub._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200">
                             🗑️
                        </button>
                    </div>
                </div>
            ))}
            {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10">Nincs VBS megrendelés az adatbázisban.</p>}
        </div>
      </main>

      {/* --- EMAIL KÜLDÉS MODAL --- */}
      {emailItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
               <h2 className="text-xl font-bold text-slate-800 mb-2">VBS PDF Küldése</h2>
               <p className="text-sm text-slate-500 mb-6">Címzett: <strong>{emailItem.managerEmail || emailItem.companyName}</strong></p>
               
               <form onSubmit={handleSendEmail} className="space-y-4">
                   <div>
                       <label className="block text-sm font-bold text-slate-700 mb-1">Címzett Email Címe</label>
                       <input type="email" required placeholder="ugyfel@pelda.hu" value={targetEmail || emailItem.managerEmail || ""} onChange={(e) => setTargetEmail(e.target.value)} className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-orange-500 outline-none" />
                   </div>
                   <div className="flex justify-end gap-3 pt-4">
                       <button type="button" onClick={() => setEmailItem(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg font-bold">Mégse</button>
                       <button type="submit" disabled={sending} className="px-6 py-2 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-70 flex items-center gap-2">
                           {sending ? "Küldés..." : "🚀 Küldés Most"}
                       </button>
                   </div>
               </form>
           </div>
        </div>
      )}

      {/* --- EDIT MODAL (CSAK VBS MEZŐK) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
              <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-800">VBS Adatok Szerkesztése</h2>
                 <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600">✕</button>
              </div>
              
              <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-slate-50/50">
                 
                 {/* 1. Szolgáltatás */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4 border-b pb-2">1. Szolgáltatás & Előzmény</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditGroup label="Megrendelt szolgáltatások (vesszővel elválasztva)" name="vbs_services" val={editItem.vbs_services} onChange={handleEditChange} />
                        <EditGroup label="Korábbi dokumentum (Igen/Nem)" name="vbs_prev_doc" val={editItem.vbs_prev_doc} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 2. Cégadatok */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4 border-b pb-2">2. Ügyfél Adatai</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                        <EditGroup label="Képviselő neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <EditGroup label="Telefon" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} />
                        <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                        <EditGroup label="Adószám" name="taxNumber" val={editItem.taxNumber} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* 3. Telephely */}
                 <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                    <h3 className="text-sm font-bold text-orange-600 uppercase tracking-wide mb-4 border-b pb-2">3. Telephely Részletei</h3>
                    <div className="grid grid-cols-1 gap-4 mb-4">
                        <EditGroup label="Telephely címe" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <EditGroup label="Tevékenységi kör" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                        <EditGroup label="Telephely mérete (m2)" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} />
                    </div>
                 </div>

                 {/* Megjegyzés */}
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés</label>
                    <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-orange-500 outline-none text-slate-700"></textarea>
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
            <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate" title={label}>{label}</label>
            <input 
                type="text" 
                name={name} 
                value={val || ""} 
                onChange={onChange} 
                className="w-full border border-gray-200 bg-slate-50 rounded-lg px-2 py-2 focus:bg-white focus:ring-2 focus:ring-orange-500 outline-none text-slate-800 text-sm font-medium transition-all" 
            />
        </div>
    );
}