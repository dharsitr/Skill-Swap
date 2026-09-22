import { Navbar } from "@/components/layout/Navbar";
import { LandingView } from "@/components/views/LandingView";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <main className="flex-1">
        <LandingView />
      </main>
    </div>
  );
}
