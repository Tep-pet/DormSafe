import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Building2 } from 'lucide-react';
import campusBg from '../../assets/addu-campus.jpg';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-slate-900 flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. Full Background Campus Image */}
      <img
        src={campusBg}
        alt="Ateneo de Davao University Campus"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
      />

      {/* 2. Lighter, Luminous Cinematic Overlays (campus photo stays bright and clear) */}
      <div className="absolute inset-0 bg-slate-950/15 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/60 via-slate-950/15 to-slate-950/50 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(6,182,212,0.15),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(30,58,138,0.2),transparent_60%)] pointer-events-none" />

      {/* 3. Lighter, Frosted Sweeping Curved Glassmorphism Arc (Inspired by Photo 2) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[54%] xl:w-[50%] pointer-events-none overflow-hidden">
        <div className="h-full w-full border-l border-white/30 rounded-l-[180px] xl:rounded-l-[240px] bg-gradient-to-r from-slate-900/35 via-slate-900/45 to-slate-900/60 backdrop-blur-xl shadow-[-20px_0_45px_rgba(0,0,0,0.3)]" />
      </div>

      {/* Top Header / Brand Logo */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-16 pt-6 sm:pt-8 flex items-center justify-between">
        <BrandLogo size="md" variant="dark" subtitle="Ateneo de Davao University" />
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-white/25 bg-slate-900/40 text-white backdrop-blur-md shadow-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
          Campus Housing Portal
        </span>
      </header>

      {/* Main Content: Split Grid */}
      <main className="relative z-20 flex-1 flex items-center px-6 sm:px-10 lg:px-16 py-8">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Heading, Description & 3 Circular Feature Badges */}
          <div className="lg:col-span-6 xl:col-span-7 flex flex-col justify-center space-y-6">
            <div>
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-cyan-300 tracking-tight leading-[1.15] drop-shadow-lg">
                Safe Housing.<br />
                Ateneo Community.
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-slate-100 leading-relaxed max-w-md drop-shadow-md">
                Verified student boarding houses, audited campus perimeter safety, and direct landlord communication—exclusively for the Ateneo de Davao University community.
              </p>
            </div>

            {/* 3 Circular Feature Outline Icons (matching Photo 2's icon row) */}
            <div className="flex items-center gap-4 sm:gap-5 pt-1">
              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-white/30 bg-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all duration-200 group-hover:border-cyan-300 group-hover:text-cyan-300 group-hover:bg-white/25 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] shadow-md shadow-black/10">
                  <MapPin size={20} />
                </div>
                <span className="text-[10px] text-white font-medium tracking-wide drop-shadow-sm">2km Zone</span>
              </div>

              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-white/30 bg-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all duration-200 group-hover:border-cyan-300 group-hover:text-cyan-300 group-hover:bg-white/25 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] shadow-md shadow-black/10">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] text-white font-medium tracking-wide drop-shadow-sm">Audited</span>
              </div>

              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-white/30 bg-white/15 backdrop-blur-md flex items-center justify-center text-white transition-all duration-200 group-hover:border-cyan-300 group-hover:text-cyan-300 group-hover:bg-white/25 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.4)] shadow-md shadow-black/10">
                  <Building2 size={20} />
                </div>
                <span className="text-[10px] text-white font-medium tracking-wide drop-shadow-sm">Housing</span>
              </div>
            </div>

            {/* Bottom-left metadata info (from Photo 2) */}
            <div className="hidden lg:block pt-6 border-t border-white/15 text-[11px] text-slate-200/90 space-y-0.5 drop-shadow-sm">
              <p className="font-semibold text-white">DormSafe Ateneo • Version 1.0.0</p>
              <p>Ateneo de Davao University • Jacinto & Matina Campuses</p>
              <p className="text-slate-300">Fortes in Fide • Leaders in Service</p>
            </div>
          </div>

          {/* Right Column: Lighter Frosted Glassmorphic Login Form */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-sm sm:max-w-md rounded-3xl border border-white/25 bg-slate-900/55 p-6 sm:p-8 shadow-2xl shadow-slate-950/40 backdrop-blur-2xl ring-1 ring-white/10">
              <div className="mb-5 text-left">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-sm">Sign In</h2>
                <p className="mt-1 text-xs text-slate-200">
                  Access student housing, stay records, and campus safety.
                </p>
              </div>

              <LoginForm variant="dark" />

              <div className="mt-5 pt-4 border-t border-white/15 text-center">
                <p className="text-xs text-slate-200">
                  Don&apos;t have an account yet?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-cyan-300 hover:text-cyan-200 hover:underline transition-colors"
                  >
                    Register here
                  </Link>
                </p>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Footer info for mobile */}
      <footer className="lg:hidden relative z-20 py-4 px-6 text-center text-[11px] text-slate-200 border-t border-white/15 bg-slate-900/70 backdrop-blur-md">
        <span>&copy; {new Date().getFullYear()} DormSafe &bull; Ateneo de Davao University</span>
      </footer>
    </div>
  );
}
