import React from 'react';
import { Link } from 'react-router-dom';
import { BrandLogo } from '../common/BrandLogo';
import { ROUTES } from '../../constants/routes';

export function AppFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-transparent text-slate-500">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <BrandLogo size="md" subtitle="Ateneo de Davao University" />
            <p className="mt-3 max-w-md text-xs text-slate-500 leading-relaxed">
              A trusted student housing discovery and verification platform for the Ateneo de Davao University community. Search verified dorms within 2 km of Jacinto and Roxas campus gates.
            </p>
            <p className="mt-2 text-[11px] text-slate-400">
              Capstone 2 Project — Aguirre, Pacatang, Palima · Ateneo de Davao University · SY 2025–2026
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Campus Portals</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li>
                <Link to={ROUTES.STUDENT_SEARCH} className="hover:text-ateneo-blue transition-colors">
                  Find Student Dorms
                </Link>
              </li>
              <li>
                <Link to={ROUTES.STUDENT_SAVED} className="hover:text-ateneo-blue transition-colors">
                  Saved Bookmarks
                </Link>
              </li>
              <li>
                <Link to={ROUTES.OWNER_DASHBOARD} className="hover:text-ateneo-blue transition-colors">
                  Property Owner Portal
                </Link>
              </li>
              <li>
                <Link to={ROUTES.ADMIN_DASHBOARD} className="hover:text-ateneo-blue transition-colors">
                  Admin Verification Desk
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">Safety & Standards</h4>
            <ul className="mt-3 space-y-2 text-xs">
              <li className="text-slate-500">
                <span className="font-medium text-slate-700">Jacinto Gate:</span> 2 km walking perimeter
              </li>
              <li className="text-slate-500">
                <span className="font-medium text-slate-700">Roxas Gate:</span> 2 km walking perimeter
              </li>
              <li className="text-slate-500">
                <span className="font-medium text-slate-700">Verification:</span> Student ID & Business Permits
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-200/60 pt-6 sm:flex-row text-xs text-slate-400">
          <p>© {currentYear} DormSafe · Ateneo de Davao University. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5 text-[11px]">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Platform Active & Verified
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
