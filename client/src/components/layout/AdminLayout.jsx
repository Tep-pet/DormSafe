import { Link, useLocation } from 'react-router-dom';
import { PageContainer } from './PageContainer';
import { ROUTES } from '../../constants/routes';

const LINKS = [
  { to: ROUTES.ADMIN_DASHBOARD, label: 'Dashboard' },
  { to: ROUTES.ADMIN_APPROVE_LISTINGS, label: 'Approve Listings' },
  { to: ROUTES.ADMIN_VERIFY_ACCOUNTS, label: 'Verify Accounts' },
  { to: ROUTES.ADMIN_MANAGE_USERS, label: 'Manage Users' },
  { to: ROUTES.ADMIN_MANAGE_TENANTS, label: 'Manage Tenants' },
  { to: ROUTES.ADMIN_AUDIT_LOG, label: 'Audit Log' },
  { to: ROUTES.ADMIN_MODERATE, label: 'Reviews & Reports' },
];

export function AdminLayout({ title, subtitle, children }) {
  const location = useLocation();

  return (
    <PageContainer title={title} subtitle={subtitle}>
      <nav className="mb-6 flex flex-wrap gap-3 border-b border-gray-200 pb-3 text-sm">
        {LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={
              location.pathname === to
                ? 'font-medium text-ateneo-blue'
                : 'text-gray-600 hover:text-ateneo-blue'
            }
          >
            {label}
          </Link>
        ))}
      </nav>
      {children}
    </PageContainer>
  );
}
