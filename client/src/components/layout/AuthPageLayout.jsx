import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

/**
 * Dedicated Authentication Layout
 * Decoupled from AppShell.
 * Supports optional `backgroundImage`.
 * Inspires from split-card modal layout with branded graphic left side and translucent white right side.
 */
export function AuthPageLayout({ children, cardMaxWidth = 'max-w-md', backgroundImage = null }) {
  const hasBg = Boolean(backgroundImage);

  return (
    <div className={`relative min-h-screen lg:h-screen lg:max-h-screen w-full ${hasBg ? 'bg-slate-900' : 'bg-slate-50'} flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden select-none`}>
      {/* Background Image & Ambient Backdrop */}
      {hasBg ? (
        <>
          <img
            src={backgroundImage}
            alt="Ateneo Campus Background"
            className="absolute inset-0 h-full w-full object-cover object-center pointer-events-none"
          />
          <div className="absolute inset-0 bg-slate-950/25 backdrop-blur-[2px] pointer-events-none" />
        </>
      ) : (
        <>
          <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        </>
      )}

      {/* Top Mobile Bar */}
      <header className={`lg:hidden relative z-10 flex items-center justify-between px-6 py-3.5 ${hasBg ? 'bg-slate-900/70 backdrop-blur-md border-b border-white/10 text-white' : 'bg-white/80 backdrop-blur-md border-b border-slate-200/80'}`}>
        <BrandLogo size="sm" variant={hasBg ? 'dark' : 'light'} />
        <span className={`text-xs font-semibold ${hasBg ? 'text-slate-200' : 'text-slate-500'}`}>Campus Housing</span>
      </header>

      {/* Main Content Area: Unified Split Card Inspired by Inspo Design */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-3.5 sm:p-6 lg:py-4 lg:px-8 xl:py-6 xl:px-12">
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto rounded-3xl overflow-hidden shadow-2xl shadow-slate-950/30 border border-white/30 grid grid-cols-1 lg:grid-cols-12">
          
          {/* Left Column: Branded Graphic Side (Inspo from Reference Pic) */}
          <div className="relative overflow-hidden lg:col-span-7 bg-gradient-to-br from-[#002266] via-ateneo-blue to-[#1e1b4b] p-6 sm:p-8 lg:p-9 xl:p-10 text-white flex flex-col justify-between">
            {/* Abstract Decorative Diagonal Shapes inspired by reference graphic */}
            <div className="absolute -bottom-8 -left-8 h-44 w-20 rounded-full bg-cyan-400/20 rotate-45 blur-xs pointer-events-none" />
            <div className="absolute top-1/3 -right-6 h-56 w-16 rounded-full bg-blue-300/15 rotate-45 blur-xs pointer-events-none" />
            <div className="absolute bottom-8 right-16 h-36 w-10 rounded-full bg-amber-400/25 rotate-45 blur-xs pointer-events-none" />
            <div className="absolute -top-10 right-24 h-36 w-36 rounded-full bg-sky-400/15 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-3.5 xl:space-y-4">
              <BrandLogo size="lg" showSubtitle={true} subtitle="Ateneo de Davao University" variant="dark" />
              
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-3 py-0.5 text-[11px] font-semibold text-white shadow-2xs backdrop-blur-xs">
                <span className="flex h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                Official Student Housing Platform
              </div>

              <h1 className="text-2xl xl:text-3xl 2xl:text-4xl font-black tracking-tight text-white leading-tight">
                Your Safe Gateway to <br />
                <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-white bg-clip-text text-transparent">
                  Ateneo Off-Campus Living
                </span>
              </h1>
              
              <p className="text-xs xl:text-sm text-blue-100/90 leading-relaxed max-w-lg">
                Verified dormitories, certified landlords, and administrative safety moderation—curated exclusively for the Ateneo de Davao community.
              </p>
            </div>

            {/* Feature Trust Badges */}
            <div className="relative z-10 space-y-2.5 max-w-lg my-4">
              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 p-2.5 xl:p-3 shadow-xs backdrop-blur-md transition-all">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-cyan-300 border border-white/30">
                  <MapPin className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-white">2km Verified Campus Zone</h2>
                  <p className="text-[11px] text-blue-100/80">
                    Listings exclusively geofenced near Jacinto & Matina campuses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 p-2.5 xl:p-3 shadow-xs backdrop-blur-md transition-all">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-emerald-300 border border-white/30">
                  <ShieldCheck className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-white">100% University Admin Moderated</h2>
                  <p className="text-[11px] text-blue-100/80">
                    Strict verification of landlord permits and student credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 hover:bg-white/15 p-2.5 xl:p-3 shadow-xs backdrop-blur-md transition-all">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-white/20 text-amber-300 border border-white/30">
                  <Building2 className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-white">Direct Landlord Communication</h2>
                  <p className="text-[11px] text-blue-100/80">
                    Direct reservation inquiries with zero broker markups.
                  </p>
                </div>
              </div>
            </div>

            {/* University Tagline Footer Note */}
            <div className="relative z-10 flex items-center gap-2 text-[11px] font-medium text-blue-200/90 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-300 flex-shrink-0" />
              <span>Fortes in Fide • Leaders in Service</span>
            </div>
          </div>

          {/* Right Column: "The White Part Made Translucent" */}
          <div className="lg:col-span-5 bg-white/80 backdrop-blur-xl p-6 sm:p-8 xl:p-10 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-white/40">
            {children}
          </div>

        </div>
      </main>

      {/* Standalone Auth Footer */}
      <footer className={`relative z-10 border-t ${hasBg ? 'border-white/15 bg-slate-950/50 text-slate-300' : 'border-slate-200/70 bg-white/50 text-slate-500'} backdrop-blur-xs py-2.5 px-6 text-center text-xs`}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="text-[11px]">&copy; {new Date().getFullYear()} DormSafe &bull; Ateneo de Davao University</span>
        </div>
      </footer>
    </div>
  );
}
