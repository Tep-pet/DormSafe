import React from 'react';
import { BrandLogo } from '../common/BrandLogo';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export function AppFooter() {
  const currentYear = new Date().getFullYear();
  const { isAuthenticated, role, profile } = useAuth();
  const hasMobileBottomBar =
    isAuthenticated && role === ROLES.STUDENT && profile?.verification_status === 'approved';

  return (
    <footer
      className={`mt-auto shrink-0 border-t border-slate-200/80 bg-slate-50/50 text-slate-500 transition-all ${
        hasMobileBottomBar ? 'pb-28 sm:pb-24 lg:pb-0' : 'pb-6 lg:pb-0'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-slate-500 text-center sm:text-left">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" subtitle="Ateneo de Davao University" />
          </div>
          <p>© {currentYear} DormSafe · Ateneo de Davao University. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
