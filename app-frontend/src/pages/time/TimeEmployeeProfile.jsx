import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchEmployeeProfile,
  fetchEmployeeSummary,
  createAdminPunch,
  deleteAdminPunch,
} from '../../services/timeApi';
import { canAccessTeamTime } from '../../utils/timeAccess';
import {
  formatAddisTime,
  formatWorkDateWeekday,
  formatWorkDateGregorianSmall,
  formatDuration,
  formatSignedDuration,
  ETH_MONTHS,
  toEthDatePartsFromGregorian,
} from '../../utils/timeFormat';

function anomalyLabel(code) {
  if (code === 'late_check_in') return 'Late check-in';
  if (code === 'missing_checkout') return 'No checkout';
  if (code === 'sequence') return 'Punch issue';
  return 'Alert';
}

function dayRowClass(row) {
  if (row.isOffDay) return 'opacity-40';
  if (row.totalMinutes === 0) return 'bg-red-50/60 dark:bg-red-950/20';
  if (row.anomalies?.length) return 'bg-amber-50/60 dark:bg-amber-950/20';
  return '';
}

function dayDotColor(row) {
  if (row.isOffDay) return 'bg-gray-300 dark:bg-gray-600';
  if (row.totalMinutes === 0) return 'bg-red-500';
  if (row.anomalies?.length) return 'bg-amber-400';
  return 'bg-emerald-500';
}

