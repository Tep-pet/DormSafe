import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Icon } from '../common/Icons';
import { ROUTES } from '../../constants/routes';
import { ROUTE_TITLES } from '../../constants/navigation';

export function AppBreadcrumbs({ customCrumbs }) {
  const location = useLocation();

  if (customCrumbs) {
    return (
      <nav aria-label="Breadcrumb" className="mb-3 flex items-center text-xs text-gray-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          {customCrumbs.map((crumb, idx) => {
            const isLast = idx === customCrumbs.length - 1;
            return (
              <li key={idx} className="flex items-center gap-1.5">
                {idx > 0 && <Icon name="chevronRight" className="h-3 w-3 text-gray-400" />}
                {crumb.to && !isLast ? (
                  <Link to={crumb.to} className="hover:text-ateneo-blue transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={isLast ? 'font-medium text-gray-900' : ''}>{crumb.label}</span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    );
  }

  const currentPath = location.pathname;
  const routeInfo = ROUTE_TITLES[currentPath];

  // If top level or not matched in route titles, generate automatic crumbs
  const pathSegments = currentPath.split('/').filter(Boolean);
  if (pathSegments.length === 0) return null;

  const crumbs = [];

  // Determine section
  const section = pathSegments[0]; // student, owner, admin
  if (section === 'student') {
    crumbs.push({ label: 'Student Portal', to: ROUTES.STUDENT_SEARCH });
  } else if (section === 'owner') {
    crumbs.push({ label: 'Owner Portal', to: ROUTES.OWNER_DASHBOARD });
  } else if (section === 'admin') {
    crumbs.push({ label: 'Admin Portal', to: ROUTES.ADMIN_DASHBOARD });
  }

  if (routeInfo) {
    crumbs.push({ label: routeInfo.title });
  } else if (pathSegments.length > 1) {
    // Dynamic subroutes
    const isUuid = (str) => /^[0-9a-f]{8}-[0-9a-f]{4}/i.test(str) || str.length > 20;

    if (section === 'admin' && pathSegments[1] === 'listings') {
      crumbs.push({ label: 'Approve Listings', to: ROUTES.ADMIN_APPROVE_LISTINGS });
      crumbs.push({ label: 'Listing Review' });
    } else if (section === 'admin' && pathSegments[1] === 'verify-owners') {
      crumbs.push({ label: 'Verify Accounts', to: ROUTES.ADMIN_VERIFY_ACCOUNTS });
      crumbs.push({ label: 'Owner Verification' });
    } else if (section === 'student' && pathSegments[1] === 'property') {
      crumbs.push({ label: 'Find Dorms', to: ROUTES.STUDENT_SEARCH });
      crumbs.push({ label: 'Property Details' });
    } else if (section === 'owner' && pathSegments[1] === 'listings' && pathSegments[3] === 'edit') {
      crumbs.push({ label: 'Manage Listings', to: ROUTES.OWNER_LISTINGS });
      crumbs.push({ label: 'Edit Property' });
    } else {
      const lastSegment = pathSegments[pathSegments.length - 1];
      const pageName = isUuid(lastSegment)
        ? 'Details'
        : lastSegment
            .replace(/-/g, ' ')
            .replace(/\b\w/g, (c) => c.toUpperCase());
      crumbs.push({ label: pageName });
    }
  }

  if (crumbs.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-3 flex items-center text-xs text-gray-500">
      <ol className="flex flex-wrap items-center gap-1.5">
        {crumbs.map((crumb, idx) => {
          const isLast = idx === crumbs.length - 1;
          return (
            <li key={idx} className="flex items-center gap-1.5">
              {idx > 0 && <Icon name="chevronRight" className="h-3 w-3 text-gray-400" />}
              {crumb.to && !isLast ? (
                <Link to={crumb.to} className="hover:text-ateneo-blue transition-colors">
                  {crumb.label}
                </Link>
              ) : (
                <span className={isLast ? 'font-medium text-gray-800' : ''}>{crumb.label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
