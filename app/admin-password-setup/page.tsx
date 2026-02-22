"use client";

import { useState } from "react";

export default function AdminPasswordSetupPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [error, setError] = useState("");

  const handleSend = async () => {
    setStatus("loading");
    setError("");
    try {
      const res = await fetch("/api/admin/send-password-link", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setError(data?.error || "Ismeretlen hiba történt.");
        setStatus("error");
        return;
      }
      setStatus("success");
    } catch {
      setError("Nem sikerült csatlakozni a szerverhez.");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-8 text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3">
          Admin jelszó beállítása
        </h1>
        <p className="text-sm text-slate-500 mb-6">
          Küldjünk egy jelszó beállító linket az alapértelmezett admin e-mail címre.
        </p>
        <button
          onClick={handleSend}
          disabled={status === "loading"}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all"
        >
          {status === "loading" ? "Küldés..." : "Jelszó beállító link küldése"}
        </button>
        {status === "success" && (
          <p className="mt-4 text-sm text-emerald-600 font-medium">
            Elkészült! Nézd meg az admin e-mail fiókodat.
          </p>
        )}
        {status === "error" && (
          <p className="mt-4 text-sm text-rose-600 font-medium">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}

