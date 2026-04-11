import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
import {
  ResponsiveContainer,
  CartesianGrid,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
  Cell,
  ReferenceLine,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchMyTodayDetail,
  fetchMyTimeSummary,
  fetchCorrectionDateWindow,
  fetchMyDayPunches,
  createTimeCorrectionRequest,
  fetchMyCorrectionRequests,
} from '../../services/timeApi';
import { canAccessMyTime } from '../../utils/timeAccess';
import {
  formatAddisTime,
  formatAddisDateTimeSmall,
  formatWorkDateWeekday,
  formatWorkDateGregorianSmall,
  formatDuration,
  formatSignedDuration,
  ETH_MONTHS,
  toEthDatePartsFromGregorian,
} from '../../utils/timeFormat';

function minutesToHours1(totalMinutes) {
  return Number((Math.max(0, totalMinutes || 0) / 60).toFixed(1));
}

function getWorkedMinutesToday(punches = [], todayStatus = 'none', nowMs = Date.now()) {
  if (!Array.isArray(punches) || punches.length === 0) return 0;
  const sorted = [...punches].sort((a, b) => new Date(a.at) - new Date(b.at));
  let openIn = null;
  let ms = 0;
  sorted.forEach((p) => {
    const at = new Date(p.at);
    if (p.type === 'in') {
      openIn = at;
      return;
    }
    if (p.type === 'out' && openIn) {
      ms += at.getTime() - openIn.getTime();
      openIn = null;
    }
  });
  if (todayStatus === 'checked_in' && openIn) {
    ms += nowMs - openIn.getTime();
  }
  return Math.max(0, Math.floor(ms / 60000));
}

