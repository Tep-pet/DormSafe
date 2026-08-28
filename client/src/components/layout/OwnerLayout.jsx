import { PageContainer } from '../../components/layout/PageContainer';
import { OwnerSidebarLinks } from '../../components/dashboard/OwnerListingCard';
import { PropertyFilter } from '../../components/dashboard/PropertyFilter';

export function OwnerLayout({ children, title, subtitle }) {
  return (
    <PageContainer title={title} subtitle={subtitle}>
      <PropertyFilter />
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">        <aside className="rounded-xl border border-gray-200 bg-white p-4">
          <OwnerSidebarLinks />
        </aside>
        <div>{children}</div>
      </div>
    </PageContainer>
  );
}
