import { ROUTES } from './routes';
import { ROLES } from './roles';

export const NAVIGATION_CONFIG = {
  [ROLES.STUDENT]: [
    {
      to: ROUTES.STUDENT_SEARCH,
      label: 'Find Housing',
      icon: 'search',
      description: 'Search nearby dorms within 2 km',
      isPrimary: true,
    },
    {
      to: ROUTES.STUDENT_SAVED,
      label: 'Saved Listings',
      icon: 'bookmark',
      description: 'Bookmarked properties & comparison',
    },
    {
      to: ROUTES.STUDENT_MY_STAY,
      label: 'My Stay',
      icon: 'home',
      description: 'Current lease, payments, & requests',
    },
    {
      to: ROUTES.STUDENT_REQUESTS,
      label: 'Room Requests',
      icon: 'inbox',
      description: 'Queue status & reservations',
    },
  ],
  [ROLES.OWNER]: [
    {
      group: 'Overview',
      items: [
        {
          to: ROUTES.OWNER_DASHBOARD,
          label: 'Dashboard',
          icon: 'dashboard',
          description: 'Occupancy & revenue overview',
        },
        {
          to: ROUTES.OWNER_ANALYTICS,
          label: 'Analytics',
          icon: 'chart',
          description: 'Performance & vacancy rates',
        },
      ],
    },
    {
      group: 'Property Management',
      items: [
        {
          to: ROUTES.OWNER_LISTINGS,
          label: 'My Listings',
          icon: 'building',
          description: 'Manage properties & room availability',
        },
        {
          to: ROUTES.OWNER_ADD_PROPERTY,
          label: 'Add Property',
          icon: 'plusCircle',
          description: 'List a new dormitory or boarding house',
        },
      ],
    },
    {
      group: 'Tenants & Operations',
      items: [
        {
          to: ROUTES.OWNER_TENANTS,
          label: 'Tenants',
          icon: 'users',
          description: 'Manage active tenants & invitations',
        },
        {
          to: ROUTES.OWNER_REQUESTS,
          label: 'Room Requests',
          icon: 'inbox',
          description: 'Inquiries & waitlist queues',
        },
        {
          to: ROUTES.OWNER_PAYMENTS,
          label: 'Payment Log',
          icon: 'receipt',
          description: 'Manual rent & billing tracking',
        },
      ],
    },
    {
      group: 'Account & Settings',
      items: [
        {
          to: ROUTES.OWNER_VERIFICATION,
          label: 'Verification',
          icon: 'badgeCheck',
          description: 'Owner ID & business permit status',
        },
      ],
    },
  ],
  [ROLES.ADMIN]: [
    {
      group: 'Overview',
      items: [
        {
          to: ROUTES.ADMIN_DASHBOARD,
          label: 'Admin Dashboard',
          icon: 'dashboard',
          description: 'System health & campus metrics',
        },
      ],
    },
    {
      group: 'Verification & Approvals',
      items: [
        {
          to: ROUTES.ADMIN_APPROVE_LISTINGS,
          label: 'Approve Listings',
          icon: 'buildingCheck',
          description: 'Review dorm listings submitted for review',
        },
        {
          to: ROUTES.ADMIN_VERIFY_ACCOUNTS,
          label: 'Verify Accounts',
          icon: 'userCheck',
          description: 'Review student & owner documents',
        },
      ],
    },
    {
      group: 'Directory & Management',
      items: [
        {
          to: ROUTES.ADMIN_MANAGE_USERS,
          label: 'Manage Users',
          icon: 'users',
          description: 'All registered platform accounts',
        },
        {
          to: ROUTES.ADMIN_MANAGE_TENANTS,
          label: 'Manage Tenants',
          icon: 'userGroup',
          description: 'Campus-wide tenant oversight',
        },
        {
          to: ROUTES.ADMIN_MODERATE,
          label: 'Reviews & Reports',
          icon: 'shieldAlert',
          description: 'Moderate reviews and safety reports',
        },
      ],
    },
    {
      group: 'System & Security',
      items: [
        {
          to: ROUTES.ADMIN_AUDIT_LOG,
          label: 'Audit Log',
          icon: 'history',
          description: 'Administrative action logs',
        },
      ],
    },
  ],
};

export const ROUTE_TITLES = {
  [ROUTES.STUDENT_SEARCH]: { title: 'Find Housing Near Ateneo', subtitle: 'Verified listings within 2 km of Jacinto or Roxas campus gates' },
  [ROUTES.STUDENT_SAVED]: { title: 'Saved Listings', subtitle: 'Properties you bookmarked for comparison' },
  [ROUTES.STUDENT_MY_STAY]: { title: 'My Stay', subtitle: 'Your active lease, payment log, and maintenance requests' },
  [ROUTES.STUDENT_REQUESTS]: { title: 'Room Requests & Waitlist', subtitle: 'Track your reservation inquiries and position in room queues' },
  [ROUTES.STUDENT_VERIFICATION]: { title: 'Student Verification', subtitle: 'Your student ID is reviewed by administrators for campus safety' },
  [ROUTES.OWNER_DASHBOARD]: { title: 'Owner Dashboard', subtitle: 'Occupancy overview and revenue summary' },
  [ROUTES.OWNER_LISTINGS]: { title: 'Manage Listings', subtitle: 'Manage your dormitory properties, rooms, and availability status' },
  [ROUTES.OWNER_ADD_PROPERTY]: { title: 'Add New Property', subtitle: 'Submit a new dorm or boarding house listing for campus approval' },
  [ROUTES.OWNER_TENANTS]: { title: 'Manage Tenants', subtitle: 'Link students, send lease invites, and track tenant status' },
  [ROUTES.OWNER_REQUESTS]: { title: 'Room Requests', subtitle: 'Review and manage student reservation requests' },
  [ROUTES.OWNER_PAYMENTS]: { title: 'Payment Log', subtitle: 'Track student rent collections and send payment reminders' },
  [ROUTES.OWNER_ANALYTICS]: { title: 'Owner Analytics', subtitle: 'Occupancy rates, monthly revenue trends, and inquiries' },
  [ROUTES.OWNER_VERIFICATION]: { title: 'Owner Verification', subtitle: 'Submit government ID and business permit for listing privileges' },
  [ROUTES.ADMIN_DASHBOARD]: { title: 'Admin Overview', subtitle: 'Campus housing analytics, system health, and quick actions' },
  [ROUTES.ADMIN_APPROVE_LISTINGS]: { title: 'Approve Listings', subtitle: 'Review pending dorm submissions against university guidelines' },
  [ROUTES.ADMIN_VERIFY_ACCOUNTS]: { title: 'Verify Accounts', subtitle: 'Approve or reject student IDs and owner business permits' },
  [ROUTES.ADMIN_MANAGE_USERS]: { title: 'Manage Users', subtitle: 'View and manage all registered student, owner, and admin accounts' },
  [ROUTES.ADMIN_MANAGE_TENANTS]: { title: 'Manage Tenants', subtitle: 'Campus-wide tenant directory and lease status' },
  [ROUTES.ADMIN_AUDIT_LOG]: { title: 'Audit Log', subtitle: 'Historical record of verification and listing approval actions' },
  [ROUTES.ADMIN_MODERATE]: { title: 'Reviews & Reports', subtitle: 'Moderation queue for property reviews and tenant reports' },
  [ROUTES.COMPONENTS]: { title: 'Design System & Component Showcase', subtitle: 'Live UI library, depth comparison, and interaction testing' },
};
