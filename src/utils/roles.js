export const ALL_ROLES = Object.freeze(['Admin', 'Staff', 'Rider', 'Customer']);
export const getPrimaryRole = (roles = []) => ALL_ROLES.find(role => roles.includes(role)) ?? null;
export const canAccessRoles = (roles = [], allowed = []) => allowed.some(role => ALL_ROLES.includes(role) && roles.includes(role));
export const roleHome = (role) => ({ Admin: '/admin/dashboard', Staff: '/staff/dashboard', Rider: '/delivery/dashboard', Customer: '/' }[role] ?? '/');
