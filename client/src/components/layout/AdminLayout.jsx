import React from 'react';
import { PageContainer } from './PageContainer';

export function AdminLayout({ title, subtitle, headerAction, children }) {
  return (
    <PageContainer title={title} subtitle={subtitle} headerAction={headerAction}>
      {children}
    </PageContainer>
  );
}
