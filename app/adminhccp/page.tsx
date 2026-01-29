"use client";

import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

export default function AdminHCCPPage() {
   const [isAuthenticated, setIsAuthenticated] = useState(false);
   const [username, setUsername] = useState("");
   const [password, setPassword] = useState("");

   const [submissions, setSubmissions] = useState<any[]>([]);
   const [loading, setLoading] = useState(false);

   // Modalok
   const [editItem, setEditItem] = useState<any>(null);
   const [emailItem, setEmailItem] = useState<any>(null);

   // EMAIL BEÁLLÍTÁSOK (HCCP)
   const [targetEmail, setTargetEmail] = useState("sebimbalog@gmail.com");
   const [senderName, setSenderName] = useState("Sebastian");
   const [emailMode, setEmailMode] = useState<"preset" | "custom">("preset");
   const [salutationName, setSalutationName] = useState("");
   const [sending, setSending] = useState(false);

   // ADATOK BETÖLTÉSE (CSAK HCCP)
   const fetchSubmissions = async () => {
      setLoading(true);
      try {
         const res = await fetch("/api/submissions");
         const data = await res.json();
         if (res.ok) {
            // Szűrés: Csak a 'hccp' vagy 'haccp' típusúak
            const hccpData = data.filter((item: any) => item.formType === 'hccp' || item.formType === 'haccp');
            setSubmissions(hccpData);
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

   // --- HCCP EMAIL KÜLDÉS ---
   const handleSendEmail = async (e: React.FormEvent) => {
      e.preventDefault();
      setSending(true);
      try {
         const pdfBlob = await generatePDF(emailItem, true);
         if (!pdfBlob) { setSending(false); return; }

         const formData = new FormData();
         formData.append("file", pdfBlob as Blob, "HCCP_Megrendelo.pdf");
         formData.append("email", targetEmail);
         formData.append("companyName", emailItem.companyName || "Ismeretlen");
         formData.append("haccpServices", emailItem.haccp_services || "HACCP Szolgáltatás");
         formData.append("senderName", senderName);
         formData.append("salutationName", salutationName);

         const res = await fetch("/api/send-email-haccp", { method: "POST", body: formData });
         const result = await res.json();

         if (res.ok) {
            if (result.previewUrl) {
               alert(`HCCP Email elküldve (Ethereal teszt). Preview URL:\n${result.previewUrl}`);
            } else {
               alert(`HCCP Email elküldve!\nCímzett: ${targetEmail}`);
            }
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

      const primaryColor = [16, 185, 129] as [number, number, number]; // Emerald Green

      // --- LOGO ---
      try {
         const logoRes = await fetch("/munkavedelmiszakiLOGO.png");
         if (logoRes.ok) {
            const logoBuf = await logoRes.arrayBuffer();
            const logoBase64 = arrayBufferToBase64(logoBuf);
            doc.addImage(logoBase64, 'PNG', 165, 5, 25, 25);
         }
      } catch (e) { }

      doc.setFontSize(22);
      doc.setTextColor(...primaryColor);
      doc.text("Trident Shield Group Kft.", 20, 20);

      doc.setFontSize(12);
      doc.setTextColor(80);
      doc.text("HCCP Dokumentáció Adatlap (Részletes)", 20, 28);
      doc.setDrawColor(...primaryColor);
      doc.line(20, 33, 190, 33);

      const sectionStyle = {
         fillColor: [236, 253, 245] as [number, number, number],
         textColor: primaryColor,
         fontStyle: 'bold' as 'bold',
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
            doc.text(`Trident Shield Group | HCCP | ${data.pageNumber}. oldal`, 20, doc.internal.pageSize.getHeight() - 10);
         },
      });

      if (returnBlob) return doc.output("blob");
      const cleanName = (data.companyName || 'haccp').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      doc.save(`HCCP_${cleanName}.pdf`);
   };

   if (!isAuthenticated) {
      return (
         <div className="min-h-screen flex items-center justify-center bg-slate-100">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-slate-200">
               <h1 className="text-2xl font-bold text-center text-slate-800 mb-6">Trident HCCP Admin</h1>
               <form onSubmit={handleLogin} className="space-y-4">
                  <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border rounded-lg" />
                  <input type="password" placeholder="admin" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border rounded-lg" />
                  <button className="w-full bg-emerald-600 text-white p-3 rounded-lg font-bold">Belépés</button>
               </form>
            </div>
         </div>
      );
   }

   return (
      <div className="min-h-screen bg-slate-50">
         <nav className="bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center sticky top-0 z-10 shadow-sm">
            <div className="flex items-center gap-2">
               <div className="bg-emerald-600 text-white p-2 rounded-lg font-bold text-lg">TSG</div>
               <h1 className="text-xl font-bold text-slate-800">HCCP Admin Dashboard</h1>
            </div>
            <button onClick={() => setIsAuthenticated(false)} className="text-sm text-red-600 font-medium hover:underline">Kijelentkezés</button>
         </nav>

         <main className="max-w-7xl mx-auto p-6">
            <div className="flex justify-between items-center mb-6">
               <h2 className="text-2xl font-bold text-slate-900">Beérkezett HCCP Megrendelések</h2>
               <button onClick={fetchSubmissions} className="text-emerald-600 text-sm hover:underline">🔄 Frissítés</button>
            </div>

            {loading && <p className="text-center py-10">Betöltés...</p>}

            <div className="grid gap-4">
               {!loading && submissions.slice().reverse().map((sub, i) => (
                  <div key={i} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row justify-between items-center gap-4 hover:shadow-md transition-shadow">
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                           <span className="text-2xl">🛡️</span>
                           <h3 className="text-xl font-bold text-slate-800 truncate">{sub.companyName || "Névtelen"}</h3>
                        </div>
                        <p className="text-slate-500 text-sm mt-1 ml-9">{sub.haccp_services}</p>
                        <p className="text-slate-400 text-xs mt-1 ml-9">{new Date(sub.createdAt).toLocaleString("hu-HU")}</p>
                     </div>

                     <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => {
                           setEmailItem(sub);
                           setTargetEmail("sebimbalog@gmail.com");
                           setEmailMode("preset");
                           setSalutationName("Partnerünk");
                           setSenderName("Sebastian");
                        }} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-lg font-bold hover:bg-emerald-100 flex items-center gap-2 border border-emerald-200">
                           ✉️ Email
                        </button>
                        <button onClick={() => setEditItem(sub)} className="bg-yellow-50 text-yellow-600 px-4 py-2 rounded-lg font-bold hover:bg-yellow-100 border border-yellow-200">
                           ✏️ Szerkesztés
                        </button>
                        <button onClick={() => generatePDF(sub)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 shadow-md">
                           📄 PDF
                        </button>
                        <button onClick={() => deleteSubmission(sub._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 border border-red-200">
                           🗑️
                        </button>
                     </div>
                  </div>
               ))}
               {!loading && submissions.length === 0 && <p className="text-center text-slate-400 py-10">Nincs HCCP megrendelés.</p>}
            </div>
         </main>

         {/* --- EMAIL MODAL --- */}
         {emailItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">HCCP Dokumentum Küldése</h2>
                  <form onSubmit={handleSendEmail} className="space-y-4">
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Címzett</label>
                        <div className="flex gap-2 mb-2 p-1 bg-slate-100 rounded-lg">
                           <button type="button" onClick={() => { setEmailMode("preset"); setTargetEmail("adam@aramszerelo.hu"); }} className={`flex-1 py-1 ${emailMode === "preset" ? "bg-white text-emerald-600 shadow" : "text-gray-500"} rounded`}>Lista</button>
                           <button type="button" onClick={() => { setEmailMode("custom"); setTargetEmail(""); }} className={`flex-1 py-1 ${emailMode === "custom" ? "bg-white text-emerald-600 shadow" : "text-gray-500"} rounded`}>Egyéni</button>
                        </div>
                        {emailMode === 'preset' ? (
                           <select value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="w-full border p-2 rounded">
                              <option value="adam@aramszerelo.hu">Adam</option>
                              <option value="info@vbf1.hu">Ricsi</option>
                              <option value="sebimbalog@gmail.com">Sebi</option>
                           </select>
                        ) : (
                           <input type="email" value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="w-full border p-2 rounded" placeholder="email@cim.hu" required />
                        )}
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Megszólítás</label>
                        <input type="text" value={salutationName} onChange={(e) => setSalutationName(e.target.value)} className="w-full border p-2 rounded" placeholder="Pl: Kedves Tamás!" />
                     </div>
                     <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Aláíró</label>
                        <select value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full border p-2 rounded">
                           <option value="Sebastian">Sebastian</option>
                           <option value="Jani">Jani</option>
                           <option value="Márk">Márk</option>
                        </select>
                     </div>
                     <div className="bg-slate-50 border border-slate-200 p-3 rounded-md text-sm text-slate-600">
                        <div className="font-bold text-slate-800 mb-1">Előnézet</div>
                        <div>Címzett: <span className="font-medium text-slate-900">{targetEmail || "-"}</span></div>
                        <div>Feladó: <span className="font-medium text-slate-900">{senderName || "-"}</span></div>
                     </div>
                     <div className="flex justify-end gap-2 mt-4">
                        <button type="button" onClick={() => setEmailItem(null)} className="px-4 py-2 bg-gray-200 rounded text-gray-700">Mégse</button>
                        <button type="submit" disabled={sending} className="px-4 py-2 bg-emerald-600 text-white rounded font-bold">{sending ? "Küldés..." : "Küldés"}</button>
                     </div>
                  </form>
               </div>
            </div>
         )}

         {/* --- EDIT MODAL (TELJES) --- */}
         {editItem && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
               <div className="bg-white w-full max-w-5xl max-h-[95vh] overflow-hidden rounded-2xl shadow-2xl flex flex-col">
                  <div className="bg-white border-b border-slate-100 p-5 flex justify-between items-center">
                     <h2 className="text-xl font-bold text-slate-800">HCCP Adatok Szerkesztése (Minden mező)</h2>
                     <button onClick={() => setEditItem(null)} className="text-slate-400 hover:text-slate-600 text-xl">✕</button>
                  </div>

                  <div className="p-6 overflow-y-auto bg-slate-50/50 space-y-8 flex-1">

                     {/* 1. SZOLGÁLTATÁS */}
                     <EditSection title="1. Szolgáltatás és Típus">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <EditGroup label="Szolgáltatások (Vesszővel választva)" name="haccp_services" val={editItem.haccp_services} onChange={handleEditChange} />
                           <EditGroup label="Korábbi dok? (Igen/Nem)" name="haccp_prev_doc" val={editItem.haccp_prev_doc} onChange={handleEditChange} />
                           <EditGroup label="Egység típusa" name="haccp_unit_type" val={editItem.haccp_unit_type} onChange={handleEditChange} />
                        </div>
                     </EditSection>

                     {/* 2. EGYSÉG ADATAI */}
                     <EditSection title="2. Egység Adatai">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <EditGroup label="Cégnév / Egység neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                           <EditGroup label="Cím" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                           <EditGroup label="Telefon" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} />
                           <EditGroup label="Email" name="managerEmail" val={editItem.managerEmail} onChange={handleEditChange} />
                           <EditGroup label="Üzletvezető neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} />
                           <EditGroup label="Beosztás" name="haccp_manager" val={editItem.haccp_manager} onChange={handleEditChange} />
                           <EditGroup label="HACCP Felügyelő (ha van)" name="haccp_haccp_supervisor" val={editItem.haccp_haccp_supervisor} onChange={handleEditChange} />
                        </div>
                     </EditSection>

                     {/* 3. HELYISÉGEK */}
                     <EditSection title="3. Helyiségek és Biztonság">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                           <EditGroup label="Helyiségek (Felsorolás)" name="haccp_rooms" val={editItem.haccp_rooms} onChange={handleEditChange} />
                           <EditGroup label="Biztonsági eszközök" name="haccp_equipment" val={editItem.haccp_equipment} onChange={handleEditChange} />
                           <EditGroup label="Táblák (Felsorolás)" name="haccp_signs" val={editItem.haccp_signs} onChange={handleEditChange} />
                           <div className="grid grid-cols-2 gap-4">
                              <EditGroup label="Tűzoltó db" name="haccp_extinguishers" val={editItem.haccp_extinguishers} onChange={handleEditChange} type="number" />
                              <EditGroup label="Gázellátás" name="haccp_gas" val={editItem.haccp_gas} onChange={handleEditChange} />
                           </div>
                           <EditGroup label="Személyzeti rész?" name="haccp_staff_area" val={editItem.haccp_staff_area} onChange={handleEditChange} />
                        </div>
                     </EditSection>

                     {/* 4. ALAPANYAGOK */}
                     <EditSection title="4. Alapanyagok és Beszerzés">
                        <div className="grid grid-cols-1 gap-4">
                           <EditGroup label="Termékkörök (1.1, 1.2...)" name="haccp_product_groups" val={editItem.haccp_product_groups} onChange={handleEditChange} />
                           <EditGroup label="Beszállítók leírása" name="haccp_suppliers" val={editItem.haccp_suppliers} onChange={handleEditChange} />
                           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <EditGroup label="Beszállítói igazolás" name="haccp_supplier_verify" val={editItem.haccp_supplier_verify} onChange={handleEditChange} />
                              <EditGroup label="Csomagolóanyag" name="haccp_packaging" val={editItem.haccp_packaging} onChange={handleEditChange} />
                              <EditGroup label="Allergének külön?" name="haccp_allergen_separation" val={editItem.haccp_allergen_separation} onChange={handleEditChange} />
                           </div>
                           <EditGroup label="Allergén jelölés" name="haccp_allergen_labeling" val={editItem.haccp_allergen_labeling} onChange={handleEditChange} />

                           {/* Mátrixok */}
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                              <EditGroup label="Hús mátrix" name="haccp_meat_sourcing" val={editItem.haccp_meat_sourcing} onChange={handleEditChange} />
                              <EditGroup label="Zöldség mátrix" name="haccp_veg_sourcing" val={editItem.haccp_veg_sourcing} onChange={handleEditChange} />
                              <EditGroup label="Hal mátrix" name="haccp_fish_sourcing" val={editItem.haccp_fish_sourcing} onChange={handleEditChange} />
                              <EditGroup label="Tojás mátrix" name="haccp_egg_sourcing" val={editItem.haccp_egg_sourcing} onChange={handleEditChange} />
                           </div>
                        </div>
                     </EditSection>

                     {/* 5. MŰKÖDÉS */}
                     <EditSection title="5. Működés és Technológia">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <EditGroup label="Értékesítés módja" name="haccp_sales_method" val={editItem.haccp_sales_method} onChange={handleEditChange} />
                           <EditGroup label="Előkészítők" name="haccp_preparation_rooms" val={editItem.haccp_preparation_rooms} onChange={handleEditChange} />
                           <EditGroup label="Termelő helyiségek" name="haccp_production_rooms" val={editItem.haccp_production_rooms} onChange={handleEditChange} />
                           <EditGroup label="Munkafázisok" name="haccp_workflow" val={editItem.haccp_workflow} onChange={handleEditChange} />
                           <EditGroup label="Pizza tészta" name="haccp_pasta_production" val={editItem.haccp_pasta_production} onChange={handleEditChange} />
                           <EditGroup label="Egyéb tészta" name="haccp_other_pasta" val={editItem.haccp_other_pasta} onChange={handleEditChange} />
                        </div>
                     </EditSection>

                     {/* 6. HULLADÉK */}
                     <EditSection title="6. Kiszállítás és Hulladék">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                           <EditGroup label="Kiszállítás partnerek" name="haccp_delivery" val={editItem.haccp_delivery} onChange={handleEditChange} />
                           <EditGroup label="Kiszállítás módja" name="haccp_delivery_method" val={editItem.haccp_delivery_method} onChange={handleEditChange} />
                           <EditGroup label="Olaj elszállítás" name="haccp_oil_transport" val={editItem.haccp_oil_transport} onChange={handleEditChange} />
                           <EditGroup label="Hulladék elszállítás" name="haccp_waste_transport" val={editItem.haccp_waste_transport} onChange={handleEditChange} />
                           <EditGroup label="Rágcsálóirtás (Van?)" name="haccp_pest_control" val={editItem.haccp_pest_control} onChange={handleEditChange} />
                           <EditGroup label="Rágcsálóirtás Cég" name="haccp_pest_control_company" val={editItem.haccp_pest_control_company} onChange={handleEditChange} />
                        </div>
                     </EditSection>

                     {/* EGYÉB */}
                     <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                        <label className="block text-sm font-bold text-slate-700 mb-1">Megjegyzés</label>
                        <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-gray-300 rounded-lg p-3 h-24 focus:ring-2 focus:ring-emerald-500 outline-none text-slate-700"></textarea>
                     </div>

                  </div>

                  <div className="p-5 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                     <button onClick={() => setEditItem(null)} className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold">Mégse</button>
                     <button onClick={saveEdit} className="bg-emerald-600 text-white px-8 py-2 rounded-lg font-bold shadow-lg hover:bg-emerald-700">Mentés</button>
                  </div>
               </div>
            </div>
         )}

      </div>
   );
}

// UI Segéd
function EditSection({ title, children }: { title: string, children: React.ReactNode }) {
   return (
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative">
         <h3 className="text-sm font-bold text-emerald-600 uppercase tracking-wide mb-4 border-b pb-2">{title}</h3>
         {children}
      </div>
   );
}

function EditGroup({ label, name, val, onChange, type = "text" }: any) {
   return (
      <div>
         <label className="block text-[10px] font-bold text-slate-400 mb-1 uppercase truncate" title={label}>{label}</label>
         <input type={type} name={name} value={val || ""} onChange={onChange} className="w-full border border-gray-200 bg-slate-50 rounded-lg px-2 py-2 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-slate-800 text-sm font-medium transition-all" />
      </div>
   );
}
