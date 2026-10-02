import React from 'react';
import { AppShell } from './AppShell';
import { PropertyFilter } from '../dashboard/PropertyFilter';

export function OwnerLayout({ children, title, subtitle, headerAction }) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      showSidebar={true}
    >
      <div className="space-y-6">
        <PropertyFilter />
        <div>{children}</div>
      </div>
    </AppShell>
  );
}
