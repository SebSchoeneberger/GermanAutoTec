import { EthDateTime } from 'ethiopian-calendar-date-converter';

export const ADDIS_TIME_ZONE = 'Africa/Addis_Ababa';

export const ETH_MONTHS = [
  { value: 1, label: 'Meskerem' },
  { value: 2, label: 'Tikimt' },
  { value: 3, label: 'Hidar' },
  { value: 4, label: 'Tahsas' },
  { value: 5, label: 'Tir' },
  { value: 6, label: 'Yekatit' },
  { value: 7, label: 'Megabit' },
  { value: 8, label: 'Miazia' },
  { value: 9, label: 'Ginbot' },
  { value: 10, label: 'Sene' },
  { value: 11, label: 'Hamle' },
  { value: 12, label: 'Nehase' },
  { value: 13, label: 'Pagume' },
];

/** Convert a YYYY-MM-DD Gregorian string to Ethiopian date parts. */
export function toEthDatePartsFromGregorian(yyyyMmDd) {
  if (typeof yyyyMmDd !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(yyyyMmDd)) return null;
  const [y, m, d] = yyyyMmDd.split('-').map(Number);
  try {
    const et = EthDateTime.fromEuropeanDate(new Date(Date.UTC(y, m - 1, d, 12, 0, 0)));
    return { year: et.year, month: et.month, day: et.date };
  } catch {
    return null;
  }
}

export function formatDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes <= 0) return '0m';
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

export function formatSignedDuration(totalMinutes) {
  if (!Number.isFinite(totalMinutes) || totalMinutes === 0) return '0m';
  const sign = totalMinutes > 0 ? '+' : '-';
  return `${sign}${formatDuration(Math.abs(totalMinutes))}`;
}

export function formatAddisTime(iso) {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleTimeString('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatAddisDateTimeSmall(iso) {
  if (!iso) return '--';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleString('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function formatWorkDateWeekday(workDate) {
  if (typeof workDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return '--';
  const date = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    weekday: 'short',
  });
}

export function formatWorkDateGregorianSmall(workDate) {
  if (typeof workDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(workDate)) return '--';
  const date = new Date(`${workDate}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return '--';
  return date.toLocaleDateString('en-GB', {
    timeZone: ADDIS_TIME_ZONE,
    day: '2-digit',
    month: 'short',
  });
}
