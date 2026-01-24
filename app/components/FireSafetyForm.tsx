"use client";

import React, { useState } from "react";

export default function FireSafetyForm() {
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  // --- MENTÉS LOGIKA (POST API) ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Adatok kinyerése
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const data: any = {};
    
    // Checkboxok kezelése (összefűzés, ha több azonos nevű van)
    formData.forEach((value, key) => {
      if (data[key]) {
        data[key] = data[key] + ", " + value;
      } else {
        data[key] = value;
      }
    });

    try {
        // API hívás a MongoDB-hez
        const res = await fetch("/api/submissions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });

        if (res.ok) {
            setIsSubmitted(true);
            form.reset();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => setIsSubmitted(false), 5000); // 5 mp után eltűnik az üzenet
        } else {
            alert("Hiba történt a mentés során. Próbálja újra!");
        }
    } catch (error) {
        console.error(error);
        alert("Szerver hiba. Ellenőrizze az internetkapcsolatot.");
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto my-6 relative">
      
      {/* SIKERES MENTÉS ÜZENET (LEBEGŐ) */}
      {isSubmitted && (
        <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 animate-bounce">
            <div className="bg-green-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-4 border-2 border-green-400">
                <div className="bg-white/20 p-2 rounded-full">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
                <div>
                    <h4 className="font-bold text-lg">Sikeres mentés!</h4>
                    <p className="text-green-100 text-sm">Az adatlapot továbbítottuk a rendszerbe.</p>
                </div>
            </div>
        </div>
      )}

      {/* --- Fejléc --- */}
      <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden mb-10 border border-slate-100">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-orange-50 rounded-full blur-3xl opacity-60"></div>
        
        <div className="relative z-10 p-8 sm:p-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-orange-100 text-orange-600 rounded-2xl mb-6 shadow-sm">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.115.385-2.256 1.036-3.286"/>
            </svg>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 mb-4">
            Tűzvédelmi Adatlap
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Kérjük, pontosan töltse ki az alábbi űrlapot a dokumentáció elkészítéséhez.
          </p>
        </div>
        <div className="h-1.5 w-full bg-slate-100">
          <div className="h-full w-1/3 bg-gradient-to-r from-orange-500 to-indigo-600 rounded-r-full"></div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* 1. Cég- és telephelyadatok */}
        <Section number="01" title="Cég- és telephelyadatok" description="A vállalkozás alapvető azonosító adatai és a helyszín.">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputGroup label="Cég neve" name="companyName" placeholder="pl. Minta Kft." fullWidth required />
            <InputGroup label="Székhely" name="headquarters" placeholder="1111 Budapest..." required />
            <InputGroup label="Telephely címe" name="siteAddress" placeholder="Ahová az anyag készül" required />
          </div>
        </Section>

        {/* 2. Rendeltetés */}
        <Section number="02" title="Rendeltetés, tevékenység" description="A végzett tevékenység jellege és kockázatai.">
          <InputGroup label="A telephely fő tevékenysége" name="mainActivity" placeholder="pl. virágbolt, iroda..." fullWidth required />
          
          <div className="pt-6">
            <Label>Van-e a speciális technológia? (pl. hegesztés)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
              <SelectableCard name="specialTech" value="no" label="Nincs speciális technológia" />
              <SelectableCard name="specialTech" value="yes" label="Van speciális technológia">
                 <input type="text" name="specialTechDesc" className="mt-2 w-full text-sm border-b border-gray-300 focus:border-indigo-600 outline-none bg-transparent py-1" placeholder="Röviden (pl. hegesztés)..." />
              </SelectableCard>
            </div>
          </div>

          <div className="pt-8">
            <Label>A telephely jellege (több is jelölhető)</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
              <CheckboxCard name="type_shop" label="Üzlet / Vendégtér" />
              <CheckboxCard name="type_office" label="Csak iroda" />
              <CheckboxCard name="type_warehouse" label="Raktár" />
              <CheckboxCard name="type_workshop" label="Műhely / Termelés" />
              <CheckboxCard name="type_social" label="Szociális helyiség" />
              <CheckboxCard name="type_other" label="Egyéb" />
            </div>
          </div>
        </Section>

        {/* 3. Épület */}
        <Section number="03" title="Épület alapadatai" description="Elhelyezkedés, szintek és megközelítés.">
          <Label>Az egység elhelyezkedése</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3 mb-6">
             <SelectableCard name="buildingType" value="standalone" label="Önálló földszintes épület" />
             <SelectableCard name="buildingType" value="multi_ground" label="Többszintes épület földszintjén" />
             <SelectableCard name="buildingType" value="industrial" label="Ipari / csarnok épület" />
             <SelectableCard name="buildingType" value="residential" label="Társasház aljában/pincéjében" />
             <div className="md:col-span-2">
                <SelectableCard name="buildingType" value="multi_floor" label="Többszintes épület emeletén">
                   <div className="flex items-center gap-2 mt-2">
                     <span className="text-sm text-gray-500">Emelet száma:</span>
                     <input type="number" name="floorNumber" className="w-20 p-1 bg-white border rounded text-sm" />
                   </div>
                </SelectableCard>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
                <Label>Megközelítés</Label>
                <div className="flex flex-col gap-2 mt-3">
                  <RadioSimple name="access" value="street" label="Utcáról nyíló bejárat" />
                  <RadioSimple name="access" value="staircase" label="Lépcsőházon keresztül" />
                  <RadioSimple name="access" value="yard" label="Udvaron keresztül" />
                </div>
             </div>
             <div>
                <InputGroup label="Hasznos alapterület (m²)" name="areaSize" type="number" placeholder="pl. 120" fullWidth />
             </div>
          </div>
        </Section>

        {/* 4. Szerkezetek */}
        <Section number="04" title="Szerkezetek" description="Falazat, födém és tetőszerkezet.">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div>
              <Label>Teherhordó falak</Label>
              <div className="mt-3 space-y-2">
                <RadioSimple name="walls" value="brick" label="Tégla falazat" />
                <RadioSimple name="walls" value="concrete" label="Panel / Vasbeton" />
                <RadioSimple name="walls" value="light" label="Könnyűszerkezetes" />
                <RadioSimple name="walls" value="unknown" label="Nem tudom / Vegyes" />
              </div>
            </div>
            
            <div>
              <Label>Födém (mennyezet)</Label>
              <div className="mt-3 space-y-2">
                <RadioSimple name="ceiling" value="plastered" label="Vakolt (vasbeton)" />
                <RadioSimple name="ceiling" value="wood" label="Fagerendás" />
                <RadioSimple name="ceiling" value="metal" label="Trapézlemez / Acél" />
                <RadioSimple name="ceiling" value="unknown" label="Álmennyezet / Nem tudom" />
              </div>
            </div>
          </div>
          
           <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-10 pt-6 border-t border-dashed border-gray-200">
               <div>
                   <Label>Tető jellege</Label>
                   <div className="mt-2 space-y-2">
                       <RadioSimple name="roofType" value="flat" label="Lapos tető" />
                       <RadioSimple name="roofType" value="pitched" label="Magastető" />
                   </div>
               </div>
               <div>
                   <Label>Tető fedése</Label>
                   <div className="mt-2 space-y-2">
                       <RadioSimple name="roofCover" value="tile" label="Cserép" />
                       <RadioSimple name="roofCover" value="sheet" label="Lemez" />
                       <RadioSimple name="roofCover" value="shingle" label="Zsindely" />
                       <RadioSimple name="roofCover" value="panel" label="Szendvicspanel" />
                   </div>
               </div>
           </div>

          <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
             <Label>Van külső hőszigetelés (dryvit)?</Label>
             <div className="flex gap-4 mt-3">
                <SelectableCard name="insulation" value="yes" label="Igen, van" />
                <SelectableCard name="insulation" value="no" label="Nincs" />
                <SelectableCard name="insulation" value="unknown" label="Nem tudom" />
             </div>
          </div>
        </Section>

        {/* 5. Létszám */}
        <Section number="05" title="Létszám" description="A bent tartózkodók becsült száma.">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <InputGroup label="Dolgozók (fő)" name="employees" type="number" placeholder="0" />
            <InputGroup label="Ügyfelek átlagosan" name="clientsAvg" type="number" placeholder="0" />
            <InputGroup label="Ügyfelek csúcsidőben" name="clientsMax" type="number" placeholder="0" />
          </div>
          <div className="mt-6 p-4 bg-orange-50 rounded-xl border border-orange-100">
             <Label>Vannak segítségre szoruló személyek?</Label>
             <div className="mt-2 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                <RadioSimple name="disabled" value="no" label="Nincs ilyen" />
                <div className="flex-1 w-full">
                   <div className="flex items-center gap-2">
                      <input type="radio" name="disabled" value="yes" className="text-orange-600 focus:ring-orange-500" />
                      <span className="text-sm text-gray-700">Előfordul (kik?):</span>
                   </div>
                   <input type="text" name="disabledDesc" className="ml-6 mt-1 block w-full border-b border-orange-300 bg-transparent text-sm focus:outline-none focus:border-orange-600" placeholder="..." />
                </div>
             </div>
          </div>
        </Section>

        {/* 6. Menekülés */}
        <Section number="06" title="Menekülési útvonalak" description="Kijáratok és távolságok.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div>
               <Label>Kijáratok száma</Label>
               <div className="flex gap-3 mt-3">
                  <SelectableCard name="exits" value="1" label="1 db" />
                  <SelectableCard name="exits" value="2" label="2 db" />
                  <SelectableCard name="exits" value="3" label="3+" />
               </div>
             </div>
             <div>
                <Label>Főajtó szélessége</Label>
                <select name="doorWidth" className="mt-3 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 py-3 px-4 bg-white">
                  <option value="90">Normál ajtó (~90 cm)</option>
                  <option value="140">Kétszárnyú (~140-180 cm)</option>
                  <option value="250">Üvegportál (250+ cm)</option>
                </select>
             </div>
           </div>
           
           <div className="mt-8 border-t border-dashed border-gray-200 pt-6">
              <Label>Van alternatív menekülési irány?</Label>
               <div className="flex flex-col sm:flex-row gap-4 mt-3">
                  <RadioSimple name="altExit" value="no" label="Nincs" />
                  <div className="flex items-center gap-2">
                    <RadioSimple name="altExit" value="yes" label="Van, ajtó szélessége:" />
                    <input type="text" name="altExitWidth" className="w-20 border-b border-gray-300 focus:border-indigo-600 outline-none" placeholder="cm" />
                  </div>
               </div>
           </div>

           <div className="mt-8">
              <Label>Legnagyobb menekülési távolság (a legtávolabbi saroktól)</Label>
              <div className="flex flex-col sm:flex-row gap-4 mt-3">
                 <InputGroup label="Méterben" name="distM" placeholder="m" fullWidth />
                 <div className="flex items-center justify-center text-gray-400 font-bold">VAGY</div>
                 <InputGroup label="Lépésben" name="distStep" placeholder="kb. lépés" fullWidth />
              </div>
           </div>
        </Section>

        {/* 7. Anyagok */}
        <Section number="07" title="Tűzveszélyes anyagok" description="Tárolt anyagok és raktározás.">
           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CheckboxCard name="mat_paper" label="Szokásos irodai papír/karton" />
              <CheckboxCard name="mat_clean" label="Tisztítószerek" />
              <CheckboxCard name="mat_paint" label="Festékek, hígítók" />
              <CheckboxCard name="mat_fuel" label="Olaj, üzemanyag" />
              <CheckboxCard name="mat_gas" label="Gázpalack (PB, CO2)" />
              <CheckboxCard name="mat_aero" label="Nagyobb mennyiségű aeroszol" />
           </div>
           
           <div className="mt-6 pt-6 border-t border-dashed border-gray-200">
               <Label>Van külön raktárhelyiség?</Label>
               <div className="flex flex-col sm:flex-row gap-4 mt-3">
                  <RadioSimple name="storageRoom" value="no" label="Nincs" />
                  <div className="flex items-center gap-2">
                    <RadioSimple name="storageRoom" value="yes" label="Van, területe:" />
                    <input type="number" name="storageSize" className="w-24 border-b border-gray-300 focus:border-indigo-600 outline-none" placeholder="m2" />
                  </div>
               </div>
           </div>
        </Section>

        {/* 8. Tűzoltó készülékek */}
        <Section number="08" title="Tűzoltó készülékek" description="Mennyiség, típus és érvényesség.">
           <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
             <div className="flex flex-col md:flex-row gap-6 items-end">
                <div className="flex-1 w-full">
                   <InputGroup label="Darabszám" name="extCount" type="number" fullWidth />
                </div>
                <div className="flex-1 w-full">
                   <Label>Típus</Label>
                   <select name="extType" className="mt-1 block w-full rounded-lg border-gray-300 py-2.5 px-3">
                      <option value="Porral oltó">Porral oltó (ABC)</option>
                      <option value="CO2">Szén-dioxid (CO2)</option>
                      <option value="Habbal oltó">Habbal oltó</option>
                   </select>
                </div>
                <div className="flex-1 w-full">
                   <Label>Helye</Label>
                   <input type="text" name="extLocation" className="mt-1 block w-full rounded-lg border-gray-300 py-2.5 px-3 border" placeholder="pl. bejárat" />
                </div>
             </div>
             <div className="mt-4 pt-4 border-t border-gray-200">
                 <Label>Érvényes matrica (1 éven belüli)?</Label>
                 <div className="flex gap-4 mt-2">
                      <RadioSimple name="valid" value="yes" label="Igen" />
                      <RadioSimple name="valid" value="no" label="Nem" />
                      <RadioSimple name="valid" value="unknown" label="Nem tudom" />
                 </div>
             </div>
           </div>
        </Section>

        {/* 9. Rendszerek */}
        <Section number="09" title="Beépített rendszerek" description="Jelző- és oltóberendezések.">
           <div className="grid grid-cols-1 gap-3">
              <CheckboxCard name="sys_alarm" label="Beépített tűzjelző rendszer" />
              <CheckboxCard name="sys_sprinkler" label="Sprinkler / Automata oltó" />
              <CheckboxCard name="sys_manual" label="Kézi jelzésadók (gombok)" />
              <CheckboxCard name="sys_none" label="Nincs ilyen rendszer" />
           </div>
           <div className="mt-4">
               <InputGroup label="Ha van, hol található?" name="systemLocation" placeholder="Rövid leírás..." fullWidth />
           </div>
        </Section>

        {/* 10-11. Vegyes adatok */}
        <Section number="10" title="Gépészet és Villámvédelem" description="Villamos, gáz és védelmi rendszerek.">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                 <Label>Villamos főkapcsoló helye</Label>
                 <input type="text" name="mainSwitch" className="mt-2 block w-full rounded-lg border-gray-300 py-2 px-3 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 border" placeholder="pl. bejárat mellett" />
              </div>
              <div>
                 <Label>Gáz főelzáró helye</Label>
                 <div className="flex flex-col gap-2 mt-2">
                     <RadioSimple name="gasValve" value="no" label="Nincs gáz" />
                     <div className="flex items-center gap-2">
                        <RadioSimple name="gasValve" value="yes" label="Van:" />
                        <input type="text" name="gasLocation" className="flex-1 border-b border-gray-300 focus:border-indigo-600 outline-none text-sm" placeholder="hol?" />
                     </div>
                 </div>
              </div>
           </div>
           
           <div className="mt-6 pt-6 border-t border-gray-100">
              <Label>Kazán / Hőtermelő?</Label>
               <div className="flex flex-col sm:flex-row gap-4 mt-2">
                  <RadioSimple name="boiler" value="no" label="Nincs" />
                  <div className="flex items-center gap-2">
                    <RadioSimple name="boiler" value="yes" label="Van, típus:" />
                    <input type="text" name="boilerDesc" className="w-32 border-b border-gray-300 focus:border-indigo-600 outline-none" />
                  </div>
               </div>
           </div>

           <div className="mt-6 pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                  <Label>Van külső villámvédelem?</Label>
                  <div className="flex gap-4 mt-3">
                     <RadioSimple name="lightning" value="yes" label="Igen" />
                     <RadioSimple name="lightning" value="no" label="Nem" />
                     <RadioSimple name="lightning" value="dk" label="Nem tudom" />
                  </div>
              </div>
              <div className="space-y-3">
                  <div>
                      <Label>Érintésvédelmi JKV?</Label>
                      <div className="flex gap-3"><RadioSimple name="shockProt" value="yes" label="Van" /><RadioSimple name="shockProt" value="no" label="Nincs" /></div>
                  </div>
                  <div>
                      <Label>Villámvédelmi JKV?</Label>
                      <div className="flex gap-3"><RadioSimple name="lightningDoc" value="yes" label="Van" /><RadioSimple name="lightningDoc" value="no" label="Nincs" /></div>
                  </div>
              </div>
           </div>
        </Section>

        {/* 12. Hulladék */}
        <Section number="11" title="Hulladékkezelés" description="Tárolás rendje.">
             <Label>Hol tárolják a hulladékot?</Label>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
                 <SelectableCard name="waste" value="inside" label="Épületen belül (közl.)" />
                 <SelectableCard name="waste" value="room" label="Külön helyiségben" />
                 <SelectableCard name="waste" value="outside" label="Udvaron / Kint" />
             </div>
             <div className="mt-4">
                 <InputGroup label="Rövid leírás" name="wasteDesc" placeholder="..." fullWidth />
             </div>
             <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                 <Label>Előfordul tárolás menekülési útvonalon?</Label>
                 <div className="flex gap-4 mt-2">
                     <RadioSimple name="wasteRoute" value="no" label="Nem" />
                     <RadioSimple name="wasteRoute" value="yes" label="Igen, néha" />
                 </div>
             </div>
        </Section>

        {/* 13. Egyéb */}
        <Section number="12" title="Megjegyzés" description="Bármi egyéb fontos információ.">
           <textarea 
             name="notes"
             className="w-full p-4 border border-gray-300 rounded-xl shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 min-h-[120px] transition-all"
             placeholder="Pl. szomszédos épület közelsége, pincehasználat, rendezvények..."
           ></textarea>
        </Section>

        {/* Submit Gomb */}
        <div className="pt-4 pb-12">
           <button type="submit" disabled={loading} className="group relative w-full flex justify-center py-5 px-4 border border-transparent text-lg font-bold rounded-2xl text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 shadow-lg shadow-indigo-200 transform transition-all active:scale-[0.99] overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed">
             <div className="absolute inset-0 w-full h-full bg-white/20 group-hover:translate-x-full transition-transform duration-500 ease-in-out -translate-x-full"></div>
             <span className="relative flex items-center gap-3">
               {loading ? "Mentés folyamatban..." : "Adatlap Beküldése"}
               {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>}
             </span>
           </button>
           <p className="text-center text-sm text-slate-400 mt-4">A gomb megnyomásával az adatok központilag mentésre kerülnek.</p>
        </div>

      </form>
    </div>
  );
}

