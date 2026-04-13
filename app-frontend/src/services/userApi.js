import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const API_URL = import.meta.env.VITE_API_URL;

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

export async function signIn(formData) {
  const response = await axios.post(`${API_URL}/users/login`, formData);
  return response.data;
}

export async function getAllUsers() {
  const response = await axios.get(`${API_URL}/users`, { headers: authHeaders() });
  return response.data.data;
}

export async function createUser(data) {
  const response = await axios.post(`${API_URL}/users`, data, { headers: authHeaders() });
  return response.data;
}

export async function updateUser(id, data) {
  const response = await axios.put(`${API_URL}/users/${id}`, data, { headers: authHeaders() });
  return response.data;
}

export async function deleteUser(id) {
  const response = await axios.delete(`${API_URL}/users/${id}`, { headers: authHeaders() });
  return response.data;
}

export async function changePassword(data) {
  const response = await axios.put(`${API_URL}/users/change-password`, data, { headers: authHeaders() });
  return response.data;
}

export async function resetUserPassword(id, password) {
  const response = await axios.put(`${API_URL}/users/${id}/reset-password`, { password }, { headers: authHeaders() });
  return response.data;
}

export async function updateCurrentUser(data) {
  const response = await axios.put(`${API_URL}/users/me`, data, { headers: authHeaders() });
  return response.data;
}

export async function getMe() {
  const response = await axios.get(`${API_URL}/users/me`, { headers: authHeaders() });
  return response.data.data;
}

export async function uploadAvatar(formData) {
  const response = await axios.put(`${API_URL}/users/me/avatar`, formData, {
    headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}
