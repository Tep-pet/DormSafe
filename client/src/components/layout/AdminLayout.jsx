import React from 'react';
import { PageContainer } from './PageContainer';

export function AdminLayout({ title, subtitle, headerAction, customBreadcrumbs, fullWidth, children }) {
  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      customBreadcrumbs={customBreadcrumbs}
      fullWidth={fullWidth}
    >
      {children}
    </PageContainer>
  );
}
