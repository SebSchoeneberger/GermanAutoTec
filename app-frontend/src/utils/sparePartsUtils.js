export const CATEGORIES = [
  'Engine', 'Transmission', 'Brake', 'Suspension',
  'Electrical', 'Body', 'Interior', 'Other',
];

export const CATEGORY_COLORS = {
  Engine:       'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  Transmission: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Brake:        'bg-red-100    text-red-700    dark:bg-red-900/30    dark:text-red-400',
  Suspension:   'bg-blue-100   text-blue-700   dark:bg-blue-900/30   dark:text-blue-400',
  Electrical:   'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  Body:         'bg-green-100  text-green-700  dark:bg-green-900/30  dark:text-green-400',
  Interior:     'bg-teal-100   text-teal-700   dark:bg-teal-900/30   dark:text-teal-400',
  Other:        'bg-gray-100   text-gray-600   dark:bg-gray-800/50   dark:text-gray-400',
};

export const getStockStatus = (qty) => {
  if (qty === 0) return { label: 'Out of Stock', className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' };
  if (qty <= 5)  return { label: 'Low Stock',    className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  return           { label: 'In Stock',       className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
};

export const OWNER_TYPES = ['Company', 'Employee', 'Customer', 'External'];

// Badge colors used in the detail modal
export const OWNER_TYPE_COLORS = {
  Employee: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
  Customer: 'bg-pink-100   text-pink-700   dark:bg-pink-900/30   dark:text-pink-400',
  External: 'bg-amber-100  text-amber-700  dark:bg-amber-900/30  dark:text-amber-400',
};

// Dot colors used on cards
export const OWNER_DOT_COLORS = {
  Employee: 'bg-indigo-500',
  Customer: 'bg-pink-500',
  External: 'bg-amber-500',
};

export const SORT_OPTIONS = [
  { label: 'Name A–Z',          sortBy: 'name',     sortOrder: 'asc' },
  { label: 'Name Z–A',          sortBy: 'name',     sortOrder: 'desc' },
  { label: 'Stock: Low → High', sortBy: 'quantity', sortOrder: 'asc' },
  { label: 'Stock: High → Low', sortBy: 'quantity', sortOrder: 'desc' },
  { label: 'Price: Low → High', sortBy: 'price',    sortOrder: 'asc' },
  { label: 'Price: High → Low', sortBy: 'price',    sortOrder: 'desc' },
];

export const ACTIVITY_STYLES = {
  created:   { dot: 'bg-green-500',  label: 'Added' },
  sold:      { dot: 'bg-red-500',    label: 'Sold' },
  restocked: { dot: 'bg-blue-500',   label: 'Restocked' },
  edited:    { dot: 'bg-yellow-500', label: 'Edited' },
  deleted:   { dot: 'bg-gray-400',   label: 'Deleted' },
};

// Format a price in Ethiopian Birr with thousands separators.
// Whole numbers show no decimals (e.g. ETB 50,000).
// Fractional amounts show 2 decimal places (e.g. ETB 1,250.50).
export const formatETB = (price) => {
  if (price == null) return null;
  const num = Number(price);
  const hasDecimals = num % 1 !== 0;
  return `ETB ${num.toLocaleString('en-US', {
    minimumFractionDigits: hasDecimals ? 2 : 0,
    maximumFractionDigits: hasDecimals ? 2 : 0,
  })}`;
};
