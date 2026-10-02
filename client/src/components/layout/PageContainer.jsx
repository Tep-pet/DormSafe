import { AppShell } from './AppShell';

export function PageContainer({
  children,
  title,
  subtitle,
  headerAction,
  showSidebar,
  fullWidth = false,
  showBreadcrumbs = true,
  customBreadcrumbs,
}) {
  return (
    <AppShell
      title={title}
      subtitle={subtitle}
      headerAction={headerAction}
      showSidebar={showSidebar}
      fullWidth={fullWidth}
      showBreadcrumbs={showBreadcrumbs}
      customBreadcrumbs={customBreadcrumbs}
    >
      {children}
    </AppShell>
  );
}
