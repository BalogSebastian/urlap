interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AdminPasswordResetPage({ params }: PageProps) {
  const { token } = await params;

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-md w-full p-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-3 text-center">
          Új admin jelszó beállítása
        </h1>
        <p className="text-sm text-slate-500 mb-6 text-center">
          Add meg az új jelszót kétszer. A jelszónak legalább 8 karakter hosszúnak kell lennie.
        </p>
        <form
          method="POST"
          action="/api/admin/set-password"
          className="space-y-4"
        >
          <input type="hidden" name="token" value={token} />
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Új jelszó
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-500 uppercase">
              Új jelszó mégegyszer
            </label>
            <input
              type="password"
              name="passwordConfirm"
              required
              minLength={8}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition-all"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl shadow-md active:scale-95 transition-all mt-2"
          >
            Jelszó mentése
          </button>
        </form>
        <p className="text-xs text-slate-400 mt-4 text-center">
          A mentés után a rendszer átirányít a központi admin felületre.
        </p>
      </div>
    </main>
  );
}