function formatRelativeTime(iso) {
  const ts = new Date(iso).getTime();
  if (Number.isNaN(ts)) return '-';
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function parseDateParts(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const [y, m, d] = s.split('-').map(Number);
  return { year: y, month: m, day: d };
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

function isEthiopianLeapYear(year) {
  return Number(year) % 4 === 3;
}

function maxEthDaysInMonth(year, month) {
  if (!month) return 30;
  if (Number(month) <= 12) return 30;
  return isEthiopianLeapYear(year) ? 6 : 5;
}

const TimeMy = () => {
  const { user } = useAuth();
  const location = useLocation();
  const correctionRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  const [windowBounds, setWindowBounds] = useState(null);
  const [kind, setKind] = useState('missing');
  const [workDate, setWorkDate] = useState('');
  const [ethYear, setEthYear] = useState('');
  const [ethMonth, setEthMonth] = useState('');
  const [ethDay, setEthDay] = useState('');
  const [timeHm, setTimeHm] = useState('');
  const [punchType, setPunchType] = useState('in');
  const [note, setNote] = useState('');
  const [dayPunches, setDayPunches] = useState([]);
  const [dayLoading, setDayLoading] = useState(false);
  const [existingPunchId, setExistingPunchId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [requests, setRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(true);
  const [nowTick, setNowTick] = useState(Date.now());
  const [showAllRequests, setShowAllRequests] = useState(false);

  const todayReal = new Date();
  const [viewYear, setViewYear] = useState(() => todayReal.getFullYear());
  const [viewMonth, setViewMonth] = useState(() => todayReal.getMonth() + 1);

  const loadToday = async () => {
    try {
      setLoading(true);
      const payload = await fetchMyTodayDetail();
      setData(payload);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load your time');
    } finally {
      setLoading(false);
    }
  };

  const loadSummary = async (year, month) => {
    const now = new Date();
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
    try {
      setSummaryLoading(true);
      const payload = await fetchMyTimeSummary(isCurrentMonth ? {} : { year, month });
      setSummary(payload);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load summary');
    } finally {
      setSummaryLoading(false);
    }
  };

  const loadWindow = async () => {
    try {
      const w = await fetchCorrectionDateWindow();
      setWindowBounds(w);
      const defaultEth = parseDateParts(w?.ethiopianMaxWorkDate) || toEthDatePartsFromGregorian(w?.maxWorkDate);
      if (defaultEth && !workDate) {
        setEthYear(String(defaultEth.year));
        setEthMonth(String(defaultEth.month));
        setEthDay(String(defaultEth.day));
      }
      if (!workDate && w?.maxWorkDate) setWorkDate(w.maxWorkDate);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load date limits');
    }
  };

  const loadRequests = async () => {
    try {
      setRequestsLoading(true);
      const list = await fetchMyCorrectionRequests();
      setRequests(list || []);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load requests');
    } finally {
      setRequestsLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessMyTime(user?.role)) {
      loadToday();
      loadSummary(viewYear, viewMonth);
      loadWindow();
      loadRequests();
    }
  }, [user?.role]);

  // Reload summary whenever the viewed month changes
  useEffect(() => {
    if (canAccessMyTime(user?.role)) {
      loadSummary(viewYear, viewMonth);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => {
    if (!canAccessMyTime(user?.role)) return undefined;
    const sync = () => {
      // Auto-refresh summary only when viewing the current month
      const now = new Date();
      if (viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1) {
        loadSummary(viewYear, viewMonth);
      }
      loadRequests();
    };
    const intervalId = setInterval(sync, 60 * 1000);
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [user?.role, viewYear, viewMonth]);

  useLayoutEffect(() => {
    if (location.hash === '#correction' && correctionRef.current) {
      correctionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [location.hash]);

  useEffect(() => {
    if (!canAccessMyTime(user?.role) || !workDate || kind !== 'wrong_time') {
      setDayPunches([]);
      setExistingPunchId('');
      return;
    }
    const run = async () => {
      try {
        setDayLoading(true);
        const payload = await fetchMyDayPunches(workDate);
        setDayPunches(payload?.punches || []);
        setExistingPunchId('');
      } catch (e) {
        setDayPunches([]);
        setExistingPunchId('');
        toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load punches for that day');
      } finally {
        setDayLoading(false);
      }
    };
    run();
  }, [workDate, kind, user?.role]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  const handleSubmitCorrection = async (e) => {
    e.preventDefault();
    if (!workDate || !timeHm) {
      toast.error('Choose work date and time');
      return;
    }
    if (kind === 'wrong_time' && !existingPunchId) {
      toast.error('Select which punch to correct');
      return;
    }
    const body = {
      kind,
      workDate,
      punchType,
      time: timeHm,
      note: note.trim(),
    };
    if (kind === 'wrong_time') {
      body.existingPunchId = existingPunchId;
    }
    try {
      setSubmitting(true);
      await createTimeCorrectionRequest(body);
      toast.success('Request sent');
      const defaultEth = parseDateParts(windowBounds?.ethiopianMaxWorkDate) || toEthDatePartsFromGregorian(windowBounds?.maxWorkDate);
      if (defaultEth) {
        setEthYear(String(defaultEth.year));
        setEthMonth(String(defaultEth.month));
        setEthDay(String(defaultEth.day));
      }
      if (windowBounds?.maxWorkDate) setWorkDate(windowBounds.maxWorkDate);
      setKind('missing');
      setPunchType('in');
      setTimeHm('');
      setExistingPunchId('');
      setDayPunches([]);
      setNote('');
      await Promise.all([loadRequests(), loadToday(), loadSummary(viewYear, viewMonth)]);
    } catch (e) {
      toast.error(
        e.response?.data?.error || e.response?.data?.message || 'Could not submit request',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!canAccessMyTime(user?.role)) {
    return null;
  }

  const todayStatus = data?.todayStatus || 'none';
  const statusLabel =
    todayStatus === 'checked_in' ? 'Checked in' : todayStatus === 'checked_out' ? 'Checked out' : 'Not checked in yet';
  const nextExpectedAction = todayStatus === 'checked_in' ? 'Check out' : 'Check in';
  const lastPunch = data?.punches?.length ? data.punches[data.punches.length - 1] : null;
  const workedMinutes = getWorkedMinutesToday(data?.punches || [], todayStatus, nowTick);
  const selectedPunch = dayPunches.find((x) => String(x.id) === String(existingPunchId));
  const weekChartData =
    summary?.last7Days?.map((d) => ({
      label: formatWorkDateWeekday(d.workDate),
      fullLabel: `${formatWorkDateWeekday(d.workDate)} · ${d.ethiopianWorkDate || d.workDate}`,
      gregorianRef: formatWorkDateGregorianSmall(d.workDate),
      hours: minutesToHours1(d.totalMinutes),
      netHours: Number(((d.totalMinutes - d.expectedMinutes) / 60).toFixed(1)),
      anomaly: d.anomalies?.length > 0,
    })) || [];
  const monthNetChartData =
    summary?.month?.days?.map((d) => ({
      ethDay: d.ethiopianWorkDate?.split('-')?.[2] || String(d.dayOfMonth),
      fullLabel: `${formatWorkDateWeekday(d.workDate)} · ${d.ethiopianWorkDate || d.workDate}`,
      gregorianRef: formatWorkDateGregorianSmall(d.workDate),
      netHours: Number(((d.totalMinutes - d.expectedMinutes) / 60).toFixed(1)),
    })) || [];
  const monthWorkedMinutes = summary?.totals?.monthMinutes || 0;
  const monthExpectedMinutes = summary?.totals?.monthExpectedMinutes || 0;
  const monthNetMinutes = summary?.totals?.monthNetMinutes || 0;
  const monthOvertimeMinutes = summary?.totals?.monthOvertimeMinutes || 0;
  const monthLostMinutes = summary?.totals?.monthLostMinutes || 0;
  const ethiopianMin = parseDateParts(windowBounds?.ethiopianMinWorkDate);
  const ethiopianMax = parseDateParts(windowBounds?.ethiopianMaxWorkDate);
  const yearMin = ethiopianMin?.year || 2010;
  const yearMax = ethiopianMax?.year || yearMin + 1;
  const yearOptions = [];
  for (let y = yearMax; y >= yearMin; y -= 1) yearOptions.push(y);
  const maxDays = maxEthDaysInMonth(ethYear, ethMonth);
  const dayOptions = Array.from({ length: maxDays }, (_, i) => i + 1);
  const selectedGregorian = toGregorianStringFromEthDate(ethYear, ethMonth, ethDay);
  const etSelectionOutOfRange =
    Boolean(selectedGregorian) &&
    Boolean(windowBounds?.minWorkDate) &&
    Boolean(windowBounds?.maxWorkDate) &&
    (selectedGregorian < windowBounds.minWorkDate || selectedGregorian > windowBounds.maxWorkDate);
  const canSubmitCorrection =
    Boolean(workDate) &&
    Boolean(timeHm) &&
    (!windowBounds ||
      (workDate >= windowBounds.minWorkDate && workDate <= windowBounds.maxWorkDate)) &&
    (kind !== 'wrong_time' || Boolean(existingPunchId));
  const visibleRequests = showAllRequests ? requests : requests.slice(0, 3);
  const isCheckedInNow = todayStatus === 'checked_in';

  return (
    <section className="py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">My time today</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Your current status and today&apos;s check-in/check-out history.
          </p>
          {data?.ethiopianWorkDate ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ethiopian date: {data.ethiopianWorkDate}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => Promise.all([loadToday(), loadSummary(viewYear, viewMonth), loadRequests()])}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          Refresh
        </button>
      </div>

      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm">
        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : (
          <>
            <div className={`mb-4 rounded-2xl border px-4 py-3 ${
              isCheckedInNow
                ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                : 'border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
            }`}>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current status</p>
              <p className={`text-xl font-bold mt-1 ${
                isCheckedInNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
              }`}>
                {isCheckedInNow ? 'Checked in now' : statusLabel}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Next action: <span className="font-medium text-gray-700 dark:text-gray-200">{nextExpectedAction}</span>
              </p>
              {lastPunch ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Last punch: {lastPunch.type === 'in' ? 'Check in' : 'Check out'} at {formatAddisTime(lastPunch.at)}
                </p>
              ) : null}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Worked today: <span className="font-medium text-gray-700 dark:text-gray-200">{formatDuration(workedMinutes)}</span>
              </p>
            </div>

            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Timeline</h2>
            {data?.punches?.length ? (
              <div className="space-y-2">
                {data.punches.map((p, idx) => (
                  <div
                    key={p.id || `${p.at}-${idx}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10"
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          p.type === 'in'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {p.type === 'in' ? 'Check in' : 'Check out'}
                      </span>
                      {p.source === 'correction' && (
                        <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">
                          Adjusted
                        </span>
                      )}
                    </div>
                    <span className="text-sm text-gray-700 dark:text-gray-200 shrink-0">{formatAddisTime(p.at)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No punches yet today.</p>
                <a
                  href="/time/punch"
                  className="inline-block mt-3 px-3 py-2 text-xs font-semibold rounded-lg text-white bg-brand-dark hover:bg-[#2a3640] transition"
                >
                  Go to Check in/out
                </a>
              </div>
            )}
          </>
        )}
      </div>

      {(() => {
        const now = new Date();
        const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1;
        const canGoBack = !(viewYear === now.getFullYear() - 2 && viewMonth === 1);
        const ethParts = toEthDatePartsFromGregorian(`${viewYear}-${String(viewMonth).padStart(2, '0')}-01`);
        const ethMonthLabel = ethParts ? ETH_MONTHS.find((m) => m.value === ethParts.month)?.label : null;
        const gregMonthLabel = new Date(viewYear, viewMonth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });

        const prevMonth = () => {
          if (viewMonth === 1) { setViewYear((y) => y - 1); setViewMonth(12); }
          else setViewMonth((m) => m - 1);
        };
        const nextMonth = () => {
          if (isCurrentMonth) return;
          if (viewMonth === 12) { setViewYear((y) => y + 1); setViewMonth(1); }
          else setViewMonth((m) => m + 1);
        };

        return (
          <div className="mt-8 flex items-center justify-between gap-2 mb-3">
            <button
              type="button"
              onClick={prevMonth}
              disabled={!canGoBack}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition"
              aria-label="Previous month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div className="text-center">
              {ethMonthLabel && ethParts ? (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{ethMonthLabel} {ethParts.year}</p>
              ) : null}
              <p className="text-xs text-gray-500 dark:text-gray-400">{gregMonthLabel}</p>
              {isCurrentMonth && <p className="text-[10px] text-brand-dark/60 dark:text-white/40 uppercase tracking-wider mt-0.5">Current month</p>}
            </div>
            <button
              type="button"
              onClick={nextMonth}
              disabled={isCurrentMonth}
              className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition"
              aria-label="Next month"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Worked this month</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {summaryLoading ? '...' : formatDuration(monthWorkedMinutes)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Expected this month (so far)</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">
            {summaryLoading ? '...' : formatDuration(monthExpectedMinutes)}
          </p>
          {summary?.isCurrentMonth && <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">Calculated up to today, not full month.</p>}
        </div>
        <div className={`rounded-xl border p-3 ${
          monthNetMinutes >= 0
            ? 'border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518]'
            : 'border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-[#141518]'
        }`}>
          <p className="text-xs text-gray-500 dark:text-gray-400">Net balance this month</p>
          <p className={`mt-1 text-lg font-semibold ${
            monthNetMinutes >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
          }`}>
            {summaryLoading ? '...' : formatSignedDuration(monthNetMinutes)}
          </p>
        </div>
      </div>
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Overtime</p>
          <p className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-300">
            {summaryLoading ? '...' : formatDuration(monthOvertimeMinutes)}
          </p>
        </div>
        <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Lost time</p>
          <p className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-300">
            {summaryLoading ? '...' : formatDuration(monthLostMinutes)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Last 7 days</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {summaryLoading ? '...' : formatDuration(summary?.totals?.weekMinutes || 0)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Pending corrections</p>
          <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
            {requests.filter((r) => r.status === 'pending').length}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Today status</p>
          <p className={`mt-1 text-base font-semibold ${isCheckedInNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>{statusLabel}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Last 7 days</h2>
          {summaryLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekChartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload;
                      if (!row) return label;
                      return `${row.fullLabel} (${row.gregorianRef})`;
                    }}
                    formatter={(value, key, payload) => [`${value} h`, payload?.anomaly ? 'Worked (check sequence)' : 'Worked']}
                  />
                  <Bar dataKey="hours" fill="#1f2937" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Daily net balance (this month)</h2>
          {summaryLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : (
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthNetChartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                  <XAxis dataKey="ethDay" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <ReferenceLine y={0} stroke="#6b7280" strokeOpacity={0.5} />
                  <Tooltip
                    labelFormatter={(label, payload) => {
                      const row = payload?.[0]?.payload;
                      if (!row) return label;
                      return `${row.fullLabel} (${row.gregorianRef})`;
                    }}
                    formatter={(value) => [`${value >= 0 ? '+' : ''}${value} h`, 'Net (worked − expected)']}
                  />
                  <Bar dataKey="netHours" radius={[4, 4, 4, 4]}>
                    {monthNetChartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.netHours >= 0 ? '#059669' : '#d97706'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Recent daily history</h2>
        {summaryLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : !summary?.last7Days?.length ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
        ) : (
          <ul className="space-y-2">
            {summary.last7Days.map((d) => (
              (() => {
                const hasSequenceIssue = d.anomalies?.includes('sequence');
                const hasLateCheckIn = d.anomalies?.includes('late_check_in');
                const hasMissingCheckout = d.anomalies?.includes('missing_checkout');
                const isOpenShiftToday =
                  d.workDate === data?.workDate &&
                  todayStatus === 'checked_in' &&
                  d.anomalies?.length === 1 &&
                  hasMissingCheckout;
                let badge = null;
                if (isOpenShiftToday) {
                  badge = (
                    <span className="text-[10px] uppercase tracking-wide text-emerald-700/90 dark:text-emerald-400/80">
                      Checked in
                    </span>
                  );
                } else if (hasLateCheckIn) {
                  badge = (
                    <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">
                      Late check-in
                    </span>
                  );
                } else if (hasSequenceIssue || hasMissingCheckout) {
                  badge = (
                    <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">
                      Review needed
                    </span>
                  );
                }

                return (
                  <li
                    key={d.workDate}
                    className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2"
                  >
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatWorkDateWeekday(d.workDate)} · {d.ethiopianWorkDate || d.workDate}
                    </span>
                    <span className="text-gray-600 dark:text-gray-300">
                      {d.firstInAt ? formatAddisTime(d.firstInAt) : '--'} - {d.lastOutAt ? formatAddisTime(d.lastOutAt) : '--'}
                    </span>
                    <span className="text-gray-700 dark:text-gray-200 font-medium">{formatDuration(d.totalMinutes)}</span>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400">
                      {formatWorkDateGregorianSmall(d.workDate)}
                    </span>
                    {badge}
                  </li>
                );
              })()
            ))}
          </ul>
        )}
      </div>

      <div
        ref={correctionRef}
        id="correction"
        className="mt-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm scroll-mt-20"
      >
        <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Time correction</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Forgot a punch or wrong time? Submit a request (Ethiopian date, last 14 days). A manager will review.
        </p>
        <form onSubmit={handleSubmitCorrection} className="space-y-4">
          <div>
            <label htmlFor="corr-kind" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Type
            </label>
            <select
              id="corr-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
            >
              <option value="missing">Missing punch</option>
              <option value="wrong_time">Wrong time</option>
            </select>
          </div>
          <div>
            <label htmlFor="corr-date" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Work date (Ethiopian calendar)
            </label>
            <div id="corr-date" className="grid grid-cols-3 gap-2">
              <select
                required
                value={ethYear}
                onChange={(e) => {
                  const y = e.target.value;
                  setEthYear(y);
                  const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(y, ethMonth));
                  setEthDay(String(clampedDay));
                  const next = toGregorianStringFromEthDate(y, ethMonth, clampedDay);
                  setWorkDate(next);
                }}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Year</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                required
                value={ethMonth}
                onChange={(e) => {
                  const m = e.target.value;
                  setEthMonth(m);
                  const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(ethYear, m));
                  setEthDay(String(clampedDay));
                  const next = toGregorianStringFromEthDate(ethYear, m, clampedDay);
                  setWorkDate(next);
                }}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Month</option>
                {ETH_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select
                required
                value={ethDay}
                onChange={(e) => {
                  const d = e.target.value;
                  setEthDay(d);
                  const next = toGregorianStringFromEthDate(ethYear, ethMonth, d);
                  setWorkDate(next);
                }}
                className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
              >
                <option value="">Day</option>
                {dayOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            {selectedGregorian ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Gregorian equivalent: {selectedGregorian}</p>
            ) : null}
            {windowBounds && etSelectionOutOfRange ? (
              <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">
                Date must be within the allowed correction window.
              </p>
            ) : null}
          </div>
          {kind === 'wrong_time' && (
            <div>
              <label htmlFor="corr-punch" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Punch to fix
              </label>
              {dayLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading punches…</p>
              ) : dayPunches.length === 0 ? (
                <p className="text-sm text-amber-700 dark:text-amber-400/90">No punches on that day in the system.</p>
              ) : (
                <select
                  id="corr-punch"
                  required
                  value={existingPunchId}
                  onChange={(e) => {
                    setExistingPunchId(e.target.value);
                    const row = dayPunches.find((x) => String(x.id) === e.target.value);
                    if (row) setPunchType(row.type);
                  }}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="">Select…</option>
                  {dayPunches.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.type === 'in' ? 'In' : 'Out'} · {formatAddisTime(p.at)}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}
          <div>
            <label htmlFor="corr-io" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              In or out
            </label>
            <select
              id="corr-io"
              value={punchType}
              onChange={(e) => setPunchType(e.target.value)}
              disabled={kind === 'wrong_time' && Boolean(existingPunchId)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white disabled:opacity-70"
            >
              <option value="in">Check in</option>
              <option value="out">Check out</option>
            </select>
          </div>
          <div>
            <label htmlFor="corr-time" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Correct time (24-hour, Addis timezone)
            </label>
            <input
              id="corr-time"
              type="time"
              required
              value={timeHm}
              onChange={(e) => setTimeHm(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
            />
            {!timeHm ? (
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use international 24-hour format (example: 08:15).</p>
            ) : null}
          </div>
          {kind === 'wrong_time' && selectedPunch && timeHm ? (
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                You are changing {selectedPunch.type === 'in' ? 'check in' : 'check out'} from{' '}
                <span className="font-medium">{formatAddisTime(selectedPunch.at)}</span> to{' '}
                <span className="font-medium">{timeHm}</span> (Addis, 24-hour).
              </p>
            </div>
          ) : null}
          <div>
            <label htmlFor="corr-note" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              Note (optional)
            </label>
            <textarea
              id="corr-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white resize-y min-h-[3rem]"
              placeholder="Short explanation"
            />
          </div>
          <button
            type="submit"
            disabled={submitting || !canSubmitCorrection || (kind === 'wrong_time' && (!existingPunchId || dayPunches.length === 0))}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
          >
            {submitting ? 'Sending…' : 'Submit request'}
          </button>
        </form>
      </div>

      <div className="mt-8 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">My correction requests</h2>
          <button
            type="button"
            onClick={loadRequests}
            className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
          >
            Refresh
          </button>
        </div>
        {requestsLoading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
        ) : requests.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">No requests yet.</p>
        ) : (
          <>
          <ul className="space-y-3">
            {visibleRequests.map((r) => (
              <li
                key={r._id}
                className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {(r.ethiopianWorkDate || r.workDate)} · {r.kind === 'wrong_time' ? 'Wrong time' : 'Missing'} · {r.punchType}
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      r.status === 'pending'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200'
                        : r.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200'
                          : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                    }`}
                  >
                    {r.status}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Requested: {r.requestedAtEthiopianDate || r.ethiopianWorkDate} · {formatAddisTime(r.requestedAt)}
                </p>
                <p className="text-gray-500 dark:text-gray-500 mt-1 text-xs">
                  Gregorian ref: {formatAddisDateTimeSmall(r.requestedAt)} · Submitted {formatRelativeTime(r.createdAt || r.requestedAt)}
                </p>
                {r.note ? <p className="text-gray-500 dark:text-gray-500 mt-1 text-xs">{r.note}</p> : null}
                {r.reviewNote ? (
                  <p className="text-gray-500 dark:text-gray-500 mt-1 text-xs">Manager: {r.reviewNote}</p>
                ) : null}
              </li>
            ))}
          </ul>
          {requests.length > 3 ? (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => setShowAllRequests((v) => !v)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
              >
                {showAllRequests ? 'Show less' : `Show more (${requests.length - 3} more)`}
              </button>
            </div>
          ) : null}
          </>
        )}
      </div>
    </section>
  );
};

export default TimeMy;
