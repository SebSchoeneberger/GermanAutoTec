import { useEffect, useLayoutEffect, useState } from 'react';
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
  createLeaveRequest,
  fetchMyLeaveRequests,
} from '../../services/timeApi';
import { canAccessMyTime } from '../../utils/timeAccess';
import {
  formatAddisTime,
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

  const [leaveEthYear, setLeaveEthYear] = useState('');
  const [leaveEthMonth, setLeaveEthMonth] = useState('');
  const [leaveEthDay, setLeaveEthDay] = useState('');
  const [leaveType, setLeaveType] = useState('sick');
  const [leaveNote, setLeaveNote] = useState('');
  const [leaveSubmitting, setLeaveSubmitting] = useState(false);
  const [leaves, setLeaves] = useState([]);
  const [leavesLoading, setLeavesLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('today');
  const [openForm, setOpenForm] = useState(null); // null | 'correction' | 'leave'

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

  const loadLeaves = async () => {
    try {
      setLeavesLoading(true);
      const list = await fetchMyLeaveRequests();
      setLeaves(list || []);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load leave requests');
    } finally {
      setLeavesLoading(false);
    }
  };

  useEffect(() => {
    if (canAccessMyTime(user?.role)) {
      loadToday();
      loadSummary(viewYear, viewMonth);
      loadWindow();
      loadRequests();
      loadLeaves();
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
      loadLeaves();
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
    if (location.hash === '#correction') {
      setActiveTab('requests');
      setOpenForm('correction');
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
      setOpenForm(null);
      await Promise.all([loadRequests(), loadToday(), loadSummary(viewYear, viewMonth)]);
    } catch (e) {
      toast.error(
        e.response?.data?.error || e.response?.data?.message || 'Could not submit request',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitLeave = async (e) => {
    e.preventDefault();
    const leaveDateGreg = toGregorianStringFromEthDate(leaveEthYear, leaveEthMonth, leaveEthDay);
    if (!leaveDateGreg) {
      toast.error('Select a valid date');
      return;
    }
    try {
      setLeaveSubmitting(true);
      await createLeaveRequest({ date: leaveDateGreg, type: leaveType, note: leaveNote.trim() });
      toast.success('Leave request submitted');
      setLeaveEthYear('');
      setLeaveEthMonth('');
      setLeaveEthDay('');
      setLeaveType('sick');
      setLeaveNote('');
      setOpenForm(null);
      await loadLeaves();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Could not submit request');
    } finally {
      setLeaveSubmitting(false);
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
  const isCheckedInNow = todayStatus === 'checked_in';

  // Leave form date helpers
  const leaveDateGreg = toGregorianStringFromEthDate(leaveEthYear, leaveEthMonth, leaveEthDay);
  const leaveMaxDays = maxEthDaysInMonth(leaveEthYear, leaveEthMonth);
  const leaveDayOptions = Array.from({ length: leaveMaxDays }, (_, i) => i + 1);
  const todayIso = `${todayReal.getFullYear()}-${String(todayReal.getMonth() + 1).padStart(2, '0')}-${String(todayReal.getDate()).padStart(2, '0')}`;
  const todayEthParts = toEthDatePartsFromGregorian(todayIso);
  const leaveEthYearBase = todayEthParts?.year ?? 2017;
  const leaveYearOptions = [];
  for (let y = leaveEthYearBase + 1; y >= leaveEthYearBase - 1; y -= 1) leaveYearOptions.push(y);
  const minGregLeaveDate = (() => {
    const d = new Date(todayReal.getTime() - 3 * 24 * 60 * 60 * 1000);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();
  const leaveOutOfWindow = Boolean(leaveDateGreg) && leaveDateGreg < minGregLeaveDate;

  return (
    <section className="py-2 pb-24 sm:pb-2">
      {/* ── Page header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">My Time</h1>
          {data?.ethiopianWorkDate ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{data.ethiopianWorkDate}</p>
          ) : null}
        </div>
        {/* Desktop: refresh + check-in/out button */}
        <div className="hidden sm:flex items-center gap-3">
          <button
            type="button"
            onClick={() => Promise.all([loadToday(), loadSummary(viewYear, viewMonth), loadRequests(), loadLeaves()])}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            aria-label="Refresh"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <a
            href="/time/punch"
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition ${
              isCheckedInNow
                ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-lg shadow-blue-500/20'
                : 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-lg shadow-emerald-500/20'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              {isCheckedInNow
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
              }
            </svg>
            {isCheckedInNow ? 'Check out' : 'Check in'}
          </a>
        </div>
        {/* Mobile: refresh only */}
        <button
          type="button"
          onClick={() => Promise.all([loadToday(), loadSummary(viewYear, viewMonth), loadRequests(), loadLeaves()])}
          className="sm:hidden px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          Refresh
        </button>
      </div>

      {/* ── Tab bar ── */}
      {(() => {
        const pendingCount =
          requests.filter((r) => r.status === 'pending').length +
          leaves.filter((r) => r.status === 'pending').length;
        const tabs = [
          {
            id: 'today',
            label: 'Today',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <circle cx="12" cy="12" r="3" /><path strokeLinecap="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
              </svg>
            ),
          },
          {
            id: 'history',
            label: 'History',
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
              </svg>
            ),
          },
          {
            id: 'requests',
            label: 'Requests',
            badge: pendingCount > 0 ? pendingCount : null,
            icon: (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            ),
          },
        ];
        return (
          <div className="flex gap-1 bg-gray-100 dark:bg-white/5 rounded-2xl p-1 mb-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold transition ${
                  activeTab === tab.id
                    ? 'bg-white dark:bg-[#1f2937] text-gray-900 dark:text-white shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                {tab.label}
                {tab.badge ? (
                  <span className="ml-0.5 bg-amber-400 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full leading-none">
                    {tab.badge}
                  </span>
                ) : null}
              </button>
            ))}
          </div>
        );
      })()}

      {/* ── TODAY TAB ── */}
      {activeTab === 'today' && (
        <>
          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : (
            <div className="sm:grid sm:grid-cols-[320px_1fr] sm:gap-4 flex flex-col gap-4">
              {/* Left col: status + quick stats */}
              <div className="flex flex-col gap-3">
                <div className={`rounded-2xl border px-4 py-4 ${
                  isCheckedInNow
                    ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                    : 'border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                        isCheckedInNow ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-gray-400 dark:bg-gray-600'
                      }`} />
                      <p className={`text-lg font-bold ${
                        isCheckedInNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'
                      }`}>
                        {isCheckedInNow ? 'Checked in' : statusLabel}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${isCheckedInNow ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-200'}`}>
                        {formatDuration(workedMinutes)}
                      </p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">worked today</p>
                    </div>
                  </div>
                  {lastPunch ? (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Last punch: {lastPunch.type === 'in' ? 'Check in' : 'Check out'} at{' '}
                      <span className="font-medium text-gray-700 dark:text-gray-200">{formatAddisTime(lastPunch.at)}</span>
                    </p>
                  ) : null}
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Next: <span className="font-medium text-gray-700 dark:text-gray-200">{nextExpectedAction}</span>
                  </p>
                </div>

                {/* Quick stats — month at a glance */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">This month</p>
                    <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">
                      {summaryLoading ? '…' : formatDuration(monthWorkedMinutes)}
                    </p>
                  </div>
                  <div className={`rounded-xl border p-3 bg-white dark:bg-[#141518] ${
                    monthNetMinutes >= 0 ? 'border-emerald-200/70 dark:border-emerald-900/40' : 'border-amber-200/80 dark:border-amber-900/40'
                  }`}>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Balance</p>
                    <p className={`mt-1 text-sm font-semibold ${
                      monthNetMinutes >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                    }`}>
                      {summaryLoading ? '…' : formatSignedDuration(monthNetMinutes)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518] p-3">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">Overtime</p>
                    <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                      {summaryLoading ? '…' : formatDuration(monthOvertimeMinutes)}
                    </p>
                  </div>
                </div>

                <p className="sm:hidden text-center text-xs text-gray-400 dark:text-gray-600">
                  → Switch to History for charts &amp; monthly detail
                </p>
              </div>

              {/* Right col: timeline */}
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                  Today&apos;s timeline
                  {data?.ethiopianWorkDate ? (
                    <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">{data.ethiopianWorkDate}</span>
                  ) : null}
                </h2>
                {data?.punches?.length ? (
                  <div className="space-y-2">
                    {data.punches.map((p, idx) => (
                      <div
                        key={p.id || `${p.at}-${idx}`}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10"
                      >
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          p.type === 'in'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300'
                        }`}>
                          {p.type === 'in' ? '→' : '←'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {p.type === 'in' ? 'Check in' : 'Check out'}
                          </p>
                          {p.source === 'correction' && (
                            <p className="text-[10px] text-amber-600 dark:text-amber-400">Adjusted</p>
                          )}
                        </div>
                        <span className="text-sm text-gray-700 dark:text-gray-200 shrink-0 font-medium">
                          {formatAddisTime(p.at)}
                        </span>
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
                      Go to Check in / out
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── HISTORY TAB ── */}
      {activeTab === 'history' && (() => {
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
          <>
            {/* Month navigator */}
            <div className="flex items-center justify-between gap-2 mb-4">
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

            {/* Stat cards — trimmed to 5 */}
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Worked</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {summaryLoading ? '…' : formatDuration(monthWorkedMinutes)}
                </p>
              </div>
              <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Expected</p>
                <p className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
                  {summaryLoading ? '…' : formatDuration(monthExpectedMinutes)}
                </p>
                {summary?.isCurrentMonth && <p className="mt-0.5 text-[10px] text-gray-500 dark:text-gray-400">Up to today</p>}
              </div>
              <div className={`rounded-xl border p-3 bg-white dark:bg-[#141518] ${
                monthNetMinutes >= 0
                  ? 'border-emerald-200/70 dark:border-emerald-900/40'
                  : 'border-amber-200/80 dark:border-amber-900/40'
              }`}>
                <p className="text-xs text-gray-500 dark:text-gray-400">Balance</p>
                <p className={`mt-1 text-base font-semibold ${
                  monthNetMinutes >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'
                }`}>
                  {summaryLoading ? '…' : formatSignedDuration(monthNetMinutes)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518] p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Overtime</p>
                <p className="mt-1 text-base font-semibold text-emerald-700 dark:text-emerald-300">
                  {summaryLoading ? '…' : formatDuration(monthOvertimeMinutes)}
                </p>
              </div>
              <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-[#141518] p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">Lost time</p>
                <p className="mt-1 text-base font-semibold text-amber-700 dark:text-amber-300">
                  {summaryLoading ? '…' : formatDuration(monthLostMinutes)}
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-5">
              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Last 7 days</h2>
                {summaryLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
                ) : (
                  <div className="h-52">
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

              <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Daily net balance</h2>
                {summaryLoading ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
                ) : (
                  <div className="h-52">
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
                            <Cell key={`cell-${index}`} fill={entry.netHours >= 0 ? '#059669' : '#d97706'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>

            {/* Recent daily history */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent daily history</h2>
              {summaryLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
              ) : !summary?.last7Days?.length ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No history yet.</p>
              ) : (
                <ul className="space-y-2">
                  {summary.last7Days.map((d) => (() => {
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
                      badge = <span className="text-[10px] uppercase tracking-wide text-emerald-700/90 dark:text-emerald-400/80">Checked in</span>;
                    } else if (hasLateCheckIn) {
                      badge = <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">Late check-in</span>;
                    } else if (hasSequenceIssue || hasMissingCheckout) {
                      badge = <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">Review needed</span>;
                    }
                    return (
                      <li key={d.workDate} className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm flex flex-wrap items-center justify-between gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {formatWorkDateWeekday(d.workDate)} · {d.ethiopianWorkDate || d.workDate}
                        </span>
                        <span className="text-gray-600 dark:text-gray-300">
                          {d.firstInAt ? formatAddisTime(d.firstInAt) : '--'} – {d.lastOutAt ? formatAddisTime(d.lastOutAt) : '--'}
                        </span>
                        <span className="text-gray-700 dark:text-gray-200 font-medium">{formatDuration(d.totalMinutes)}</span>
                        <span className="text-[11px] text-gray-500 dark:text-gray-400">{formatWorkDateGregorianSmall(d.workDate)}</span>
                        {badge}
                      </li>
                    );
                  })())}
                </ul>
              )}
            </div>
          </>
        );
      })()}

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (
      <div className="flex flex-col gap-4">
        {/* Action buttons */}
        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">New request</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setOpenForm((f) => (f === 'correction' ? null : 'correction'))}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition text-left ${
              openForm === 'correction'
                ? 'border-blue-300 bg-blue-50/60 dark:border-blue-800/50 dark:bg-blue-950/20'
                : 'border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-[#141518] hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0 text-base">🕐</span>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">Time correction</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Missing or wrong punch</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setOpenForm((f) => (f === 'leave' ? null : 'leave'))}
            className={`flex items-center gap-3 p-3 rounded-2xl border transition text-left ${
              openForm === 'leave'
                ? 'border-amber-300 bg-amber-50/60 dark:border-amber-800/50 dark:bg-amber-950/20'
                : 'border-dashed border-gray-300 dark:border-white/10 bg-white dark:bg-[#141518] hover:bg-gray-50 dark:hover:bg-white/5'
            }`}
          >
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-900/25 flex items-center justify-center flex-shrink-0 text-base">📋</span>
            <div>
              <p className="text-xs font-semibold text-gray-900 dark:text-white leading-tight">Request leave</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Sick day or day off</p>
            </div>
          </button>
        </div>

        {/* Inline correction form */}
        {openForm === 'correction' && (
          <div className="rounded-2xl border border-blue-200 dark:border-blue-900/40 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Time correction</h2>
              <button type="button" onClick={() => setOpenForm(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Forgot a punch or wrong time? Submit a request (last 14 days). A manager will review.
            </p>
            <form onSubmit={handleSubmitCorrection} className="space-y-4">
              <div>
                <label htmlFor="corr-kind" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
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
                <label htmlFor="corr-date" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Work date (Ethiopian calendar)</label>
                <div id="corr-date" className="grid grid-cols-3 gap-2">
                  <select
                    required
                    value={ethYear}
                    onChange={(e) => {
                      const y = e.target.value;
                      setEthYear(y);
                      const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(y, ethMonth));
                      setEthDay(String(clampedDay));
                      setWorkDate(toGregorianStringFromEthDate(y, ethMonth, clampedDay));
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Year</option>
                    {yearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    required
                    value={ethMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setEthMonth(m);
                      const clampedDay = Math.min(Number(ethDay || 1), maxEthDaysInMonth(ethYear, m));
                      setEthDay(String(clampedDay));
                      setWorkDate(toGregorianStringFromEthDate(ethYear, m, clampedDay));
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Month</option>
                    {ETH_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select
                    required
                    value={ethDay}
                    onChange={(e) => {
                      const d = e.target.value;
                      setEthDay(d);
                      setWorkDate(toGregorianStringFromEthDate(ethYear, ethMonth, d));
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Day</option>
                    {dayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {selectedGregorian ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Gregorian: {selectedGregorian}</p> : null}
                {windowBounds && etSelectionOutOfRange ? (
                  <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">Date must be within the allowed correction window.</p>
                ) : null}
              </div>
              {kind === 'wrong_time' && (
                <div>
                  <label htmlFor="corr-punch" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Punch to fix</label>
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
                        <option key={p.id} value={p.id}>{p.type === 'in' ? 'In' : 'Out'} · {formatAddisTime(p.at)}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="corr-io" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">In or out</label>
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
                <label htmlFor="corr-time" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Correct time (24-hour, Addis timezone)</label>
                <input
                  id="corr-time"
                  type="time"
                  required
                  value={timeHm}
                  onChange={(e) => setTimeHm(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                />
                {!timeHm ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Use 24-hour format (e.g. 08:15).</p> : null}
              </div>
              {kind === 'wrong_time' && selectedPunch && timeHm ? (
                <div className="rounded-lg border border-amber-200 dark:border-amber-900/40 bg-amber-50/70 dark:bg-amber-950/20 px-3 py-2">
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Changing {selectedPunch.type === 'in' ? 'check in' : 'check out'} from{' '}
                    <span className="font-medium">{formatAddisTime(selectedPunch.at)}</span> to{' '}
                    <span className="font-medium">{timeHm}</span>.
                  </p>
                </div>
              ) : null}
              <div>
                <label htmlFor="corr-note" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Note (optional)</label>
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
        )}

        {/* Inline leave form */}
        {openForm === 'leave' && (
          <div className="rounded-2xl border border-amber-200 dark:border-amber-900/40 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Request leave</h2>
              <button type="button" onClick={() => setOpenForm(null)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none">&times;</button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              Sick day or day off? Submit a request and a manager will approve or reject it.
            </p>
            <form onSubmit={handleSubmitLeave} className="space-y-4">
              <div>
                <label htmlFor="leave-type" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select
                  id="leave-type"
                  value={leaveType}
                  onChange={(e) => setLeaveType(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                >
                  <option value="sick">Sick day</option>
                  <option value="day_off">Day off</option>
                </select>
              </div>
              <div>
                <label htmlFor="leave-date" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Date (Ethiopian calendar)</label>
                <div id="leave-date" className="grid grid-cols-3 gap-2">
                  <select
                    required
                    value={leaveEthYear}
                    onChange={(e) => {
                      const y = e.target.value;
                      setLeaveEthYear(y);
                      const clamped = Math.min(Number(leaveEthDay || 1), maxEthDaysInMonth(y, leaveEthMonth));
                      setLeaveEthDay(leaveEthDay ? String(clamped) : '');
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Year</option>
                    {leaveYearOptions.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select
                    required
                    value={leaveEthMonth}
                    onChange={(e) => {
                      const m = e.target.value;
                      setLeaveEthMonth(m);
                      const clamped = Math.min(Number(leaveEthDay || 1), maxEthDaysInMonth(leaveEthYear, m));
                      setLeaveEthDay(leaveEthDay ? String(clamped) : '');
                    }}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Month</option>
                    {ETH_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                  <select
                    required
                    value={leaveEthDay}
                    onChange={(e) => setLeaveEthDay(e.target.value)}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white"
                  >
                    <option value="">Day</option>
                    {leaveDayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                {leaveDateGreg ? <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Gregorian: {leaveDateGreg}</p> : null}
                {leaveOutOfWindow ? <p className="mt-1 text-xs text-amber-700 dark:text-amber-400/90">Date is more than 3 days in the past.</p> : null}
              </div>
              <div>
                <label htmlFor="leave-note" className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Note <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
                </label>
                <textarea
                  id="leave-note"
                  rows={2}
                  value={leaveNote}
                  onChange={(e) => setLeaveNote(e.target.value)}
                  maxLength={500}
                  className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0f1012] px-3 py-2 text-sm text-gray-900 dark:text-white resize-y min-h-[3rem]"
                  placeholder="Short explanation"
                />
              </div>
              <button
                type="submit"
                disabled={leaveSubmitting || !leaveDateGreg || leaveOutOfWindow}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
              >
                {leaveSubmitting ? 'Sending…' : 'Submit request'}
              </button>
            </form>
          </div>
        )}

        {/* Unified requests list */}
        {(() => {
          const allRequests = [
            ...requests.map((r) => ({ ...r, _kind: 'correction', _sortKey: r.createdAt || r.requestedAt })),
            ...leaves.map((r) => ({ ...r, _kind: 'leave', _sortKey: r.createdAt })),
          ].sort((a, b) => new Date(b._sortKey) - new Date(a._sortKey));
          const visibleAll = showAllRequests ? allRequests : allRequests.slice(0, 5);

          return (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4 mb-3">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">My requests</h2>
                <button
                  type="button"
                  onClick={() => { loadRequests(); loadLeaves(); }}
                  className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition"
                >
                  Refresh
                </button>
              </div>
              {(requestsLoading || leavesLoading) ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
              ) : allRequests.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No requests yet.</p>
              ) : (
                <>
                  <ul className="space-y-3">
                    {visibleAll.map((r) => (
                      <li key={r._id || r.id} className="rounded-xl border border-gray-200 dark:border-white/10 px-3 py-2.5 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {r._kind === 'correction'
                              ? `${r.ethiopianWorkDate || r.workDate} · ${r.kind === 'wrong_time' ? 'Wrong time' : 'Missing'} · ${r.punchType}`
                              : `${r.ethiopianDate || r.date} · ${r.type === 'sick' ? 'Sick day' : 'Day off'}`
                            }
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            r.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/35 dark:text-amber-200'
                              : r.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/35 dark:text-emerald-200'
                                : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                          }`}>
                            {r.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                            r._kind === 'correction'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/25 dark:text-amber-300'
                          }`}>
                            {r._kind === 'correction' ? '⏱ Correction' : '🏥 Leave'}
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-500">
                            {formatRelativeTime(r.createdAt || r.requestedAt)}
                          </span>
                        </div>
                        {r.note ? <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{r.note}</p> : null}
                        {r.reviewNote ? <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Manager: {r.reviewNote}</p> : null}
                      </li>
                    ))}
                  </ul>
                  {allRequests.length > 5 ? (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllRequests((v) => !v)}
                        className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 transition"
                      >
                        {showAllRequests ? 'Show less' : `Show more (${allRequests.length - 5} more)`}
                      </button>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          );
        })()}
      </div>
      )}

      {/* ── Sticky check-in/out bar — mobile only ── */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 pt-3 bg-gradient-to-t from-white dark:from-[#0f1117] via-white/90 dark:via-[#0f1117]/90 to-transparent pointer-events-none">
        <a
          href="/time/punch"
          className={`pointer-events-auto flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-xl transition ${
            isCheckedInNow
              ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-500/30'
              : 'bg-gradient-to-br from-emerald-600 to-emerald-700 shadow-emerald-500/30'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            {isCheckedInNow
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
            }
          </svg>
          {isCheckedInNow ? 'Check out' : 'Check in'}
        </a>
      </div>
    </section>
  );
};

export default TimeMy;
