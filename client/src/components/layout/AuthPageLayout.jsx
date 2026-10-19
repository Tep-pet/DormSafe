import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { BrandLogo } from '../common/BrandLogo';

/**
 * Dedicated Authentication Layout
 * Decoupled from AppShell.
 * On desktop (lg+), perfectly fits within a single non-scrollable viewport (100vh).
 * On smaller screens, provides smooth natural scrolling.
 */
export function AuthPageLayout({ children, cardMaxWidth = 'max-w-md' }) {
  return (
    <div className="relative min-h-screen lg:h-screen lg:max-h-screen w-full bg-slate-50 flex flex-col justify-between overflow-x-hidden overflow-y-auto lg:overflow-hidden">
      {/* Background Decorative Ambient Glows & Subtle Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] opacity-60 pointer-events-none" />
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      {/* Top Mobile Bar */}
      <header className="lg:hidden relative z-10 flex items-center justify-between px-6 py-3.5 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <BrandLogo size="sm" />
        <span className="text-xs font-semibold text-slate-500">Campus Housing</span>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-6 lg:py-2 lg:px-8 xl:py-4 xl:px-12">
        <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 xl:gap-12 items-center">
          
          {/* Left Column: Institutional Brand & Pillars (Visible on Desktop) */}
          <div className="hidden lg:flex lg:col-span-6 xl:col-span-7 flex-col justify-center space-y-4 xl:space-y-6 pr-2">
            <div>
              <BrandLogo size="lg" showSubtitle={true} subtitle="Ateneo de Davao University" />
              
              <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/90 px-3 py-0.5 text-[11px] font-semibold text-ateneo-blue shadow-2xs backdrop-blur-xs">
                <span className="flex h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse" />
                Official Student Housing Platform
              </div>

              <h1 className="mt-2.5 text-2xl xl:text-3xl 2xl:text-4xl font-black tracking-tight text-slate-900 leading-tight">
                Your Safe Gateway to <br />
                <span className="bg-gradient-to-r from-ateneo-blue via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                  Ateneo Off-Campus Living
                </span>
              </h1>
              
              <p className="mt-1.5 text-xs xl:text-sm text-slate-600 leading-relaxed max-w-lg">
                Verified dormitories, certified landlords, and administrative safety moderation—curated exclusively for the Ateneo de Davao community.
              </p>
            </div>

            {/* Feature Trust Badges */}
            <div className="space-y-2.5 max-w-lg">
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 xl:p-3 shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-0.5">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-ateneo-blue border border-blue-100">
                  <MapPin className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-slate-900">2km Verified Campus Zone</h2>
                  <p className="text-[11px] text-slate-500">
                    Listings exclusively geofenced near Jacinto & Matina campuses.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 xl:p-3 shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-0.5">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <ShieldCheck className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-slate-900">100% University Admin Moderated</h2>
                  <p className="text-[11px] text-slate-500">
                    Strict verification of landlord permits and student credentials.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/80 p-2.5 xl:p-3 shadow-xs backdrop-blur-xs transition-transform hover:-translate-y-0.5">
                <div className="flex h-8 w-8 xl:h-9 xl:w-9 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
                  <Building2 className="h-4 w-4 xl:h-4.5 xl:w-4.5" />
                </div>
                <div>
                  <h2 className="text-xs xl:text-sm font-bold text-slate-900">Direct Landlord Communication</h2>
                  <p className="text-[11px] text-slate-500">
                    Direct reservation inquiries with zero broker markups.
                  </p>
                </div>
              </div>
            </div>

            {/* University Tagline Footer Note */}
            <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500 pt-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-ateneo-blue flex-shrink-0" />
              <span>Fortes in Fide • Leaders in Service</span>
            </div>
          </div>

          {/* Right Column: Dynamic Auth Form Card */}
          <div className="lg:col-span-6 xl:col-span-5 flex justify-center w-full">
            <div className={`w-full ${cardMaxWidth}`}>
              {children}
            </div>
          </div>

        </div>
      </main>

      {/* Standalone Auth Footer */}
      <footer className="relative z-10 border-t border-slate-200/70 bg-white/50 backdrop-blur-xs py-2.5 px-6 text-center text-xs text-slate-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span className="text-[11px]">&copy; {new Date().getFullYear()} DormSafe &bull; Ateneo de Davao University</span>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span>Housing Safety Portal</span>
            <span>&bull;</span>
            <Link to="/components" className="hover:text-ateneo-blue transition-colors">Design System</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
