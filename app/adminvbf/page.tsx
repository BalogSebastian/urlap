// /app/adminvbf/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import {
  FiMail,
  FiEdit2,
  FiFileText,
  FiTrash2,
  FiLogOut,
  FiRefreshCw,
  FiX,
  FiCheck,
  FiZap
} from "react-icons/fi";

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

export default function AdminVBFPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Modalok
  const [editItem, setEditItem] = useState<any>(null);
  const [emailItem, setEmailItem] = useState<any>(null);

  // EMAIL BEÁLLÍTÁSOK (VBF)
  const [targetEmail, setTargetEmail] = useState("sebimbalog@gmail.com");
  const [senderName, setSenderName] = useState("Jani");

  // New: Email Mode and Salutation
  const [emailMode, setEmailMode] = useState<"preset" | "custom">("preset");
  const [salutationName, setSalutationName] = useState("");
  const [sending, setSending] = useState(false);

  // ADATOK BETÖLTÉSE (CSAK VBF)
  const fetchSubmissions = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/submissions");
      const data = await res.json();
      if (res.ok) {
        // Szűrés: Csak a 'vbf' típusúak
        const vbfData = data.filter((item: any) => item.formType === 'vbf');
        setSubmissions(vbfData);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (isAuthenticated) fetchSubmissions();
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === "admin" && password === "admin") setIsAuthenticated(true);
    else alert("Helytelen adatok!");
  };

  const deleteSubmission = async (id: string) => {
    if (!confirm("Biztosan törölni szeretné?")) return;
    try {
      const res = await fetch(`/api/submissions/${id}`, { method: "DELETE" });
      if (res.ok) setSubmissions(prev => prev.filter(s => s._id !== id));
    } catch (error) { alert("Szerver hiba."); }
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
      }
    } catch (error) { alert("Hiba történt."); }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditItem({ ...editItem, [e.target.name]: e.target.value });
  };

  // --- VBF EMAIL KÜLDÉS (ÚJ API-HOZ) ---
  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    try {
      const pdfBlob = await generatePDF(emailItem, true);
      if (!pdfBlob) { setSending(false); return; }

      const formData = new FormData();
      formData.append("file", pdfBlob as Blob, "VBF_Megrendelo.pdf");
      formData.append("email", targetEmail);
      formData.append("companyName", emailItem.companyName);

      // VBF specifikus adatok átadása az új API-nak
      formData.append("vbfServices", emailItem.vbf_services || "Nincs megadva");
      formData.append("senderName", senderName);

      // NEW: Salutation
      formData.append("salutationName", salutationName);

      // FONTOS: Az új API-t hívjuk meg!
      const res = await fetch("/api/send-email-vbf", { method: "POST", body: formData });

      if (res.ok) {
        alert(`VBF Email elküldve!\nCímzett: ${targetEmail}\nFeladó: ${senderName}`);
        setEmailItem(null);
      } else {
        const err = await res.json();
        alert("Hiba: " + err.error);
      }
    } catch (error) {
      console.error(error);
      alert("Szerver hiba.");
    } finally {
      setSending(false);
    }
  };

  // --- PDF GENERÁTOR (VBF STÍLUS) ---
  const generatePDF = async (data: any, returnBlob = false) => {
    const doc = new jsPDF();
    const fontUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf";
    let fontLoaded = false;
    try {
      const response = await fetch(fontUrl);
      if (response.ok) {
        const fontBuffer = await response.arrayBuffer();
        const base64Font = arrayBufferToBase64(fontBuffer);
        doc.addFileToVFS("Roboto-Regular.ttf", base64Font);
        doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
        doc.addFont("Roboto-Regular.ttf", "Roboto", "bold");
        doc.setFont("Roboto", "normal");
        fontLoaded = true;
      }
    } catch (e) { }

    const primaryColor: [number, number, number] = [220, 100, 0]; // Narancs

    // --- LOGO BETÖLTÉS ---
    let logoBase64: string | null = null;
    try {
      const logoRes = await fetch("/munkavedelmiszakiLOGO.png");
      if (logoRes.ok) {
        const logoBuf = await logoRes.arrayBuffer();
        logoBase64 = arrayBufferToBase64(logoBuf);
      }
    } catch (e) { console.error("Logo betöltési hiba:", e); }

    // --- Címsor & Logo ---
    if (logoBase64) {
      // JAVÍTÁS: Feljebb rakva (Y=5)
      doc.addImage(logoBase64, 'PNG', 165, 5, 25, 25);
    }

    if (fontLoaded) doc.setFont("Roboto", "bold");
    doc.setFontSize(22);
    doc.setTextColor(...primaryColor);
    doc.text("Trident Shield Group Kft.", 20, 20);

    if (fontLoaded) doc.setFont("Roboto", "normal");
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text("VBF Megrendelő Adatlap", 20, 28);
    doc.setDrawColor(220, 100, 0);
    doc.setLineWidth(0.5);
    doc.line(20, 33, 190, 33);

    const sectionStyle = {
      fillColor: [255, 248, 240] as [number, number, number],
      textColor: primaryColor,
      fontStyle: "bold" as const,
      fontSize: 11,
      cellPadding: { top: 6, bottom: 6, left: 2 }
    };

    const tableBody = [
      [{ content: '1. Megrendelt Szolgáltatások', colSpan: 2, styles: sectionStyle }],
      ['Típusok', data.vbf_services || 'Nincs kiválasztva'],

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
      ['Van korábbi dokumentum?', data.vbf_prev_doc || '-'],

      [{ content: 'Egyéb megjegyzés', colSpan: 2, styles: sectionStyle }],
      [{ content: data.notes || "Nincs megjegyzés.", colSpan: 2, styles: { fontStyle: 'italic', textColor: 80 } }],
    ];

    autoTable(doc, {
      startY: 40,
      body: tableBody,
      theme: 'grid',
      styles: { font: fontLoaded ? "Roboto" : undefined, fontSize: 10, textColor: [40, 40, 40], cellPadding: 4, valign: 'middle', lineColor: [230, 230, 230] },
      // JAVÍTÁS: column 1 (Válaszok) is félkövér (fontStyle: 'bold')
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] },
        1: { cellWidth: 'auto', fontStyle: 'bold' }
      },
      didDrawPage: function (data) {
        const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
        doc.setFillColor(...primaryColor);
        doc.rect(0, 0, 6, pageHeight, "F");
        doc.setFontSize(8);
        doc.setTextColor(150);
        if (fontLoaded) doc.setFont("Roboto", "normal");
        doc.text(`Trident Shield Group Kft. | VBF Adatlap | ${data.pageNumber}. oldal`, 20, pageHeight - 10);
      },
    });

    if (returnBlob) return doc.output("blob");
    const cleanName = (data.companyName || 'vbf').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    doc.save(`VBF_${cleanName}.pdf`);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#fff7ed] flex flex-col items-center justify-center p-4">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-orange-50 via-white to-transparent -z-10"></div>
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50 w-full max-w-md">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-orange-500/30">
              <FiZap />
            </div>
          </div>
          <h1 className="text-3xl font-black text-center text-slate-900 mb-2">Trident Admin</h1>
          <p className="text-center text-slate-500 mb-8 font-medium">Lépj be a folytatáshoz</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-2">Felhasználónév</label>
              <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-400 uppercase ml-2">Jelszó</label>
              <input type="password" placeholder="•••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-500 outline-none transition-all font-bold text-slate-700" />
            </div>
            <button className="w-full bg-orange-600 hover:bg-orange-700 text-white p-4 rounded-xl font-bold shadow-xl shadow-orange-500/20 active:scale-95 transition-all mt-4">Bejelentkezés</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fff7ed] text-slate-900 font-sans selection:bg-orange-100">
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-orange-50/50 to-transparent -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
        <nav className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-orange-600 font-bold tracking-wider text-xs uppercase mb-2">
              <span className="w-8 h-[2px] bg-orange-600"></span>
              Trident Shield Group
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
              VBF <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-amber-600">Megrendelések</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={fetchSubmissions} className="p-3 bg-white hover:bg-orange-50 text-orange-600 rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95" title="Frissítés">
              <FiRefreshCw className={loading ? "animate-spin" : ""} />
            </button>
            <button onClick={() => setIsAuthenticated(false)} className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-500 rounded-xl shadow-sm border border-slate-200 font-bold text-sm flex items-center gap-2 transition-all active:scale-95">
              <FiLogOut /> Kijelentkezés
            </button>
          </div>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Összes Beküldés</p>
                <h3 className="text-3xl font-black text-slate-800">{submissions.length}</h3>
              </div>
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                <FiFileText size={20} />
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-500 to-amber-600 p-6 rounded-[2rem] shadow-xl shadow-orange-500/20 text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-orange-100 text-xs font-bold uppercase tracking-wider mb-1">Aktív Rendszer</p>
              <h3 className="text-2xl font-black">Electrical Safety</h3>
              <p className="text-orange-100 text-sm mt-2">Minden rendszer üzemkész.</p>
            </div>
            <div className="absolute -bottom-4 -right-4 text-white/10">
              <FiZap size={100} />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-400 font-medium">Adatok betöltése...</p>
          </div>
        ) : (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-6 md:p-8">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                Legutóbbi Beküldések
              </h3>
              <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{submissions.length} db</span>
            </div>

            <div className="space-y-4">
              {!loading && submissions.slice().reverse().map((sub, i) => (
                <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl hover:bg-orange-50/50 border border-slate-100 hover:border-orange-100 transition-all duration-300">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl flex-shrink-0 font-bold">
                      <FiZap />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-orange-700 transition-colors">{sub.companyName || "Névtelen"}</h3>
                      <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                        <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                          🔧 {sub.vbf_services}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          📅 {new Date(sub.createdAt).toLocaleDateString("hu-HU")}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end md:self-center">
                    <button onClick={() => {
                      setEmailItem(sub);
                      setTargetEmail("adam@aramszerelo.hu");
                      setEmailMode("preset");
                      setSalutationName("Partnerünk");
                      setSenderName("Jani");
                    }} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="Email">
                      <FiMail size={18} />
                    </button>
                    <button onClick={() => setEditItem(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all" title="Szerkesztés">
                      <FiEdit2 size={18} />
                    </button>
                    <button onClick={() => generatePDF(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-200 transition-all" title="PDF">
                      <FiFileText size={18} />
                    </button>
                    <button onClick={() => deleteSubmission(sub._id)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" title="Törlés">
                      <FiTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
              {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10 italic">Nincs VBF megrendelés.</p>}
            </div>
          </div>
        )}
      </div>

      {/* --- VBF EMAIL KÜLDÉS MODAL --- */}
      {emailItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h2 className="text-2xl font-black text-slate-800">VBF Adatok küldése</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wide">PDF csatolva lesz</p>
              </div>
              <button onClick={() => setEmailItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <FiX size={20} />
              </button>
            </div>

            <form onSubmit={handleSendEmail} className="space-y-5">

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Címzett</label>

                <div className="flex gap-2 mb-3 p-1.5 bg-slate-100 rounded-xl">
                  <button type="button" onClick={() => { setEmailMode("preset"); setTargetEmail("adam@aramszerelo.hu"); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "preset" ? "bg-white shadow text-orange-600" : "text-slate-500 hover:text-slate-700"}`}>Lista</button>
                  <button type="button" onClick={() => { setEmailMode("custom"); setTargetEmail(""); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "custom" ? "bg-white shadow text-orange-600" : "text-slate-500 hover:text-slate-700"}`}>Egyéni</button>
                </div>

                {emailMode === "preset" ? (
                  <div className="relative">
                    <select
                      value={targetEmail}
                      onChange={(e) => setTargetEmail(e.target.value)}
                      className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="adam@aramszerelo.hu">Adam (adam@aramszerelo.hu)</option>
                      <option value="info@vbf1.hu">Ricsi (info@vbf1.hu)</option>
                      <option value="sebimbalog@gmail.com">Sebi (sebimbalog@gmail.com)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                  </div>
                ) : (
                  <input
                    type="email"
                    placeholder="pelda@email.hu"
                    value={targetEmail}
                    onChange={(e) => setTargetEmail(e.target.value)}
                    className="w-full border border-slate-200 p-4 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-orange-500"
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Megszólítás (Kedves ...)</label>
                <input
                  type="text"
                  placeholder="Pl: Melinda, Partnerünk"
                  value={salutationName}
                  onChange={(e) => setSalutationName(e.target.value)}
                  className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Aláírás</label>
                <div className="relative">
                  <select
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-orange-500"
                  >
                    <option value="Jani">Jani</option>
                    <option value="Márk">Márk</option>
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                </div>
              </div>

              {/* Előnézet */}
              <div className="bg-orange-50 p-4 rounded-2xl border border-orange-100 text-sm text-slate-600 mt-2">
                <p className="font-bold text-orange-800 mb-2 text-xs uppercase">Email Előnézet</p>
                <p className="italic text-xs leading-relaxed font-mono bg-white p-3 rounded-xl border border-orange-100">
                  "Kedves <span className="font-bold text-slate-900">{salutationName || "Partnerünk"}</span>!<br /><br />
                  Küldöm az adatokat...<br />
                  Megrendelés: <span className="text-orange-600 font-bold">{emailItem.vbf_services}</span><br /><br />
                  Üdvözlettel,<br />
                  {senderName}<br />
                  Trident Shield Group Kft."
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <button type="button" onClick={() => setEmailItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
                <button type="submit" disabled={sending} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95">
                  {sending ? <FiRefreshCw className="animate-spin" /> : <FiMail />}
                  {sending ? "Küldés..." : "Küldés"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT MODAL (Csak VBF mezők) --- */}
      {editItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
            <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800">VBF Adatok Szerkesztése</h2>
                <p className="text-slate-500 text-sm font-medium">Módosítások mentése az adatbázisba</p>
              </div>
              <button onClick={() => setEditItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                <FiX size={24} />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-[#fff7ed] custom-scrollbar">
              <EditSection title="1. Szolgáltatás & Előzmény" color="orange">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <EditGroup label="Megrendelt szolgáltatások" name="vbf_services" val={editItem.vbf_services} onChange={handleEditChange} color="orange" />
                  <EditGroup label="Korábbi dokumentum (Igen/Nem)" name="vbf_prev_doc" val={editItem.vbf_prev_doc} onChange={handleEditChange} color="orange" />
                </div>
              </EditSection>

              <EditSection title="2. Ügyfél Adatai" color="orange">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                  <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} color="orange" />
                  <EditGroup label="Képviselő neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} color="orange" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <EditGroup label="Telefon" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} color="orange" />
                  <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} color="orange" />
                  <EditGroup label="Adószám" name="taxNumber" val={editItem.taxNumber} onChange={handleEditChange} color="orange" />
                </div>
              </EditSection>

              <EditSection title="3. Telephely Részletei" color="orange">
                <div className="grid grid-cols-1 gap-5 mb-5">
                  <EditGroup label="Telephely címe" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} color="orange" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <EditGroup label="Tevékenységi kör" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} color="orange" />
                  <EditGroup label="Telephely mérete (m2)" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} color="orange" />
                </div>
              </EditSection>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Megjegyzés</label>
                <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 h-24 focus:ring-2 focus:ring-orange-500 outline-none text-slate-700 font-medium"></textarea>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white sticky bottom-0 z-10">
              <button onClick={() => setEditItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
              <button onClick={saveEdit} className="px-8 py-3 bg-green-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/20 hover:bg-green-700 transition-all active:scale-95 flex items-center gap-2">
                <FiCheck size={20} /> Mentés
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// UI Segéd
function EditSection({ title, children, color = "indigo" }: { title: string, children: React.ReactNode, color?: string }) {
  // Tailwind dynamic classes workaround or just simplistic approach
  const textColor = color === "orange" ? "text-orange-600" : "text-indigo-600";

  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
      <div className={`absolute top-0 left-6 -translate-y-1/2 bg-white px-2 ${textColor} font-bold text-xs uppercase tracking-widest border border-slate-100 rounded-full shadow-sm`}>
        {title}
      </div>
      <div className="pt-2">
        {children}
      </div>
    </div>
  );
}

function EditGroup({ label, name, val, onChange, color = "indigo" }: any) {
  const ringColor = color === "orange" ? "focus:ring-orange-500" : "focus:ring-indigo-500";
  return (
    <div>
      <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase truncate" title={label}>{label}</label>
      <input type="text" name={name} value={val || ""} onChange={onChange} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 ${ringColor} outline-none text-slate-800 text-sm font-semibold transition-all placeholder:text-slate-300`} />
    </div>
  );
}
