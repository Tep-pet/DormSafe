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
      className={`flex-1 flex flex-col w-full min-w-0 max-w-full ${
        fullWidth
          ? 'px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6'
          : 'mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-3.5 sm:py-6'
      } ${role === ROLES.STUDENT ? 'pb-24 sm:pb-20 lg:pb-8' : 'pb-6 lg:pb-8'}`}
    >
      {/* Breadcrumb Navigation / Page Stepper */}
      {showBreadcrumbs && (
        <div className="mb-2 sm:mb-3">
          <AppBreadcrumbs customCrumbs={customBreadcrumbs} />
        </div>
      )}

      {/* Page Header (Title + Subtitle + Action Slot) */}
      {(title || subtitle || headerAction) && (
        <header className="mb-4 sm:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between min-w-0 w-full">
          <div className="min-w-0 flex-1">
            {title && (
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 break-words">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="mt-1 text-xs text-slate-500 font-normal leading-relaxed break-words">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && (
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 min-w-0">
              {headerAction}
            </div>
          )}
        </header>
      )}

      {/* Page Body */}
      <div className="min-w-0 w-full max-w-full flex-1 flex flex-col">
        {children}
      </div>
    </div>
  );
}
