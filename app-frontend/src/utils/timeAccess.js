export const TIME_EMPLOYEE_ROLES = ['mechanic', 'accountant', 'receptionist'];
export const TIME_TEAM_ROLES = ['admin', 'manager'];
export const TIME_DISPLAY_ROLES = ['workshop', 'admin', 'manager'];

export function canAccessMyTime(role) {
  return Boolean(role && TIME_EMPLOYEE_ROLES.includes(role));
}

export function canAccessTeamTime(role) {
  return Boolean(role && TIME_TEAM_ROLES.includes(role));
}

export function canAccessTimeDisplay(role) {
  return Boolean(role && TIME_DISPLAY_ROLES.includes(role));
}

export function getTimeHomePath(role) {
  if (canAccessTeamTime(role)) return '/time/team';
  if (canAccessMyTime(role)) return '/time/my';
  if (role === 'workshop') return '/time/display';
  return '/dashboard';
}
