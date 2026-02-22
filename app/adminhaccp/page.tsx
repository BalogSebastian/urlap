// /app/adminhaccp/page.tsx
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
   FiClipboard
} from "react-icons/fi";

// Segédfüggvény: ArrayBuffer -> Base64
function arrayBufferToBase64(buffer: ArrayBuffer) {
   let binary = '';
   const bytes = new Uint8Array(buffer);
   const len = bytes.byteLength;
   for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
   }
   return window.btoa(binary);
}

export default function AdminHACCPPage() {
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");

   const [submissions, setSubmissions] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   // Modalok
   const [editItem, setEditItem] = useState<any>(null);
   const [emailItem, setEmailItem] = useState<any>(null);

   // EMAIL BEÁLLÍTÁSOK (HACCP)
   const [targetEmail, setTargetEmail] = useState("sebimbalog@gmail.com");
   const [senderName, setSenderName] = useState("Sebastian");
   const [emailMode, setEmailMode] = useState<"preset" | "custom">("preset");
   const [salutationName, setSalutationName] = useState("");
   const [sending, setSending] = useState(false);

   // ADATOK BETÖLTÉSE (CSAK HACCP)
   const fetchSubmissions = async () => {
      setLoading(true);
      try {
         const res = await fetch("/api/submissions");
         const data = await res.json();
         if (res.ok) {
            // Szűrés: Csak a 'haccp' típusúak
            const haccpData = data.filter((item: any) => item.formType === 'haccp');
            setSubmissions(haccpData);
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

   const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setEditItem({ ...editItem, [e.target.name]: e.target.value });
   };

   // --- HACCP EMAIL KÜLDÉS ---
   const handleSendEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      try {
         const pdfBlob = await generatePDF(emailItem, true);
         if (!pdfBlob) { setSending(false); return; }

         const formData = new FormData();
         formData.append("file", pdfBlob as Blob, "HACCP_Megrendelo.pdf");
         formData.append("email", targetEmail);
         formData.append("companyName", emailItem.companyName || "Ismeretlen");
         formData.append("haccpServices", emailItem.haccp_services || "HACCP Szolgáltatás");
         formData.append("senderName", senderName);
         formData.append("salutationName", salutationName);

         const res = await fetch("/api/send-email-haccp", { method: "POST", body: formData });
         const result = await res.json();

         if (res.ok) {
            alert(`HACCP Email elküldve!\nCímzett: ${targetEmail}`);
            setEmailItem(null);
         } else {
            alert("Hiba: " + (result.error || JSON.stringify(result)));
         }
      } catch (error) {
         console.error(error);
         alert("Szerver hiba.");
      } finally {
         setSending(false);
      }
   };

   // --- PDF GENERÁTOR (TÖKÉLETESÍTETT) ---
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

      const primaryColor: [number, number, number] = [16, 185, 129]; // Emerald Green

      // --- LOGO ---
      try {
         const logoRes = await fetch("/munkavedelmiszakiLOGO.png");
         if (logoRes.ok) {
            const logoBuf = await logoRes.arrayBuffer();
            const logoBase64 = arrayBufferToBase64(logoBuf);
            doc.addImage(logoBase64, 'PNG', 165, 5, 25, 25);
         }
      } catch (e) { }

      if (fontLoaded) doc.setFont("Roboto", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.text("Trident Shield Group Kft.", 20, 20);

      if (fontLoaded) doc.setFont("Roboto", "normal");
      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text("HACCP Dokumentáció Adatlap", 20, 28);
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(0.5);
      doc.line(20, 33, 190, 33);

      const sectionStyle = {
         fillColor: [236, 253, 245] as [number, number, number],
         textColor: primaryColor,
         fontStyle: "bold" as const,
         fontSize: 11,
         cellPadding: { top: 6, bottom: 6, left: 2 }
      };

      // --- TÁBLÁZAT ÉPÍTÉS (MINDEN ADAT) ---
      const tableBody = [
         // 1. SZOLGÁLTATÁS
         [{ content: '1. Szolgáltatás és Típus', colSpan: 2, styles: sectionStyle }],
         ['Szolgáltatás típusa', data.haccp_services || '-'],
         ['Korábbi dokumentáció', data.haccp_prev_doc || '-'],
         ['Vendéglátó egység típusa', data.haccp_unit_type || '-'],

         // 2. EGYSÉG ADATAI
         [{ content: '2. Egység Adatai', colSpan: 2, styles: sectionStyle }],
         ['Cégnév / Egység neve', data.companyName || '-'],
         ['Cím (Telephely)', data.siteAddress || '-'],
         ['Üzletvezető neve', data.managerName || '-'],
         ['Beosztás', data.haccp_manager || '-'],
         ['Telefon', data.managerPhone || '-'],
         ['Email', data.managerEmail || '-'],
         ['HACCP Felügyelő', data.haccp_haccp_supervisor || 'Nincs külön jelölve'],

         // 3. HELYISÉGEK
         [{ content: '3. Helyiségek és Berendezések', colSpan: 2, styles: sectionStyle }],
         ['Helyiségek', data.haccp_rooms || '-'],
         ['Személyzeti rész', data.haccp_staff_area || '-'],
         ['Biztonsági eszközök', data.haccp_equipment || '-'],
         ['Elsősegély doboz', data.haccp_first_aid || '-'],
         ['Tűzoltó készülékek', `${data.haccp_extinguishers || 0} db`],
         ['Gázellátás', data.haccp_gas || '-'],
         ['Kitevő táblák', data.haccp_signs || '-'],

         // 4. TERMÉKEK & ALAPANYAGOK
         [{ content: '4. Termékek és Alapanyagok', colSpan: 2, styles: sectionStyle }],
         ['Forgalmazott termékkörök', data.haccp_product_groups || '-'],
         ['Beszállítók leírása', data.haccp_suppliers || '-'],
         ['Beszállítói igazolás', data.haccp_supplier_verify || '-'],
         ['Csomagolóanyag beszerzés', data.haccp_packaging || '-'],
         ['Allergének elkülönítése', data.haccp_allergen_separation || '-'],
         ['Allergén jelölés', data.haccp_allergen_labeling || '-'],

         // MÁTRIXOK
         [{ content: 'Beszerzési Mátrix', colSpan: 2, styles: { fillColor: [240, 240, 240], fontStyle: 'bold' } }],
         ['Hús beszerzés', data.haccp_meat_sourcing || '-'],
         ['Zöldség/Gyümölcs beszerzés', data.haccp_veg_sourcing || '-'],
         ['Hal beszerzés', data.haccp_fish_sourcing || '-'],
         ['Tojás beszerzés', data.haccp_egg_sourcing || '-'],

         // 5. TECHNOLÓGIA
         [{ content: '5. Technológia és Működés', colSpan: 2, styles: sectionStyle }],
         ['Értékesítés módja', data.haccp_sales_method || '-'],
         ['Előkészítő helyiségek', data.haccp_preparation_rooms || '-'],
         ['Termelő helyiségek', data.haccp_production_rooms || '-'],
         ['Munkafázisok (Workflow)', data.haccp_workflow || '-'],
         ['Pizza tészta készítés', data.haccp_pasta_production || '-'],
         ['Egyéb tészta készítés', data.haccp_other_pasta || '-'],

         // 6. LOGISZTIKA & HULLADÉK
         [{ content: '6. Kiszállítás és Hulladék', colSpan: 2, styles: sectionStyle }],
         ['Kiszállítás partnerek', data.haccp_delivery || '-'],
         ['Kiszállítás végzője', data.haccp_delivery_method || '-'],
         ['Használt olaj szállító', data.haccp_oil_transport || '-'],
         ['Hulladék elszállítás', data.haccp_waste_transport || '-'],
         ['Rágcsálóirtás', `${data.haccp_pest_control || '-'} (${data.haccp_pest_control_company || ''})`],

         // MEGJEGYZÉS
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
            lineColor: [230, 230, 230]
         },
         columnStyles: {
            0: { cellWidth: 70, fontStyle: 'bold', textColor: [80, 80, 80] },
            1: { cellWidth: 'auto', fontStyle: 'bold' }
         },
         didDrawPage: function (data) {
            doc.setFillColor(...primaryColor);
            doc.rect(0, 0, 6, doc.internal.pageSize.getHeight(), "F");
            doc.setFontSize(8);
            doc.setTextColor(150);
            if (fontLoaded) doc.setFont("Roboto", "normal");
            doc.text(`Trident Shield Group Kft. | HACCP | ${data.pageNumber}. oldal`, 20, doc.internal.pageSize.getHeight() - 10);
         },
      });

      if (returnBlob) return doc.output("blob");
      const cleanName = (data.companyName || 'haccp').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`HACCP_${cleanName}.pdf`);
   };

   if (!isAuthenticated) {
      return (
         <div className="min-h-screen bg-[#f0fdf4] flex flex-col items-center justify-center p-4">
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-50 via-white to-transparent -z-10"></div>
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50 w-full max-w-md">
               <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-emerald-500/30">
                     <FiClipboard />
                  </div>
               </div>
               <h1 className="text-3xl font-black text-center text-slate-900 mb-2">Trident Admin</h1>
               <p className="text-center text-slate-500 mb-8 font-medium">Lépj be a folytatáshoz</p>
               <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-400 uppercase ml-2">Felhasználónév</label>
                     <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-xs font-bold text-slate-400 uppercase ml-2">Jelszó</label>
                     <input type="password" placeholder="•••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-100 focus:border-emerald-500 outline-none transition-all font-bold text-slate-700" />
                  </div>
                  <button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-xl font-bold shadow-xl shadow-emerald-500/20 active:scale-95 transition-all mt-4">Bejelentkezés</button>
               </form>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-[#f0fdf4] text-slate-900 font-sans selection:bg-emerald-100">
         <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-emerald-50/50 to-transparent -z-10"></div>

         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
               <div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold tracking-wider text-xs uppercase mb-2">
                     <span className="w-8 h-[2px] bg-emerald-600"></span>
                     Trident Shield Group
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                     HACCP <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Rendszer</span>
                  </h1>
               </div>
               <div className="flex items-center gap-3">
                  <button onClick={fetchSubmissions} className="p-3 bg-white hover:bg-emerald-50 text-emerald-600 rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95" title="Frissítés">
                     <FiRefreshCw className={loading ? "animate-spin" : ""} />
                  </button>
                  <button onClick={() => setIsAuthenticated(false)} className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-500 rounded-xl shadow-sm border border-slate-200 font-bold text-sm flex items-center gap-2 transition-all active:scale-95">
                     <FiLogOut /> Kijelentkezés
                  </button>
               </div>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
               <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                  <div className="flex justify-between items-start relative z-10">
                     <div>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Összes Beküldés</p>
                        <h3 className="text-3xl font-black text-slate-800">{submissions.length}</h3>
                     </div>
                     <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                        <FiFileText size={20} />
                     </div>
                  </div>
               </div>
               <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-[2rem] shadow-xl shadow-emerald-500/20 text-white relative overflow-hidden">
                  <div className="relative z-10">
                     <p className="text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">Aktív Rendszer</p>
                     <h3 className="text-2xl font-black">Food Safety 1.0</h3>
                     <p className="text-emerald-100 text-sm mt-2">Minden rendszer üzemkész.</p>
                  </div>
                  <div className="absolute -bottom-4 -right-4 text-white/10">
                     <FiClipboard size={100} />
                  </div>
               </div>
            </div>

            {loading ? (
               <div className="flex flex-col items-center justify-center py-20">
                  <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
                  <p className="text-slate-400 font-medium">Adatok betöltése...</p>
               </div>
            ) : (
               <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-6 md:p-8">
                  <div className="flex items-center justify-between mb-8 px-2">
                     <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        Legutóbbi Beküldések
                     </h3>
                     <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{submissions.length} db</span>
                  </div>

                  <div className="space-y-4">
                     {!loading && submissions.slice().reverse().map((sub, i) => (
                        <div key={i} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl hover:bg-emerald-50/50 border border-slate-100 hover:border-emerald-100 transition-all duration-300">
                           <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl flex-shrink-0 font-bold">
                                 <FiClipboard />
                              </div>
                              <div>
                                 <h3 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-emerald-700 transition-colors">{sub.companyName || "Névtelen"}</h3>
                                 <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                                    <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                       🥗 {sub.haccp_services || "Szolgáltatás"}
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
                                 setTargetEmail("sebimbalog@gmail.com");
                                 setEmailMode("preset");
                                 setSalutationName("Partnerünk");
                                 setSenderName("Sebastian");
                              }} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="Email">
                                 <FiMail size={18} />
                              </button>
                              <button onClick={() => setEditItem(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all" title="Szerkesztés">
                                 <FiEdit2 size={18} />
                              </button>
                              <button onClick={() => generatePDF(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="PDF">
                                 <FiFileText size={18} />
                              </button>
                              <button onClick={() => deleteSubmission(sub._id)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" title="Törlés">
                                 <FiTrash2 size={18} />
                              </button>
                           </div>
                        </div>
                     ))}
                     {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10 italic">Nincs HACCP megrendelés.</p>}
                  </div>
               </div>
            )}
         </div>

         {/* --- EMAIL MODAL --- */}
         {emailItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h2 className="text-2xl font-black text-slate-800">HACCP Anyag Küldése</h2>
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
                           <button type="button" onClick={() => { setEmailMode("preset"); setTargetEmail("sebimbalog@gmail.com"); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "preset" ? "bg-white shadow text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Lista</button>
                           <button type="button" onClick={() => { setEmailMode("custom"); setTargetEmail(""); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "custom" ? "bg-white shadow text-emerald-600" : "text-slate-500 hover:text-slate-700"}`}>Egyéni</button>
                        </div>

                        {emailMode === "preset" ? (
                           <div className="relative">
                              <select
                                 value={targetEmail}
                                 onChange={(e) => setTargetEmail(e.target.value)}
                                 className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                              >
                                 <option value="sebimbalog@gmail.com">Sebi (sebimbalog@gmail.com)</option>
                                 <option value="adam@aramszerelo.hu">Adam (adam@aramszerelo.hu)</option>
                                 <option value="info@vbf1.hu">Ricsi (info@vbf1.hu)</option>
                              </select>
                              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                           </div>
                        ) : (
                           <input
                              type="email"
                              placeholder="pelda@email.hu"
                              value={targetEmail}
                              onChange={(e) => setTargetEmail(e.target.value)}
                              className="w-full border border-slate-200 p-4 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                              required
                           />
                        )}
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Megszólítás (Kedves ...)</label>
                        <input
                           type="text"
                           placeholder="Pl: Tamás, Partnerünk"
                           value={salutationName}
                           onChange={(e) => setSalutationName(e.target.value)}
                           className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                     </div>

                     <div>
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Aláírás</label>
                        <div className="relative">
                           <select
                              value={senderName}
                              onChange={(e) => setSenderName(e.target.value)}
                              className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-emerald-500"
                           >
                              <option value="Sebastian">Sebastian</option>
                              <option value="Jani">Jani</option>
                              <option value="Márk">Márk</option>
                           </select>
                           <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                        </div>
                     </div>

                     <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-sm text-slate-600 mt-2">
                        <p className="font-bold text-emerald-800 mb-2 text-xs uppercase">Email Előnézet</p>
                        <p className="italic text-xs leading-relaxed font-mono bg-white p-3 rounded-xl border border-emerald-100">
                           "Kedves <span className="font-bold text-slate-900">{salutationName || "Partnerünk"}</span>!<br /><br />
                           Mellékelten küldöm a HACCP dokumentációt...<br />
                           Szolgáltatás: <span className="text-emerald-600 font-bold">{emailItem.haccp_services}</span><br /><br />
                           Üdvözlettel,<br />
                           {senderName}<br />
                           Trident Shield Group Kft."
                        </p>
                     </div>

                     <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                        <button type="button" onClick={() => setEmailItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
                        <button type="submit" disabled={sending} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95">
                           {sending ? <FiRefreshCw className="animate-spin" /> : <FiMail />}
                           {sending ? "Küldés..." : "Küldés"}
                        </button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* --- EDIT MODAL (HACCP TELJES) --- */}
         {editItem && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                  <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
                     <div>
                        <h2 className="text-2xl font-black text-slate-800">HACCP Adatok Szerkesztése</h2>
                        <p className="text-slate-500 text-sm font-medium">Módosítások mentése az adatbázisba</p>
                     </div>
                     <button onClick={() => setEditItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                        <FiX size={24} />
                     </button>
                  </div>

                  <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-[#f0fdf4] custom-scrollbar">

                     {/* 1. SZOLGÁLTATÁS */}
                     <EditSection title="1. Szolgáltatás és Típus" color="emerald">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <EditGroup label="Szolgáltatások (Vesszővel)" name="haccp_services" val={editItem.haccp_services} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Korábbi dokumentum (Igen/Nem)" name="haccp_prev_doc" val={editItem.haccp_prev_doc} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Egység típusa" name="haccp_unit_type" val={editItem.haccp_unit_type} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     {/* 2. EGYSÉG ADATAI */}
                     <EditSection title="2. Egység Adatai" color="emerald">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                           <EditGroup label="Cégnév / Egység neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Cím" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                           <EditGroup label="Üzletvezető neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Beosztás" name="haccp_manager" val={editItem.haccp_manager} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Telefon" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Email" name="managerEmail" val={editItem.managerEmail} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="mt-5">
                           <EditGroup label="HACCP Felügyelő (ha van)" name="haccp_haccp_supervisor" val={editItem.haccp_haccp_supervisor} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     {/* 3. HELYISÉGEK */}
                     <EditSection title="3. Helyiségek és Biztonság" color="emerald">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                           <EditGroup label="Helyiségek (Felsorolás)" name="haccp_rooms" val={editItem.haccp_rooms} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Biztonsági eszközök" name="haccp_equipment" val={editItem.haccp_equipment} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                           <EditGroup label="Táblák (Felsorolás)" name="haccp_signs" val={editItem.haccp_signs} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Tűzoltó db" name="haccp_extinguishers" val={editItem.haccp_extinguishers} onChange={handleEditChange} type="number" color="emerald" />
                           <EditGroup label="Gázellátás" name="haccp_gas" val={editItem.haccp_gas} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="mt-5">
                           <EditGroup label="Személyzeti rész?" name="haccp_staff_area" val={editItem.haccp_staff_area} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     {/* 4. ALAPANYAGOK */}
                     <EditSection title="4. Alapanyagok és Beszerzés" color="emerald">
                        <div className="grid grid-cols-1 gap-5 mb-5">
                           <EditGroup label="Forgalmazott termékkörök" name="haccp_product_groups" val={editItem.haccp_product_groups} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Beszállítók leírása" name="haccp_suppliers" val={editItem.haccp_suppliers} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                           <EditGroup label="Beszállítói igazolás" name="haccp_supplier_verify" val={editItem.haccp_supplier_verify} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Csomagolóanyag" name="haccp_packaging" val={editItem.haccp_packaging} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Allergének elkülönítése" name="haccp_allergen_separation" val={editItem.haccp_allergen_separation} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="mb-5">
                           <EditGroup label="Allergén jelölés" name="haccp_allergen_labeling" val={editItem.haccp_allergen_labeling} onChange={handleEditChange} color="emerald" />
                        </div>

                        {/* Mátrixok */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-emerald-50 p-6 rounded-2xl border border-emerald-100">
                           <EditGroup label="Hús beszerzés" name="haccp_meat_sourcing" val={editItem.haccp_meat_sourcing} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Zöldség beszerzés" name="haccp_veg_sourcing" val={editItem.haccp_veg_sourcing} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Hal beszerzés" name="haccp_fish_sourcing" val={editItem.haccp_fish_sourcing} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Tojás beszerzés" name="haccp_egg_sourcing" val={editItem.haccp_egg_sourcing} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     {/* 5. MŰKÖDÉS */}
                     <EditSection title="5. Működés és Technológia" color="emerald">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                           <EditGroup label="Értékesítés módja" name="haccp_sales_method" val={editItem.haccp_sales_method} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Munkafázisok" name="haccp_workflow" val={editItem.haccp_workflow} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                           <EditGroup label="Előkészítő helyiségek" name="haccp_preparation_rooms" val={editItem.haccp_preparation_rooms} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Termelő helyiségek" name="haccp_production_rooms" val={editItem.haccp_production_rooms} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                           <EditGroup label="Pizza tészta készítés" name="haccp_pasta_production" val={editItem.haccp_pasta_production} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Egyéb tészta készítés" name="haccp_other_pasta" val={editItem.haccp_other_pasta} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     {/* 6. HULLADÉK */}
                     <EditSection title="6. Kiszállítás és Hulladék" color="emerald">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                           <EditGroup label="Kiszállítás partnerek" name="haccp_delivery" val={editItem.haccp_delivery} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Kiszállítás módja" name="haccp_delivery_method" val={editItem.haccp_delivery_method} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                           <EditGroup label="Olaj elszállítás" name="haccp_oil_transport" val={editItem.haccp_oil_transport} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Hulladék elszállítás" name="haccp_waste_transport" val={editItem.haccp_waste_transport} onChange={handleEditChange} color="emerald" />
                           <EditGroup label="Rágcsálóirtás (Van?)" name="haccp_pest_control" val={editItem.haccp_pest_control} onChange={handleEditChange} color="emerald" />
                        </div>
                        <div className="mt-5">
                           <EditGroup label="Rágcsálóirtás Cég" name="haccp_pest_control_company" val={editItem.haccp_pest_control_company} onChange={handleEditChange} color="emerald" />
                        </div>
                     </EditSection>

                     <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Megjegyzés</label>
                        <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 h-32 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700 font-medium"></textarea>
                     </div>

                  </div>

                  <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10 bg-white">
                     <button onClick={() => setEditItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
                     <button onClick={saveEdit} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2">
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
   const textColor = color === "emerald" ? "text-emerald-600" : (color === "orange" ? "text-orange-600" : "text-indigo-600");
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

function EditGroup({ label, name, val, onChange, type = "text", color = "indigo" }: any) {
   const ringColor = color === "emerald" ? "focus:ring-emerald-500" : (color === "orange" ? "focus:ring-orange-500" : "focus:ring-indigo-500");
   return (
      <div>
         <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase truncate" title={label}>{label}</label>
         <input type={type} name={name} value={val || ""} onChange={onChange} className={`w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 ${ringColor} outline-none text-slate-800 text-sm font-semibold transition-all placeholder:text-slate-300`} />
      </div>
   );
}
