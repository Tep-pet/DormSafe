import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';
import { ROUTES } from '../../constants/routes';
import { Icon } from '../common/Icons';

export function UserDropdown() {
  const { profile, role, logout, isAuthenticated } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isAuthenticated || !profile) return null;

  async function handleLogout() {
    setIsOpen(false);
    await logout();
    navigate('/login');
  }

  const initials = profile.full_name
    ? profile.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'DS';

  const roleLabel = {
    [ROLES.STUDENT]: 'Ateneo Student',
    [ROLES.OWNER]: 'Property Owner',
    [ROLES.ADMIN]: 'Platform Administrator',
  }[role] || role;

  const roleBadgeColor = {
    [ROLES.STUDENT]: 'bg-blue-100 text-blue-800 border-blue-200',
    [ROLES.OWNER]: 'bg-amber-100 text-amber-800 border-amber-200',
    [ROLES.ADMIN]: 'bg-purple-100 text-purple-800 border-purple-200',
  }[role] || 'bg-gray-100 text-gray-800 border-gray-200';

  const verificationStatus = profile.verification_status || 'unverified';
  const isApproved = verificationStatus === 'approved';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 rounded-full p-1 transition-all hover:ring-2 hover:ring-ateneo-blue/20 focus:outline-none focus:ring-2 focus:ring-ateneo-blue"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-ateneo-blue font-semibold text-white shadow-sm text-sm">
          {initials}
        </div>
        <div className="hidden text-left sm:block">
          <p className="max-w-[130px] truncate text-xs font-semibold text-gray-900 leading-tight">
            {profile.full_name || 'User'}
          </p>
          <p className="text-[11px] text-gray-500 capitalize">{role}</p>
        </div>
        <Icon name="chevronDown" className="hidden h-4 w-4 text-gray-400 sm:block" />
      </button>

      {isOpen && (
        <div className="absolute right-0 z-50 mt-2 w-72 origin-top-right rounded-2xl border border-gray-100 bg-white p-2 shadow-xl ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-100">
          <div className="border-b border-gray-100 px-3 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-ateneo-blue font-bold text-white shadow-sm">
                {initials}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">
                  {profile.full_name || 'User'}
                </p>
                <p className="truncate text-xs text-gray-500">{profile.email || ''}</p>
              </div>
            </div>

            <div className="mt-2.5 flex items-center justify-between gap-2">
              <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium ${roleBadgeColor}`}>
                {roleLabel}
              </span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  isApproved
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'bg-amber-50 text-amber-700'
                }`}
              >
                {isApproved ? 'Verified' : 'Pending Verification'}
              </span>
            </div>
          </div>

          <div className="py-1">
            {role === ROLES.STUDENT && (
              <>
                <Link
                  to={ROUTES.STUDENT_SEARCH}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="search" className="h-4 w-4 text-gray-400" />
                  <span>Find Housing</span>
                </Link>
                <Link
                  to={ROUTES.STUDENT_SAVED}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="bookmark" className="h-4 w-4 text-gray-400" />
                  <span>Saved Listings</span>
                </Link>
                <Link
                  to={ROUTES.STUDENT_MY_STAY}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="home" className="h-4 w-4 text-gray-400" />
                  <span>My Stay & Lease</span>
                </Link>
                <Link
                  to={ROUTES.STUDENT_VERIFICATION}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="badgeCheck" className="h-4 w-4 text-gray-400" />
                  <span>Student ID Status</span>
                </Link>
              </>
            )}

            {role === ROLES.OWNER && (
              <>
                <Link
                  to={ROUTES.OWNER_DASHBOARD}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="dashboard" className="h-4 w-4 text-gray-400" />
                  <span>Owner Dashboard</span>
                </Link>
                <Link
                  to={ROUTES.OWNER_LISTINGS}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="building" className="h-4 w-4 text-gray-400" />
                  <span>My Listings</span>
                </Link>
                <Link
                  to={ROUTES.OWNER_VERIFICATION}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="badgeCheck" className="h-4 w-4 text-gray-400" />
                  <span>Permit Verification</span>
                </Link>
              </>
            )}

            {role === ROLES.ADMIN && (
              <>
                <Link
                  to={ROUTES.ADMIN_DASHBOARD}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="dashboard" className="h-4 w-4 text-gray-400" />
                  <span>Admin Overview</span>
                </Link>
                <Link
                  to={ROUTES.ADMIN_AUDIT_LOG}
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-ateneo-blue"
                >
                  <Icon name="history" className="h-4 w-4 text-gray-400" />
                  <span>Audit Logs</span>
                </Link>
              </>
            )}

          </div>

          <div className="border-t border-gray-100 pt-1">
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"
            >
              <Icon name="logout" className="h-4 w-4 text-red-500" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
