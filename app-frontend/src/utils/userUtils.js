export const ROLE_LABELS = {
  admin: 'Admin',
  manager: 'Manager',
  accountant: 'Accountant',
  mechanic: 'Mechanic',
  receptionist: 'Receptionist',
  workshop: 'Workshop',
  user: 'User',
};

export const ROLE_COLORS = {
  admin: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400',
  manager: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  accountant: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  mechanic: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  receptionist: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  workshop: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
  user: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400',
};

const AVATAR_BG = [
  'bg-blue-600', 'bg-emerald-600', 'bg-purple-600', 'bg-amber-600',
  'bg-rose-600', 'bg-cyan-600', 'bg-indigo-600', 'bg-teal-600',
];

export function avatarColor(id) {
  const hash = (id || '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_BG[hash % AVATAR_BG.length];
}

export function getInitials(user) {
  return [user.firstName?.[0], user.lastName?.[0]].filter(Boolean).join('').toUpperCase();
}
