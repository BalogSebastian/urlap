// /app/page.tsx
import FireSafetyForm from "./components/FireSafetyForm";

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-slate-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <FireSafetyForm />
    </main>
  );
}