// --- DESIGN KOMPONENSEK ---

function Section({ number, title, description, children }: { number?: string, title: string, description?: string, children: React.ReactNode }) {
  return (
    <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-slate-100 transition-shadow hover:shadow-[0_8px_30px_-6px_rgba(0,0,0,0.08)]">
      <div className="flex items-start gap-4 mb-8 border-b border-slate-50 pb-6">
        {number && <span className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 font-bold text-lg">{number}</span>}
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">{title}</h2>
          {description && <p className="text-slate-500 mt-1 text-sm">{description}</p>}
        </div>
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-sm font-semibold text-slate-700 mb-2">{children}</label>;
}

function InputGroup({ label, name, type = "text", placeholder, fullWidth, required }: any) {
  return (
    <div className={fullWidth ? "w-full" : ""}>
      <Label>{label} {required && <span className="text-red-500">*</span>}</Label>
      <input 
        type={type} 
        name={name} 
        required={required}
        placeholder={placeholder}
        className="block w-full rounded-lg border-gray-200 bg-slate-50 focus:bg-white text-slate-800 py-3 pl-4 border focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 transition-all sm:text-sm"
      />
    </div>
  );
}

function SelectableCard({ name, value, label, children }: any) {
  return (
    <label className="relative flex cursor-pointer rounded-xl border border-gray-200 bg-white p-4 shadow-sm focus:outline-none transition-all hover:border-indigo-300 hover:ring-1 hover:ring-indigo-300 has-[:checked]:border-indigo-600 has-[:checked]:ring-1 has-[:checked]:ring-indigo-600 has-[:checked]:bg-indigo-50/30">
      <input type="radio" name={name} value={value} className="sr-only" />
      <div className="flex w-full flex-col">
        <span className="block text-sm font-medium text-gray-900">{label}</span>
        {children}
      </div>
      <div className="absolute top-4 right-4 hidden has-[:checked]:block text-indigo-600">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
      </div>
    </label>
  );
}

function CheckboxCard({ label, name }: { label: string, name: string }) {
  return (
     <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors has-[:checked]:border-indigo-500 has-[:checked]:bg-indigo-50/50">
        <input type="checkbox" name={name} value={label} className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
        <span className="text-sm font-medium text-slate-700">{label}</span>
     </label>
  );
}

function RadioSimple({ name, value, label }: any) {
    return (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div className="relative flex items-center justify-center w-5 h-5">
                <input type="radio" name={name} value={value} className="peer appearance-none w-5 h-5 border-2 border-gray-300 rounded-full checked:border-indigo-600 transition-colors" />
                <div className="absolute w-2.5 h-2.5 bg-indigo-600 rounded-full scale-0 peer-checked:scale-100 transition-transform"></div>
            </div>
            <span className="text-sm text-gray-700 group-hover:text-indigo-600 transition-colors">{label}</span>
        </label>
    );
}