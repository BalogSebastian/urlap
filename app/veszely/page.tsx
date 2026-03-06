"use client";
import React, { useState } from "react";

export default function VeszelyPage() {
  const [genFormType, setGenFormType] = useState<"fire" | "vbf" | "haccp">("fire");
  const [genTokenDuration, setGenTokenDuration] = useState<string>("1h");
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setGeneratedLink(null);
    setExpiresAt(null);
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const email = ((formData.get("gen_email") as string) || "").trim();
    const emailSubject = ((formData.get("email_subject") as string) || "").trim();
    const emailMessage = ((formData.get("email_message") as string) || "").trim();
    if (!email) {
      alert("Kérjük, adjon meg egy érvényes e-mail címet.");
      setLoading(false);
      return;
    }
    let durationMinutes = 60;
    if (genTokenDuration === "1h") durationMinutes = 60;
    else if (genTokenDuration === "2h") durationMinutes = 120;
    else if (genTokenDuration === "24h") durationMinutes = 24 * 60;
    else if (genTokenDuration === "48h") durationMinutes = 48 * 60;
    else if (genTokenDuration === "custom") {
      const amountRaw = (formData.get("gen_custom_amount") as string) || "1";
      const unit = (formData.get("gen_custom_unit") as string) || "hours";
      const amount = Math.max(1, Number(amountRaw) || 1);
      durationMinutes = unit === "days" ? amount * 24 * 60 : amount * 60;
    }
    try {
      const res = await fetch("/api/generate-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          formType: genFormType,
          durationMinutes,
          mode: "files",
          emailSubject,
          emailMessage,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || "Hiba történt a meghívó generálása közben.");
        return;
      }
      const data = (await res.json().catch(() => null)) as { url?: string; expiresAt?: string } | null;
      setGeneratedLink(data?.url || null);
      setExpiresAt(data?.expiresAt || null);
      alert("Meghívó link sikeresen elküldve (csak fájlfeltöltés).");
      form.reset();
    } catch (error) {
      console.error(error);
      alert("Szerver hiba a meghívó generálása során.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-full bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          <div className="px-8 py-7 bg-gradient-to-r from-yellow-500 to-amber-400 text-slate-900">
            <div className="text-xs font-extrabold tracking-widest opacity-90">VESZÉLY / FILES-ONLY</div>
            <h1 className="text-2xl font-extrabold mt-1">Csak fájlfeltöltés meghívó generálása</h1>
            <p className="text-sm text-slate-900/80 mt-2">
              A címzett a linkre kattintva kizárólag cégnevet, e-mailt és fájlokat adhat meg.
            </p>
          </div>

          <div className="p-8">
            {generatedLink && (
              <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50">
                <div className="text-sm font-extrabold text-emerald-800">Meghívó elküldve</div>
                <div className="text-xs text-emerald-800/80 mt-1">
                  {expiresAt ? `Lejárat: ${new Date(expiresAt).toLocaleString("hu-HU")}` : null}
                </div>
                <div className="mt-3 text-xs text-slate-700 break-all bg-white border border-emerald-200 rounded-xl p-3">
                  {generatedLink}
                </div>
              </div>
            )}

            <form onSubmit={handleGenerate} className="space-y-8">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Címzett e-mail</label>
                  <input
                    type="email"
                    name="gen_email"
                    required
                    placeholder="cimzett@pelda.hu"
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none shadow-sm focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail tárgy (szabadon írható)</label>
                  <input
                    type="text"
                    name="email_subject"
                    placeholder="Pl. Kérjük, csatolja a szükséges dokumentumokat"
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none shadow-sm focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail szöveg (szabadon írható)</label>
                  <textarea
                    name="email_message"
                    rows={6}
                    placeholder={"Pl.\nKérjük, a gombon keresztül töltse fel a szükséges PDF-eket és képeket.\nKöszönjük!"}
                    className="w-full p-3 border border-slate-300 rounded-xl outline-none shadow-sm focus:ring-4 focus:ring-amber-100 focus:border-amber-500 transition-all"
                  />
                </div>
              </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Melyik szekciót küldjük?</label>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="button"
                  onClick={() => setGenFormType("fire")}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    genFormType === "fire"
                      ? "bg-white border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-indigo-100/40 border-indigo-200 text-slate-700 hover:bg-indigo-100"
                  }`}
                >
                  🔥 Tűzvédelmi Adatlap
                </button>
                <button
                  type="button"
                  onClick={() => setGenFormType("vbf")}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    genFormType === "vbf"
                      ? "bg-white border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-indigo-100/40 border-indigo-200 text-slate-700 hover:bg-indigo-100"
                  }`}
                >
                  ⚡ VBF Adatlap
                </button>
                <button
                  type="button"
                  onClick={() => setGenFormType("haccp")}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-bold transition-all ${
                    genFormType === "haccp"
                      ? "bg-white border-indigo-500 text-indigo-700 shadow-sm"
                      : "bg-indigo-100/40 border-indigo-200 text-slate-700 hover:bg-indigo-100"
                  }`}
                >
                  🛡️ HACCP Adatlap
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Token érvényességi ideje</label>
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gen_token_duration" value="1h" checked={genTokenDuration === "1h"} onChange={() => setGenTokenDuration("1h")} />
                  <span className="text-sm font-semibold text-slate-700">1 óra</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gen_token_duration" value="2h" checked={genTokenDuration === "2h"} onChange={() => setGenTokenDuration("2h")} />
                  <span className="text-sm font-semibold text-slate-700">2 óra</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gen_token_duration" value="24h" checked={genTokenDuration === "24h"} onChange={() => setGenTokenDuration("24h")} />
                  <span className="text-sm font-semibold text-slate-700">24 óra</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gen_token_duration" value="48h" checked={genTokenDuration === "48h"} onChange={() => setGenTokenDuration("48h")} />
                  <span className="text-sm font-semibold text-slate-700">48 óra</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="gen_token_duration" value="custom" checked={genTokenDuration === "custom"} onChange={() => setGenTokenDuration("custom")} />
                  <span className="text-sm font-semibold text-slate-700">Egyedi</span>
                </label>
                {genTokenDuration === "custom" && (
                  <div className="flex items-center gap-2">
                    <input type="number" name="gen_custom_amount" className="w-24 p-2 border rounded-xl" placeholder="1" />
                    <select name="gen_custom_unit" className="p-2 border rounded-xl">
                      <option value="hours">óra</option>
                      <option value="days">nap</option>
                    </select>
                  </div>
                )}
              </div>
            </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-7 py-3.5 rounded-2xl text-sm font-extrabold bg-yellow-400 text-slate-900 hover:bg-yellow-500 transition-all shadow-sm disabled:opacity-60"
                >
                  {loading ? "Küldés..." : "Meghívó kiküldése"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </main>
  );
}
