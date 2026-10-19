/** User roles aligned with Capstone proposal */
export const ROLES = {
  STUDENT: 'student',
  OWNER: 'owner',
  ADMIN: 'admin',
};

export const ROLE_LABELS = {
  student: 'Student',
  owner: 'Property Owner',
  admin: 'Administrator',
};

/** Roles allowed during self-registration (admin is seeded) */
export const REGISTERABLE_ROLES = [ROLES.STUDENT, ROLES.OWNER];
