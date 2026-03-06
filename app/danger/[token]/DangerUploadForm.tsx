"use client";

import React, { useMemo, useState } from "react";

type FormType = "fire" | "vbf" | "haccp";

export default function DangerUploadForm({ formType }: { formType: FormType }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);

  const formTypeLabel = useMemo(() => {
    if (formType === "vbf") return "VBF";
    if (formType === "haccp") return "HACCP";
    return "Tűzvédelmi";
  }, [formType]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    const rawFormData = new FormData(e.currentTarget);
    const companyName = String(rawFormData.get("companyName") || "").trim();
    const managerEmail = String(rawFormData.get("managerEmail") || "").trim();

    if (!companyName) {
      setStatus("error");
      setErrorMessage("A cég neve kötelező.");
      return;
    }

    if (!managerEmail || !managerEmail.includes("@")) {
      setStatus("error");
      setErrorMessage("Kérjük, adjon meg egy érvényes e-mail címet.");
      return;
    }

    if (files.length === 0) {
      setStatus("error");
      setErrorMessage("Kérjük, csatoljon legalább egy fájlt.");
      return;
    }

    const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
    const maxBytes = 15 * 1024 * 1024;
    if (totalBytes > maxBytes) {
      setStatus("error");
      setErrorMessage("Túl nagy összméret. Kérjük, ossza több beküldésre (max ~15MB).");
      return;
    }

    const formData = new FormData();
    formData.append("companyName", companyName);
    formData.append("managerEmail", managerEmail);
    formData.append("formType", formType);
    formData.append("submissionKind", "files_only");
    for (const file of files) formData.append("files", file);

    try {
      const res = await fetch("/api/submissions", { method: "POST", body: formData });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { error?: string } | null;
        setStatus("error");
        setErrorMessage(data?.error || "Hiba történt a beküldés során.");
        return;
      }
      setStatus("success");
      (e.currentTarget as HTMLFormElement).reset();
      setFiles([]);
    } catch {
      try {
        const recentRes = await fetch("/api/debug-latest", { method: "GET" });
        const recent = (await recentRes.json().catch(() => null)) as Array<{
          companyName?: string;
          managerEmail?: string;
          formType?: string;
          createdAt?: string;
        }> | null;

        const now = Date.now();
        const found = Array.isArray(recent)
          ? recent.some((s) => {
              const createdAt = s.createdAt ? Date.parse(s.createdAt) : 0;
              const ageMs = createdAt ? Math.abs(now - createdAt) : Number.POSITIVE_INFINITY;
              return (
                (s.companyName || "").toLowerCase().trim() === companyName.toLowerCase() &&
                (s.managerEmail || "").toLowerCase().trim() === managerEmail.toLowerCase() &&
                (s.formType || "").toLowerCase().trim() === formType.toLowerCase() &&
                ageMs < 120_000
              );
            })
          : false;

        if (found) {
          setStatus("success");
          (e.currentTarget as HTMLFormElement).reset();
          setFiles([]);
          return;
        }
      } catch {
        // ignore
      }

      setStatus("error");
      setErrorMessage("Szerver hiba a beküldés során.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-8 py-7 bg-gradient-to-r from-slate-900 to-slate-700 text-white">
          <div className="text-xs font-semibold tracking-widest opacity-90">FÁJLBEKÜLDÉS</div>
          <h1 className="text-2xl font-extrabold mt-1">Csatolmányok feltöltése</h1>
          <p className="text-sm text-white/80 mt-2">
            Beküldés típusa: <span className="font-bold">{formTypeLabel}</span>
          </p>
        </div>

        <div className="p-8">
          {status === "success" && (
            <div className="mb-6 p-4 rounded-2xl border border-emerald-200 bg-emerald-50 text-emerald-800 text-sm font-semibold">
              Sikeres beküldés. Köszönjük!
            </div>
          )}
          {status === "error" && (
            <div className="mb-6 p-4 rounded-2xl border border-rose-200 bg-rose-50 text-rose-800 text-sm font-semibold">
              {errorMessage || "Hiba történt."}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Cég neve</label>
                <input
                  name="companyName"
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  placeholder="Pl. Trident Shield Group Kft."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail cím</label>
                <input
                  type="email"
                  name="managerEmail"
                  required
                  className="w-full p-3 border border-slate-300 rounded-xl outline-none shadow-sm focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all"
                  placeholder="nev@ceg.hu"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Fájlok</label>
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      const selected = Array.from(e.target.files || []);
                      if (selected.length > 0) {
                        setFiles((prev) => [...prev, ...selected]);
                        e.currentTarget.value = "";
                      }
                    }}
                    className="block w-full text-sm text-slate-500 file:mr-4 file:py-3 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 transition-all cursor-pointer shadow-sm"
                  />
                  {files.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {files.map((f, idx) => (
                        <div key={`${f.name}-${f.size}-${idx}`} className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2">
                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-slate-800 truncate">{f.name}</div>
                            <div className="text-xs text-slate-500">{Math.round(f.size / 1024)} KB</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setFiles((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-xs font-extrabold text-rose-700 hover:text-rose-800 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200"
                          >
                            Törlés
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-3">
                    Több PDF/kép is feltölthető. Nagy fájloknál a feltöltés tovább tarthat.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={status === "submitting"}
                className="px-7 py-3.5 rounded-2xl text-sm font-extrabold bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-sm disabled:opacity-60"
              >
                {status === "submitting" ? "Beküldés..." : "Beküldés"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
