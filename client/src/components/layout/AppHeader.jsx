import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Search, Command } from 'lucide-react';
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
  const { isAuthenticated, profile, role } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const isStudentVerified = role === ROLES.STUDENT && profile?.verification_status === 'approved';

  const studentTopLinks = [
    { to: ROUTES.STUDENT_SEARCH, label: 'Find Housing', icon: 'search' },
    { to: ROUTES.STUDENT_SAVED, label: 'Saved', icon: 'bookmark' },
    { to: ROUTES.STUDENT_MY_STAY, label: 'My Stay', icon: 'home' },
    { to: ROUTES.STUDENT_REQUESTS, label: 'Requests', icon: 'inbox' },
  ];

  const getSearchPlaceholder = () => {
    if (role === ROLES.ADMIN) return 'Search users, dorms, reports...';
    if (role === ROLES.OWNER) return 'Search listings, tenants, payments...';
    return 'Search dorms near Ateneo...';
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      if (role === ROLES.STUDENT || !isAuthenticated) {
        navigate(`${ROUTES.STUDENT_SEARCH}?q=${encodeURIComponent(searchQuery.trim())}`);
      } else if (role === ROLES.ADMIN) {
        navigate(`${ROUTES.ADMIN_MANAGE_USERS}?q=${encodeURIComponent(searchQuery.trim())}`);
      } else if (role === ROLES.OWNER) {
        navigate(`${ROUTES.OWNER_LISTINGS}?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <header
      className={`pointer-events-auto mx-auto w-full ${
        fullWidth ? 'w-full' : 'max-w-7xl'
      } h-14 sm:h-16 px-4 sm:px-6 rounded-2xl lg:rounded-3xl transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex items-center justify-between gap-4 ${
        isScrolled
          ? 'bg-white/90 backdrop-blur-md border border-slate-200/90 shadow-sm'
          : 'bg-transparent border border-transparent shadow-none'
      }`}
    >
      {/* Left Side: Mobile Menu Button + Search Bar */}
      <div className="flex items-center gap-3 min-w-0 flex-1 sm:flex-initial sm:w-80 md:w-96">
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
        {(!hasSidebar || 'lg:hidden') && (
          <div className={hasSidebar ? 'flex lg:hidden flex-shrink-0' : 'flex flex-shrink-0'}>
            <BrandLogo size="sm" subtitle="Ateneo" />
          </div>
        )}

        {/* Clean, artifact-free floating search input */}
        <div className="relative flex items-center w-full h-9 px-3.5 rounded-full bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 focus-within:border-ateneo-blue focus-within:ring-2 focus-within:ring-ateneo-blue/10 transition-all">
          <Search size={15} className="text-slate-400 flex-shrink-0 mr-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            placeholder={getSearchPlaceholder()}
            className="w-full bg-transparent border-0 outline-none ring-0 p-0 text-xs text-slate-800 placeholder:text-slate-400 font-normal focus:ring-0 focus:outline-none"
          />
          <div className="hidden sm:flex items-center gap-0.5 rounded-md border border-slate-200/80 bg-slate-100/70 px-1.5 py-0.5 text-[10px] font-medium text-slate-400 shadow-2xs select-none ml-2">
            <Command size={10} />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* Center: Desktop Student Navigation (if student) */}
      {isAuthenticated && isStudentVerified && (
        <nav className="hidden items-center gap-1 xl:flex">
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

      {/* Right: Actions (Notification Bell & User Dropdown or Login/Register) */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
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
