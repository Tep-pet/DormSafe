import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { NAVIGATION_CONFIG } from '../../constants/navigation';
import { Icon } from '../common/Icons';
import { BrandLogo } from '../common/BrandLogo';
import { ROLES } from '../../constants/roles';

export function AppSidebar({ className = '' }) {
  const { role } = useAuth();
  const location = useLocation();

  const navConfig = NAVIGATION_CONFIG[role] || [];
  if (navConfig.length === 0) return null;

  // Check if items are grouped or flat
  const isGrouped = navConfig[0]?.group !== undefined;

  return (
    <aside
      className={`h-full w-[270px] flex-shrink-0 rounded-2xl lg:rounded-3xl border border-slate-200/90 bg-white/95 backdrop-blur-md shadow-xs p-4 flex flex-col justify-between overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`.trim()}
    >
      <div className="space-y-6">
        {/* Brand Logo inside Floating Sidebar */}
        <div className="pb-3.5 border-b border-slate-100 px-1.5">
          <BrandLogo size="md" subtitle="Ateneo de Davao" />
        </div>

        {/* Role Portal Label */}
        <div className="px-2.5">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
            {role === ROLES.OWNER && 'Owner Workspace'}
            {role === ROLES.ADMIN && 'Admin Control Desk'}
            {role === ROLES.STUDENT && 'Student Portal'}
          </p>
        </div>

        {/* Navigation list */}
        <nav className="space-y-4">
          {isGrouped ? (
            navConfig.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1.5">
                {group.group && (
                  <p className="px-2.5 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                    {group.group}
                  </p>
                )}
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isActive =
                      location.pathname === item.to ||
                      (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                          isActive
                            ? 'bg-blue-50 text-ateneo-blue font-semibold shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <Icon
                          name={item.icon}
                          className={`h-5 w-5 shrink-0 transition-colors ${
                            isActive ? 'text-ateneo-blue' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        <span className="flex-1 truncate text-sm">{item.label}</span>
                        {item.badge && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-ateneo-blue">
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div className="space-y-1">
              {navConfig.map((item) => {
                const isActive =
                  location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(`${item.to}/`));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`group flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-ateneo-blue font-semibold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Icon
                      name={item.icon}
                      className={`h-5 w-5 shrink-0 transition-colors ${
                        isActive ? 'text-ateneo-blue' : 'text-slate-400 group-hover:text-slate-600'
                      }`}
                    />
                    <span className="flex-1 truncate text-sm">{item.label}</span>
                    {item.badge && (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-ateneo-blue">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </nav>
      </div>

      {/* Clean Subtle Footer with Version/Status */}
      <div className="pt-4 border-t border-slate-100 px-2.5 text-xs text-slate-400 flex items-center justify-between">
        <span>DormSafe System</span>
        <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          Active
        </span>
      </div>
    </aside>
  );
}
