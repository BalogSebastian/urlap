// /app/components/FireSafetyForm.tsx
"use client";

import React, { useState } from "react";

export default function FireSafetyForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- MENTÉS LOGIKA ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};
    
    // Adatok összegzése
    formData.forEach((value, key) => {
      // Ha fájlt töltöttek fel, csak a nevét mentjük el szövegként
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

      {/* --- FEJLÉC --- */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-10 border border-slate-100">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-900 rounded-full blur-3xl opacity-10"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-80 h-80 bg-orange-500 rounded-full blur-3xl opacity-10"></div>
        
        <div className="relative z-10 p-10 sm:p-14 text-center">
          <div className="inline-flex items-center justify-center p-4 bg-indigo-50 text-indigo-900 rounded-2xl mb-6 shadow-sm ring-1 ring-indigo-100">
             <span className="font-black text-2xl tracking-tighter">TSG</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 mb-6">
            Trident Shield Group Kft. <br/><span className="text-indigo-700">Adatbekérő</span>
          </h1>
          <p className="text-lg text-slate-500 max-w-3xl mx-auto leading-relaxed">
            Kérjük, pontosan töltse ki az alábbi űrlapot a tűz- és munkavédelmi dokumentáció szakszerű elkészítéséhez.
          </p>
        </div>
        <div className="h-2 w-full bg-gradient-to-r from-indigo-900 via-blue-600 to-orange-500"></div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-10">
        
        {/* 1. Cégadatok */}
        <Section number="01" title="Cégadatok és Kapcsolattartás" description="A vállalkozás hivatalos adatai és az ügyvezető elérhetősége.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Cég teljes neve" name="companyName" placeholder="pl. Minta Kft." fullWidth required />
            <InputGroup label="Székhely címe" name="headquarters" placeholder="Irányítószám, Város, Utca, Házszám" required />
            <InputGroup label="Telephely címe (ahová az anyag készül)" name="siteAddress" placeholder="Pontos cím" required />
            <InputGroup label="Adószám" name="taxNumber" placeholder="xxxxxxxx-x-xx" />
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-100">
             <Label>Ügyvezető adatai</Label>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-3">
                <InputGroup label="Név" name="managerName" placeholder="Vezető neve" fullWidth />
                <InputGroup label="Telefonszám" name="managerPhone" placeholder="+36..." fullWidth />
                <InputGroup label="E-mail cím" name="managerEmail" placeholder="vezeto@ceg.hu" type="email" fullWidth />
             </div>
          </div>
        </Section>

        {/* 2. Tevékenység */}
        <Section number="02" title="Tevékenység és Működés" description="Mivel foglalkozik a cég napi szinten?">
          <InputGroup label="Fő tevékenység megnevezése" name="mainActivity" placeholder="pl. autószerelés, iroda, kereskedelem..." fullWidth required />
          
          <div className="mt-6">
             <Label>Röviden összefoglalva írd le a napi tevékenységet</Label>
             <textarea name="dailyActivity" className="w-full border border-gray-300 rounded-xl p-4 h-24 text-sm focus:ring-2 focus:ring-indigo-500 placeholder-gray-400 outline-none transition-all" placeholder="Pl: Reggel áruátvétel, napközben kiszolgálás, adminisztráció..."></textarea>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
             <InputGroup label="Alkalmazottak száma" name="employees" type="number" placeholder="0" />
             <InputGroup label="Alvállalkozók száma" name="subcontractors" type="number" placeholder="0" />
             <InputGroup label="Ügyfélforgalom (max/nap)" name="clientsMax" type="number" placeholder="0" />
          </div>

          <div className="pt-6">
            <Label>Munkához használt eszközök és berendezések</Label>
            <input type="text" name="toolsUsed" className="w-full border-b border-gray-300 py-2 focus:border-indigo-600 outline-none placeholder-gray-400 transition-colors" placeholder="pl: fúró, targonca, számítógép, kávéfőző, létra..." />
          </div>

          <div className="pt-6">
            <Label>Van-e speciális technológia? (pl. hegesztés, festés)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <SelectableCard name="specialTech" value="no" label="Nincs" />
              <SelectableCard name="specialTech" value="yes" label="Van (fejtse ki):">
                 <input type="text" name="specialTechDesc" className="mt-2 w-full text-sm border-b border-gray-300 outline-none bg-transparent" placeholder="..." />
              </SelectableCard>
            </div>
          </div>

          <div className="pt-6">
            <Label>Működés jellege (Több is jelölhető)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
              <CheckboxCard name="type_shop" label="Üzlet / Vendégtér" />
              <CheckboxCard name="type_office" label="Csak iroda" />
              <CheckboxCard name="type_warehouse" label="Raktár" />
              <CheckboxCard name="type_workshop" label="Műhely / Termelés" />
              <CheckboxCard name="type_social" label="Szociális / Öltöző" />
              <CheckboxCard name="type_education" label="Oktatás" />
            </div>
          </div>
        </Section>

        {/* 3. Munkakörülmények */}
        <Section number="03" title="Munkakörülmények" description="Munkavédelmi szempontból fontos kérdések.">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <Label>Képernyő előtti munkavégzés?</Label>
                 <div className="flex gap-4 mt-3">
                    <RadioSimple name="screenWork" value="yes" label="Igen" />
                    <RadioSimple name="screenWork" value="no" label="Nem" />
                 </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <Label>Otthoni munkavégzés (Home Office)?</Label>
                 <div className="flex gap-4 mt-3">
                    <RadioSimple name="homeOffice" value="yes" label="Igen" />
                    <RadioSimple name="homeOffice" value="no" label="Nem" />
                 </div>
              </div>
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                 <Label>Magasban végzett munka?</Label>
                 <div className="flex gap-4 mt-3">
                    <RadioSimple name="highWork" value="yes" label="Igen" />
                    <RadioSimple name="highWork" value="no" label="Nem" />
                 </div>
              </div>
           </div>
        </Section>

        {/* 4. Épület és Higiénia */}
        <Section number="04" title="Épület és Higiénia" description="Az ingatlan jellemzői és a szociális helyiségek.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
             <div>
                <Label>Épület típusa</Label>
                <select name="buildingType" className="mt-2 block w-full rounded-xl border-gray-300 py-3.5 px-4 bg-white focus:ring-2 focus:ring-indigo-500 shadow-sm border">
                   <option value="standalone">Önálló földszintes</option>
                   <option value="multi_ground">Többszintes ép. fszt.</option>
                   <option value="multi_floor">Többszintes ép. emelet</option>
                   <option value="industrial">Ipari / Csarnok</option>
                   <option value="residential">Társasház alja / Pince</option>
                </select>
             </div>
             <InputGroup label="Hasznos alapterület (m²)" name="areaSize" type="number" placeholder="120" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
             <div>
                <Label>Szintek száma</Label>
                <input type="text" name="floorNumber" className="w-full border rounded-xl p-3.5 placeholder-gray-400" placeholder="pl. 2 szintes" />
             </div>
             <div>
                <Label>Helyiségek listája</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                   <CheckboxCard name="room_office" label="Iroda" />
                   <CheckboxCard name="room_guest" label="Vendégtér" />
                   <CheckboxCard name="room_kitchen" label="Konyha" />
                   <CheckboxCard name="room_warehouse" label="Raktár" />
                   <CheckboxCard name="room_social" label="Szociális" />
                   <CheckboxCard name="room_workshop" label="Műhely" />
                </div>
             </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-100">
             <h4 className="font-bold text-indigo-900 mb-4 text-lg flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                Higiénia
             </h4>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="border border-slate-200 p-4 rounded-xl bg-white">
                   <Label>Van WC / Mosdó?</Label>
                   <div className="flex gap-4 mt-3">
                      <RadioSimple name="restroom" value="yes" label="Igen" />
                      <RadioSimple name="restroom" value="no" label="Nem" />
                   </div>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-white">
                   <Label>Kézmosó / fertőtlenítő?</Label>
                   <div className="flex gap-4 mt-3">
                      <RadioSimple name="handSanitizer" value="yes" label="Van" />
                      <RadioSimple name="handSanitizer" value="no" label="Nincs" />
                   </div>
                </div>
                <div className="border border-slate-200 p-4 rounded-xl bg-white">
                   <Label>Klíma / Fan-coil?</Label>
                   <div className="flex gap-4 mt-3">
                      <RadioSimple name="ac" value="yes" label="Van" />
                      <RadioSimple name="ac" value="no" label="Nincs" />
                   </div>
                </div>
             </div>
          </div>
        </Section>

        {/* 5. Szerkezetek */}
        <Section number="05" title="Épületszerkezetek" description="Falazat, tető és szigetelés.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <Label>Teherhordó falak</Label>
              <div className="mt-2 space-y-2">
                <RadioSimple name="walls" value="brick" label="Tégla falazat" />
                <RadioSimple name="walls" value="concrete" label="Panel / Vasbeton" />
                <RadioSimple name="walls" value="light" label="Könnyűszerkezetes (gipszkarton)" />
                <RadioSimple name="walls" value="unknown" label="Nem tudom" />
              </div>
            </div>
            <div>
              <Label>Födém (mennyezet)</Label>
              <div className="mt-2 space-y-2">
                <RadioSimple name="ceiling" value="concrete" label="Vasbeton / Vakolt" />
                <RadioSimple name="ceiling" value="wood" label="Fa / Gerendás" />
                <RadioSimple name="ceiling" value="metal" label="Fém / Trapézlemez" />
                <RadioSimple name="ceiling" value="unknown" label="Nem tudom / Álmennyezet" />
              </div>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-dashed border-gray-200 pt-6">
             <div>
                 <Label>Tető fedése</Label>
                 <select name="roofCover" className="w-full border rounded-xl p-3 bg-white mt-1 shadow-sm">
                    <option value="tile">Cserép</option>
                    <option value="sheet">Lemez</option>
                    <option value="flat">Lapos (bitumen)</option>
                    <option value="shingle">Zsindely</option>
                    <option value="panel">Szendvicspanel</option>
                 </select>
             </div>
             <div>
                 <Label>Külső szigetelés (Dryvit)?</Label>
                 <div className="flex gap-4 mt-3">
                    <RadioSimple name="insulation" value="yes" label="Igen, van" />
                    <RadioSimple name="insulation" value="no" label="Nincs" />
                    <RadioSimple name="insulation" value="unknown" label="Nem tudom" />
                 </div>
             </div>
          </div>
        </Section>

        {/* 6. Menekülés */}
        <Section number="06" title="Menekülés" description="Útvonalak és segítségnyújtás.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <Label>Kijáratok száma</Label>
                  <div className="flex gap-3 mt-2">
                      <SelectableCard name="exits" value="1" label="1 db" />
                      <SelectableCard name="exits" value="2" label="2 db" />
                      <SelectableCard name="exits" value="3" label="3+" />
                  </div>
              </div>
              <div>
                  <Label>Főajtó szélessége</Label>
                  <select name="doorWidth" className="w-full border rounded-xl p-3.5 bg-white mt-2 shadow-sm">
                      <option value="90">Normál ajtó (~90 cm)</option>
                      <option value="140">Kétszárnyú (~140 cm)</option>
                      <option value="250">Üvegportál (250+ cm)</option>
                  </select>
              </div>
           </div>
           
           <div className="mt-6">
              <Label>Vannak segítségre szoruló személyek? (pl. mozgáskorlátozott)</Label>
              <div className="flex items-center gap-4 mt-2">
                  <RadioSimple name="disabled" value="no" label="Nincs" />
                  <div className="flex items-center gap-2 flex-1">
                      <RadioSimple name="disabled" value="yes" label="Van:" />
                      <input type="text" name="disabledDesc" className="flex-1 border-b border-gray-300 py-1 outline-none text-sm bg-transparent" placeholder="Kik? (pl. idősek)" />
                  </div>
              </div>
           </div>

           <div className="mt-6 border-t border-slate-100 pt-4">
              <Label>Legnagyobb menekülési távolság a kijáratig</Label>
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
        <Section number="07" title="Biztonsági Felszerelések" description="Elsősegély, táblák és oltóeszközök.">
           <div className="flex flex-col sm:flex-row gap-8 mb-10 items-start">
              <div className="flex-1 bg-green-50 p-5 rounded-2xl border border-green-100 w-full">
                 <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">+</div>
                    <Label>Van elsősegély doboz?</Label>
                 </div>
                 <div className="flex gap-4">
                    <RadioSimple name="firstAid" value="yes" label="Igen" />
                    <RadioSimple name="firstAid" value="no" label="Nem" />
                 </div>
              </div>
              <div className="flex-1 w-full bg-red-50 p-5 rounded-2xl border border-red-100">
                 <div className="flex items-center gap-3 mb-3">
                    <Label>Hány db tűzoltó készülék van?</Label>
                 </div>
                 <input type="number" name="extCount" className="w-full border border-red-200 rounded-xl p-3 mt-1 bg-white focus:ring-red-500" placeholder="db" />
              </div>
           </div>

           <div>
              <Label>Milyen táblák vannak kitéve? (Jelöld be ami van)</Label>
              <p className="text-xs text-gray-500 mb-4">Kérjük, ellenőrizze a falakon lévő matricákat az alábbi képek alapján.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                 <ImageCheckbox name="sign_firstaid" label="Elsősegély" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/First_aid_sign.svg/300px-First_aid_sign.svg.png" />
                 <ImageCheckbox name="sign_extinguisher" label="Tűzoltó készülék" src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5c/ISO_7010_F001.svg/300px-ISO_7010_F001.svg.png" />
                 <ImageCheckbox name="sign_escape" label="Menekülési út" src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Emergency_exit_icon.svg/300px-Emergency_exit_icon.svg.png" />
                 <ImageCheckbox name="sign_no_smoking" label="Dohányozni Tilos" src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/No_Smoking.svg/300px-No_Smoking.svg.png" />
                 
                 <CheckboxCard name="sign_gas" label="Gáz főelzáró" />
                 <CheckboxCard name="sign_emergency" label="Segélyhívó számok" />
                 <CheckboxCard name="sign_shelf" label="Polc terhelhetőség" />
                 <CheckboxCard name="sign_camera" label="Kamera megfigyelés" />
              </div>
           </div>

           <div className="mt-8 pt-6 border-t border-slate-100">
              <Label>Milyen kémiai anyagokat használnak? (Tisztítószerek, vegyszerek)</Label>
              <p className="text-xs text-gray-500 mb-2">Pl: Domestos, Sanytol, Benzin, Klór, stb.</p>
              <textarea name="chemicals" className="w-full border border-gray-300 rounded-xl p-3 h-20 focus:ring-2 focus:ring-indigo-500 placeholder-gray-400" placeholder="Felsorolás..."></textarea>
           </div>
        </Section>

        {/* 8. Rendszerek és Gépészet */}
        <Section number="08" title="Rendszerek és Gépészet" description="Jelzőrendszerek és közművek.">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <CheckboxCard name="sys_alarm" label="Tűzjelző rendszer" />
              <CheckboxCard name="sys_sprinkler" label="Sprinkler / Oltórendszer" />
              <CheckboxCard name="sys_smoke" label="Füstérzékelő (önálló)" />
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-6">
              <div>
                 <Label>Villamos főkapcsoló helye</Label>
                 <input type="text" name="mainSwitch" className="w-full border rounded-xl p-3.5 mt-1 placeholder-gray-400 shadow-sm" placeholder="pl. bejárat mellett" />
              </div>
              <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100">
                 <Label>Gázellátás</Label>
                 <div className="flex flex-col gap-3 mt-3">
                    <RadioSimple name="gasValve" value="no" label="Nincs gáz" />
                    <RadioSimple name="gasValve" value="yes" label="Vezetékes gáz van" />
                    <RadioSimple name="gasValve" value="pb" label="PB Gázpalack van" />
                 </div>
              </div>
           </div>
        </Section>

        {/* 9. Hulladékkezelés */}
        <Section number="09" title="Hulladékkezelés" description="Tárolás módja.">
             <Label>Hogyan tárolják a hulladékot?</Label>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                 <CheckboxCard name="waste_communal" label="Kommunális (gyűjtőedényben)" />
                 <CheckboxCard name="waste_select" label="Szelektív" />
                 <CheckboxCard name="waste_hazard" label="Veszélyes (zárt, ellenőrzött)" />
                 <CheckboxCard name="waste_industrial" label="Ipari (tömörítve/elkülönítve)" />
             </div>
        </Section>

        {/* 10. Polc és Fotók */}
        <Section number="10" title="Raktározás és Fotók" description="Polcrendszerek és helyszíni képek.">
           <div className="mb-8 border-b border-slate-100 pb-6">
              <Label>Fém polcrendszer terhelhetősége (ha van)</Label>
              <div className="flex items-center gap-4 mt-2">
                 <div className="flex items-center gap-2 border rounded-xl p-3 bg-slate-50">
                    <input type="number" name="shelfLoad" className="w-20 bg-transparent outline-none text-right font-bold text-lg" placeholder="0" />
                    <span className="text-sm font-semibold text-slate-500">kg</span>
                 </div>
                 <span className="text-sm text-gray-400">vagy</span>
                 <CheckboxCard name="shelfLabelMissing" label="Nincs jelölés kirakva" />
              </div>
           </div>

           <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100">
              <div className="flex items-center gap-3 mb-4">
                 <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
                 </div>
                 <Label>Kérjük, csatolja az alábbi fotókat:</Label>
              </div>
              
              <ul className="list-disc list-inside text-sm text-slate-700 mb-6 pl-2 space-y-1">
                 <li><strong>Gáz főelzáró</strong> helye</li>
                 <li><strong>Villamos főkapcsoló</strong> helye</li>
                 <li><strong>Tűzoltó készülékek</strong> elhelyezkedése</li>
                 <li><strong>Áttekintő kép</strong> a telephelyről</li>
              </ul>
              
              <div className="space-y-2">
                 <input type="file" multiple className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-700 transition-all cursor-pointer shadow-sm"/>
                 <p className="text-xs text-blue-500 mt-3 font-medium">* A fotók feltöltése opcionális itt, emailben is pótolható.</p>
              </div>
           </div>
        </Section>

        {/* 11. Egyéb */}
        <Section number="11" title="Megjegyzés" description="Bármi egyéb fontos információ.">
           <textarea 
             name="notes"
             className="w-full p-4 border border-gray-300 rounded-2xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 min-h-[120px] outline-none transition-all placeholder-gray-400"
             placeholder="Pl. pincehasználat, szomszédos épület, éjszakai műszak, kulcsok helye..."
           ></textarea>
        </Section>

        {/* Submit Gomb */}
        <div className="pt-8 pb-16">
           <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-5 px-6 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-900 to-blue-800 hover:from-indigo-800 hover:to-blue-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/30 shadow-2xl shadow-indigo-200 transform transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed">
             <span className="relative flex items-center gap-3">
               {loading ? "MENTÉS FOLYAMATBAN..." : "ADATLAP BEKÜLDÉSE"}
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

function Section({ number, title, description, children }: { number?: string, title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.05)] border border-slate-100 transition-all hover:shadow-[0_10px_35px_-5px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-5 mb-8 border-b border-slate-50 pb-6">
        {number && <span className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-700 font-extrabold text-xl border border-indigo-100 shadow-sm">{number}</span>}
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

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-bold text-slate-700 mb-2 uppercase tracking-wide text-[11px]">{children}</label>;
}

function InputGroup({ label, name, type = "text", placeholder, fullWidth, required }: any) {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Label>{label} {required && <span className="text-red-500 text-lg align-top">*</span>}</Label>
      <input 
        type={type} 
        name={name} 
        required={required}
        placeholder={placeholder}
        className="block w-full rounded-xl border-gray-200 bg-slate-50 text-slate-800 py-3.5 pl-4 border focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all sm:text-sm shadow-sm outline-none placeholder-gray-400"
      />
    </div>
  );
}

function SelectableCard({ name, value, label, children }: any) {
  return (
    <label className="relative flex cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm focus:outline-none transition-all hover:border-indigo-400 hover:ring-2 hover:ring-indigo-100 has-[:checked]:border-indigo-600 has-[:checked]:ring-2 has-[:checked]:ring-indigo-600 has-[:checked]:bg-indigo-50/10">
      <input type="radio" name={name} value={value} className="sr-only" />
      <div className="flex w-full flex-col">
        <span className="block text-sm font-semibold text-gray-900">{label}</span>
        {children}
      </div>
      <div className="absolute top-4 right-4 hidden has-[:checked]:block text-indigo-600 animate-in fade-in zoom-in duration-200">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
    </label>
  );
}

function CheckboxCard({ label, name }: { label: string, name: string }) {
  return (
     <label className="flex items-center gap-3 p-3.5 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/30 has-[:checked]:shadow-sm">
        <input type="checkbox" name={name} value={label} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
        <span className="text-sm font-semibold text-slate-700">{label}</span>
     </label>
  );
}

// --- ÚJ KÉPES CHECKBOX KOMPONENS ---
function ImageCheckbox({ label, name, src }: { label: string, name: string, src: string }) {
    return (
       <label className="flex flex-col items-center gap-3 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition-all has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/20 has-[:checked]:shadow-md">
          <div className="w-full aspect-square relative bg-white rounded-lg overflow-hidden flex items-center justify-center p-2">
              <img src={src} alt={label} className="w-full h-full object-contain" />
          </div>
          <div className="flex items-center gap-2 w-full justify-center">
            <input type="checkbox" name={name} value={label} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer flex-shrink-0" />
            <span className="text-xs font-bold text-slate-700 leading-tight">{label}</span>
          </div>
       </label>
    );
}

function RadioSimple({ name, value, label }: any) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5">
                <input type="radio" name={name} value={value} className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-indigo-600 checked:bg-indigo-600 transition-all cursor-pointer" />
                <div className="absolute w-2 h-2 bg-white rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-indigo-700 transition-colors font-medium">{label}</span>
        </label>
    );
}