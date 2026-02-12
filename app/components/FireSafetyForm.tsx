"use client";

import React, { useState } from "react";

type Theme = 'cyan' | 'orange' | 'gray' | 'purple';

export default function FireSafetyForm() {
    const [activeTab, setActiveTab] = useState<'fire' | 'vbf' | 'haccp' | 'generate'>('fire');
    const [genTokenDuration, setGenTokenDuration] = useState<string>('1h');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Determine current theme based on active tab
    // Fire -> Cyan (Blue)
    // Fire -> Cyan (Blue)
    // VBF -> Orange
    // HACCP -> Gray
    // Fire -> Cyan (Blue)
    // VBF -> Orange
    // HACCP -> Gray (Emerald)
    // Generate -> Purple
    const currentTheme: Theme =
        activeTab === 'fire' ? 'cyan' :
            (activeTab === 'vbf' ? 'orange' :
                (activeTab === 'haccp' ? 'gray' : 'purple'));

    // --- MENTÉS LOGIKA ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (activeTab === 'generate') return; // A generálás fülön a gomb inaktív
        setLoading(true);

        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);
        const data: any = {
            formType: activeTab // Elküldjük, hogy melyik típusú űrlap ez
        };

        // Adatok összegzése
        formData.forEach((value, key) => {
            if (value instanceof File) {
                if (value.size > 0) {
                    data[key] = (data[key] ? data[key] + ", " : "") + `[Fájl csatolva: ${value.name}]`;
                }
            } else {
                // Checkboxok összefűzése
                if (data[key]) {
                    data[key] = data[key] + ", " + value;
                } else {
                    data[key] = value;
                }
            }
        });

        try {
            const res = await fetch("/api/submissions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setIsSubmitted(true);
                form.reset();
                window.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => setIsSubmitted(false), 8000);
            } else {
                alert("Hiba történt a mentés során. Kérjük, próbálja újra!");
            }
        } catch (error) {
            console.error(error);
            alert("Szerver hiba. Ellenőrizze az internetkapcsolatot.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto my-8 relative font-sans text-slate-800">

            {/* SIKERES MENTÉS ÜZENET */}
            {isSubmitted && (
                <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
                    <div className="bg-emerald-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-emerald-400">
                        <div className="bg-white/20 p-2 rounded-full">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                        </div>
                        <div>
                            <h4 className="font-bold text-xl">Sikeres beküldés!</h4>
                            <p className="text-emerald-50 text-sm">Az adatokat rögzítettük a rendszerben.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VÁLTÓGOMB (CSÚSZKA) --- */}
            <div className="flex justify-center mb-8">
                <div className="bg-white p-1.5 rounded-2xl shadow-lg border border-slate-200 inline-flex relative">
                    {/* Háttér animáció a csúszkához */}
                    {/* Fire -> Cyan, VBF -> Orange, HACCP -> Gray, Generate -> Purple */}
                    <div className={`absolute top-1.5 bottom-1.5 w-[140px] rounded-xl transition-all duration-300 ease-in-out shadow-sm
                        ${activeTab === 'fire' ? 'left-1.5 bg-cyan-500' : ''}
                        ${activeTab === 'vbf' ? 'left-[148px] bg-orange-500' : ''}
                        ${activeTab === 'haccp' ? 'left-[290px] bg-emerald-500' : ''}
                        ${activeTab === 'generate' ? 'left-[432px] bg-indigo-500' : ''}
                    `}></div>

                    <button
                        type="button"
                        onClick={() => setActiveTab('fire')}
                        className={`relative w-[140px] py-3 rounded-xl font-bold text-sm transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'fire' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🔥 Tűzvédelmi
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('vbf')}
                        className={`relative w-[140px] py-3 rounded-xl font-bold text-sm transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'vbf' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        ⚡ VBF Adatlap
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('haccp')}
                        className={`relative w-[140px] py-3 rounded-xl font-bold text-sm transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'haccp' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🛡️ HACCP
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('generate')}
                        className={`relative w-[140px] py-3 rounded-xl font-bold text-sm transition-colors z-10 flex items-center justify-center gap-2 ${activeTab === 'generate' ? 'text-white' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🚀 Generálás
                    </button>
                </div>
            </div>

            {/* --- FEJLÉC --- */}
            <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-10 border border-slate-100">
                {/* Dynamically changing background blobs */}
                {activeTab === 'fire' && (
                    <>
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-cyan-400 rounded-full blur-3xl opacity-20"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-cyan-200 rounded-full blur-3xl opacity-20"></div>
                    </>
                )}
                {activeTab === 'vbf' && (
                    <>
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-orange-500 rounded-full blur-3xl opacity-15"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-amber-400 rounded-full blur-3xl opacity-15"></div>
                    </>
                )}
                {activeTab === 'haccp' && (
                    <>
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-emerald-400 rounded-full blur-3xl opacity-15"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-emerald-200 rounded-full blur-3xl opacity-15"></div>
                    </>
                )}
                {activeTab === 'generate' && (
                    <>
                        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-indigo-500 rounded-full blur-3xl opacity-15"></div>
                        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-purple-400 rounded-full blur-3xl opacity-15"></div>
                    </>
                )}

                <div className="relative z-10 p-10 sm:p-14 text-center">
                    <div className="flex justify-center mb-6">
                        <img src="/munkavedelmiszakiLOGO.png" alt="TSG Logo" className="h-32 object-contain" />
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
                        Trident Shield Group Kft. <br />
                        <span className={`
                            ${activeTab === 'fire' ? 'text-cyan-500' : ''}
                            ${activeTab === 'vbf' ? 'text-orange-600' : ''}
                            ${activeTab === 'haccp' ? 'text-emerald-600' : ''}
                            ${activeTab === 'generate' ? 'text-indigo-600' : ''}
                        `}>
                            {activeTab === 'fire' && "Tűz- és Munkavédelmi Adatlap"}
                            {activeTab === 'vbf' && "VBF Megrendelő Adatlap"}
                            {activeTab === 'haccp' && "HACCP Dokumentáció"}
                            {activeTab === 'generate' && "Generálás és Küldés"}
                        </span>
                    </h1>
                    <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
                        {activeTab === 'fire' && "Kérjük, töltse ki a tűz- és munkavédelmi dokumentációhoz szükséges adatokat."}
                        {activeTab === 'vbf' && "Kérjük, adja meg a villamos biztonsági felülvizsgálathoz szükséges adatokat."}
                        {activeTab === 'haccp' && "Élelmiszerbiztonsági rendszer kidolgozása."}
                        {activeTab === 'generate' && "Ideiglenes hozzáférési token generálása és kiküldése."}
                    </p>
                </div>
                {/* Gradient Stripe */}
                <div className={`h-2 w-full bg-gradient-to-r 
                     ${activeTab === 'fire' ? 'from-cyan-500 via-cyan-400 to-cyan-300' : ''}
                     ${activeTab === 'vbf' ? 'from-orange-500 via-orange-400 to-amber-300' : ''}
                     ${activeTab === 'haccp' ? 'from-emerald-400 via-emerald-300 to-emerald-200' : ''}
                     ${activeTab === 'generate' ? 'from-indigo-500 via-purple-500 to-pink-400' : ''}
                `}></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-10">

                {/* =========================================================================
            HACCP (FEJLESZTÉS ALATT)
           ========================================================================= */}
                {/* =========================================================================
            HACCP ADATLAP (Green Theme / Emerald)
           ========================================================================= */}
                {activeTab === 'haccp' && (
                    <>
                        {/* 1. Szolgáltatás */}
                        <Section theme={currentTheme} number="01" title="Szolgáltatás és Típus" description="Válassza ki a megfelelő kategóriákat.">
                            <div className="space-y-4 bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                                <Label theme={currentTheme}>Milyen szolgáltatást kér?</Label>
                                <CheckboxCard theme={currentTheme} name="haccp_services" label="Új HACCP rendszer kiépítése" />
                                <CheckboxCard theme={currentTheme} name="haccp_services" label="Meglévő rendszer felülvizsgálata" />
                                <CheckboxCard theme={currentTheme} name="haccp_services" label="Nyitáshoz szükséges dokumentáció" />
                                <CheckboxCard theme={currentTheme} name="haccp_services" label="Oktatás" />
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <Label theme={currentTheme}>Rendelkezik korábbi HACCP kézikönyvvel?</Label>
                                <div className="flex gap-6 mt-3">
                                    <RadioSimple theme={currentTheme} name="haccp_prev_doc" value="Igen" label="Igen, rendelkezem" />
                                    <RadioSimple theme={currentTheme} name="haccp_prev_doc" value="Nem" label="Nem rendelkezem" />
                                </div>
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100">
                                <Label theme={currentTheme}>Milyen vendéglátó egység?</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                    {/* Kézi lista a PDF alapján */}
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Étterem" label="Étterem" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Büfé" label="Büfé" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Cukrászda" label="Cukrászda" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Pékség" label="Pékség" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Kocsma / Bár" label="Kocsma / Bár" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Mozgóbolt" label="Mozgóbolt / Food Truck" />
                                    <RadioSimple theme={currentTheme} name="haccp_unit_type" value="Egyéb" label="Egyéb" />
                                </div>
                            </div>
                        </Section>

                        {/* 2. Egység Adatai */}
                        <Section theme={currentTheme} number="02" title="Egység adatai" description="Az üzemeltetés alapadatai.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup theme={currentTheme} label="Egység neve" name="companyName" placeholder="pl. Falatozó Kft." fullWidth required />
                                <InputGroup theme={currentTheme} label="Egység címe" name="siteAddress" placeholder="Pontos cím" required />
                                <InputGroup theme={currentTheme} label="Telefon" name="managerPhone" placeholder="+36..." fullWidth />
                                <InputGroup theme={currentTheme} label="Email" name="managerEmail" placeholder="info@..." type="email" fullWidth />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <Label theme={currentTheme}>Felelős személy</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
                                    <InputGroup theme={currentTheme} label="Név" name="managerName" placeholder="Teljes név" fullWidth />
                                    <div>
                                        <Label theme={currentTheme}>Beosztás</Label>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <RadioSimple theme={currentTheme} name="haccp_manager" value="Üzletvezető" label="Üzletvezető" />
                                            <RadioSimple theme={currentTheme} name="haccp_manager" value="Ügyvezető" label="Ügyvezető" />
                                            <RadioSimple theme={currentTheme} name="haccp_manager" value="Egyéb" label="Egyéb kijelölt személy" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label theme={currentTheme}>Van külön HACCP felügyelő személy?</Label>
                                <input type="text" name="haccp_haccp_supervisor" className="w-full border rounded-xl p-3 mt-1 placeholder-gray-400" placeholder="Ha van, írja ide a nevét..." />
                            </div>
                        </Section>

                        {/* 3. Helyiségek és Berendezések */}
                        <Section theme={currentTheme} number="03" title="Helyiségek és Berendezések" description="Az ingatlan elosztása és felszereltsége.">
                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 mb-6">
                                <Label theme={currentTheme}>Helyiségek (Jelölje be ami van)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-3">
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Iroda" />
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Vendégtér" />
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Műhely" />
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Konyha" />
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Raktár" />
                                    <CheckboxCard theme={currentTheme} name="haccp_rooms" label="Szociális helyiség" />
                                    <CheckboxCard theme={currentTheme} name="haccp_staff_area" label="Személyzeti rész van" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <Label theme={currentTheme}>Biztonsági eszközök</Label>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <CheckboxCard theme={currentTheme} name="haccp_equipment" label="Sprinkler" />
                                        <CheckboxCard theme={currentTheme} name="haccp_equipment" label="Füstérzékelő" />
                                        <CheckboxCard theme={currentTheme} name="haccp_first_aid" label="Elsősegély doboz" />
                                    </div>
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Tűzoltó készülékek</Label>
                                    <input type="number" name="haccp_extinguishers" className="w-full border rounded-xl p-3 mt-2" placeholder="Darabszám" />

                                    <div className="mt-4">
                                        <Label theme={currentTheme}>Gázellátás</Label>
                                        <div className="flex flex-col gap-2 mt-2">
                                            <RadioSimple theme={currentTheme} name="haccp_gas" value="Nincs" label="Nincs használatban" />
                                            <RadioSimple theme={currentTheme} name="haccp_gas" value="Vezetékes" label="Vezetékes gáz" />
                                            <RadioSimple theme={currentTheme} name="haccp_gas" value="PB" label="PB gáz" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                <Label theme={currentTheme}>Milyen táblák vannak kitéve?</Label>
                                <div className="grid grid-cols-2 gap-3 mt-3">
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Elsősegély pont" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Tűzoltó készülék helye" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Gáz főelzáró" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Segélyhívó számok" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Dohányozni Tilos" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Menekülési útvonal" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="Polc terhelhetőség" />
                                    <CheckboxCard theme={currentTheme} name="haccp_signs" label="HACCP folyamatábra" />
                                </div>
                            </div>
                        </Section>

                        {/* 4. Termékek és Alapanyagok */}
                        <Section theme={currentTheme} number="04" title="Termékek és Alapanyagok" description="Forgalmazott termékek köre és beszerzés.">
                            <div className="mb-8">
                                <Label theme={currentTheme}>Forgalmazott termékek köre (Válasszon)</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3 text-sm">
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.1 Meleg-, hideg étel" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.2 Kávé, italok, szeszes italok" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.4 Cukrászati készítmény" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.5 Hús- és hentesáru" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.8 Kenyér- és pékáru" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.9 Édességáru, fagylalt, jégkrém" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.10 Tej, tejtermék" />
                                    <CheckboxCard theme={currentTheme} name="haccp_product_groups" label="1.11 Egyéb élelmiszer (liszt, olaj...)" />
                                    <input type="text" name="haccp_product_groups" placeholder="Egyéb kategória..." className="w-full border rounded-xl p-3 mt-2" />
                                </div>
                            </div>

                            <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100 space-y-6">
                                <div>
                                    <Label theme={currentTheme}>Beszállítók és Alapanyagok</Label>
                                    <textarea name="haccp_suppliers" className="w-full border rounded-xl p-3 h-20 mt-2" placeholder="Honnan érkezik liszt, tej, hús, zöldség? (Piac, Nagyker, ...)" />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label theme={currentTheme}>Van beszállítói igazolás?</Label>
                                        <select name="haccp_supplier_verify" className="w-full border rounded-xl p-3 mt-1 bg-white">
                                            <option value="Igen, számla/nyilatkozat">Igen (Számla / Nyilatkozat)</option>
                                            <option value="Nincs">Nincs</option>
                                        </select>
                                    </div>
                                    <div>
                                        <Label theme={currentTheme}>Csomagolóanyag beszerzés</Label>
                                        <input type="text" name="haccp_packaging" className="w-full border rounded-xl p-3 mt-1" placeholder="Honnan?" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <Label theme={currentTheme}>Allergének külön vannak?</Label>
                                        <RadioSimple theme={currentTheme} name="haccp_allergen_separation" value="Igen" label="Igen" />
                                        <RadioSimple theme={currentTheme} name="haccp_allergen_separation" value="Nem" label="Nem / Egy térben" />
                                    </div>
                                    <div>
                                        <Label theme={currentTheme}>Allergén jelölés módja</Label>
                                        <input type="text" name="haccp_allergen_labeling" className="w-full border rounded-xl p-3 mt-1" placeholder="pl. Étlapon, Táblán, Címkén" />
                                    </div>
                                </div>
                            </div>

                            {/* Beszerzési Mátrixok */}
                            <div className="mt-8">
                                <h3 className="font-bold text-emerald-800 mb-4 border-b pb-2">Beszerzési Mátrix</h3>

                                <div className="space-y-6">
                                    {/* Hús */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <Label theme={currentTheme}>Hús beszerzése</Label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <CheckboxCard theme={currentTheme} name="haccp_meat_sourcing" label="Feldolgozva" />
                                            <CheckboxCard theme={currentTheme} name="haccp_meat_sourcing" label="Feldolgozatlan" />
                                            <CheckboxCard theme={currentTheme} name="haccp_meat_sourcing" label="Mirelit" />
                                        </div>
                                    </div>
                                    {/* Zöldség */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <Label theme={currentTheme}>Zöldség/Gyümölcs beszerzése</Label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <CheckboxCard theme={currentTheme} name="haccp_veg_sourcing" label="Feldolgozva" />
                                            <CheckboxCard theme={currentTheme} name="haccp_veg_sourcing" label="Feldolgozatlan" />
                                            <CheckboxCard theme={currentTheme} name="haccp_veg_sourcing" label="Mirelit" />
                                        </div>
                                    </div>
                                    {/* Hal */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <Label theme={currentTheme}>Hal beszerzése</Label>
                                        <div className="grid grid-cols-3 gap-2 mt-2">
                                            <CheckboxCard theme={currentTheme} name="haccp_fish_sourcing" label="Feldolgozva" />
                                            <CheckboxCard theme={currentTheme} name="haccp_fish_sourcing" label="Feldolgozatlan" />
                                            <CheckboxCard theme={currentTheme} name="haccp_fish_sourcing" label="Mirelit" />
                                        </div>
                                    </div>
                                    {/* Tojás */}
                                    <div className="bg-white p-4 rounded-xl border border-gray-200">
                                        <Label theme={currentTheme}>Tojás beszerzése</Label>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                                            <CheckboxCard theme={currentTheme} name="haccp_egg_sourcing" label="Szimpla" />
                                            <CheckboxCard theme={currentTheme} name="haccp_egg_sourcing" label="Fertőtlenített" />
                                            <CheckboxCard theme={currentTheme} name="haccp_egg_sourcing" label="Tojáslé" />
                                            <CheckboxCard theme={currentTheme} name="haccp_egg_sourcing" label="Tojáspor" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 5. Technológia és Helyiségek */}
                        <Section theme={currentTheme} number="05" title="Technológia és Helyiségek" description="Az üzemi folyamatok és területek.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <Label theme={currentTheme}>Értékesítés módja</Label>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <CheckboxCard theme={currentTheme} name="haccp_sales_method" label="Pult mögül (kiszolgálás)" />
                                        <CheckboxCard theme={currentTheme} name="haccp_sales_method" label="Önkiszolgáló" />
                                        <CheckboxCard theme={currentTheme} name="haccp_sales_method" label="Házhozszállítás" />
                                    </div>
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Előkészítő helyiségek</Label>
                                    <div className="flex flex-col gap-2 mt-2">
                                        <CheckboxCard theme={currentTheme} name="haccp_preparation_rooms" label="Hús előkészítő" />
                                        <CheckboxCard theme={currentTheme} name="haccp_preparation_rooms" label="Zöldség előkészítő" />
                                        <CheckboxCard theme={currentTheme} name="haccp_preparation_rooms" label="Tojás előkészítő" />
                                        <CheckboxCard theme={currentTheme} name="haccp_preparation_rooms" label="Csak konyhakész árút használunk" />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-6">
                                <Label theme={currentTheme}>Termelő helyiségek</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Melegkonyha" />
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Hidegkonyha" />
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Sütöde / Pékség" />
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Cukrászüzem" />
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Látványkonyha" />
                                    <CheckboxCard theme={currentTheme} name="haccp_production_rooms" label="Italkészítés" />
                                </div>
                            </div>

                            <div>
                                <Label theme={currentTheme}>Alkalmazott technológiai lépések (Műveletek)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2 text-sm">
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Áruátvétel / Raktározás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Előkészítés / Tisztítás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Hőkezelés (Sütés/Főzés)" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Lehűtés" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Fagyasztás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Melegentartás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Tálalás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Kiszállítás" />
                                    <CheckboxCard theme={currentTheme} name="haccp_workflow" label="Mosogatás" />
                                </div>
                            </div>

                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <Label theme={currentTheme}>Tészták készítése</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                                    <div>
                                        <span className="text-xs font-bold text-gray-500">Pizza tészta:</span>
                                        <div className="flex gap-2">
                                            <RadioSimple theme={currentTheme} name="haccp_pasta_production" value="Helyben" label="Helyben" />
                                            <RadioSimple theme={currentTheme} name="haccp_pasta_production" value="Beszállítva" label="Beszállítva" />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-xs font-bold text-gray-500">Egyéb tészta:</span>
                                        <div className="flex gap-2">
                                            <RadioSimple theme={currentTheme} name="haccp_other_pasta" value="Helyben" label="Helyben" />
                                            <RadioSimple theme={currentTheme} name="haccp_other_pasta" value="Beszállítva" label="Beszállítva" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 6. Kiszállítás és Hulladék */}
                        <Section theme={currentTheme} number="06" title="Kiszállítás és Hulladék" description="Logisztika és környezetvédelem.">
                            <div className="mb-6">
                                <Label theme={currentTheme}>Kiszállítás módja</Label>
                                <div className="grid grid-cols-2 gap-3 mt-2">
                                    <CheckboxCard theme={currentTheme} name="haccp_delivery" label="Wolt / Foodora / Bolt" />
                                    <CheckboxCard theme={currentTheme} name="haccp_delivery" label="Saját futár" />
                                </div>
                                <div className="mt-3">
                                    <Label theme={currentTheme}>Ha van kiszállítás, ki végzi?</Label>
                                    <div className="flex gap-4">
                                        <RadioSimple theme={currentTheme} name="haccp_delivery_method" value="Saját" label="Saját alkalmazott/autó" />
                                        <RadioSimple theme={currentTheme} name="haccp_delivery_method" value="Alvállalkozó" label="Alvállalkozó" />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                <Label theme={currentTheme}>Hulladékkezelés</Label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3">
                                    <div>
                                        <Label theme={currentTheme}>Használt olaj elszállító</Label>
                                        <div className="flex flex-col gap-2 mt-1">
                                            <RadioSimple theme={currentTheme} name="haccp_oil_transport" value="Biofilter" label="Biofilter" />
                                            <RadioSimple theme={currentTheme} name="haccp_oil_transport" value="Gastrooil" label="Gastrooil" />
                                            <RadioSimple theme={currentTheme} name="haccp_oil_transport" value="Nincs/Folyamatban" label="Nincs / Folyamatban" />
                                        </div>
                                    </div>
                                    <div>
                                        <Label theme={currentTheme}>Egyéb hulladék szállító</Label>
                                        <input type="text" name="haccp_waste_transport" className="w-full border rounded-xl p-3 mt-1" placeholder="Cég neve..." />
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <Label theme={currentTheme}>Rágcsálóirtás van?</Label>
                                    <div className="flex items-center gap-2 mt-1">
                                        <RadioSimple theme={currentTheme} name="haccp_pest_control" value="Igen" label="Igen" />
                                        <input type="text" name="haccp_pest_control_company" className="flex-1 border-b border-gray-300 py-1 outline-none text-sm bg-transparent" placeholder="Ki végzi?" />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 7. Dokumentumok és Fotók */}
                        <Section theme={currentTheme} number="07" title="Dokumentumok" description="Csatolmányok feltöltése.">
                            <div className="bg-emerald-50 p-6 rounded-3xl border border-emerald-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-emerald-600 rounded-xl text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                                    </div>
                                    <Label theme={currentTheme}>Kérjük, csatolja az alábbi dokumentumokat:</Label>
                                </div>

                                <ul className="list-disc list-inside text-sm text-slate-700 mb-6 pl-2 space-y-2">
                                    <li><strong>Alaprajz / Skicc</strong> a telephelyről (kötelező)</li>
                                    <li><strong>Étlap</strong> fotója (vagy fájl)</li>
                                    <li><strong>Beszállítói igazolások</strong> (opcionális)</li>
                                </ul>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">Alaprajz Feltöltése</label>
                                        <input type="file" name="haccp_floor_plan" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-emerald-700 uppercase mb-1 block">Étlap Feltöltése</label>
                                        <input type="file" name="haccp_menu_photo" className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200 transition-all cursor-pointer" />
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </>
                )}

                {/* =========================================================================
            VBF ADATLAP (Orange Theme)
           ========================================================================= */}
                {activeTab === 'vbf' && (
                    <>
                        <Section theme={currentTheme} number="01" title="Szolgáltatás kiválasztása" description="Milyen felülvizsgálatot szeretne rendelni?">
                            <div className="space-y-4 bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                                <CheckboxCard theme={currentTheme} name="vbf_services" label="Villamos Biztonsági felülvizsgálat" />
                                <CheckboxCard theme={currentTheme} name="vbf_services" label="Villámvédelmi felülvizsgálat" />
                                <CheckboxCard theme={currentTheme} name="vbf_services" label="Szabványossági felülvizsgálat" />
                            </div>
                        </Section>

                        <Section theme={currentTheme} number="02" title="Ügyfél adatai" description="A megrendelő és a helyszín adatai.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup theme={currentTheme} label="Ügyfél Cég neve" name="companyName" placeholder="pl. Minta Kft." fullWidth required />
                                <InputGroup theme={currentTheme} label="Képviseletre jogosult személy neve" name="managerName" placeholder="Vezető neve" fullWidth />
                                <InputGroup theme={currentTheme} label="Képviselő telefonos elérhetősége" name="managerPhone" placeholder="+36..." fullWidth />
                                <InputGroup theme={currentTheme} label="Ügyfél székhelye" name="headquarters" placeholder="Cím" required />
                            </div>

                            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup theme={currentTheme} label="Ügyfél telephelye (ahova a szolgáltatást kéri)" name="siteAddress" placeholder="Pontos cím" required />
                                <InputGroup theme={currentTheme} label="A telephely mérete (m²)" name="areaSize" type="number" placeholder="pl. 120" />
                                <InputGroup theme={currentTheme} label="Az ügyfél tevékenységi köre" name="mainActivity" placeholder="pl. iroda, gyártás..." fullWidth />
                            </div>
                        </Section>

                        <Section theme={currentTheme} number="03" title="Előzmények" description="Korábbi dokumentációk rendelkezésre állása.">
                            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                                <Label theme={currentTheme}>Rendelkezik korábbi felülvizsgálati dokumentummal?</Label>
                                <div className="flex gap-6 mt-4">
                                    <RadioSimple theme={currentTheme} name="vbf_prev_doc" value="Igen" label="Igen, rendelkezem" />
                                    <RadioSimple theme={currentTheme} name="vbf_prev_doc" value="Nem" label="Nem rendelkezem" />
                                </div>
                            </div>
                        </Section>
                    </>
                )}

                {/* =========================================================================
            TŰZVÉDELMI ADATLAP (Cyan Theme)
           ========================================================================= */}
                {activeTab === 'fire' && (
                    <>
                        {/* 1. Cégadatok */}
                        <Section theme={currentTheme} number="01" title="Cégadatok és Kapcsolattartás" description="A vállalkozás hivatalos adatai és az ügyvezető elérhetősége.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <InputGroup theme={currentTheme} label="Cég teljes neve" name="companyName" placeholder="pl. Minta Kft." fullWidth required />
                                <InputGroup theme={currentTheme} label="Székhely címe" name="headquarters" placeholder="Irányítószám, Város, Utca, Házszám" required />
                                <InputGroup theme={currentTheme} label="Telephely címe (ahová az anyag készül)" name="siteAddress" placeholder="Pontos cím" required />
                                <InputGroup theme={currentTheme} label="Adószám" name="taxNumber" placeholder="xxxxxxxx-x-xx" required />
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <Label theme={currentTheme}>Ügyvezető adatai</Label>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                                    <InputGroup theme={currentTheme} label="Név" name="managerName" placeholder="Vezető neve" fullWidth />
                                    <InputGroup theme={currentTheme} label="Telefonszám" name="managerPhone" placeholder="+36..." fullWidth />
                                    <InputGroup theme={currentTheme} label="E-mail cím" name="managerEmail" placeholder="vezeto@ceg.hu" type="email" fullWidth />
                                </div>
                            </div>
                        </Section>

                        {/* 2. Tevékenység */}
                        <Section theme={currentTheme} number="02" title="Tevékenység és Működés" description="Mivel foglalkozik a cég napi szinten?">
                            <InputGroup theme={currentTheme} label="Fő tevékenység megnevezése" name="mainActivity" placeholder="pl. autószerelés, iroda, kereskedelem..." fullWidth required />

                            <div className="mt-6">
                                <Label theme={currentTheme}>Röviden összefoglalva írd le a napi tevékenységet</Label>
                                <textarea name="dailyActivity" className={`w-full border border-gray-300 rounded-xl p-4 h-24 text-sm focus:ring-2 placeholder-gray-400 outline-none transition-all ${currentTheme === 'cyan' ? 'focus:ring-cyan-400' : 'focus:ring-orange-500'}`} placeholder="Pl: Reggel áruátvétel, napközben kiszolgálás, adminisztráció..."></textarea>
                            </div>

                            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                                <InputGroup theme={currentTheme} label="Alkalmazottak száma" name="employees" type="number" placeholder="0" />
                                <InputGroup theme={currentTheme} label="Alvállalkozók száma" name="subcontractors" type="number" placeholder="0" />
                                <InputGroup theme={currentTheme} label="Ügyfélforgalom (max/nap)" name="clientsMax" type="number" placeholder="0" />
                            </div>

                            <div className="pt-6">
                                <Label theme={currentTheme}>Munkához használt eszközök és berendezések</Label>
                                <input type="text" name="toolsUsed" className={`w-full border-b border-gray-300 py-2 outline-none placeholder-gray-400 transition-colors ${currentTheme === 'cyan' ? 'focus:border-cyan-500' : 'focus:border-orange-600'}`} placeholder="pl: fúró, targonca, számítógép, kávéfőző, létra..." />
                            </div>

                            <div className="pt-6">
                                <Label theme={currentTheme}>Van-e speciális technológia? (pl. hegesztés, festés)</Label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                                    <SelectableCard theme={currentTheme} name="specialTech" value="no" label="Nincs" />
                                    <SelectableCard theme={currentTheme} name="specialTech" value="yes" label="Van (fejtse ki):">
                                        <input type="text" name="specialTechDesc" className="mt-2 w-full text-sm border-b border-gray-300 outline-none bg-transparent" placeholder="..." />
                                    </SelectableCard>
                                </div>
                            </div>

                            <div className="pt-6">
                                <Label theme={currentTheme}>Működés jellege (Több is jelölhető)</Label>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                                    <CheckboxCard theme={currentTheme} name="type_shop" label="Üzlet / Vendégtér" />
                                    <CheckboxCard theme={currentTheme} name="type_office" label="Csak iroda" />
                                    <CheckboxCard theme={currentTheme} name="type_warehouse" label="Raktár" />
                                    <CheckboxCard theme={currentTheme} name="type_workshop" label="Műhely / Termelés" />
                                    <CheckboxCard theme={currentTheme} name="type_social" label="Szociális / Öltöző" />
                                    <CheckboxCard theme={currentTheme} name="type_education" label="Oktatás" />
                                </div>
                            </div>
                        </Section>

                        {/* 3. Munkakörülmények */}
                        <Section theme={currentTheme} number="03" title="Munkakörülmények" description="Munkavédelmi szempontból fontos kérdések.">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <Label theme={currentTheme}>Képernyő előtti munkavégzés?</Label>
                                    <div className="flex gap-4 mt-3">
                                        <RadioSimple theme={currentTheme} name="screenWork" value="yes" label="Igen" />
                                        <RadioSimple theme={currentTheme} name="screenWork" value="no" label="Nem" />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <Label theme={currentTheme}>Otthoni munkavégzés (Home Office)?</Label>
                                    <div className="flex gap-4 mt-3">
                                        <RadioSimple theme={currentTheme} name="homeOffice" value="yes" label="Igen" />
                                        <RadioSimple theme={currentTheme} name="homeOffice" value="no" label="Nem" />
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                                    <Label theme={currentTheme}>Magasban végzett munka?</Label>
                                    <div className="flex gap-4 mt-3">
                                        <RadioSimple theme={currentTheme} name="highWork" value="yes" label="Igen" />
                                        <RadioSimple theme={currentTheme} name="highWork" value="no" label="Nem" />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 4. Épület és Higiénia */}
                        <Section theme={currentTheme} number="04" title="Épület és Higiénia" description="Az ingatlan jellemzői és a szociális helyiségek.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                <div>
                                    <Label theme={currentTheme}>Épület típusa</Label>
                                    <select name="buildingType" className={`mt-2 block w-full rounded-xl border-gray-300 py-3.5 px-4 bg-white shadow-sm border focus:ring-2 ${currentTheme === 'cyan' ? 'focus:ring-cyan-400' : 'focus:ring-orange-500'}`}>
                                        <option value="standalone">Önálló földszintes</option>
                                        <option value="multi_ground">Többszintes ép. fszt.</option>
                                        <option value="multi_floor">Többszintes ép. emelet</option>
                                        <option value="industrial">Ipari / Csarnok</option>
                                        <option value="residential">Társasház alja / Pince</option>
                                    </select>
                                </div>
                                <InputGroup theme={currentTheme} label="Hasznos alapterület (m²)" name="areaSize" type="number" placeholder="120" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                                <div>
                                    <Label theme={currentTheme}>Szintek száma</Label>
                                    <input type="text" name="floorNumber" className="w-full border rounded-xl p-3.5 placeholder-gray-400" placeholder="pl. 2 szintes" />
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Helyiségek listája</Label>
                                    <div className="grid grid-cols-2 gap-2 mt-2">
                                        <CheckboxCard theme={currentTheme} name="room_office" label="Iroda" />
                                        <CheckboxCard theme={currentTheme} name="room_guest" label="Vendégtér" />
                                        <CheckboxCard theme={currentTheme} name="room_kitchen" label="Konyha" />
                                        <CheckboxCard theme={currentTheme} name="room_warehouse" label="Raktár" />
                                        <CheckboxCard theme={currentTheme} name="room_social" label="Szociális" />
                                        <CheckboxCard theme={currentTheme} name="room_workshop" label="Műhely" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <h4 className={`font-bold mb-4 text-lg flex items-center gap-2 ${currentTheme === 'cyan' ? 'text-cyan-800' : 'text-orange-900'}`}>
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Higiénia
                                </h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                                        <Label theme={currentTheme}>Van WC / Mosdó?</Label>
                                        <div className="flex gap-4 mt-3">
                                            <RadioSimple theme={currentTheme} name="restroom" value="yes" label="Igen" />
                                            <RadioSimple theme={currentTheme} name="restroom" value="no" label="Nem" />
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                                        <Label theme={currentTheme}>Kézmosó / fertőtlenítő?</Label>
                                        <div className="flex gap-4 mt-3">
                                            <RadioSimple theme={currentTheme} name="handSanitizer" value="yes" label="Van" />
                                            <RadioSimple theme={currentTheme} name="handSanitizer" value="no" label="Nincs" />
                                        </div>
                                    </div>
                                    <div className="border border-slate-200 p-4 rounded-xl bg-white">
                                        <Label theme={currentTheme}>Klíma / Fan-coil?</Label>
                                        <div className="flex gap-4 mt-3">
                                            <RadioSimple theme={currentTheme} name="ac" value="yes" label="Van" />
                                            <RadioSimple theme={currentTheme} name="ac" value="no" label="Nincs" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 5. Szerkezetek */}
                        <Section theme={currentTheme} number="05" title="Épületszerkezetek" description="Falazat, tető és szigetelés.">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div>
                                    <Label theme={currentTheme}>Teherhordó falak</Label>
                                    <div className="mt-2 space-y-2">
                                        <RadioSimple theme={currentTheme} name="walls" value="brick" label="Tégla falazat" />
                                        <RadioSimple theme={currentTheme} name="walls" value="concrete" label="Panel / Vasbeton" />
                                        <RadioSimple theme={currentTheme} name="walls" value="light" label="Könnyűszerkezetes (gipszkarton)" />
                                        <RadioSimple theme={currentTheme} name="walls" value="unknown" label="Nem tudom" />
                                    </div>
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Födém (mennyezet)</Label>
                                    <div className="mt-2 space-y-2">
                                        <RadioSimple theme={currentTheme} name="ceiling" value="concrete" label="Vasbeton / Vakolt" />
                                        <RadioSimple theme={currentTheme} name="ceiling" value="wood" label="Fa / Gerendás" />
                                        <RadioSimple theme={currentTheme} name="ceiling" value="metal" label="Fém / Trapézlemez" />
                                        <RadioSimple theme={currentTheme} name="ceiling" value="unknown" label="Nem tudom / Álmennyezet" />
                                    </div>
                                </div>
                            </div>
                            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-dashed border-gray-200 pt-6">
                                <div>
                                    <Label theme={currentTheme}>Tető fedése</Label>
                                    <select name="roofCover" className="w-full border rounded-xl p-3 bg-white mt-1 shadow-sm">
                                        <option value="tile">Cserép</option>
                                        <option value="sheet">Lemez</option>
                                        <option value="flat">Lapos (bitumen)</option>
                                        <option value="shingle">Zsindely</option>
                                        <option value="panel">Szendvicspanel</option>
                                    </select>
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Külső szigetelés (Dryvit)?</Label>
                                    <div className="flex gap-4 mt-3">
                                        <RadioSimple theme={currentTheme} name="insulation" value="yes" label="Igen, van" />
                                        <RadioSimple theme={currentTheme} name="insulation" value="no" label="Nincs" />
                                        <RadioSimple theme={currentTheme} name="insulation" value="unknown" label="Nem tudom" />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 6. Menekülés */}
                        <Section theme={currentTheme} number="06" title="Menekülés" description="Útvonalak és segítségnyújtás.">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <Label theme={currentTheme}>Kijáratok száma</Label>
                                    <div className="flex gap-3 mt-2">
                                        <SelectableCard theme={currentTheme} name="exits" value="1" label="1 db" />
                                        <SelectableCard theme={currentTheme} name="exits" value="2" label="2 db" />
                                        <SelectableCard theme={currentTheme} name="exits" value="3" label="3+" />
                                    </div>
                                </div>
                                <div>
                                    <Label theme={currentTheme}>Főajtó szélessége</Label>
                                    <select name="doorWidth" className="w-full border rounded-xl p-3.5 bg-white mt-2 shadow-sm">
                                        <option value="90">Normál ajtó (~90 cm)</option>
                                        <option value="140">Kétszárnyú (~140 cm)</option>
                                        <option value="250">Üvegportál (250+ cm)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6">
                                <Label theme={currentTheme}>Vannak segítségre szoruló személyek? (pl. mozgáskorlátozott)</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <RadioSimple theme={currentTheme} name="disabled" value="no" label="Nincs" />
                                    <div className="flex items-center gap-2 flex-1">
                                        <RadioSimple theme={currentTheme} name="disabled" value="yes" label="Van:" />
                                        <input type="text" name="disabledDesc" className="flex-1 border-b border-gray-300 py-1 outline-none text-sm bg-transparent" placeholder="Kik? (pl. idősek)" />
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 border-t border-slate-100 pt-4">
                                <Label theme={currentTheme}>Legnagyobb menekülési távolság a kijáratig</Label>
                                <div className="flex flex-col sm:flex-row gap-4 mt-2">
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 mb-1 block font-bold">Méterben:</span>
                                        <input type="number" name="distM" className="w-full border rounded-lg p-2.5" placeholder="m" />
                                    </div>
                                    <div className="flex items-center justify-center text-gray-400 font-bold px-2">VAGY</div>
                                    <div className="flex-1">
                                        <span className="text-xs text-gray-500 mb-1 block font-bold">Lépésben (kb.):</span>
                                        <input type="number" name="distStep" className="w-full border rounded-lg p-2.5" placeholder="lépés" />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 7. Biztonság és Táblák - KÉPEKKEL */}
                        <Section theme={currentTheme} number="07" title="Biztonsági Felszerelések" description="Elsősegély, táblák és oltóeszközök.">
                            <div className="flex flex-col sm:flex-row gap-8 mb-10 items-start">
                                <div className="flex-1 bg-green-50 p-5 rounded-2xl border border-green-100 w-full">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">+</div>
                                        <Label theme={currentTheme}>Van elsősegély doboz?</Label>
                                    </div>
                                    <div className="flex gap-4">
                                        <RadioSimple theme={currentTheme} name="firstAid" value="yes" label="Igen" />
                                        <RadioSimple theme={currentTheme} name="firstAid" value="no" label="Nem" />
                                    </div>
                                </div>
                                <div className="flex-1 w-full bg-red-50 p-5 rounded-2xl border border-red-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Label theme={currentTheme}>Hány db tűzoltó készülék van?</Label>
                                    </div>
                                    <input type="number" name="extCount" className="w-full border border-red-200 rounded-xl p-3 mt-1 bg-white focus:ring-red-500" placeholder="db" />
                                </div>
                            </div>

                            <div>
                                <Label theme={currentTheme}>Milyen táblák vannak kitéve? (Jelöld be ami van)</Label>
                                <p className="text-xs text-gray-500 mb-4">Kérjük, ellenőrizze a falakon lévő matricákat az alábbi képek alapján.</p>

                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <ImageCheckbox theme={currentTheme} name="sign_firstaid" label="Elsősegély" src="/elsosegely.jpg" />
                                    <ImageCheckbox theme={currentTheme} name="sign_extinguisher" label="Tűzoltó készülék" src="/tuzoltokeszulek.jpg" />
                                    <ImageCheckbox theme={currentTheme} name="sign_escape" label="Menekülési út" src="/menekulesiutvonal.jpg" />
                                    <ImageCheckbox theme={currentTheme} name="sign_no_smoking" label="Dohányozni Tilos" src="/dohanyozni tilos.jpg" />

                                    <CheckboxCard theme={currentTheme} name="sign_gas" label="Gáz főelzáró" />
                                    <CheckboxCard theme={currentTheme} name="sign_emergency" label="Segélyhívó számok" />
                                    <CheckboxCard theme={currentTheme} name="sign_shelf" label="Polc terhelhetőség" />
                                    <CheckboxCard theme={currentTheme} name="sign_camera" label="Kamera megfigyelés" />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-slate-100">
                                <Label theme={currentTheme}>Milyen kémiai anyagokat használnak? (Tisztítószerek, vegyszerek)</Label>
                                <p className="text-xs text-gray-500 mb-2">Pl: Domestos, Sanytol, Benzin, Klór, stb.</p>
                                <textarea name="chemicals" className={`w-full border border-gray-300 rounded-xl p-3 h-20 focus:ring-2 placeholder-gray-400 ${currentTheme === 'cyan' ? 'focus:ring-cyan-400' : 'focus:ring-orange-500'}`} placeholder="Felsorolás..."></textarea>
                            </div>
                        </Section>

                        {/* 8. Rendszerek és Gépészet */}
                        <Section theme={currentTheme} number="08" title="Rendszerek és Gépészet" description="Jelzőrendszerek és közművek.">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <CheckboxCard theme={currentTheme} name="sys_alarm" label="Tűzjelző rendszer" />
                                <CheckboxCard theme={currentTheme} name="sys_sprinkler" label="Sprinkler / Oltórendszer" />
                                <CheckboxCard theme={currentTheme} name="sys_smoke" label="Füstérzékelő (önálló)" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
                                <div>
                                    <Label theme={currentTheme}>Villamos főkapcsoló helye</Label>
                                    <input type="text" name="mainSwitch" className="w-full border rounded-xl p-3.5 mt-1 placeholder-gray-400 shadow-sm" placeholder="pl. bejárat mellett" />
                                </div>
                                <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                                    <Label theme={currentTheme}>Gázellátás</Label>
                                    <div className="flex flex-col gap-3 mt-3">
                                        <RadioSimple theme={currentTheme} name="gasValve" value="no" label="Nincs gáz" />
                                        <RadioSimple theme={currentTheme} name="gasValve" value="yes" label="Vezetékes gáz van" />
                                        <RadioSimple theme={currentTheme} name="gasValve" value="pb" label="PB Gázpalack van" />
                                    </div>
                                </div>
                            </div>
                        </Section>

                        {/* 9. Hulladékkezelés */}
                        <Section theme={currentTheme} number="09" title="Hulladékkezelés" description="Tárolás módja.">
                            <Label theme={currentTheme}>Hogyan tárolják a hulladékot?</Label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <CheckboxCard theme={currentTheme} name="waste_communal" label="Kommunális (gyűjtőedényben)" />
                                <CheckboxCard theme={currentTheme} name="waste_select" label="Szelektív" />
                                <CheckboxCard theme={currentTheme} name="waste_hazard" label="Veszélyes (zárt, ellenőrzött)" />
                                <CheckboxCard theme={currentTheme} name="waste_industrial" label="Ipari (tömörítve/elkülönítve)" />
                            </div>
                        </Section>

                        {/* 10. Polc és Fotók */}
                        <Section theme={currentTheme} number="10" title="Raktározás és Fotók" description="Polcrendszerek és helyszíni képek.">
                            <div className="mb-8 border-b border-slate-100 pb-6">
                                <Label theme={currentTheme}>Fém polcrendszer terhelhetősége (ha van)</Label>
                                <div className="flex items-center gap-4 mt-2">
                                    <div className="flex items-center gap-2 border rounded-xl p-3 bg-slate-50">
                                        <input type="number" name="shelfLoad" className="w-20 bg-transparent outline-none text-right font-bold text-lg" placeholder="0" />
                                        <span className="text-sm font-semibold text-slate-500">kg</span>
                                    </div>
                                    <span className="text-sm text-gray-400">vagy</span>
                                    <CheckboxCard theme={currentTheme} name="shelfLabelMissing" label="Nincs jelölés kirakva" />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                                    </div>
                                    <Label theme={currentTheme}>Kérjük, csatolja az alábbi fotókat:</Label>
                                </div>

                                <ul className="list-disc list-inside text-sm text-slate-700 mb-6 pl-2 space-y-1">
                                    <li><strong>Gáz főelzáró</strong> helye</li>
                                    <li><strong>Villamos főkapcsoló</strong> helye</li>
                                    <li><strong>Tűzoltó készülékek</strong> elhelyezkedése</li>
                                    <li><strong>Áttekintő kép</strong> a telephelyről</li>
                                </ul>

                                <div className="space-y-2">
                                    <input type="file" multiple className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm" />
                                    <p className="text-xs text-blue-500 mt-3 font-medium">* A fotók feltöltése opcionális itt, emailben is pótolható.</p>
                                </div>
                            </div>
                        </Section>
                    </>
                )}

                {/* 11. Egyéb (Közös szekció) - CSAK HA NEM GENERÁLÁS */}
                {activeTab !== 'generate' && (
                    <Section theme={currentTheme} number={activeTab === 'fire' ? "11" : "04"} title="Megjegyzés" description="Bármi egyéb fontos információ.">
                        <textarea
                            name="notes"
                            className={`w-full p-4 border border-gray-300 rounded-2xl shadow-sm focus:ring-4 min-h-[120px] outline-none transition-all placeholder-gray-400 ${currentTheme === 'cyan' ? 'focus:ring-cyan-100 focus:border-cyan-400' : (currentTheme === 'orange' ? 'focus:ring-orange-100 focus:border-orange-500' : (currentTheme === 'purple' ? 'focus:ring-indigo-100 focus:border-indigo-500' : 'focus:ring-slate-100 focus:border-slate-400'))}`}
                            placeholder="Írjon ide bármit, amit fontosnak tart..."
                        ></textarea>
                    </Section>
                )}

                {/* =========================================================================
             GENERÁLÁS TAB (Purple Theme)
            ========================================================================= */}
                {activeTab === 'generate' && (
                    <Section theme={currentTheme} number="01" title="Generálás beállításai" description="Adja meg a címzettet és az érvényességi időt.">
                        <div className="grid grid-cols-1 gap-6">
                            <InputGroup theme={currentTheme} label="E-mail cím" name="gen_email" type="email" placeholder="cimzett@pelda.hu" fullWidth />

                            <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                <Label theme={currentTheme}>Token érvényességi ideje</Label>
                                <div className="grid grid-cols-1 gap-4 mt-3">
                                    <div className="flex flex-wrap gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="gen_token_duration" value="1h" checked={genTokenDuration === '1h'} onChange={() => setGenTokenDuration('1h')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-semibold text-slate-700">1 óra</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="gen_token_duration" value="2h" checked={genTokenDuration === '2h'} onChange={() => setGenTokenDuration('2h')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-semibold text-slate-700">2 óra</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="gen_token_duration" value="24h" checked={genTokenDuration === '24h'} onChange={() => setGenTokenDuration('24h')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-semibold text-slate-700">1 nap</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="gen_token_duration" value="48h" checked={genTokenDuration === '48h'} onChange={() => setGenTokenDuration('48h')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-semibold text-slate-700">2 nap</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="gen_token_duration" value="custom" checked={genTokenDuration === 'custom'} onChange={() => setGenTokenDuration('custom')} className="text-indigo-600 focus:ring-indigo-500" />
                                            <span className="text-sm font-semibold text-slate-700">Egyéni</span>
                                        </label>
                                    </div>

                                    {/* Egyéni input mezők */}
                                    {genTokenDuration === 'custom' && (
                                        <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                            <input type="number" name="gen_custom_amount" placeholder="Idő" className="w-24 border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400" min="1" />
                                            <select name="gen_custom_unit" className="border rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-400 bg-white">
                                                <option value="hours">Óra</option>
                                                <option value="days">Nap</option>
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </Section>
                )}

                {/* Submit Gomb */}
                <div className="pt-8 pb-16">
                    <button type="submit" disabled={loading} className={`group relative w-full flex justify-center py-5 px-6 border border-transparent text-lg font-bold rounded-2xl text-white shadow-2xl transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed 
                        ${activeTab === 'fire' ? 'bg-gradient-to-r from-cyan-600 to-cyan-400 hover:from-cyan-500 hover:to-cyan-300 shadow-cyan-200' : ''}
                        ${activeTab === 'vbf' ? 'bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 shadow-orange-200' : ''}
                        ${activeTab === 'haccp' ? 'bg-gradient-to-r from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 shadow-emerald-200' : ''}
                        ${activeTab === 'generate' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-200 cursor-not-allowed opacity-80' : ''}
                    `}>
                        <span className="relative flex items-center gap-3">
                            {loading ? "MENTÉS FOLYAMATBAN..." : (activeTab === 'fire' ? "ADATLAP BEKÜLDÉSE" : (activeTab === 'generate' ? "GENERÁLÁS ÉS KÜLDÉS" : "MEGRENDELÉS KÜLDÉSE"))}
                            {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
                        </span>
                    </button>
                    <p className="text-center text-xs text-slate-400 mt-4">A beküldéssel hozzájárul az adatok feldolgozásához.</p>
                </div>

            </form>
        </div>
    );
}

// --- DESIGN KOMPONENSEK ---

interface ThemeProps {
    theme?: Theme;
}

function Section({ number, title, description, children, theme = 'cyan' }: { number?: string, title: string, description?: string, children: React.ReactNode } & ThemeProps) {
    let accentClass = '';
    if (theme === 'cyan') accentClass = 'bg-cyan-50 text-cyan-600 border-cyan-100';
    if (theme === 'orange') accentClass = 'bg-orange-50 text-orange-600 border-orange-100';
    if (theme === 'gray') accentClass = 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (theme === 'purple') accentClass = 'bg-indigo-50 text-indigo-600 border-indigo-100';

    return (
        <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)]">
            <div className="flex items-start gap-5 mb-8 border-b border-slate-50 pb-6">
                {number && <span className={`flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl font-extrabold text-xl border shadow-sm ${accentClass}`}>{number}</span>}
                <div className="pt-1">
                    <h2 className="text-2xl font-bold text-slate-800 tracking-tight">{title}</h2>
                    {description && <p className="text-slate-500 mt-1 text-sm leading-relaxed">{description}</p>}
                </div>
            </div>
            <div className="space-y-6">
                {children}
            </div>
        </div>
    );
}

function Label({ children, theme = 'cyan' }: { children: React.ReactNode } & ThemeProps) {
    return <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide text-[11px]">{children}</label>;
}

function InputGroup({ label, name, type = "text", placeholder, fullWidth, required, theme = 'cyan' }: any) {
    let focusClass = '';
    if (theme === 'cyan') focusClass = 'focus:border-cyan-400 focus:ring-cyan-500/10';
    if (theme === 'orange') focusClass = 'focus:border-orange-500 focus:ring-orange-500/10';
    if (theme === 'gray') focusClass = 'focus:border-emerald-500 focus:ring-emerald-500/10';
    if (theme === 'purple') focusClass = 'focus:border-indigo-500 focus:ring-indigo-500/10';

    return (
        <div className={fullWidth ? "w-full" : ""}>
            <Label theme={theme}>{label} {required && <span className="text-red-500 text-lg align-top">*</span>}</Label>
            <input
                type={type}
                name={name}
                required={required}
                placeholder={placeholder}
                className={`block w-full rounded-xl border-gray-200 bg-slate-50 text-slate-800 py-3.5 pl-4 border focus:bg-white focus:ring-4 transition-all sm:text-sm shadow-sm outline-none placeholder-gray-400 ${focusClass}`}
            />
        </div>
    );
}

function SelectableCard({ name, value, label, children, theme = 'cyan' }: any) {
    let themeClass = '';
    let iconColor = '';
    if (theme === 'cyan') {
        themeClass = 'hover:border-cyan-400 hover:ring-cyan-100 has-[:checked]:border-cyan-500 has-[:checked]:ring-cyan-500 has-[:checked]:bg-cyan-50/10';
        iconColor = 'text-cyan-500';
    } else if (theme === 'orange') {
        themeClass = 'hover:border-orange-400 hover:ring-orange-100 has-[:checked]:border-orange-500 has-[:checked]:ring-orange-500 has-[:checked]:bg-orange-50/10';
        iconColor = 'text-orange-600';
    } else if (theme === 'gray') {
        themeClass = 'hover:border-emerald-400 hover:ring-emerald-100 has-[:checked]:border-emerald-500 has-[:checked]:ring-emerald-500 has-[:checked]:bg-emerald-50/10';
        iconColor = 'text-emerald-600';
    } else if (theme === 'purple') {
        themeClass = 'hover:border-indigo-400 hover:ring-indigo-100 has-[:checked]:border-indigo-500 has-[:checked]:ring-indigo-500 has-[:checked]:bg-indigo-50/10';
        iconColor = 'text-indigo-600';
    }

    return (
        <label className={`relative flex cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm focus:outline-none transition-all has-[:checked]:ring-2 hover:ring-2 ${themeClass}`}>
            <input type="radio" name={name} value={value} className="sr-only" />
            <div className="flex w-full flex-col">
                <span className="block text-sm font-semibold text-gray-900">{label}</span>
                {children}
            </div>
            <div className={`absolute top-4 right-4 hidden has-[:checked]:block animate-in fade-in zoom-in duration-200 ${iconColor}`}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
        </label>
    );
}

function CheckboxCard({ label, name, theme = 'cyan' }: { label: string, name: string } & ThemeProps) {
    let cardClass = '';
    let checkClass = '';

    if (theme === 'cyan') {
        cardClass = 'hover:bg-cyan-50 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50/30';
        checkClass = 'text-cyan-500 focus:ring-cyan-400';
    } else if (theme === 'orange') {
        cardClass = 'hover:bg-orange-50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50/30';
        checkClass = 'text-orange-600 focus:ring-orange-500';
    } else if (theme === 'gray') {
        cardClass = 'hover:bg-emerald-50 has-[:checked]:border-emerald-500 has-[:checked]:bg-emerald-50/30';
        checkClass = 'text-emerald-600 focus:ring-emerald-500';
    } else if (theme === 'purple') {
        cardClass = 'hover:bg-indigo-50 has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/30';
        checkClass = 'text-indigo-600 focus:ring-indigo-500';
    }

    return (
        <label className={`flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer transition-all has-[:checked]:shadow-sm ${cardClass}`}>
            <input type="checkbox" name={name} value={label} className={`h-5 w-5 rounded border-gray-300 cursor-pointer focus:ring-offset-0 ${checkClass}`} />
            <span className="text-sm font-semibold text-slate-700">{label}</span>
        </label>
    );
}

function ImageCheckbox({ label, name, src, theme = 'cyan' }: { label: string, name: string, src: string } & ThemeProps) {
    let cardClass = '';
    let checkClass = '';

    if (theme === 'cyan') {
        cardClass = 'hover:bg-cyan-50 has-[:checked]:border-cyan-500 has-[:checked]:bg-cyan-50/20';
        checkClass = 'text-cyan-500 focus:ring-cyan-400';
    } else if (theme === 'orange') {
        cardClass = 'hover:bg-orange-50 has-[:checked]:border-orange-500 has-[:checked]:bg-orange-50/20';
        checkClass = 'text-orange-600 focus:ring-orange-500';
    }

    return (
        <label className={`flex flex-col items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer transition-all has-[:checked]:shadow-md ${cardClass}`}>
            <div className="w-full aspect-square relative bg-white rounded-lg overflow-hidden flex items-center justify-center p-2">
                <img src={src} alt={label} className="w-full h-full object-contain" />
            </div>
            <div className="flex items-center gap-2 w-full justify-center">
                <input type="checkbox" name={name} value={label} className={`h-4 w-4 rounded border-gray-300 cursor-pointer flex-shrink-0 ${checkClass}`} />
                <span className="text-xs font-bold text-slate-700 leading-tight">{label}</span>
            </div>
        </label>
    );
}

function RadioSimple({ name, value, label, theme = 'cyan' }: any) {
    let radioClass = '';
    let textHoverClass = '';

    if (theme === 'cyan') {
        radioClass = 'checked:border-cyan-500 checked:bg-cyan-500';
        textHoverClass = 'group-hover:text-cyan-600';
    } else if (theme === 'orange') {
        radioClass = 'checked:border-orange-600 checked:bg-orange-600';
        textHoverClass = 'group-hover:text-orange-700';
    } else if (theme === 'gray') {
        radioClass = 'checked:border-emerald-600 checked:bg-emerald-600';
        textHoverClass = 'group-hover:text-emerald-600';
    } else if (theme === 'purple') {
        radioClass = 'checked:border-indigo-600 checked:bg-indigo-600';
        textHoverClass = 'group-hover:text-indigo-600';
    }

    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5">
                <input type="radio" name={name} value={value} className={`peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full transition-all cursor-pointer ${radioClass}`} />
                <div className="absolute w-2 h-2 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className={`text-sm text-gray-700 transition-colors font-medium ${textHoverClass}`}>{label}</span>
        </label>
    );
}