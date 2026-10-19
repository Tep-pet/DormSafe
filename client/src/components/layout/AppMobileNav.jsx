import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAVIGATION_CONFIG } from '../../constants/navigation';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { Icon } from '../common/Icons';
import { BrandLogo } from '../common/BrandLogo';

export function AppMobileDrawer({ isOpen, onClose }) {
  const { profile, role, logout, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isOpen) return null;

  async function handleLogout() {
    onClose();
    await logout();
    navigate('/login');
  }

  const navConfig = isAuthenticated ? NAVIGATION_CONFIG[role] || [] : [];
  const isGrouped = navConfig.length > 0 && navConfig[0]?.group !== undefined;

  const initials = profile?.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DS';

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 flex w-full max-w-xs flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
        {/* Top brand header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <BrandLogo size="sm" subtitle="Ateneo de Davao" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
            aria-label="Close menu"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        {/* User preview */}
        {isAuthenticated && profile && (
          <div className="border-b border-gray-100 bg-gray-50/70 px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ateneo-blue font-semibold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{profile.full_name}</p>
                <p className="truncate text-xs text-gray-500">{profile.email}</p>
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-2">
              <span className="inline-block rounded-md bg-white border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-gray-700">
                {role ? role.toUpperCase() : 'USER'}
              </span>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  profile.verification_status === 'approved'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {profile.verification_status === 'approved' ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {isAuthenticated ? (
            <div className="space-y-4">
              {isGrouped ? (
                navConfig.map((group, idx) => (
                  <div key={idx} className="space-y-1">
                    {group.group && (
                      <p className="px-3 text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                        {group.group}
                      </p>
                    )}
                    <div className="space-y-0.5">
                      {group.items.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                          <Link
                            key={item.to}
                            to={item.to}
                            onClick={onClose}
                            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                              isActive
                                ? 'bg-blue-50 text-ateneo-blue font-semibold'
                                : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                            }`}
                          >
                            <Icon
                              name={item.icon}
                              className={`h-4 w-4 ${isActive ? 'text-ateneo-blue' : 'text-gray-400'}`}
                            />
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="space-y-1">
                  {navConfig.map((item) => {
                    const isActive = location.pathname === item.to;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        onClick={onClose}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-ateneo-blue font-semibold'
                            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          className={`h-4 w-4 ${isActive ? 'text-ateneo-blue' : 'text-gray-400'}`}
                        />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <Link
                to="/login"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl border border-ateneo-blue px-4 py-2.5 text-xs font-semibold text-ateneo-blue hover:bg-blue-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={onClose}
                className="flex items-center justify-center rounded-xl bg-ateneo-blue px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-blue-900"
              >
                Register
              </Link>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="border-t border-gray-100 p-4 space-y-2">

          {isAuthenticated && (
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
            >
              <Icon name="logout" className="h-4 w-4" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function AppMobileBottomBar() {
  const { isAuthenticated, role, profile } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || role !== ROLES.STUDENT || profile?.verification_status !== 'approved') {
    return null;
  }

  const links = [
    { to: ROUTES.STUDENT_SEARCH, label: 'Search', icon: 'search' },
    { to: ROUTES.STUDENT_SAVED, label: 'Saved', icon: 'bookmark' },
    { to: ROUTES.STUDENT_MY_STAY, label: 'My Stay', icon: 'home' },
    { to: ROUTES.STUDENT_REQUESTS, label: 'Requests', icon: 'inbox' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md lg:hidden">
      <nav className="flex items-center justify-around px-2 py-1.5">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 transition-colors ${
                isActive ? 'text-ateneo-blue font-semibold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon name={link.icon} className={`h-5 w-5 ${isActive ? 'text-ateneo-blue' : 'text-gray-400'}`} />
              <span className="text-[10px]">{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
