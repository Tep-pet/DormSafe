import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ShieldCheck, Building2 } from 'lucide-react';
import campusBg from '../../assets/addu-campus.jpg';
import { LoginForm } from '../../components/auth/LoginForm';
import { BrandLogo } from '../../components/common/BrandLogo';

export function LoginPage() {
  return (
    <div className="relative min-h-screen w-full bg-slate-950 flex flex-col justify-between overflow-x-hidden select-none">
      {/* 1. Full Background Campus Image */}
      <img
        src={campusBg}
        alt="Ateneo de Davao University Campus"
        className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
      />

      {/* 2. Cinematic Atmospheric Dark Overlays (campus photo stays clearly visible) */}
      <div className="absolute inset-0 bg-slate-950/40 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950/85 via-slate-950/40 to-slate-950/85 pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_75%,rgba(6,182,212,0.18),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_25%,rgba(30,58,138,0.25),transparent_60%)] pointer-events-none" />

      {/* 3. Sweeping Curved Glassmorphism Arc (Inspired by Photo 2) */}
      <div className="hidden lg:block absolute inset-y-0 right-0 w-[54%] xl:w-[50%] pointer-events-none overflow-hidden">
        <div className="h-full w-full border-l border-white/15 rounded-l-[180px] xl:rounded-l-[240px] bg-gradient-to-r from-slate-950/60 via-slate-950/75 to-slate-950/90 backdrop-blur-xl shadow-[-25px_0_60px_rgba(0,0,0,0.5)]" />
      </div>

      {/* Top Header / Brand Logo */}
      <header className="relative z-20 w-full px-6 sm:px-10 lg:px-16 pt-6 sm:pt-8 flex items-center justify-between">
        <BrandLogo size="md" variant="dark" subtitle="Ateneo de Davao University" />
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border border-white/15 bg-slate-900/60 text-slate-200 backdrop-blur-md">
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
              <h1 className="text-3xl sm:text-4xl xl:text-5xl font-black text-cyan-400 tracking-tight leading-[1.15] drop-shadow-md">
                Safe Housing.<br />
                Ateneo Community.
              </h1>
              <p className="mt-4 text-xs sm:text-sm text-slate-200/90 leading-relaxed max-w-md drop-shadow-xs">
                Verified student boarding houses, audited campus perimeter safety, and direct landlord communication—exclusively for the Ateneo de Davao University community.
              </p>
            </div>

            {/* 3 Circular Feature Outline Icons (matching Photo 2's icon row) */}
            <div className="flex items-center gap-4 sm:gap-5 pt-1">
              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-slate-600/80 bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-slate-200 transition-all duration-200 group-hover:border-cyan-400 group-hover:text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                  <MapPin size={20} />
                </div>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide">2km Zone</span>
              </div>

              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-slate-600/80 bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-slate-200 transition-all duration-200 group-hover:border-cyan-400 group-hover:text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                  <ShieldCheck size={20} />
                </div>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide">Audited</span>
              </div>

              <div className="group flex flex-col items-center gap-1.5 cursor-default">
                <div className="w-12 h-12 rounded-full border border-slate-600/80 bg-slate-900/70 backdrop-blur-md flex items-center justify-center text-slate-200 transition-all duration-200 group-hover:border-cyan-400 group-hover:text-cyan-400 group-hover:scale-105 group-hover:shadow-[0_0_16px_rgba(6,182,212,0.35)]">
                  <Building2 size={20} />
                </div>
                <span className="text-[10px] text-slate-300 font-medium tracking-wide">Housing</span>
              </div>
            </div>

            {/* Bottom-left metadata info (from Photo 2) */}
            <div className="hidden lg:block pt-6 border-t border-white/10 text-[11px] text-slate-300/80 space-y-0.5">
              <p className="font-semibold text-slate-200">DormSafe Ateneo • Version 1.0.0</p>
              <p>Ateneo de Davao University • Jacinto & Matina Campuses</p>
              <p className="text-slate-400">Fortes in Fide • Leaders in Service</p>
            </div>
          </div>

          {/* Right Column: Sleek Dark Glassmorphic Login Form */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center lg:justify-end w-full">
            <div className="w-full max-w-sm sm:max-w-md rounded-3xl border border-white/15 bg-slate-950/75 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-2xl">
              <div className="mb-5 text-left">
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">Sign In</h2>
                <p className="mt-1 text-xs text-slate-300">
                  Access student housing, stay records, and campus safety.
                </p>
              </div>

              <LoginForm variant="dark" />

              <div className="mt-5 pt-4 border-t border-white/10 text-center">
                <p className="text-xs text-slate-300">
                  Don&apos;t have an account yet?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-cyan-400 hover:text-cyan-300 hover:underline transition-colors"
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
      <footer className="lg:hidden relative z-20 py-4 px-6 text-center text-[11px] text-slate-300 border-t border-white/10 bg-slate-950/85 backdrop-blur-md">
        <span>&copy; {new Date().getFullYear()} DormSafe &bull; Ateneo de Davao University</span>
      </footer>
    </div>
  );
}
