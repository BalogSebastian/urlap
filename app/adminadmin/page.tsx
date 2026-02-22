// /app/adminadmin/page.tsx
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
    FiShield
} from "react-icons/fi";

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

    interface FireSubmission {
        _id?: string;
        companyName?: string;
        headquarters?: string;
        siteAddress?: string;
        managerName?: string;
        createdAt?: string;
        notes?: string;
        formType?: string;
        [key: string]: string | null | undefined;
    }

    const [submissions, setSubmissions] = useState<FireSubmission[]>([]);
    const [loading, setLoading] = useState(false);

    // --- MODAL ÁLLAPOTOK ---
    const [editItem, setEditItem] = useState<FireSubmission | null>(null);
    const [emailItem, setEmailItem] = useState<FireSubmission | null>(null);

    // EMAIL OPCIÓK ÁLLAPOTAI
    const [targetEmail, setTargetEmail] = useState("sebimbalog@gmail.com");
    const [selectedOrders, setSelectedOrders] = useState<string[]>(["Kockázatértékelés"]);
    const [senderName, setSenderName] = useState("Jani");

    const [sending, setSending] = useState(false);

    // New State for Custom Email Logic
    const [emailMode, setEmailMode] = useState<"preset" | "custom">("preset");
    const [salutationName, setSalutationName] = useState("");


    // --- ADATOK BETÖLTÉSE (CSAK TŰZVÉDELEM) ---
    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/submissions");
            const data = await res.json();
            if (res.ok) {
                // Szűrés: Csak a 'fire' (Tűzvédelmi) adatlapok. (Ha nincs típus, akkor is ide tartozik alapértelmezetten)
                const fireData = data.filter((item: { formType?: string }) => !item.formType || item.formType === 'fire');
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
        console.log("Admin Dashboard Loaded - Filter Logic: Strict Fire Only");
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

    // --- MŰVELETEK ---
    const deleteSubmission = async (id: string | undefined) => {
        if (!id) return;
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
        if (!emailItem) {
            alert("Nincs kiválasztott adatlap az email küldéshez.");
            return;
        }
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

            // NEW: Salutation
            formData.append("salutationName", salutationName);

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

    const tr = (val: string | null | undefined) => {
        if (!val) return "-";
        const map: Record<string, string> = {
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
        return map[val] ?? val;
    };

    // --- PDF GENERÁTOR (JAVÍTOTT OLDALTÖRÉSSEL ÉS TÍPUS HIBÁVAL) ---
    const generatePDF = async (data: FireSubmission, returnBlob = false) => {
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

        // --- LOGO BETÖLTÉS ---
        let logoBase64: string | null = null;
        try {
            const logoRes = await fetch("/munkavedelmiszakiLOGO.png");
            if (logoRes.ok) {
                const logoBuf = await logoRes.arrayBuffer();
                logoBase64 = arrayBufferToBase64(logoBuf);
            }
        } catch (e) { console.error("Logo betöltési hiba:", e); }

        const primaryColor: [number, number, number] = [20, 50, 120];

        // --- Címsor & Logo ---
        if (logoBase64) {
            // Logo a jobb felső sarokban (A4 szélesség ~210mm)
            // JAVÍTÁS: Feljebb rakva (Y=5), hogy ne lógjon bele a vonalba (Y=33)
            doc.addImage(logoBase64, 'PNG', 165, 5, 25, 25);
        }

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

        const join = (arr: Array<string | undefined | null>) =>
            arr && arr.length > 0 ? arr.filter(Boolean).join(", ") : "-";
        const activityTypes = join([data.type_shop, data.type_office, data.type_warehouse, data.type_workshop, data.type_social, data.type_education, data.type_other]);
        const rooms = join([data.room_office, data.room_guest, data.room_kitchen, data.room_warehouse, data.room_social, data.room_workshop]);
        const wastes = join([data.waste_communal, data.waste_select, data.waste_hazard, data.waste_industrial]);
        const signs = join([data.sign_firstaid, data.sign_extinguisher, data.sign_gas, data.sign_emergency, data.sign_no_smoking, data.sign_escape, data.sign_shelf, data.sign_camera]);

        const sectionStyle = {
            fillColor: [245, 247, 250] as [number, number, number],
            textColor: primaryColor,
            fontStyle: "bold" as const,
            fontSize: 11,
            cellPadding: { top: 6, bottom: 6, left: 2 }
        };

        // --- OLDALAK DEFINIÁLÁSA (ÚJ STRUKTÚRA) ---
        const pageContent = [
            // OLDAL 1: Cégadatok (1) + Tevékenység (2)
            [
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
            ],
            // OLDAL 2: Munkakörülmények (3) + Épület (4) + Szerkezetek (5)
            [
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
            ],
            // OLDAL 3: Létszám (6) + Biztonsági (7) + Rendszerek (8)
            [
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
            ],
            // OLDAL 4: Hulladék (9) + Megjegyzés
            [
                [{ content: '9. Hulladék és Raktározás', colSpan: 2, styles: sectionStyle }],
                ['Hulladék típusok', wastes || 'Nincs megadva'],
                ['Polc teherbírás', data.shelfLoad ? `${data.shelfLoad} kg` : '-'],
                ['Polc jelölés hiány', data.shelfLabelMissing ? 'Jelölés hiányzik!' : 'Rendben'],
                ['Raktár helyiség', data.storageRoom === 'yes' ? `Van (${data.storageSize} m²)` : 'Nincs'],
                [{ content: 'Egyéb megjegyzés', colSpan: 2, styles: sectionStyle }],
                [{ content: data.notes || "Nincs.", colSpan: 2, styles: { fontStyle: 'italic', textColor: 80 } }],
            ]
        ];

        // --- TÁBLÁZATOK GENERÁLÁSA ---
        let currentY = 40;

        pageContent.forEach((pageBody, index) => {
            if (index > 0) {
                doc.addPage();
                currentY = 30;
            }

            autoTable(doc, {
                startY: currentY,
                body: pageBody as any,
                theme: 'grid',
                pageBreak: 'auto',
                margin: { top: 25, bottom: 30, left: 20, right: 14 },
                styles: { font: fontLoaded ? "Roboto" : undefined, fontSize: 10, cellPadding: 4 },
                // JAVÍTÁS: A válaszok (1-es oszlop) is félkövérek (fontStyle: 'bold')
                columnStyles: {
                    0: { cellWidth: 70, fontStyle: 'bold' as const },
                    1: { fontStyle: 'bold' as const }
                },
                didDrawPage: (d) => {
                    const h = doc.internal.pageSize.height;
                    doc.setFillColor(...primaryColor);
                    doc.rect(0, 0, 8, h, "F");
                    doc.setFontSize(8);
                    doc.setTextColor(150);
                    // JAVÍTVA: doc.getNumberOfPages() a helyes publikus metódus
                    doc.text(`Trident Shield Group Kft. | ${doc.getNumberOfPages()}. oldal`, 20, h - 10);
                }
            });
        });

        if (returnBlob) return doc.output("blob");
        doc.save(`Trident_${data.companyName || 'adatlap'}.pdf`);
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-4">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-50 via-white to-transparent -z-10"></div>
                <div className="bg-white/80 backdrop-blur-xl p-8 rounded-[2rem] shadow-2xl border border-white/50 w-full max-w-md">
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white text-3xl shadow-lg shadow-indigo-500/30">
                            <FiShield />
                        </div>
                    </div>
                    <h1 className="text-3xl font-black text-center text-slate-900 mb-2">Trident Admin</h1>
                    <p className="text-center text-slate-500 mb-8 font-medium">Lépj be a folytatáshoz</p>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Felhasználónév</label>
                            <input type="text" placeholder="admin" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-400 uppercase ml-2">Jelszó</label>
                            <input type="password" placeholder="•••••" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700" />
                        </div>
                        <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white p-4 rounded-xl font-bold shadow-xl shadow-indigo-500/20 active:scale-95 transition-all mt-4">Bejelentkezés</button>
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100">
            {/* Dekorációs háttér elemek */}
            <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10"></div>

            {/* NAVBAR / HEADER */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-4">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wider text-xs uppercase mb-2">
                            <span className="w-8 h-[2px] bg-indigo-600"></span>
                            Trident Shield Group
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                            Tűzvédelmi <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Adatlapok</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={fetchSubmissions} className="p-3 bg-white hover:bg-indigo-50 text-indigo-600 rounded-xl shadow-sm border border-slate-200 transition-all active:scale-95" title="Frissítés">
                            <FiRefreshCw className={loading ? "animate-spin" : ""} />
                        </button>
                        <button onClick={() => setIsAuthenticated(false)} className="px-4 py-3 bg-white hover:bg-rose-50 text-rose-500 rounded-xl shadow-sm border border-slate-200 font-bold text-sm flex items-center gap-2 transition-all active:scale-95">
                            <FiLogOut /> Kijelentkezés
                        </button>
                    </div>
                </header>

                {/* KPI SZEKCIÓ (Opcionális, statisztika feeling) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 relative overflow-hidden">
                        <div className="flex justify-between items-start relative z-10">
                            <div>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Összes Beküldés</p>
                                <h3 className="text-3xl font-black text-slate-800">{submissions.length}</h3>
                            </div>
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                                <FiFileText size={20} />
                            </div>
                        </div>
                    </div>
                    <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-[2rem] shadow-xl shadow-indigo-500/20 text-white relative overflow-hidden">
                        <div className="relative z-10">
                            <p className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-1">Aktív Rendszer</p>
                            <h3 className="text-2xl font-black">Fire Safety 2.0</h3>
                            <p className="text-indigo-200 text-sm mt-2">Minden rendszer üzemkész.</p>
                        </div>
                        <div className="absolute -bottom-4 -right-4 text-white/10">
                            <FiShield size={100} />
                        </div>
                    </div>
                </div>

                {/* LISTA */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                        <p className="text-slate-400 font-medium">Adatok betöltése...</p>
                    </div>
                ) : (
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-6 md:p-8">
                        <div className="flex items-center justify-between mb-8 px-2">
                            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                                Legutóbbi Beküldések
                            </h3>
                            <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full">{submissions.length} db</span>
                        </div>

                        <div className="space-y-4">
                            {submissions.slice().reverse().map((sub, i) => (
                                <div key={sub._id || i} className="group flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl hover:bg-slate-50 border border-slate-100 hover:border-indigo-100 transition-all duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl flex-shrink-0 font-bold">
                                            {sub.companyName ? sub.companyName.charAt(0).toUpperCase() : "?"}
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg leading-tight group-hover:text-indigo-700 transition-colors">
                                                {sub.companyName || "Névtelen"}
                                            </h4>
                                            <div className="flex flex-wrap items-center gap-y-1 gap-x-3 mt-1.5">
                                                <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
                                                    📍 {sub.siteAddress}
                                                </span>
                                            <span className="text-xs font-semibold text-slate-400">
                                                    📅 {sub.createdAt ? new Date(sub.createdAt).toLocaleDateString("hu-HU") : "-"}
                                                </span>
                                                {sub.notes && (
                                                    <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-md uppercase tracking-wide">
                                                        Megjegyzés
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 self-end md:self-center">
                                        <button onClick={() => {
                                            setEmailItem(sub);
                                            setTargetEmail("info@kiajanlas.hu");
                                            setEmailMode("preset");
                                            setSalutationName("Partnerünk");
                                            setSelectedOrders(["Kockázatértékelés"]);
                                            setSenderName("Jani");
                                        }} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 transition-all" title="Email küldése">
                                            <FiMail size={18} />
                                        </button>
                                        <button onClick={() => setEditItem(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200 transition-all" title="Szerkesztés">
                                            <FiEdit2 size={18} />
                                        </button>
                                        <button onClick={() => generatePDF(sub)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all" title="PDF letöltése">
                                            <FiFileText size={18} />
                                        </button>
                                        <button onClick={() => deleteSubmission(sub._id)} className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all" title="Törlés">
                                            <FiTrash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* --- EMAIL MODAL --- */}
            {emailItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-4xl rounded-[2rem] shadow-2xl p-8 animate-in fade-in zoom-in duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg"><FiMail /></div>
                                Email küldése
                            </h2>
                            <button onClick={() => setEmailItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <FiX size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSendEmail}>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {/* BAL OSZLOP: BEÁLLÍTÁSOK */}
                                <div className="space-y-5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Címzett</label>
                                        <div className="flex gap-2 mb-3 p-1.5 bg-slate-100 rounded-xl">
                                            <button type="button" onClick={() => { setEmailMode("preset"); setTargetEmail("info@kiajanlas.hu"); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "preset" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>Lista</button>
                                            <button type="button" onClick={() => { setEmailMode("custom"); setTargetEmail(""); }} className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${emailMode === "custom" ? "bg-white shadow text-indigo-600" : "text-slate-500 hover:text-slate-700"}`}>Egyéni</button>
                                        </div>

                                        {emailMode === "preset" ? (
                                            <div className="relative">
                                                <select value={targetEmail} onChange={(e) => setTargetEmail(e.target.value)} className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                                                    <option value="info@kiajanlas.hu">info@kiajanlas.hu</option>
                                                    <option value="sebimbalog@gmail.com">Sebi (sebimbalog@gmail.com)</option>
                                                    <option value="nemeth.janos21@gmail.com">Nemeth Janos (nemeth.janos21@gmail.com)</option>
                                                </select>
                                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                                            </div>
                                        ) : (
                                            <input
                                                type="email"
                                                placeholder="pelda@email.hu"
                                                value={targetEmail}
                                                onChange={(e) => setTargetEmail(e.target.value)}
                                                className="w-full border border-slate-200 p-4 rounded-xl bg-white font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                                required
                                            />
                                        )}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Megszólítás</label>
                                        <input
                                            type="text"
                                            placeholder="Pl: Melinda, Partnerünk"
                                            value={salutationName}
                                            onChange={(e) => setSalutationName(e.target.value)}
                                            className="w-full border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium outline-none focus:ring-2 focus:ring-indigo-500"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Megrendelés típusa</label>
                                        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
                                            {["Kockázatértékelés", "Komplex Tűzvédelem", "Komplex Munkavédelem", "Tűzvédelmi Szabályzat", "Munkavédelmi Szabályzat"].map((option) => (
                                                <label key={option} className="flex items-center gap-3 cursor-pointer group">
                                                    <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${selectedOrders.includes(option) ? "bg-indigo-600 border-indigo-600" : "bg-white border-slate-300 group-hover:border-indigo-400"}`}>
                                                        {selectedOrders.includes(option) && <FiCheck className="text-white text-xs" />}
                                                    </div>
                                                    <input type="checkbox" checked={selectedOrders.includes(option)} onChange={() => toggleOrder(option)} className="hidden" />
                                                    <span className={`text-sm font-medium ${selectedOrders.includes(option) ? "text-indigo-900" : "text-slate-600"}`}>{option}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Aláírás</label>
                                        <div className="relative">
                                            <select value={senderName} onChange={(e) => setSenderName(e.target.value)} className="w-full appearance-none border border-slate-200 p-4 rounded-xl bg-slate-50 font-medium text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500">
                                                <option value="Jani">Jani</option>
                                                <option value="Márk">Márk</option>
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">▼</div>
                                        </div>
                                    </div>
                                </div>

                                {/* JOBB OSZLOP: ELŐNÉZET */}
                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col h-full">
                                    <p className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2">
                                        <FiMail /> Előnézet
                                    </p>
                                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm leading-relaxed text-sm text-slate-600 flex-1 overflow-y-auto font-mono">
                                        <p className="mb-4 font-bold text-slate-900">
                                            {salutationName ? `Kedves ${salutationName}!` : "Kedves Kolléga!"}
                                        </p>
                                        <p className="mb-4">
                                            A mellékletben csatolom az elvégzendő munkához az adatokat. Kérdés esetén keress bátran minket! 😉
                                        </p>
                                        <div className="bg-indigo-50/50 p-4 rounded-lg mb-4 border border-indigo-100">
                                            <p className="text-xs font-bold text-indigo-400 uppercase mb-2">Ügyfél</p>
                                            <p><span className="text-slate-400">Cégnév:</span> <strong className="text-slate-800">{emailItem.companyName || "-"}</strong></p>
                                            <p><span className="text-slate-400">Cím:</span> {emailItem.siteAddress || "-"}</p>
                                            <p><span className="text-slate-400">Székhely:</span> {emailItem.headquarters || "-"}</p>
                                        </div>
                                        <p className="mb-2">
                                            <span className="font-bold text-slate-800">Megrendelés:</span> <br />
                                            <span className="text-indigo-600 font-medium">{selectedOrders.length > 0 ? selectedOrders.join(", ") : "-"}</span>
                                        </p>
                                        <div className="mt-8 border-t border-slate-100 pt-4">
                                            <p>Köszönjük,</p>
                                            <p className="font-bold text-slate-900">{senderName}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                <button type="button" onClick={() => setEmailItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
                                <button type="submit" disabled={sending} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 disabled:opacity-70 flex items-center gap-2 transition-all active:scale-95">
                                    {sending ? <FiRefreshCw className="animate-spin" /> : <FiMail />}
                                    {sending ? "Küldés..." : "Email Küldése"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- EDIT MODAL (100% COMPLETE) --- */}
            {editItem && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-white w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-[2rem] shadow-2xl flex flex-col animate-in fade-in zoom-in duration-300">
                        <div className="bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Adatlap Szerkesztése</h2>
                                <p className="text-slate-500 text-sm font-medium">Módosítások mentése az adatbázisba</p>
                            </div>
                            <button onClick={() => setEditItem(null)} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-500 transition-colors">
                                <FiX size={24} />
                            </button>
                        </div>

                        <div className="p-6 md:p-8 space-y-8 flex-1 overflow-y-auto bg-[#f8fafc] custom-scrollbar">
                            {/* 1. Cégadatok */}
                            <EditSection title="1. Cég és Vezetés">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <EditGroup label="Cég neve" name="companyName" val={editItem.companyName} onChange={handleEditChange} />
                                    <EditGroup label="Székhely" name="headquarters" val={editItem.headquarters} onChange={handleEditChange} />
                                    <EditGroup label="Telephely" name="siteAddress" val={editItem.siteAddress} onChange={handleEditChange} />
                                    <EditGroup label="Adószám" name="taxNumber" val={editItem.taxNumber} onChange={handleEditChange} />
                                    <EditGroup label="Ügyvezető neve" name="managerName" val={editItem.managerName} onChange={handleEditChange} />
                                    <EditGroup label="Ügyvezető tel" name="managerPhone" val={editItem.managerPhone} onChange={handleEditChange} />
                                    <EditGroup label="Ügyvezető email" name="managerEmail" val={editItem.managerEmail} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 2. Tevékenység */}
                            <EditSection title="2. Tevékenység">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                                    <EditGroup label="Fő tevékenység" name="mainActivity" val={editItem.mainActivity} onChange={handleEditChange} />
                                    <EditGroup label="Napi leírás" name="dailyActivity" val={editItem.dailyActivity} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
                                    <EditGroup label="Üzlet?" name="type_shop" val={editItem.type_shop} onChange={handleEditChange} />
                                    <EditGroup label="Iroda?" name="type_office" val={editItem.type_office} onChange={handleEditChange} />
                                    <EditGroup label="Raktár?" name="type_warehouse" val={editItem.type_warehouse} onChange={handleEditChange} />
                                    <EditGroup label="Műhely?" name="type_workshop" val={editItem.type_workshop} onChange={handleEditChange} />
                                    <EditGroup label="Szociális?" name="type_social" val={editItem.type_social} onChange={handleEditChange} />
                                    <EditGroup label="Oktatás?" name="type_education" val={editItem.type_education} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <EditGroup label="Eszközök" name="toolsUsed" val={editItem.toolsUsed} onChange={handleEditChange} />
                                    <EditGroup label="Spec Tech (yes/no)" name="specialTech" val={editItem.specialTech} onChange={handleEditChange} />
                                    <EditGroup label="Spec Tech Leírás" name="specialTechDesc" val={editItem.specialTechDesc} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 3. Munkakörülmények */}
                            <EditSection title="3. Munkakörülmények">
                                <div className="grid grid-cols-3 gap-5">
                                    <EditGroup label="Képernyő (yes/no)" name="screenWork" val={editItem.screenWork} onChange={handleEditChange} />
                                    <EditGroup label="Home Office (yes/no)" name="homeOffice" val={editItem.homeOffice} onChange={handleEditChange} />
                                    <EditGroup label="Magasban (yes/no)" name="highWork" val={editItem.highWork} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 4. Épület */}
                            <EditSection title="4. Épület és Higiénia">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                    <EditGroup label="Típus" name="buildingType" val={editItem.buildingType} onChange={handleEditChange} />
                                    <EditGroup label="Emelet" name="floorNumber" val={editItem.floorNumber} onChange={handleEditChange} />
                                    <EditGroup label="Terület" name="areaSize" val={editItem.areaSize} onChange={handleEditChange} />
                                    <EditGroup label="Megközelítés" name="access" val={editItem.access} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-5">
                                    <EditGroup label="Hely: Iroda" name="room_office" val={editItem.room_office} onChange={handleEditChange} />
                                    <EditGroup label="Hely: Vendég" name="room_guest" val={editItem.room_guest} onChange={handleEditChange} />
                                    <EditGroup label="Hely: Konyha" name="room_kitchen" val={editItem.room_kitchen} onChange={handleEditChange} />
                                    <EditGroup label="Hely: Raktár" name="room_warehouse" val={editItem.room_warehouse} onChange={handleEditChange} />
                                    <EditGroup label="Hely: Szoc." name="room_social" val={editItem.room_social} onChange={handleEditChange} />
                                    <EditGroup label="Hely: Műhely" name="room_workshop" val={editItem.room_workshop} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <EditGroup label="WC (yes/no)" name="restroom" val={editItem.restroom} onChange={handleEditChange} />
                                    <EditGroup label="Kézmosó (yes/no)" name="handSanitizer" val={editItem.handSanitizer} onChange={handleEditChange} />
                                    <EditGroup label="Klíma (yes/no)" name="ac" val={editItem.ac} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 5. Szerkezet */}
                            <EditSection title="5. Szerkezetek">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                                    <EditGroup label="Falazat" name="walls" val={editItem.walls} onChange={handleEditChange} />
                                    <EditGroup label="Födém" name="ceiling" val={editItem.ceiling} onChange={handleEditChange} />
                                    <EditGroup label="Tető típus" name="roofType" val={editItem.roofType} onChange={handleEditChange} />
                                    <EditGroup label="Tető fedés" name="roofCover" val={editItem.roofCover} onChange={handleEditChange} />
                                    <EditGroup label="Szigetelés" name="insulation" val={editItem.insulation} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 6. Menekülés */}
                            <EditSection title="6. Létszám és Menekülés">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-5">
                                    <EditGroup label="Dolgozók" name="employees" val={editItem.employees} onChange={handleEditChange} />
                                    <EditGroup label="Ügyfél Max" name="clientsMax" val={editItem.clientsMax} onChange={handleEditChange} />
                                    <EditGroup label="Kijáratok" name="exits" val={editItem.exits} onChange={handleEditChange} />
                                    <EditGroup label="Ajtó (cm)" name="doorWidth" val={editItem.doorWidth} onChange={handleEditChange} />
                                    <EditGroup label="Távolság (m)" name="distM" val={editItem.distM} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 7. Biztonság */}
                            <EditSection title="7. Biztonság és Táblák">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-5">
                                    <EditGroup label="Elsősegély (yes/no)" name="firstAid" val={editItem.firstAid} onChange={handleEditChange} />
                                    <EditGroup label="Oltó db" name="extCount" val={editItem.extCount} onChange={handleEditChange} />
                                    <EditGroup label="Vegyszerek" name="chemicals" val={editItem.chemicals} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <EditGroup label="Elsősegély tábla" name="sign_firstaid" val={editItem.sign_firstaid} onChange={handleEditChange} />
                                    <EditGroup label="Oltó tábla" name="sign_extinguisher" val={editItem.sign_extinguisher} onChange={handleEditChange} />
                                    <EditGroup label="Menekülés" name="sign_escape" val={editItem.sign_escape} onChange={handleEditChange} />
                                    <EditGroup label="Gáz elzáró" name="sign_gas" val={editItem.sign_gas} onChange={handleEditChange} />
                                    <EditGroup label="Dohányozni Tilos" name="sign_no_smoking" val={editItem.sign_no_smoking} onChange={handleEditChange} />
                                    <EditGroup label="Kamera" name="sign_camera" val={editItem.sign_camera} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 8. Rendszerek */}
                            <EditSection title="8. Rendszerek és Gépészet">
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-5 mb-5">
                                    <EditGroup label="Tűzjelző" name="sys_alarm" val={editItem.sys_alarm} onChange={handleEditChange} />
                                    <EditGroup label="Füstérzékelő" name="sys_smoke" val={editItem.sys_smoke} onChange={handleEditChange} />
                                    <EditGroup label="Sprinkler" name="sys_sprinkler" val={editItem.sys_sprinkler} onChange={handleEditChange} />
                                    <EditGroup label="Kézi jelzés" name="sys_manual" val={editItem.sys_manual} onChange={handleEditChange} />
                                    <EditGroup label="Nincs" name="sys_none" val={editItem.sys_none} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                                    <EditGroup label="Főkapcsoló" name="mainSwitch" val={editItem.mainSwitch} onChange={handleEditChange} />
                                    <EditGroup label="Gáz (no/yes/pb)" name="gasValve" val={editItem.gasValve} onChange={handleEditChange} />
                                    <EditGroup label="Gáz helye" name="gasLocation" val={editItem.gasLocation} onChange={handleEditChange} />
                                    <EditGroup label="Kazán (yes/no)" name="boiler" val={editItem.boiler} onChange={handleEditChange} />
                                    <EditGroup label="Kazán Leírás" name="boilerDesc" val={editItem.boilerDesc} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            {/* 9. Hulladék */}
                            <EditSection title="9. Hulladék és Raktár">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-5">
                                    <EditGroup label="Kommunális" name="waste_communal" val={editItem.waste_communal} onChange={handleEditChange} />
                                    <EditGroup label="Szelektív" name="waste_select" val={editItem.waste_select} onChange={handleEditChange} />
                                    <EditGroup label="Veszélyes" name="waste_hazard" val={editItem.waste_hazard} onChange={handleEditChange} />
                                    <EditGroup label="Ipari" name="waste_industrial" val={editItem.waste_industrial} onChange={handleEditChange} />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    <EditGroup label="Polc terhelés (kg)" name="shelfLoad" val={editItem.shelfLoad} onChange={handleEditChange} />
                                    <EditGroup label="Jelölés hiány?" name="shelfLabelMissing" val={editItem.shelfLabelMissing} onChange={handleEditChange} />
                                    <EditGroup label="Raktár helyiség?" name="storageRoom" val={editItem.storageRoom} onChange={handleEditChange} />
                                    <EditGroup label="Raktár méret" name="storageSize" val={editItem.storageSize} onChange={handleEditChange} />
                                </div>
                            </EditSection>

                            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-3">Megjegyzés</label>
                                <textarea name="notes" value={editItem.notes || ""} onChange={handleEditChange} className="w-full border border-slate-200 bg-slate-50 rounded-xl p-4 h-32 outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-slate-700"></textarea>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 z-10 bg-white">
                            <button onClick={() => setEditItem(null)} className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Mégse</button>
                            <button onClick={saveEdit} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2">
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
function EditSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative">
            <div className="absolute top-0 left-6 -translate-y-1/2 bg-white px-2 text-indigo-600 font-bold text-xs uppercase tracking-widest border border-slate-100 rounded-full shadow-sm">
                {title}
            </div>
            <div className="pt-2">
                {children}
            </div>
        </div>
    );
}

function EditGroup({ label, name, val, onChange }: any) {
    return (
        <div>
            <label className="block text-[10px] font-bold text-slate-400 mb-1.5 uppercase truncate" title={label}>{label}</label>
            <input
                type="text"
                name={name}
                value={val || ""}
                onChange={onChange}
                className="w-full border border-slate-200 bg-slate-50 rounded-xl px-3 py-2.5 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 text-sm font-semibold transition-all placeholder:text-slate-300"
            />
        </div>
    );
}
