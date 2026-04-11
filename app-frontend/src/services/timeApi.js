import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

/** Payload for the workshop wall tablet — QR URL and when the code rolls over. */
export async function fetchTimeDisplay() {
  const { data } = await axios.get(`${API_URL}/time/display`, { headers: authHeaders() });
  return data.data;
}

/** Submit scanned code; alternates check-in / check-out for today (Addis day on server). */
export async function postTimePunch(code) {
  const { data } = await axios.post(
    `${API_URL}/time/punch`,
    { code },
    { headers: authHeaders() },
  );
  return data;
}

export async function fetchTeamOverview() {
  const { data } = await axios.get(`${API_URL}/time/team/overview`, { headers: authHeaders() });
  return data.data;
}

export async function fetchEmployeeSummary(employeeId, { year, month } = {}) {
  const params = year && month ? { year, month } : undefined;
  const { data } = await axios.get(`${API_URL}/time/employees/${employeeId}/summary`, {
    headers: authHeaders(),
    params,
  });
  return data.data;
}

export async function createAdminPunch(body) {
  const { data } = await axios.post(`${API_URL}/time/admin/punches`, body, { headers: authHeaders() });
  return data;
}

export async function deleteAdminPunch(id) {
  const { data } = await axios.delete(`${API_URL}/time/admin/punches/${id}`, { headers: authHeaders() });
  return data;
}

export async function fetchMyTodayDetail() {
  const { data } = await axios.get(`${API_URL}/time/me/today`, { headers: authHeaders() });
  return data.data;
}

export async function fetchMyTimeSummary({ year, month } = {}) {
  const params = year && month ? { year, month } : undefined;
  const { data } = await axios.get(`${API_URL}/time/me/summary`, { headers: authHeaders(), params });
  return data.data;
}

export async function fetchCorrectionDateWindow() {
  const { data } = await axios.get(`${API_URL}/time/corrections/window`, { headers: authHeaders() });
  return data.data;
}

export async function fetchMyDayPunches(workDate) {
  const { data } = await axios.get(`${API_URL}/time/me/day`, {
    params: { date: workDate },
    headers: authHeaders(),
  });
  return data.data;
}

export async function createTimeCorrectionRequest(body) {
  const { data } = await axios.post(`${API_URL}/time/corrections`, body, { headers: authHeaders() });
  return data;
}

export async function fetchMyCorrectionRequests() {
  const { data } = await axios.get(`${API_URL}/time/corrections/mine`, { headers: authHeaders() });
  return data.data;
}

export async function fetchPendingCorrectionRequests() {
  const { data } = await axios.get(`${API_URL}/time/corrections/pending`, { headers: authHeaders() });
  return data.data;
}

export async function approveCorrectionRequest(id, reviewNote) {
  const { data } = await axios.patch(
    `${API_URL}/time/corrections/${id}/approve`,
    reviewNote != null ? { reviewNote } : {},
    { headers: authHeaders() },
  );
  return data;
}

export async function rejectCorrectionRequest(id, reviewNote) {
  const { data } = await axios.patch(
    `${API_URL}/time/corrections/${id}/reject`,
    reviewNote != null ? { reviewNote } : {},
    { headers: authHeaders() },
  );
  return data;
}

export async function fetchEmployeeProfile(employeeId) {
  const { data } = await axios.get(`${API_URL}/time/employees/${employeeId}/profile`, { headers: authHeaders() });
  return data.data;
}
