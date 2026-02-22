// /app/staticsadmin/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  FiActivity,
  FiFileText,
  FiZap,
  FiTrendingUp,
  FiClock,
  FiArrowRight,
  FiCalendar
} from "react-icons/fi"; // Telepítsd: npm install react-icons

interface RecentActivityItem {
  id: string;
  company: string;
  type: "fire" | "vbf";
  date: string | number | Date;
}

interface StatsResponse {
  total: number;
  fireCount: number;
  vbfCount: number;
  thisMonth: {
    total: number;
    fire: number;
    vbf: number;
  };
  recentActivity: RecentActivityItem[];
}

export default function StatsAdmin() {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/stats")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center">
        <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 font-medium animate-pulse">Rendszeradatok szinkronizálása...</p>
      </div>
    );
  }

  const monthNames = ["Január", "Február", "Március", "Április", "Május", "Június", "Július", "Augusztus", "Szeptember", "Október", "November", "December"];
  const currentMonth = monthNames[new Date().getMonth()];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Dekorációs háttér elemek */}
      <div className="fixed top-0 left-0 w-full h-64 bg-gradient-to-b from-indigo-50/50 to-transparent -z-10"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">

        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 text-indigo-600 font-bold tracking-wider text-xs uppercase mb-2">
              <span className="w-8 h-[2px] bg-indigo-600"></span>
              Rendszerfelügyelet
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">
              Üzleti <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Intelligencia</span>
            </h1>
            <p className="mt-3 text-slate-500 font-medium italic">Trident Shield Group – Valós idejű statisztikai modul</p>
          </div>

          <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200/60">
            <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600">
              <FiCalendar className="w-5 h-5" />
            </div>
            <div className="pr-4">
              <p className="text-[10px] uppercase font-bold text-slate-400 leading-none mb-1">Aktuális időszak</p>
              <p className="text-sm font-bold text-slate-700">{currentMonth}, 2026</p>
            </div>
          </div>
        </header>

        {/* --- KPI CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <PremiumStatCard
            title="Összes megrendelés"
            value={stats.total}
            icon={<FiActivity />}
            gradient="from-slate-800 to-slate-900"
            percentage="+12%" // Példa adat
          />
          <PremiumStatCard
            title="Tűzvédelmi Napló"
            value={stats.fireCount}
            icon={<FiFileText />}
            gradient="from-orange-500 to-rose-600"
            percentage="Fire Safety"
          />
          <PremiumStatCard
            title="VBF / VBF Modul"
            value={stats.vbfCount}
            icon={<FiZap />}
            gradient="from-amber-400 to-orange-500"
            percentage="Electrical"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* --- HAVI ÖSSZEGZŐ --- */}
          <div className="lg:col-span-2 bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-gradient-to-r from-white to-slate-50/50">
              <div>
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <FiTrendingUp className="text-indigo-600" /> Havi Teljesítmény
                </h3>
                <p className="text-slate-400 text-sm font-medium">Frissítve: éppen most</p>
              </div>
              <button onClick={() => window.location.reload()} className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600">
                <FiClock className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3">
              <HaviMetric label="Új Ügyfél" value={stats.thisMonth.total} sub="Összesen" color="text-indigo-600" />
              <HaviMetric label="Tűzvédelem" value={stats.thisMonth.fire} sub="Beküldve" color="text-rose-500" />
              <HaviMetric label="Villamosság" value={stats.thisMonth.vbf} sub="Megrendelve" color="text-amber-500" />
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-50">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 font-medium italic">A havi célkitűzés 85%-a teljesült.</span>
                <div className="w-48 h-2 bg-slate-200 rounded-full overflow-hidden">
                  <div className="w-[85%] h-full bg-indigo-600 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* --- RECENT FEED --- */}
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold text-slate-800">Napló</h3>
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-600 px-2 py-1 rounded-md uppercase">Live</span>
            </div>

            <div className="space-y-6">
              {stats.recentActivity.map((item: RecentActivityItem) => (
                <div key={item.id} className="group flex items-start gap-4 cursor-default">
                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.type === 'fire' ? 'bg-rose-500' : 'bg-amber-500'} ring-4 ${item.type === 'fire' ? 'ring-rose-50' : 'ring-amber-50'}`}></div>
                  <div className="flex-1 border-b border-slate-50 pb-4 group-last:border-0">
                    <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight mb-1">{item.company}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {item.type === 'fire' ? '🔥 Tűzvédelem' : '⚡ VBF Adatlap'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">{new Date(item.date).toLocaleDateString('hu-HU')}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="w-full mt-8 py-4 bg-slate-50 hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-2 group">
              Összes tevékenység megnyitása
              <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// --- SEGÉDKOMPONENSEK ---

interface PremiumStatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  percentage: string;
}

function PremiumStatCard({ title, value, icon, gradient, percentage }: PremiumStatCardProps) {
  return (
    <div className="relative group overflow-hidden bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200/60 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${gradient} opacity-[0.03] rounded-bl-full`}></div>

      <div className="relative z-10">
        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-500`}>
          {icon}
        </div>

        <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <h4 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h4>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-slate-50 text-slate-400 rounded-full border border-slate-100 italic">{percentage}</span>
        </div>
      </div>
    </div>
  );
}

interface HaviMetricProps {
  label: string;
  value: number;
  sub: string;
  color: string;
}

function HaviMetric({ label, value, sub, color }: HaviMetricProps) {
  return (
    <div className="p-10 flex flex-col items-center justify-center text-center group hover:bg-slate-50/50 transition-colors">
      <p className="text-slate-400 text-[10px] uppercase font-black tracking-[0.2em] mb-4">{label}</p>
      <p className={`text-6xl font-black ${color} tracking-tighter mb-2 group-hover:scale-110 transition-transform`}>{value}</p>
      <p className="text-slate-400 text-xs font-medium">{sub}</p>
    </div>
  );
}
