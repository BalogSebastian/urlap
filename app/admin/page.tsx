// /app/admin/page.tsx
"use client";

import React from "react";
import Link from "next/link";
import { FiShield, FiZap, FiPieChart, FiArrowRight, FiLock } from "react-icons/fi";

export default function MasterAdminPortal() {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Háttér dekoráció */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-indigo-50 via-transparent to-transparent -z-10"></div>

      <div className="max-w-5xl mx-auto px-6 py-20">
        <header className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 mb-6">
            <FiLock className="text-indigo-600 w-4 h-4" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">Központi Adminisztráció</span>
          </div>
          <h1 className="text-5xl font-black tracking-tight text-slate-900 mb-4">
            Üdvözöljük, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Adminisztrátor</span>
          </h1>
          <p className="text-slate-500 text-lg max-w-2xl mx-auto font-medium">
            Válassza ki a kezelni kívánt területet. Minden modul külön adatbázis-szűréssel és egyedi funkciókkal rendelkezik.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <PortalCard 
            href="/adminadmin"
            title="Tűzvédelem"
            desc="Tűz- és munkavédelmi adatlapok kezelése, szerkesztése és PDF generálás."
            icon={<FiShield />}
            color="text-rose-600"
            bg="bg-rose-50"
            hover="hover:border-rose-200"
          />
          <PortalCard 
            href="/adminvbf"
            title="VBF / VBS"
            desc="Villamos biztonsági felülvizsgálati megrendelések és egyedi email küldés."
            icon={<FiZap />}
            color="text-amber-600"
            bg="bg-amber-50"
            hover="hover:border-amber-200"
          />
          <PortalCard 
            href="/staticsadmin"
            title="Statisztika"
            desc="Üzleti intelligencia, havi kimutatások és teljesítmény elemzés."
            icon={<FiPieChart />}
            color="text-indigo-600"
            bg="bg-indigo-50"
            hover="hover:border-indigo-200"
          />
        </div>

        <footer className="mt-20 text-center border-t border-slate-200 pt-8">
          <p className="text-slate-400 text-sm font-medium">Trident Shield Group Kft. &copy; 2026</p>
        </footer>
      </div>
    </div>
  );
}

function PortalCard({ href, title, desc, icon, color, bg, hover }: any) {
  return (
    <Link href={href} className={`group bg-white p-8 rounded-[2.5rem] border border-slate-200/60 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 ${hover}`}>
      <div className={`w-16 h-16 ${bg} ${color} rounded-2xl flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-inner`}>
        {icon}
      </div>
      <h3 className="text-xl font-black text-slate-800 mb-3 flex items-center gap-2">
        {title}
        <FiArrowRight className="opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-indigo-600" />
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed font-medium">
        {desc}
      </p>
    </Link>
  );
}