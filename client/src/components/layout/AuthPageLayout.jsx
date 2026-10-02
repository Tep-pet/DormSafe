import React from 'react';
import { AppShell } from './AppShell';

/** Minimal header for login/register pages */
export function AuthPageLayout({ children, title, subtitle }) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      showSidebar={false}
      showBreadcrumbs={false}
      showFooter={true}
    >
      <div className="mx-auto max-w-md py-6">
        {children}
      </div>
    </AppShell>
  );
}
