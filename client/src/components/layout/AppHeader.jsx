import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NotificationBell } from '../common/NotificationBell';
import { UserDropdown } from './UserDropdown';
import { Icon } from '../common/Icons';
import { BrandLogo } from '../common/BrandLogo';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';

export function AppHeader({
  onOpenMobileMenu,
  isScrolled = false,
  hasSidebar = false,
  fullWidth = false,
}) {
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();

  const studentTopLinks = [
    { to: ROUTES.STUDENT_SAVED, label: 'Saved', icon: 'bookmark' },
    { to: ROUTES.STUDENT_MY_STAY, label: 'My Stay', icon: 'home' },
    { to: ROUTES.STUDENT_REQUESTS, label: 'Requests', icon: 'inbox' },
  ];

  return (
    <header className="w-full h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-4">
      {/* Left Side: Mobile Menu Button + Brand Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile hamburger menu toggle */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white/90 text-slate-600 hover:bg-slate-100 hover:text-slate-900 lg:hidden shadow-xs"
          aria-label="Open menu"
        >
          <Icon name="menu" className="h-5 w-5" />
        </button>

        {/* Logo only appears on mobile or when desktop has NO sidebar */}
        <div className={hasSidebar ? 'flex lg:hidden flex-shrink-0' : 'flex flex-shrink-0'}>
          <BrandLogo size="sm" subtitle="Ateneo" />
        </div>
      </div>

      {/* Right Side: (Saved, My Stay, Requests) beside Bell Icon + User Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {isAuthenticated && role === ROLES.STUDENT && (
          <nav className="hidden sm:flex items-center gap-1 mr-1">
            {studentTopLinks.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-blue-50 text-ateneo-blue font-semibold shadow-xs'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    name={item.icon}
                    className={`h-4 w-4 ${isActive ? 'text-ateneo-blue' : 'text-slate-400'}`}
                  />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}

        {isAuthenticated ? (
          <>
            <NotificationBell />
            <div className="h-5 w-[1px] bg-slate-200" />
            <UserDropdown />
          </>
        ) : (
          <div className="flex items-center gap-2">
            <Link
              to="/login"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-ateneo-blue hover:bg-white/80 transition-colors"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-ateneo-blue px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-blue-900 transition-colors"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
