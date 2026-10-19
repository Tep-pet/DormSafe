import React from 'react';
import { PageContainer } from './PageContainer';
import { PropertyFilter } from '../dashboard/PropertyFilter';

export function OwnerLayout({
  children,
  title,
  subtitle,
  headerAction,
  customBreadcrumbs,
  fullWidth,
  hidePropertyFilter = false,
}) {
  return (
    <PageContainer
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      customBreadcrumbs={customBreadcrumbs}
      fullWidth={fullWidth}
    >
      <div className="space-y-6">
        {!hidePropertyFilter && <PropertyFilter />}
        <div>{children}</div>
      </div>
    </PageContainer>
  );
}
