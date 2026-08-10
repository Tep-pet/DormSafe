export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  STUDENT_SEARCH: '/student/search',
  STUDENT_PROPERTY: '/student/property/:id',
  OWNER_DASHBOARD: '/owner/dashboard',
  ADMIN_VERIFY_OWNERS: '/admin/verify-owners',
  ADMIN_APPROVE_LISTINGS: '/admin/approve-listings',
};

/** Default landing page per role after login */
export const ROLE_HOME = {
  student: ROUTES.STUDENT_SEARCH,
  owner: ROUTES.OWNER_DASHBOARD,
  admin: ROUTES.ADMIN_APPROVE_LISTINGS,
};
