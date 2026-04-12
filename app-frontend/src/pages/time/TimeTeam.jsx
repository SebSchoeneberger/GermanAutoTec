import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EthDateTime } from 'ethiopian-calendar-date-converter';
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
  fetchPendingLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  fetchHolidays,
  createHoliday,
  deleteHoliday,
  adminCreateLeaveRecord,
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

function buildManageYearOptions() {
  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const parts = toEthDatePartsFromGregorian(iso);
  const cur = parts?.year ?? 2017;
  const options = [];
  for (let y = cur + 2; y >= cur - 3; y -= 1) options.push(y);
  return { options, current: cur };
}

const { options: MANAGE_YEAR_OPTIONS, current: CURRENT_ETH_YEAR } = buildManageYearOptions();

function formatEthDateLabel(gregDateStr) {
  const parts = toEthDatePartsFromGregorian(gregDateStr);
  if (!parts) return '';
  const monthName = ETH_MONTHS.find((m) => m.value === parts.month)?.label ?? '';
  return `${parts.day} ${monthName} ${parts.year}`;
}

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

  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveActionId, setLeaveActionId] = useState(null);
  const [leaveReviewModal, setLeaveReviewModal] = useState(null); // { id, action: 'approve'|'reject', employeeName, summary }
  const [leaveReviewNote, setLeaveReviewNote] = useState('');

  const todayReal = new Date();
  const [detailYear, setDetailYear] = useState(() => todayReal.getFullYear());
  const [detailMonth, setDetailMonth] = useState(() => todayReal.getMonth() + 1);

  const [punchType, setPunchType] = useState('in');
  const [punchWorkDate, setPunchWorkDate] = useState('');
  const [punchTime, setPunchTime] = useState('');
  const [punchSubmitting, setPunchSubmitting] = useState(false);
  const [deletingPunchId, setDeletingPunchId] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showManagePunches, setShowManagePunches] = useState(false);

  // Manage tab — admin leave entry
  const [adminLeaveEmployee, setAdminLeaveEmployee] = useState('');
  const [adminLeaveEthYear, setAdminLeaveEthYear] = useState(String(CURRENT_ETH_YEAR));
  const [adminLeaveEthMonth, setAdminLeaveEthMonth] = useState('');
  const [adminLeaveEthDay, setAdminLeaveEthDay] = useState('');
  const [adminLeaveType, setAdminLeaveType] = useState('sick');
  const [adminLeaveNote, setAdminLeaveNote] = useState('');
  const [adminLeaveSubmitting, setAdminLeaveSubmitting] = useState(false);

  // Manage tab — holidays
  const [holidays, setHolidays] = useState([]);
  const [holidaysLoaded, setHolidaysLoaded] = useState(false);
  const [holidaysLoading, setHolidaysLoading] = useState(false);
  const [holidaysError, setHolidaysError] = useState(false);
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState(null);
  const [holEthYear, setHolEthYear] = useState(String(CURRENT_ETH_YEAR));
  const [holEthMonth, setHolEthMonth] = useState('');
  const [holEthDay, setHolEthDay] = useState('');
  const [holReason, setHolReason] = useState('');
  const [holSubmitting, setHolSubmitting] = useState(false);

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

  const loadPendingLeaves = async () => {
    try {
      const list = await fetchPendingLeaveRequests();
      setPendingLeaves(list || []);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || 'Failed to load leave requests');
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
      await Promise.all([loadPendingCorrections(), loadPendingLeaves()]);
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

  useEffect(() => {
    if (activeTab === 'manage' && !holidaysLoaded && !holidaysLoading) {
      loadHolidays();
    }
  }, [activeTab]);

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

  const loadHolidays = async () => {
    try {
      setHolidaysLoading(true);
      setHolidaysError(false);
      const data = await fetchHolidays();
      setHolidays(data);
      setHolidaysLoaded(true);
    } catch {
      setHolidaysError(true);
      toast.error('Failed to load holidays');
    } finally {
      setHolidaysLoading(false);
    }
  };

  const handleCreateHoliday = async (e) => {
    e.preventDefault();
    const gregDate = toGregorianStringFromEthDate(holEthYear, holEthMonth, holEthDay);
    if (!gregDate) { toast.error('Select a valid date'); return; }
    try {
      setHolSubmitting(true);
      const created = await createHoliday({ date: gregDate, reason: holReason.trim() });
      setHolidays((prev) => [...prev, created].sort((a, b) => a.date.localeCompare(b.date)));
      toast.success('Holiday added');
      setHolEthMonth('');
      setHolEthDay('');
      setHolReason('');
      setShowAddHoliday(false);
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add holiday');
    } finally {
      setHolSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    try {
      setDeletingHolidayId(id);
      await deleteHoliday(id);
      setHolidays((prev) => prev.filter((h) => h.id !== id));
      toast.success('Holiday removed');
    } catch {
      toast.error('Failed to remove holiday');
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const handleAdminLeave = async (e) => {
    e.preventDefault();
    const gregDate = toGregorianStringFromEthDate(adminLeaveEthYear, adminLeaveEthMonth, adminLeaveEthDay);
    if (!gregDate) { toast.error('Select a valid date'); return; }
    if (!adminLeaveEmployee) { toast.error('Select an employee'); return; }
    try {
      setAdminLeaveSubmitting(true);
      await adminCreateLeaveRecord({
        employeeId: adminLeaveEmployee,
        date: gregDate,
        type: adminLeaveType,
        note: adminLeaveNote.trim(),
      });
      toast.success('Leave record added');
      setAdminLeaveEthMonth('');
      setAdminLeaveEthDay('');
      setAdminLeaveType('sick');
      setAdminLeaveNote('');
    } catch (err) {
      toast.error(err?.response?.data?.error || 'Failed to add leave record');
    } finally {
      setAdminLeaveSubmitting(false);
    }
  };

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

  const openLeaveReviewModal = (r, action) => {
    const emp = r.employee;
    const employeeName = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
    const typeLabel = r.type === 'sick' ? 'Sick day' : 'Day off';
    const summary = `${r.ethiopianDate || r.date} · ${typeLabel}`;
    setLeaveReviewNote('');
    setLeaveReviewModal({ id: r.id, action, employeeName, summary });
  };

  const handleLeaveReviewConfirm = async () => {
    if (!leaveReviewModal) return;
    const { id, action } = leaveReviewModal;
    try {
      setLeaveActionId(id);
      if (action === 'approve') {
        await approveLeaveRequest(id, leaveReviewNote.trim() || undefined);
        toast.success('Leave approved');
      } else {
        await rejectLeaveRequest(id, leaveReviewNote.trim() || undefined);
        toast.success('Leave rejected');
      }
      setLeaveReviewModal(null);
      await load(true);
    } catch (e) {
      toast.error(e.response?.data?.error || e.response?.data?.message || `${action === 'approve' ? 'Approve' : 'Reject'} failed`);
    } finally {
      setLeaveActionId(null);
    }
  };

  const historyChartData =
    detail?.last7Days?.map((d) => ({
      label: formatWorkDateWeekday(d.workDate),
      hours: Number((Math.max(0, d.totalMinutes || 0) / 60).toFixed(1)),
    })) || [];
  const monthTotals = detail?.monthTotals || {};

  const pendingTotal = pendingCorrections.length + pendingLeaves.length;

  const tabs = [
    {
      id: 'overview',
      label: 'Team',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
    {
      id: 'employee',
      label: 'Employee',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: 'requests',
      label: 'Requests',
      badge: pendingTotal > 0 ? pendingTotal : null,
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
    },
    {
      id: 'manage',
      label: 'Manage',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-2">
      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4 mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-brand-dark dark:text-white">Time management</h1>
          {overview?.ethiopianWorkDate ? (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{overview.ethiopianWorkDate}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => load(true)}
            className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition"
            aria-label="Refresh"
          >
            {refreshing ? (
              <span className="text-xs">…</span>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* ── Tab bar — matches TimeMy pill style with icons ── */}
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

      {/* ── TEAM TAB ── */}
      {activeTab === 'overview' && (
        <>
          {/* KPI cards with colored borders */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3 mb-5">
            <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518] p-2 sm:p-3">
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">At work</p>
              <p className="mt-1 text-xl font-bold text-emerald-700 dark:text-emerald-300">{overview?.kpis?.checkedInNow ?? 0}</p>
            </div>
            <div className={`rounded-xl border bg-white dark:bg-[#141518] p-2 sm:p-3 ${pendingTotal > 0 ? 'border-amber-200/80 dark:border-amber-900/40' : 'border-gray-200 dark:border-white/10'}`}>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">Pending</p>
              <p className={`mt-1 text-xl font-bold ${pendingTotal > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-900 dark:text-white'}`}>{pendingTotal}</p>
            </div>
            <div className={`rounded-xl border bg-white dark:bg-[#141518] p-2 sm:p-3 ${(overview?.kpis?.todayAnomalies ?? 0) > 0 ? 'border-red-200/80 dark:border-red-900/40' : 'border-gray-200 dark:border-white/10'}`}>
              <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 leading-tight">Alerts</p>
              <p className={`mt-1 text-xl font-bold ${(overview?.kpis?.todayAnomalies ?? 0) > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{overview?.kpis?.todayAnomalies ?? 0}</p>
            </div>
          </div>

          {/* Employee roster */}
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-white/5">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Employees</h2>
              <span className="text-xs text-gray-400 dark:text-gray-500">{employees.length} total</span>
            </div>
            {loading ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4">Loading…</p>
            ) : employees.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 p-4">No employees found.</p>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-white/5">
                {[...employees].sort((a, b) => {
                  // anomalies first, then checked_in, then rest
                  const aScore = a.todayAnomalies?.length ? 0 : a.todayStatus === 'checked_in' ? 1 : 2;
                  const bScore = b.todayAnomalies?.length ? 0 : b.todayStatus === 'checked_in' ? 1 : 2;
                  return aScore - bScore;
                }).map((emp) => {
                  const isIn = emp.todayStatus === 'checked_in';
                  const hasAlert = Boolean(emp.todayAnomalies?.length);
                  const initials = `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();
                  return (
                    <button
                      key={emp.employeeId}
                      type="button"
                      onClick={() => { setSelected(emp); setShowManagePunches(false); setActiveTab('employee'); }}
                      className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/3 transition"
                    >
                      {/* Initials bubble */}
                      <span className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                        hasAlert
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          : isIn
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                          : 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400'
                      }`}>
                        {initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{emp.firstName} {emp.lastName}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {emp.role}{isIn && emp.checkedInAt ? ` · since ${formatAddisTime(emp.checkedInAt)}` : ''}
                        </p>
                        {hasAlert ? (
                          <p className="text-[10px] uppercase tracking-wide text-amber-600 dark:text-amber-400 mt-0.5 font-semibold">⚠ Review needed</p>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          isIn
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : emp.todayStatus === 'checked_out'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : 'bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                        }`}>
                          {isIn ? 'In' : emp.todayStatus === 'checked_out' ? 'Out' : 'No punch'}
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── EMPLOYEE TAB ── */}
      {activeTab === 'employee' && (
        <>
          {!selected ? (
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-8 text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Select an employee from the Team tab.</p>
              <button type="button" onClick={() => setActiveTab('overview')} className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-dark hover:bg-[#2a3640] transition">
                Go to Team
              </button>
            </div>
          ) : (
            <>
              {/* Status banner — same pattern as TimeMy */}
              {(() => {
                const isIn = selected.todayStatus === 'checked_in';
                const hasAlert = Boolean(detail?.todayAnomalies?.length);
                const initials = `${selected.firstName?.[0] || ''}${selected.lastName?.[0] || ''}`.toUpperCase();
                return (
                  <div className={`rounded-2xl border px-4 py-4 mb-4 ${
                    hasAlert
                      ? 'border-amber-200 bg-amber-50/70 dark:border-amber-900/40 dark:bg-amber-950/20'
                      : isIn
                      ? 'border-emerald-200 bg-emerald-50/70 dark:border-emerald-900/40 dark:bg-emerald-950/20'
                      : 'border-gray-200 bg-gray-50/70 dark:border-white/10 dark:bg-white/5'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                          hasAlert
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : isIn
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-gray-200 text-gray-600 dark:bg-white/10 dark:text-gray-400'
                        }`}>
                          {initials}
                        </span>
                        <div>
                          <p className={`text-base font-bold ${hasAlert ? 'text-amber-700 dark:text-amber-300' : isIn ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                            {selected.firstName} {selected.lastName}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {selected.role}
                            {isIn && selected.checkedInAt ? ` · in since ${formatAddisTime(selected.checkedInAt)}` : ''}
                            {!isIn && selected.todayStatus === 'checked_out' ? ' · checked out' : ''}
                            {selected.todayStatus === 'none' ? ' · no punch today' : ''}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate(`/time/team/${selected.employeeId}`)}
                        className="text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                      >
                        Full profile →
                      </button>
                    </div>
                    {hasAlert ? (
                      <div className="mt-3 space-y-0.5">
                        {detail.todayAnomalies.map((code) => (
                          <p key={code} className="text-xs text-amber-700 dark:text-amber-400">⚠ {anomalyLabel(code)}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })()}

              {detailLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">Loading…</p>
              ) : (
                <>
                  {/* Stat cards with colored borders */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Worked</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDuration(monthTotals.workedMinutes || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-3">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Expected</p>
                      <p className="mt-1 text-sm font-semibold text-gray-900 dark:text-white">{formatDuration(monthTotals.expectedMinutes || 0)}</p>
                    </div>
                    <div className={`rounded-xl border p-3 bg-white dark:bg-[#141518] ${(monthTotals.netMinutes || 0) >= 0 ? 'border-emerald-200/70 dark:border-emerald-900/40' : 'border-amber-200/80 dark:border-amber-900/40'}`}>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Net</p>
                      <p className={`mt-1 text-sm font-semibold ${(monthTotals.netMinutes || 0) >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}>{formatSignedDuration(monthTotals.netMinutes || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-emerald-200/70 dark:border-emerald-900/40 bg-white dark:bg-[#141518] p-3">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Overtime</p>
                      <p className="mt-1 text-sm font-semibold text-emerald-700 dark:text-emerald-300">{formatDuration(monthTotals.overtimeMinutes || 0)}</p>
                    </div>
                    <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-white dark:bg-[#141518] p-3 col-span-2">
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">Lost time</p>
                      <p className="mt-1 text-sm font-semibold text-amber-700 dark:text-amber-300">{formatDuration(monthTotals.lostMinutes || 0)}</p>
                    </div>
                  </div>

                  {/* Today's timeline — icon bubble style matching TimeMy */}
                  <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Today&apos;s timeline</h3>
                    {detail?.today?.punches?.length ? (
                      <div className="space-y-2">
                        {detail.today.punches.map((p, idx) => (
                          <div key={`${p.at}-${idx}`} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10">
                            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              p.type === 'in'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-blue-100 text-blue-700 dark:bg-blue-900/25 dark:text-blue-300'
                            }`}>
                              {p.type === 'in' ? '→' : '←'}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white">{p.type === 'in' ? 'Check in' : 'Check out'}</p>
                              {p.source === 'correction' && <p className="text-[10px] text-amber-600 dark:text-amber-400">Adjusted</p>}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200 shrink-0">{formatAddisTime(p.at)}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">No punches yet today.</p>
                    )}
                  </div>

                  {/* Month navigator */}
                  {(() => {
                    const now = new Date();
                    const isCurrentDetailMonth = detailYear === now.getFullYear() && detailMonth === now.getMonth() + 1;
                    const gregMonthLabel = new Date(detailYear, detailMonth - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
                    const ethParts = toEthDatePartsFromGregorian(`${detailYear}-${String(detailMonth).padStart(2, '0')}-01`);
                    const ethMonthLabel = ethParts ? ETH_MONTHS.find((m) => m.value === ethParts.month)?.label : null;
                    const prevDetailMonth = () => { if (detailMonth === 1) { setDetailYear((y) => y - 1); setDetailMonth(12); } else setDetailMonth((m) => m - 1); };
                    const nextDetailMonth = () => { if (isCurrentDetailMonth) return; if (detailMonth === 12) { setDetailYear((y) => y + 1); setDetailMonth(1); } else setDetailMonth((m) => m + 1); };
                    return (
                      <div className="flex items-center justify-between gap-2 mb-4">
                        <button type="button" onClick={prevDetailMonth} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
                        </button>
                        <div className="text-center">
                          {ethMonthLabel && ethParts ? <p className="text-sm font-semibold text-gray-900 dark:text-white">{ethMonthLabel} {ethParts.year}</p> : null}
                          <p className="text-xs text-gray-500 dark:text-gray-400">{gregMonthLabel}</p>
                        </div>
                        <button type="button" onClick={nextDetailMonth} disabled={isCurrentDetailMonth} className="p-2 rounded-xl border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-30 transition">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                        </button>
                      </div>
                    );
                  })()}

                  {/* Chart + 7-day list */}
                  <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-4 shadow-sm mb-4">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Last 7 days</h3>
                    <div className="h-44 mb-3">
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
                    <ul className="space-y-1.5">
                      {(detail?.last7Days || []).map((d) => (
                        <li key={d.workDate} className="text-xs flex items-center justify-between text-gray-600 dark:text-gray-300">
                          <span>{formatWorkDateWeekday(d.workDate)} · {d.ethiopianWorkDate || d.workDate}<span className="text-gray-400 dark:text-gray-500"> ({formatWorkDateGregorianSmall(d.workDate)})</span></span>
                          <span className="shrink-0 ml-2">{d.firstInAt ? formatAddisTime(d.firstInAt) : '--'} – {d.lastOutAt ? formatAddisTime(d.lastOutAt) : '--'} ({Math.round((d.totalMinutes || 0) / 60)}h)</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Collapsible manage punches */}
                  {canAccessTeamTime(user?.role) && (
                    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setShowManagePunches((v) => !v)}
                        className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/3 transition"
                      >
                        <span className="flex items-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Manage punches
                        </span>
                        <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 transition-transform ${showManagePunches ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {showManagePunches && (
                        <div className="px-4 pb-4 border-t border-gray-100 dark:border-white/5">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-3 mb-2">Today&apos;s punches</p>
                          {detail?.today?.punches?.length ? (
                            <ul className="space-y-1.5 mb-4">
                              {detail.today.punches.map((p) => (
                                <li key={p.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-gray-100 dark:border-white/5 last:border-0">
                                  <span className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.type === 'in' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'}`}>
                                      {p.type === 'in' ? 'In' : 'Out'}
                                    </span>
                                    {formatAddisTime(p.at)}
                                    {p.source === 'correction' && <span className="text-[10px] text-amber-600 dark:text-amber-400">adj</span>}
                                  </span>
                                  <button
                                    type="button"
                                    disabled={deletingPunchId === p.id}
                                    onClick={() => handleDeletePunch(p.id)}
                                    className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-40 transition"
                                  >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    {deletingPunchId === p.id ? 'Deleting…' : 'Delete'}
                                  </button>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">No punches today.</p>
                          )}
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Add punch</p>
                          <form onSubmit={handleCreatePunch}>
                            <div className="grid grid-cols-2 gap-2">
                              <select value={punchType} onChange={(e) => setPunchType(e.target.value)} className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20">
                                <option value="in">Check in</option>
                                <option value="out">Check out</option>
                              </select>
                              <input type="time" value={punchTime} onChange={(e) => setPunchTime(e.target.value)} required className="rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20" />
                              <input type="date" value={punchWorkDate} onChange={(e) => setPunchWorkDate(e.target.value)} required className="col-span-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20" />
                              <button type="submit" disabled={punchSubmitting || !punchWorkDate || !punchTime} className="col-span-2 py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition">
                                {punchSubmitting ? 'Adding…' : 'Add punch'}
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {activeTab === 'requests' && (() => {
        const allRequests = [
          ...pendingCorrections.map((r) => ({ ...r, _type: 'correction', _key: r._id, _sortAt: r.createdAt || r.requestedAt })),
          ...pendingLeaves.map((r) => ({ ...r, _type: 'leave', _key: r.id, _sortAt: r.createdAt || r.date })),
        ].sort((a, b) => new Date(b._sortAt) - new Date(a._sortAt));

        if (allRequests.length === 0) return (
          <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-10 text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-3 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">All caught up</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">No pending requests.</p>
          </div>
        );

        return (
          <ul className="space-y-3">
            {allRequests.map((r) => {
              const emp = r.employee;
              const name = emp ? `${emp.firstName || ''} ${emp.lastName || ''}`.trim() : 'Employee';
              const isCorrection = r._type === 'correction';
              const busy = isCorrection ? correctionActionId === r._id : leaveActionId === r._key;

              return (
                <li key={r._key} className={`rounded-2xl border bg-white dark:bg-[#141518] shadow-sm overflow-hidden ${isCorrection ? 'border-blue-200/70 dark:border-blue-900/40' : 'border-amber-200/70 dark:border-amber-900/40'}`}>
                  {/* Colored top accent bar */}
                  <div className={`h-1 w-full ${isCorrection ? 'bg-gradient-to-r from-blue-500 to-blue-400' : 'bg-gradient-to-r from-amber-500 to-amber-400'}`} />
                  <div className="px-4 py-3">
                    {/* Header row */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full ${isCorrection ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'}`}>
                        {isCorrection ? '⏱ Correction' : '🏥 Leave'}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">{name}</span>
                    </div>
                    {/* Detail */}
                    {isCorrection ? (
                      <>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                          {r.ethiopianWorkDate || r.workDate} · <span className="font-medium">{r.kind === 'wrong_time' ? 'Wrong time' : 'Missing punch'}</span> · {r.punchType} → {formatAddisTime(r.requestedAt)}
                        </p>
                        {r.kind === 'wrong_time' && r.previousAt ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Was: {formatAddisTime(r.previousAt)}</p>
                        ) : null}
                      </>
                    ) : (
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                        {r.ethiopianDate || r.date} · <span className="font-medium">{r.type === 'sick' ? 'Sick day' : 'Day off'}</span>
                      </p>
                    )}
                    {r.note ? <p className="text-xs text-gray-500 dark:text-gray-500 italic mt-1">&ldquo;{r.note}&rdquo;</p> : null}
                    {/* Actions */}
                    <div className="flex gap-2 mt-3">
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => isCorrection ? openReviewModal(r, 'approve') : openLeaveReviewModal(r, 'approve')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                        Approve
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => isCorrection ? openReviewModal(r, 'reject') : openLeaveReviewModal(r, 'reject')}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-white/15 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50 transition"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                        Reject
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        );
      })()}

      {/* ── MANAGE TAB ── */}
      {activeTab === 'manage' && (() => {
        const adminLeaveDayOptions = Array.from({ length: maxEthDaysInMonth(adminLeaveEthYear, adminLeaveEthMonth) }, (_, i) => i + 1);
        const adminLeaveGregDate = toGregorianStringFromEthDate(adminLeaveEthYear, adminLeaveEthMonth, adminLeaveEthDay);
        const holDayOptions = Array.from({ length: maxEthDaysInMonth(holEthYear, holEthMonth) }, (_, i) => i + 1);
        const holGregDate = toGregorianStringFromEthDate(holEthYear, holEthMonth, holEthDay);

        const selectClass = 'rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/20';

        return (
          <div className="space-y-5 pb-8">
            {/* ── Mark Leave ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Mark Leave</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Directly mark an employee sick or day off — no request needed.</p>
              </div>
              <form onSubmit={handleAdminLeave} className="px-4 py-4 space-y-3">
                {/* Employee */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Employee</label>
                  <select
                    required
                    value={adminLeaveEmployee}
                    onChange={(e) => setAdminLeaveEmployee(e.target.value)}
                    className={`w-full ${selectClass}`}
                  >
                    <option value="">Select employee…</option>
                    {[...employees].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`)).map((emp) => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date (Ethiopian calendar)</label>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      required
                      value={adminLeaveEthYear}
                      onChange={(e) => {
                        const y = e.target.value;
                        setAdminLeaveEthYear(y);
                        if (adminLeaveEthDay) setAdminLeaveEthDay(String(Math.min(Number(adminLeaveEthDay), maxEthDaysInMonth(y, adminLeaveEthMonth))));
                      }}
                      className={selectClass}
                    >
                      {MANAGE_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <select
                      required
                      value={adminLeaveEthMonth}
                      onChange={(e) => {
                        const m = e.target.value;
                        setAdminLeaveEthMonth(m);
                        if (adminLeaveEthDay) setAdminLeaveEthDay(String(Math.min(Number(adminLeaveEthDay), maxEthDaysInMonth(adminLeaveEthYear, m))));
                      }}
                      className={selectClass}
                    >
                      <option value="">Month</option>
                      {ETH_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                    <select
                      required
                      value={adminLeaveEthDay}
                      onChange={(e) => setAdminLeaveEthDay(e.target.value)}
                      className={selectClass}
                    >
                      <option value="">Day</option>
                      {adminLeaveDayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  {adminLeaveGregDate && (
                    <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                      {formatWorkDateWeekday(adminLeaveGregDate)} · {formatWorkDateGregorianSmall(adminLeaveGregDate)} (Gregorian)
                    </p>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Type</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ value: 'sick', label: 'Sick day' }, { value: 'day_off', label: 'Day off' }].map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAdminLeaveType(opt.value)}
                        className={`py-2 rounded-xl text-xs font-semibold border transition ${
                          adminLeaveType === opt.value
                            ? 'bg-brand-dark text-white border-brand-dark'
                            : 'border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Note */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                    Note <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={adminLeaveNote}
                    onChange={(e) => setAdminLeaveNote(e.target.value)}
                    placeholder="e.g. Doctor confirmed"
                    maxLength={500}
                    className={`w-full ${selectClass}`}
                  />
                </div>

                <button
                  type="submit"
                  disabled={adminLeaveSubmitting || !adminLeaveEmployee || !adminLeaveGregDate}
                  className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
                >
                  {adminLeaveSubmitting ? 'Saving…' : 'Mark leave'}
                </button>
              </form>
            </div>

            {/* ── Holidays ── */}
            <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Holidays</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Excluded from expected-work calculations.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddHoliday((v) => !v)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                      showAddHoliday
                        ? 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200'
                        : 'text-white bg-brand-dark hover:bg-[#2a3640]'
                    }`}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      {showAddHoliday
                        ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        : <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                      }
                    </svg>
                    {showAddHoliday ? 'Cancel' : 'Add Holiday'}
                  </button>
                </div>
              </div>

              {/* Add holiday form */}
              {showAddHoliday && (
                <form onSubmit={handleCreateHoliday} className="px-4 py-4 space-y-3 border-b border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02]">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Date (Ethiopian calendar)</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select
                        required
                        value={holEthYear}
                        onChange={(e) => {
                          const y = e.target.value;
                          setHolEthYear(y);
                          if (holEthDay) setHolEthDay(String(Math.min(Number(holEthDay), maxEthDaysInMonth(y, holEthMonth))));
                        }}
                        className={selectClass}
                      >
                        {MANAGE_YEAR_OPTIONS.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select
                        required
                        value={holEthMonth}
                        onChange={(e) => {
                          const m = e.target.value;
                          setHolEthMonth(m);
                          if (holEthDay) setHolEthDay(String(Math.min(Number(holEthDay), maxEthDaysInMonth(holEthYear, m))));
                        }}
                        className={selectClass}
                      >
                        <option value="">Month</option>
                        {ETH_MONTHS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <select
                        required
                        value={holEthDay}
                        onChange={(e) => setHolEthDay(e.target.value)}
                        className={selectClass}
                      >
                        <option value="">Day</option>
                        {holDayOptions.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    {holGregDate && (
                      <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                        {formatWorkDateWeekday(holGregDate)} · {formatWorkDateGregorianSmall(holGregDate)} (Gregorian)
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                      Reason <span className="font-normal text-gray-400 dark:text-gray-500">(optional)</span>
                    </label>
                    <input
                      type="text"
                      value={holReason}
                      onChange={(e) => setHolReason(e.target.value)}
                      placeholder="e.g. Ethiopian New Year"
                      maxLength={200}
                      className={`w-full ${selectClass}`}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={holSubmitting || !holGregDate}
                    className="w-full py-2.5 rounded-xl text-sm font-semibold text-white bg-brand-dark hover:bg-[#2a3640] disabled:opacity-50 transition"
                  >
                    {holSubmitting ? 'Adding…' : 'Add Holiday'}
                  </button>
                </form>
              )}

              {/* Holiday list */}
              {holidaysLoading ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 p-4 text-center">Loading…</p>
              ) : holidaysError ? (
                <div className="py-10 px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-red-400 dark:text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Failed to load holidays</p>
                  <button
                    type="button"
                    onClick={loadHolidays}
                    className="mt-2 text-xs text-brand-dark dark:text-brand-light underline hover:no-underline"
                  >
                    Retry
                  </button>
                </div>
              ) : holidaysLoaded && holidays.length === 0 ? (
                <div className="py-10 px-4 text-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">No holidays yet</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Add holidays to exclude them from time tracking.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
                  {holidays.map((h) => (
                    <div key={h.id} className="flex items-center gap-3 px-4 py-3.5">
                      <span className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-violet-100 dark:bg-violet-900/30">
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-violet-600 dark:text-violet-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatEthDateLabel(h.date)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {formatWorkDateWeekday(h.date)} · {formatWorkDateGregorianSmall(h.date)}
                        </p>
                        {h.reason && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate italic">{h.reason}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleDeleteHoliday(h.id)}
                        disabled={deletingHolidayId === h.id}
                        aria-label="Remove holiday"
                        className="w-8 h-8 flex items-center justify-center rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40 transition flex-shrink-0"
                      >
                        {deletingHolidayId === h.id ? (
                          <span className="text-[10px]">…</span>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Modals ── */}
      {reviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{reviewModal.action === 'approve' ? 'Approve correction' : 'Reject correction'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{reviewModal.employeeName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">{reviewModal.summary}</p>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Note (optional)</label>
            <textarea rows={3} value={reviewNote} onChange={(e) => setReviewNote(e.target.value)} placeholder="Add a note…" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 resize-none" />
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setReviewModal(null)} disabled={correctionActionId === reviewModal.id} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleReviewConfirm} disabled={correctionActionId === reviewModal.id} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${reviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {correctionActionId === reviewModal.id ? (reviewModal.action === 'approve' ? 'Approving…' : 'Rejecting…') : (reviewModal.action === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
      {leaveReviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#141518] p-5 shadow-xl">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">{leaveReviewModal.action === 'approve' ? 'Approve leave' : 'Reject leave'}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{leaveReviewModal.employeeName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mb-4">{leaveReviewModal.summary}</p>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 uppercase tracking-wider">Note (optional)</label>
            <textarea rows={3} value={leaveReviewNote} onChange={(e) => setLeaveReviewNote(e.target.value)} placeholder="Add a note…" className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-brand-dark/40 dark:focus:ring-white/30 resize-none" />
            <div className="mt-4 flex gap-2 justify-end">
              <button type="button" onClick={() => setLeaveReviewModal(null)} disabled={leaveActionId === leaveReviewModal.id} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/5 disabled:opacity-50">Cancel</button>
              <button type="button" onClick={handleLeaveReviewConfirm} disabled={leaveActionId === leaveReviewModal.id} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white disabled:opacity-50 ${leaveReviewModal.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}`}>
                {leaveActionId === leaveReviewModal.id ? (leaveReviewModal.action === 'approve' ? 'Approving…' : 'Rejecting…') : (leaveReviewModal.action === 'approve' ? 'Approve' : 'Reject')}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default TimeTeam;
