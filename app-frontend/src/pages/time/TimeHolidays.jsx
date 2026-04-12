import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { canAccessTeamTime } from '../../utils/timeAccess';
import { fetchHolidays, createHoliday, deleteHoliday } from '../../services/timeApi';
import {
  ETH_MONTHS,
  formatWorkDateWeekday,
  formatWorkDateGregorianSmall,
  toEthDatePartsFromGregorian,
} from '../../utils/timeFormat';

// ── helpers ────────────────────────────────────────────────────────────────

function isEthiopianLeapYear(year) {
  return Number(year) % 4 === 3;
}

function maxEthDaysInMonth(year, month) {
  if (!month) return 30;
  if (Number(month) <= 12) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

function toGregorianStringFromEthDate(year, month, day) {
  if (!year || !month || !day) return '';
  try {
    const dt = new EthDateTime(Number(year), Number(month), Number(day), 6, 0, 0);
    const g = dt.toEuropeanDate();
    const yyyy = g.getUTCFullYear();
    const mm = String(g.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(g.getUTCDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return '';
  }
}

function buildYearOptions() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const parts = toEthDatePartsFromGregorian(iso);
  const currentEthYear = parts?.year ?? 2017;
  const options = [];
  for (let y = currentEthYear + 2; y >= currentEthYear - 3; y -= 1) options.push(y);
  return { options, currentEthYear };
}

const { options: YEAR_OPTIONS, currentEthYear: CURRENT_ETH_YEAR } = buildYearOptions();

function formatEthDate(gregDateStr) {
  const parts = toEthDatePartsFromGregorian(gregDateStr);
  if (!parts) return '';
  const monthName = ETH_MONTHS.find((m) => m.value === parts.month)?.label ?? '';
  return `${parts.day} ${monthName} ${parts.year}`;
}

// ── component ──────────────────────────────────────────────────────────────

const TimeHolidays = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  // Modal form state
  const [ethYear, setEthYear] = useState(String(CURRENT_ETH_YEAR));
  const [ethMonth, setEthMonth] = useState('');
  const [ethDay, setEthDay] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const gregDate = toGregorianStringFromEthDate(ethYear, ethMonth, ethDay);
  const maxDays = maxEthDaysInMonth(ethYear, ethMonth);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);

  useEffect(() => {
    if (!canAccessTeamTime(user?.role)) {
      navigate('/time');
      return;
    }
    loadHolidays();
  }, []);

  async function loadHolidays() {
    setLoading(true);
    try {
      const data = await fetchHolidays();
      setHolidays(data);
    } catch {
      toast.error('Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }

  function openModal() {
    setEthYear(String(CURRENT_ETH_YEAR));
    setEthMonth('');
    setEthDay('');
    setReason('');
    setShowModal(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!gregDate) {
      toast.error('Select a valid date');
      return;
    }
    setSubmitting(true);
    try {
      const created = await createHoliday({ date: gregDate, reason: reason.trim() });
      setHolidays((prev) =>
        [...prev, created].sort((a, b) => a.date.localeCompare(b.date)),
      );
      toast.success('Holiday added');
      setShowModal(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add holiday');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success('Holiday removed');
    } catch {
      toast.error('Failed to remove holiday');
    } finally {
      setDeletingId(null);
    }
  }

  // Group by Ethiopian year (derived from each holiday's Gregorian date), newest first
  const grouped = holidays.reduce((acc, h) => {
    const parts = toEthDatePartsFromGregorian(h.date);
    const label = parts ? String(parts.year) : h.date.slice(0, 4);
    if (!acc[label]) acc[label] = [];
    acc[label].push(h);
    return acc;
  }, {});
  const sortedYears = Object.keys(grouped).sort((a, b) => b - a);

  return (
    <section className="py-2">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <button
            type="button"
            onClick={() => navigate('/time/team')}
            className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to team
          </button>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Holidays</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Marked days are excluded from expected-work calculations.
          </p>
        </div>
        <button
          type="button"
          onClick={openModal}
          className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition flex items-center gap-1.5 shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Holiday
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-16">
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        </div>
      ) : holidays.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-10 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 mx-auto mb-3 text-gray-300 dark:text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="font-medium text-gray-700 dark:text-gray-300">No holidays added yet</p>
          <p className="text-sm mt-1 text-gray-500 dark:text-gray-400">Add holidays to exclude them from time tracking.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {sortedYears.map((ethYear) => (
            <div key={ethYear}>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2 px-1">
                Ethiopian year {ethYear}
              </p>
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] overflow-hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
                {grouped[ethYear].map((h) => (
                  <div key={h.id} className="flex items-center gap-3 px-4 py-3.5">
                    <div className="flex-1 min-w-0">
                      {/* Primary: Ethiopian date */}
                      <p className="font-semibold text-sm text-gray-900 dark:text-white">
                        {formatEthDate(h.date)}
                      </p>
                      {/* Secondary: Gregorian ref + weekday */}
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {formatWorkDateWeekday(h.date)} · {formatWorkDateGregorianSmall(h.date)} (Gregorian)
                      </p>
                      {h.reason && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
                          {h.reason}
                        </p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(h.id)}
                      disabled={deletingId === h.id}
                      aria-label="Remove holiday"
                      className="text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-40 transition text-xs font-semibold uppercase tracking-wide shrink-0"
                    >
                      {deletingId === h.id ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Holiday Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Add Holiday</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Enter the date using the Ethiopian calendar.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Ethiopian date picker */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Date (Ethiopian calendar)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <select
                    required
                    value={ethYear}
                    onChange={(e) => {
                      const y = e.target.value;
                      setEthYear(y);
                      const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(y, ethMonth));
                      setEthDay(ethDay ? String(clampedDay) : '');
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30"
                  >
                    {YEAR_OPTIONS.map((y) => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                  <select
                    required
                    value={ethMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setEthMonth(m);
                      const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(ethYear, m));
                      setEthDay(ethDay ? String(clampedDay) : '');
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30"
                  >
                    <option value="">Month</option>
                    {ETH_MONTHS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                  <select
                    required
                    value={ethDay}
                    onChange={(e) => setEthDay(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-2 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30"
                  >
                    <option value="">Day</option>
                    {dayOptions.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                {gregDate && (
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    Gregorian: {formatWorkDateGregorianSmall(gregDate)} ({formatWorkDateWeekday(gregDate)})
                  </p>
                )}
              </div>

              {/* Reason */}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Reason <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <input
                  type="text"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Ethiopian New Year"
                  maxLength={200}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !gregDate}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
                >
                  {submitting ? 'Adding…' : 'Add Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default TimeHolidays;
