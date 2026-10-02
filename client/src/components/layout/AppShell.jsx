import React, { useState, useRef } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';
import { AppBreadcrumbs } from './AppBreadcrumbs';
import { AppFooter } from './AppFooter';
import { AppMobileDrawer, AppMobileBottomBar } from './AppMobileNav';
import { PageTransition } from '../common/PageTransition';
import { useAuth } from '../../hooks/useAuth';
import { useAutoScrollbar } from '../../hooks/useAutoScrollbar';
import { ROLES } from '../../constants/roles';

export function AppShell({
  children,
  title,
  subtitle,
  headerAction,
  customBreadcrumbs,
  showBreadcrumbs = true,
  showSidebar: explicitShowSidebar,
  showFooter = true,
  fullWidth = false,
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const scrollContainerRef = useRef(null);
  const { isAuthenticated, role } = useAuth();
  const location = useLocation();
  const { handleScroll: handleAutoScrollbar, scrollbarClassName } = useAutoScrollbar(1000);

  // Determine whether sidebar should be shown by default:
  // Show sidebar for Owner and Admin dashboards unless explicitly overridden
  const hasSidebar =
    explicitShowSidebar !== undefined
      ? explicitShowSidebar
      : isAuthenticated && (role === ROLES.OWNER || role === ROLES.ADMIN);

  const handleScroll = (e) => {
    const scrollTop = e.currentTarget.scrollTop;
    setIsScrolled(scrollTop > 12);
    handleAutoScrollbar();
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-ateneo-blue">
      {/* 1. Floating Left Sidebar (Spans top-to-bottom / hits ceiling with elegant margins) */}
      {hasSidebar && (
        <div className="hidden lg:flex flex-col flex-shrink-0 p-3 sm:p-4 pr-0 h-screen z-20">
          <AppSidebar />
        </div>
      )}

      {/* 2. Mobile Drawer */}
      <AppMobileDrawer
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* 3. Main Viewport Area (Scrollable viewport on the right with sticky topbar) */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className={`flex flex-1 flex-col overflow-y-auto min-h-0 min-w-0 relative ${scrollbarClassName}`}
      >
        {/* Topbar: Floating capsule sitting on the side of sidebar */}
        <div className="sticky top-0 z-30 pt-3 sm:pt-4 px-4 sm:px-6 lg:px-8 pointer-events-none">
          <AppHeader
            isScrolled={isScrolled}
            hasSidebar={hasSidebar}
            fullWidth={fullWidth}
            onOpenMobileMenu={() => setMobileMenuOpen(true)}
          />
        </div>

        {/* Universal Page Container (Standardized universal padding & margin across all pages) */}
        <main
          className={`flex-1 ${
            fullWidth
              ? 'w-full px-4 sm:px-6 lg:px-8 py-6'
              : 'mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6'
          } ${role === ROLES.STUDENT ? 'pb-20 lg:pb-8' : ''}`}
        >
          {/* Breadcrumb Navigation */}
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

          {/* Render children or nested React Router Outlet with graceful transition */}
          <PageTransition pageKey={location.pathname}>
            {children ? children : <Outlet />}
          </PageTransition>
        </main>

        {/* Footer at bottom of scrollable page */}
        {showFooter && <AppFooter />}
      </div>

      {/* 4. Mobile Bottom Bar (Quick navigation for students) */}
      <AppMobileBottomBar />
    </div>
  );
}
