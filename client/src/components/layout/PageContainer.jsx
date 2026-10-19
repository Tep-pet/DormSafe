import React from 'react';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { useAuth } from '../../hooks/useAuth';
import { ROLES } from '../../constants/roles';

export function PageContainer({
  children,
  title,
  subtitle,
  headerAction,
  fullWidth = false,
  showBreadcrumbs = true,
  customBreadcrumbs,
}) {
  const { role } = useAuth();

  return (
    <div
      className={`flex-1 flex flex-col w-full ${
        fullWidth ? 'px-4 sm:px-6 lg:px-8 py-6' : 'mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
      } ${role === ROLES.STUDENT ? 'pb-20 lg:pb-8' : ''}`}
    >
      {/* Breadcrumb Navigation / Page Stepper */}
      {showBreadcrumbs && <AppBreadcrumbs customCrumbs={customBreadcrumbs} />}

      {/* Page Header (Title + Subtitle + Action Slot) */}
      {(title || subtitle || headerAction) && (
        <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 font-normal leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="flex items-center gap-2">{headerAction}</div>}
        </header>
      )}

      {/* Page Body */}
      {children}
    </div>
  );
}