const TimeEmployeeProfile = () => {
  const { employeeId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Month navigator state — Gregorian month for detail view
  const todayReal = new Date();
  const [detailYear, setDetailYear] = useState(() => todayReal.getFullYear());
  const [detailMonth, setDetailMonth] = useState(() => todayReal.getMonth() + 1);
  const [monthDays, setMonthDays] = useState(null);
  const [monthDaysLoading, setMonthDaysLoading] = useState(false);

  // Admin punch form
  const [punchType, setPunchType] = useState('in');
  const [punchWorkDate, setPunchWorkDate] = useState('');
  const [punchTime, setPunchTime] = useState('');
  const [punchSubmitting, setPunchSubmitting] = useState(false);
  const [deletingPunchId, setDeletingPunchId] = useState(null);

  useEffect(() => {
    if (user && !canAccessTeamTime(user.role)) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await fetchEmployeeProfile(employeeId);
      setProfile(data);
      // Current month days come from trend[0]
      if (data?.trend?.[0]?.days) {
        setMonthDays(data.trend[0].days);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (employeeId) loadProfile();
  }, [employeeId]);

  const loadMonthDays = async (year, month) => {
    try {
      setMonthDaysLoading(true);

      // Check if the requested month is in the already-loaded profile trend data
      const trendMonth = profile?.trend?.find((t) => t.year === year && t.month === month);
      if (trendMonth) {
        setMonthDays(trendMonth.days || []);
        setHistoricalTotals({
          workedMinutes: trendMonth.workedMinutes,
          expectedMinutes: trendMonth.expectedMinutes,
          netMinutes: trendMonth.netMinutes,
          overtimeMinutes: trendMonth.overtimeMinutes,
          lostMinutes: trendMonth.lostMinutes,
        });
        return;
      }

      // Fall back to the summary endpoint for months outside the 3-month profile window
      const data = await fetchEmployeeSummary(employeeId, { year, month });
      setMonthDays(null); // summary endpoint has no per-day breakdown
      setHistoricalTotals(data?.monthTotals || null);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load month data');
    } finally {
      setMonthDaysLoading(false);
    }
  };

  const [historicalTotals, setHistoricalTotals] = useState(null);

  const prevMonth = () => {
    const newYear = detailMonth === 1 ? detailYear - 1 : detailYear;
    const newMonth = detailMonth === 1 ? 12 : detailMonth - 1;
    setDetailYear(newYear);
    setDetailMonth(newMonth);
    loadMonthDays(newYear, newMonth);
  };

  const nextMonth = () => {
    const now = new Date();
    const isCurrentMonth = detailYear === now.getFullYear() && detailMonth === now.getMonth() + 1;
    if (isCurrentMonth) return;
    const newYear = detailMonth === 12 ? detailYear + 1 : detailYear;
    const newMonth = detailMonth === 12 ? 1 : detailMonth + 1;
    setDetailYear(newYear);
    setDetailMonth(newMonth);
    loadMonthDays(newYear, newMonth);
  };

  const handleCreatePunch = async (e) => {
    e.preventDefault();
    if (!punchWorkDate || !punchTime) return;
    try {
      setPunchSubmitting(true);
      await createAdminPunch({ employeeId, type: punchType, workDate: punchWorkDate, time: punchTime });
      toast.success('Punch added');
      setPunchWorkDate('');
      setPunchTime('');
      await loadProfile();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to add punch');
    } finally {
      setPunchSubmitting(false);
    }
  };

  const handleDeletePunch = async (punchId) => {
    try {
      setDeletingPunchId(punchId);
      await deleteAdminPunch(punchId);
      toast.success('Punch deleted');
      await loadProfile();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to delete punch');
    } finally {
      setDeletingPunchId(null);
    }
  };

  if (!canAccessTeamTime(user?.role)) return null;

  if (loading) {
    return (
      <section className="py-4">
        <button
          type="button"
          onClick={() => navigate('/time/team')}
          className="mb-6 flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Team overview
        </button>
        <p className="text-sm text-gray-500 dark:text-gray-400">Loading profile…</p>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="py-4">
        <button type="button" onClick={() => navigate('/time/team')} className="mb-6 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition">
          ← Team overview
        </button>
        <p className="text-sm text-red-500">Could not load employee profile.</p>
      </section>
    );
  }

  const { employee, today, trend, recentCorrections } = profile;
  const currentTrend = trend?.[0] || {};
  const now = new Date();
  const isViewingCurrentMonth = detailYear === now.getFullYear() && detailMonth === now.getMonth() + 1;

  // Month label
  const gregMonthLabel = new Date(detailYear, detailMonth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const ethParts = toEthDatePartsFromGregorian(`${detailYear}-${String(detailMonth).padStart(2, '0')}-01`);
  const ethMonthLabel = ethParts ? ETH_MONTHS.find((m) => m.value === ethParts.month)?.label : null;

  // Trend chart data — worked hours vs expected, oldest first
  const trendChartData = [...(trend || [])].reverse().map((t) => {
    const ethP = toEthDatePartsFromGregorian(`${t.year}-${String(t.month).padStart(2, '0')}-01`);
    const label = ethP ? (ETH_MONTHS.find((m) => m.value === ethP.month)?.label?.slice(0, 3) || t.month) : t.month;
    return {
      label,
      worked: Number((t.workedMinutes / 60).toFixed(1)),
      expected: Number((t.expectedMinutes / 60).toFixed(1)),
      net: Number((t.netMinutes / 60).toFixed(1)),
    };
  });

  // Today status badge
  const todayStatusBadge = (() => {
    if (today.status === 'checked_in') return { label: 'In', cls: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' };
    if (today.status === 'checked_out') return { label: 'Out', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' };
    return { label: 'No punch', cls: 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400' };
  })();

  // Days to render in day-list
  const activeDays = isViewingCurrentMonth ? (monthDays || currentTrend.days || []) : (monthDays || []);
  const displayTotals = isViewingCurrentMonth
    ? { workedMinutes: currentTrend.workedMinutes, expectedMinutes: currentTrend.expectedMinutes, netMinutes: currentTrend.netMinutes, overtimeMinutes: currentTrend.overtimeMinutes, lostMinutes: currentTrend.lostMinutes }
    : historicalTotals
    ? { workedMinutes: historicalTotals.workedMinutes, expectedMinutes: historicalTotals.expectedMinutes, netMinutes: historicalTotals.netMinutes, overtimeMinutes: historicalTotals.overtimeMinutes, lostMinutes: historicalTotals.lostMinutes }
    : null;

  return (
    <section className="py-2 space-y-5">
      {/* Back nav */}
      <button
        type="button"
        onClick={() => navigate('/time/team')}
        className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Team overview
      </button>

      {/* Employee header */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 sm:p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {employee.firstName} {employee.lastName}
            </h1>
            <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400 capitalize">{employee.role}</p>
          </div>
          <span className={`shrink-0 text-xs font-semibold px-2.5 py-1.5 rounded-full ${todayStatusBadge.cls}`}>
            {todayStatusBadge.label}
          </span>
        </div>

        {today.status === 'checked_in' && today.punches?.length ? (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            Checked in at{' '}
            <span className="font-medium text-gray-800 dark:text-gray-200">
              {formatAddisTime(today.punches[0].at)}
            </span>
            {' '}· Ethiopian date: {today.ethiopianWorkDate}
          </p>
        ) : (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Ethiopian date: {today.ethiopianWorkDate}</p>
        )}

        {today.anomalies?.length ? (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {today.anomalies.map((code) => (
              <span key={code} className="text-[10px] uppercase tracking-wide font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                {anomalyLabel(code)}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {/* Current month quick stats */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
          This month
          {ethMonthLabel && ethParts && isViewingCurrentMonth ? ` · ${ethMonthLabel} ${ethParts.year}` : ''}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Attendance */}
          <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Attendance</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">
              {currentTrend.daysExpected > 0
                ? `${Math.round((currentTrend.daysWorked / currentTrend.daysExpected) * 100)}%`
                : '—'}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">
              {currentTrend.daysWorked ?? 0}/{currentTrend.daysExpected ?? 0} days
            </p>
          </div>

          {/* Late arrivals */}
          <div className={`rounded-xl border p-3 ${(currentTrend.lateArrivals || 0) > 0 ? 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518]'}`}>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Late arrivals</p>
            <p className={`mt-1 text-lg font-bold ${(currentTrend.lateArrivals || 0) > 0 ? 'text-amber-700 dark:text-amber-300' : 'text-gray-900 dark:text-white'}`}>
              {currentTrend.lateArrivals ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">times this month</p>
          </div>

          {/* Net balance */}
          <div className={`rounded-xl border p-3 ${(currentTrend.netMinutes || 0) >= 0 ? 'border-emerald-200/70 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20' : 'border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20'}`}>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Net balance</p>
            <p className={`mt-1 text-lg font-bold ${(currentTrend.netMinutes || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
              {formatSignedDuration(currentTrend.netMinutes || 0)}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">vs expected</p>
          </div>

          {/* Absences */}
          <div className={`rounded-xl border p-3 ${(currentTrend.daysAbsent || 0) > 0 ? 'border-red-200/80 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518]'}`}>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">Absences</p>
            <p className={`mt-1 text-lg font-bold ${(currentTrend.daysAbsent || 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
              {currentTrend.daysAbsent ?? 0}
            </p>
            <p className="text-[10px] text-gray-400 dark:text-gray-500">workdays missed</p>
          </div>
        </div>
      </div>

      {/* 3-month trend chart */}
      {trendChartData.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Hours trend (last 3 months)</h2>
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mb-3">Worked vs expected hours per month</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={trendChartData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit="h" />
                <Tooltip
                  formatter={(value, name) => [`${value}h`, name === 'worked' ? 'Worked' : 'Expected']}
                />
                <Bar dataKey="expected" fill="#e5e7eb" radius={[4, 4, 0, 0]} name="expected" />
                <Bar
                  dataKey="worked"
                  radius={[4, 4, 0, 0]}
                  name="worked"
                  fill="#059669"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Net balance mini-row */}
          <div className="mt-3 flex justify-around border-t border-gray-100 dark:border-white/5 pt-3">
            {[...trend].reverse().map((t) => {
              const ethP = toEthDatePartsFromGregorian(`${t.year}-${String(t.month).padStart(2, '0')}-01`);
              const lbl = ethP ? (ETH_MONTHS.find((m) => m.value === ethP.month)?.label?.slice(0, 3) || t.month) : t.month;
              return (
                <div key={`${t.year}-${t.month}`} className="text-center">
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">{lbl}</p>
                  <p className={`text-xs font-semibold ${t.netMinutes >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {formatSignedDuration(t.netMinutes)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Day-by-day breakdown with month navigator */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
        {/* Month navigator */}
        <div className="flex items-center justify-between gap-2 mb-4">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            aria-label="Previous month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="text-center">
            {ethMonthLabel && ethParts ? (
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{ethMonthLabel} {ethParts.year}</p>
            ) : null}
            <p className="text-xs text-gray-500 dark:text-gray-400">{gregMonthLabel}</p>
            {isViewingCurrentMonth && (
              <p className="text-[10px] text-brand-dark/50 dark:text-white/30 uppercase tracking-wider mt-0.5">Current month</p>
            )}
          </div>
          <button
            type="button"
            onClick={nextMonth}
            disabled={isViewingCurrentMonth}
            className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition"
            aria-label="Next month"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Month totals */}
        {displayTotals && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-2 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Worked</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDuration(displayTotals.workedMinutes || 0)}</p>
            </div>
            <div className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-2 text-center">
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Expected</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDuration(displayTotals.expectedMinutes || 0)}</p>
            </div>
            <div className={`rounded-lg border px-2.5 py-2 text-center ${(displayTotals.netMinutes || 0) >= 0 ? 'border-emerald-200/70 dark:border-emerald-900/40' : 'border-amber-200/80 dark:border-amber-900/40'}`}>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">Net</p>
              <p className={`text-sm font-semibold ${(displayTotals.netMinutes || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>
                {formatSignedDuration(displayTotals.netMinutes || 0)}
              </p>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex flex-wrap gap-3 mb-3 text-[10px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />On time</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />Alert</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Absent</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />Day off</span>
        </div>

        {monthDaysLoading ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">Loading…</p>
        ) : activeDays.length === 0 ? (
          <p className="text-sm text-gray-400 dark:text-gray-500 py-4 text-center">No daily data for this period.</p>
        ) : (
          <ul className="space-y-1">
            {activeDays.map((row) => (
              <li
                key={row.workDate}
                className={`flex items-center justify-between gap-2 px-2 py-2 rounded-lg text-xs ${dayRowClass(row)}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`shrink-0 w-2 h-2 rounded-full ${dayDotColor(row)}`} />
                  <span className="shrink-0 font-medium text-gray-700 dark:text-gray-300 w-7">
                    {formatWorkDateWeekday(row.workDate)}
                  </span>
                  <span className="text-gray-500 dark:text-gray-400">
                    {row.ethiopianWorkDate || row.workDate}
                    <span className="text-gray-400 dark:text-gray-600 ml-1 hidden sm:inline">({formatWorkDateGregorianSmall(row.workDate)})</span>
                  </span>
                </div>
                <div className="shrink-0 flex items-center gap-2 text-right">
                  {row.isOffDay ? (
                    <span className="text-gray-400 dark:text-gray-600">—</span>
                  ) : row.totalMinutes === 0 ? (
                    <span className="text-red-500 font-medium">Absent</span>
                  ) : (
                    <>
                      <span className="text-gray-600 dark:text-gray-300">
                        {row.firstInAt ? formatAddisTime(row.firstInAt) : '--'}–{row.lastOutAt ? formatAddisTime(row.lastOutAt) : '--'}
                      </span>
                      <span className="font-medium text-gray-800 dark:text-gray-200">
                        {formatDuration(row.totalMinutes)}
                      </span>
                    </>
                  )}
                  {row.anomalies?.length > 0 && !row.isOffDay && (
                    <span className="text-amber-500 text-[10px] font-semibold uppercase">!</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Today's punches + admin punch management */}
      <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today's punches</h2>

        {today.punches?.length ? (
          <ul className="space-y-2 mb-4">
            {today.punches.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      p.type === 'in'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                    }`}
                  >
                    {p.type === 'in' ? 'Check in' : 'Check out'}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-200">{formatAddisTime(p.at)}</span>
                  {p.source === 'correction' && (
                    <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">Adjusted</span>
                  )}
                </div>
                <button
                  type="button"
                  disabled={deletingPunchId === p.id}
                  onClick={() => handleDeletePunch(p.id)}
                  className="text-red-400 hover:text-red-600 dark:hover:text-red-400 disabled:opacity-40 transition text-xs font-medium"
                >
                  {deletingPunchId === p.id ? 'Deleting…' : 'Delete'}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">No punches today.</p>
        )}

        <div className="border-t border-gray-100 dark:border-white/5 pt-4">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Add punch</p>
          <form onSubmit={handleCreatePunch} className="grid grid-cols-2 gap-2">
            <select
              value={punchType}
              onChange={(e) => setPunchType(e.target.value)}
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
            >
              <option value="in">In</option>
              <option value="out">Out</option>
            </select>
            <input
              type="time"
              value={punchTime}
              onChange={(e) => setPunchTime(e.target.value)}
              required
              className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
            />
            <input
              type="date"
              value={punchWorkDate}
              onChange={(e) => setPunchWorkDate(e.target.value)}
              required
              className="col-span-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2.5 py-2 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
            />
            <button
              type="submit"
              disabled={punchSubmitting || !punchWorkDate || !punchTime}
              className="col-span-2 px-4 py-2 rounded-lg text-xs font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
            >
              {punchSubmitting ? '…' : 'Add'}
            </button>
          </form>
        </div>
      </div>

      {/* Recent corrections */}
      {recentCorrections?.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Recent corrections</h2>
          <ul className="space-y-2">
            {recentCorrections.map((r) => {
              const statusCls =
                r.status === 'approved'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                  : r.status === 'rejected'
                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                  : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
              return (
                <li
                  key={r.id}
                  className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 text-xs"
                >
                  <div>
                    <p className="font-medium text-gray-800 dark:text-gray-200">
                      {r.ethiopianWorkDate || r.workDate}
                      <span className="text-gray-400 dark:text-gray-500 ml-1">({r.workDate})</span>
                    </p>
                    <p className="mt-0.5 text-gray-500 dark:text-gray-400">
                      {r.kind === 'wrong_time' ? 'Wrong time' : 'Missing'} · {r.punchType === 'in' ? 'Check in' : 'Check out'}
                      {r.requestedAt ? ` → ${formatAddisTime(r.requestedAt)}` : ''}
                    </p>
                    {r.note && <p className="mt-0.5 text-gray-400 dark:text-gray-500 italic">{r.note}</p>}
                    {r.reviewNote && (
                      <p className="mt-0.5 text-gray-400 dark:text-gray-500">Review: {r.reviewNote}</p>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${statusCls}`}>
                    {r.status}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </section>
  );
};

export default TimeEmployeeProfile;
