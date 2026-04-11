import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ResponsiveContainer, CartesianGrid, Tooltip, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { useAuth } from '../../hooks/useAuth';
import {
  fetchTeamOverview,
  fetchEmployeeSummary,
  fetchPendingCorrectionRequests,
  approveCorrectionRequest,
  rejectCorrectionRequest,
  createAdminPunch,
  deleteAdminPunch,
} from '../../services/timeApi';
import { canAccessTeamTime } from '../../utils/timeAccess';
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

function anomalyLabel(code) {
  if (code === 'late_check_in') return 'Late check-in (after 09:00)';
  if (code === 'missing_checkout') return 'No checkout after 18:00';
  if (code === 'sequence') return 'Punch record issue';
  return 'Review needed';
}

const TimeTeam = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [overview, setOverview] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [pendingCorrections, setPendingCorrections] = useState([]);
  const [correctionActionId, setCorrectionActionId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { id, action: 'approve'|'reject', employeeName, summary }
  const [reviewNote, setReviewNote] = useState('');

  const todayReal = new Date();
  const [detailYear, setDetailYear] = useState(() => todayReal.getFullYear());
  const [detailMonth, setDetailMonth] = useState(() => todayReal.getMonth() + 1);

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

  const loadPendingCorrections = async () => {
    try {
      const list = await fetchPendingCorrectionRequests();
      setPendingCorrections(list || []);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load correction requests');
    }
  };

  const load = async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      const data = await fetchTeamOverview();
      setOverview(data);
      setEmployees(data.employees || []);
      if (selected) {
        const fresh = data.employees?.find((e) => String(e.employeeId) === String(selected.employeeId));
        if (fresh) setSelected(fresh);
      } else if (data.employees?.length) {
        setSelected(data.employees[0]);
      }
      await loadPendingCorrections();
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load team overview');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const loadDetail = async (employeeId, year, month) => {
    if (!employeeId) { setDetail(null); return; }
    try {
      setDetailLoading(true);
      const now = new Date();
      const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1;
      const data = await fetchEmployeeSummary(employeeId, isCurrentMonth ? {} : { year, month });
      setDetail(data);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load employee details');
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    if (!selected?.employeeId) { setDetail(null); return; }
    loadDetail(selected.employeeId, detailYear, detailMonth);
  }, [selected?.employeeId]);

  useEffect(() => {
    if (selected?.employeeId) loadDetail(selected.employeeId, detailYear, detailMonth);
  }, [detailYear, detailMonth]);

  if (!canAccessTeamTime(user?.role)) return null;

  const handleCreatePunch = async (e) => {
    e.preventDefault();
    if (!selected?.employeeId || !punchWorkDate || !punchTime) return;
    try {
      setPunchSubmitting(true);
      await createAdminPunch({ employeeId: selected.employeeId, type: punchType, workDate: punchWorkDate, time: punchTime });
      toast.success('Punch added');
      setPunchWorkDate('');
      setPunchTime('');
      await loadDetail(selected.employeeId, detailYear, detailMonth);
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
      await loadDetail(selected.employeeId, detailYear, detailMonth);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to delete punch');
    } finally {
      setDeletingPunchId(null);
    }
  };

  const openReviewModal = (r, action) => {
    const emp = r.employee;
    const employeeName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
    const summary = `${r.ethiopianWorkDate || r.workDate} · ${r.kind === 'wrong_time' ? 'Wrong time' : 'Missing'} · ${r.punchType} → ${formatAddisTime(r.requestedAt)}`;
    setReviewNote('');
    setReviewModal({ id: r._id, action, employeeName, summary });
  };

  const handleReviewConfirm = async () => {
    if (!reviewModal) return;
    const { id, action } = reviewModal;
    try {
      setCorrectionActionId(id);
      if (action === 'approve') {
        await approveCorrectionRequest(id, reviewNote.trim() || undefined);
        toast.success('Correction approved');
      } else {
        await rejectCorrectionRequest(id, reviewNote.trim() || undefined);
        toast.success('Correction rejected');
      }
      setReviewModal(null);
      await Promise.all([load(true), selected?.employeeId ? loadDetail(selected.employeeId, detailYear, detailMonth) : Promise.resolve()]);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || `${action === 'approve' ? 'Approve' : 'Reject'} failed`);
    } finally {
      setCorrectionActionId(null);
    }
  };

  const historyChartData =
    detail?.last7Days?.map((d) => ({
      label: formatWorkDateWeekday(d.workDate),
      hours: Number((Math.max(0, d.totalMinutes || 0) / 60).toFixed(1)),
    })) || [];
  const monthTotals = detail?.monthTotals || {};

  return (
    <section className="py-2">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Time management</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Team overview with employee status, corrections, and recent time details.
          </p>
          {overview?.ethiopianWorkDate ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Ethiopian date: {overview.ethiopianWorkDate}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => load(true)}
          className="px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition"
        >
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-6">
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">At work</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{overview?.kpis?.checkedInNow ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">Pending</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{overview?.kpis?.pendingCorrections ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-2 sm:p-3">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">Alerts</p>
          <p className="mt-1 text-lg font-semibold text-gray-900 dark:text-white">{overview?.kpis?.todayAnomalies ?? 0}</p>
        </div>
      </div>

      <div className="rounded-2xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5 shadow-sm mb-6">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending time corrections</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">{pendingCorrections.length}</span>
        </div>
        {pendingCorrections.length === 0 ? (
          <p className="text-sm text-gray-600 dark:text-gray-400">No pending requests.</p>
        ) : (
          <ul className="space-y-3">
            {pendingCorrections.map((r) => {
              const emp = r.employee;
              const name = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
              const busy = correctionActionId === r._id;
              return (
                <li
                  key={r._id}
                  className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] px-3 py-3 text-sm"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{name}</p>
                      <p className="text-gray-600 dark:text-gray-400 mt-1">
                        {(r.ethiopianWorkDate || r.workDate)} · {r.kind === 'wrong_time' ? 'Wrong time' : 'Missing'} · {r.punchType} →{' '}
                        {formatAddisTime(r.requestedAt)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                        Gregorian ref: {formatAddisDateTimeSmall(r.requestedAt)}
                      </p>
                      {r.note ? <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{r.note}</p> : null}
                      {r.kind === 'wrong_time' && r.previousAt ? (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-0.5">
                          Previous: {formatAddisTime(r.previousAt)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openReviewModal(r, 'approve')}
                        className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => openReviewModal(r, 'reject')}
                        className="px-3 py-2 rounded-lg text-xs font-semibold border border-gray-300 dark:border-white/20 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">All employees</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">{employees.length} employee(s)</span>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading…</p>
          ) : employees.length === 0 ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">No employees found.</p>
          ) : (
            <div className="space-y-2">
              {employees.map((emp) => {
                const active = selected?.employeeId === emp.employeeId;
                const isIn = emp.todayStatus === 'checked_in';
                const statusLabel = isIn ? 'In' : emp.todayStatus === 'checked_out' ? 'Out' : 'No punch';
                return (
                  <div
                    key={emp.employeeId}
                    className={`rounded-xl border transition ${
                      active
                        ? 'border-brand-dark/40 bg-gray-50 dark:bg-white/5'
                        : 'border-gray-200 dark:border-white/10'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelected(emp)}
                      className="w-full text-left px-3 py-2.5"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {emp.firstName} {emp.lastName}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded-full ${
                            isIn
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                              : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-300'
                          }`}
                        >
                          {statusLabel}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {emp.role}
                        {emp.checkedInAt ? ` • since ${formatAddisTime(emp.checkedInAt)}` : ''}
                      </p>
                      {emp.todayAnomalies?.length ? (
                        <p className="mt-0.5 text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">
                          Review needed
                        </p>
                      ) : null}
                    </button>
                    <div className="px-3 pb-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/time/team/${emp.employeeId}`)}
                        className="text-[11px] font-medium text-brand-dark/60 dark:text-white/40 hover:text-brand-dark dark:hover:text-white transition"
                      >
                        View full profile →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employee details</h2>

          {!selected ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Select an employee from the left.</p>
          ) : detailLoading ? (
            <p className="text-sm text-gray-500 dark:text-gray-400">Loading details…</p>
          ) : (
            <>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                {selected.firstName} {selected.lastName} —{' '}
                <span className="font-medium">{detail?.todayStatus?.replace('_', ' ') || 'none'}</span>
              </p>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Worked month</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDuration(monthTotals.workedMinutes || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 dark:border-white/10 px-2.5 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Expected month</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">
                    {formatDuration(monthTotals.expectedMinutes || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-emerald-200/70 dark:border-emerald-900/40 px-2.5 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Overtime</p>
                  <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                    {formatDuration(monthTotals.overtimeMinutes || 0)}
                  </p>
                </div>
                <div className="rounded-lg border border-amber-200/80 dark:border-amber-900/40 px-2.5 py-2">
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Lost time</p>
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {formatDuration(monthTotals.lostMinutes || 0)}
                  </p>
                </div>
                <div className={`rounded-lg border px-2.5 py-2 ${
                  (monthTotals.netMinutes || 0) >= 0
                    ? 'border-emerald-200/70 dark:border-emerald-900/40'
                    : 'border-amber-200/80 dark:border-amber-900/40'
                }`}>
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">Net balance</p>
                  <p className={`text-sm font-semibold ${
                    (monthTotals.netMinutes || 0) >= 0
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-amber-700 dark:text-amber-300'
                  }`}>
                    {formatSignedDuration(monthTotals.netMinutes || 0)}
                  </p>
                </div>
              </div>
              {detail?.todayAnomalies?.length ? (
                <div className="mb-3">
                  <p className="text-xs text-amber-700 dark:text-amber-400/90">Today has alerts:</p>
                  <ul className="mt-1 space-y-1">
                    {detail.todayAnomalies.map((code) => (
                      <li key={code} className="text-xs text-amber-700 dark:text-amber-400/90">
                        - {anomalyLabel(code)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
              {detail?.today?.punches?.length ? (
                <div className="space-y-2">
                  {detail.today.punches.map((p, idx) => (
                    <div
                      key={`${p.at}-${idx}`}
                      className="flex items-center justify-between px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10"
                    >
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          p.type === 'in'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                        }`}
                      >
                        {p.type === 'in' ? 'Check in' : 'Check out'}
                      </span>
                      <span className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200">
                        {formatAddisTime(p.at)}
                        {p.source === 'correction' && (
                          <span className="text-[10px] uppercase tracking-wide text-amber-700/80 dark:text-amber-400/70">
                            Adjusted
                          </span>
                        )}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No punches yet today.</p>
              )}

              {(() => {
                const now = new Date();
                const isCurrentDetailMonth = detailYear === now.getFullYear() && detailMonth === now.getMonth() + 1;
                const gregMonthLabel = new Date(detailYear, detailMonth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                const ethParts = toEthDatePartsFromGregorian(`${detailYear}-${String(detailMonth).padStart(2, '0')}-01`);
                const ethMonthLabel = ethParts ? ETH_MONTHS.find((m) => m.value === ethParts.month)?.label : null;
                const prevDetailMonth = () => {
                  if (detailMonth === 1) { setDetailYear((y) => y - 1); setDetailMonth(12); }
                  else setDetailMonth((m) => m - 1);
                };
                const nextDetailMonth = () => {
                  if (isCurrentDetailMonth) return;
                  if (detailMonth === 12) { setDetailYear((y) => y + 1); setDetailMonth(1); }
                  else setDetailMonth((m) => m + 1);
                };
                return (
                  <div className="mt-5 flex items-center justify-between gap-2">
                    <button type="button" onClick={prevDetailMonth} className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition" aria-label="Previous month">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <div className="text-center">
                      {ethMonthLabel && ethParts ? (
                        <p className="text-xs font-semibold text-gray-800 dark:text-gray-200">{ethMonthLabel} {ethParts.year}</p>
                      ) : null}
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">{gregMonthLabel}</p>
                    </div>
                    <button type="button" onClick={nextDetailMonth} disabled={isCurrentDetailMonth} className="p-1.5 rounded-lg border border-gray-200 dark:border-white/10 text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition" aria-label="Next month">
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                    </button>
                  </div>
                );
              })()}

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Last 7 days</h3>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={historyChartData}>
                      <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#1f2937" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ul className="mt-3 space-y-1.5">
                  {(detail?.last7Days || []).map((d) => (
                    <li key={d.workDate} className="text-xs flex items-center justify-between text-gray-600 dark:text-gray-300">
                      <span>
                        {formatWorkDateWeekday(d.workDate)} · {d.ethiopianWorkDate || d.workDate}
                        <span className="text-gray-400 dark:text-gray-500"> ({formatWorkDateGregorianSmall(d.workDate)})</span>
                      </span>
                      <span>
                        {d.firstInAt ? formatAddisTime(d.firstInAt) : '--'} - {d.lastOutAt ? formatAddisTime(d.lastOutAt) : '--'} ({Math.round((d.totalMinutes || 0) / 60)}h)
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {canAccessTeamTime(user?.role) && selected?.employeeId && (
                <div className="mt-5 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50/60 dark:bg-white/[0.03] p-3">
                  <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Admin — manage punches</h3>

                  {detail?.today?.punches?.length ? (
                    <ul className="space-y-1.5 mb-3">
                      {detail.today.punches.map((p) => (
                        <li key={p.id} className="flex items-center justify-between gap-2 text-xs text-gray-700 dark:text-gray-300">
                          <span>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold mr-1 ${p.type === 'in' ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                              {p.type === 'in' ? 'In' : 'Out'}
                            </span>
                            {formatAddisTime(p.at)}
                            {p.source === 'correction' && <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400">adj</span>}
                          </span>
                          <button
                            type="button"
                            disabled={deletingPunchId === p.id}
                            onClick={() => handleDeletePunch(p.id)}
                            className="text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-40 transition text-[10px] font-semibold uppercase tracking-wide"
                          >
                            {deletingPunchId === p.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">No punches today to manage.</p>
                  )}

                  <form onSubmit={handleCreatePunch} className="space-y-2">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Add punch</p>
                    <div className="grid grid-cols-2 gap-2">
                      <select
                        value={punchType}
                        onChange={(e) => setPunchType(e.target.value)}
                        className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
                      >
                        <option value="in">In</option>
                        <option value="out">Out</option>
                      </select>
                      <input
                        type="time"
                        value={punchTime}
                        onChange={(e) => setPunchTime(e.target.value)}
                        required
                        className="rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
                      />
                      <input
                        type="date"
                        value={punchWorkDate}
                        onChange={(e) => setPunchWorkDate(e.target.value)}
                        required
                        className="col-span-2 rounded-lg border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-2 py-1.5 text-xs text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-brand-dark/40"
                      />
                      <button
                        type="submit"
                        disabled={punchSubmitting || !punchWorkDate || !punchTime}
                        className="col-span-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50"
                      >
                        {punchSubmitting ? '…' : 'Add'}
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
              {reviewModal.action === 'approve' ? 'Approve correction' : 'Reject correction'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{reviewModal.employeeName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">{reviewModal.summary}</p>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">
              Note for the employee (optional)
            </label>
            <textarea
              rows={3}
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              placeholder="Add a note…"
              className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 resize-none"
            />
            <div className="mt-4 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setReviewModal(null)}
                disabled={correctionActionId === reviewModal.id}
                className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReviewConfirm}
                disabled={correctionActionId === reviewModal.id}
                className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${
                  reviewModal.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {correctionActionId === reviewModal.id
                  ? reviewModal.action === 'approve' ? 'Approving…' : 'Rejecting…'
                  : reviewModal.action === 'approve' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TimeTeam;
