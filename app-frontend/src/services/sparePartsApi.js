import axios from 'axios';
import { getToken } from '../utils/tokenUtils';

const BASE_URL = `${import.meta.env.VITE_API_URL}/spare-parts`;

const authHeaders = () => ({
  headers: { Authorization: `Bearer ${getToken()}` },
});

export const getParts = (params = {}) =>
  axios.get(BASE_URL, { ...authHeaders(), params });

export const createPart = (data) =>
  axios.post(BASE_URL, data, authHeaders());

export const updatePart = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data, authHeaders());

export const deletePart = (id) =>
  axios.delete(`${BASE_URL}/${id}`, authHeaders());

export const getActivity = (params = {}) =>
  axios.get(`${BASE_URL}/activity`, { ...authHeaders(), params });

export const getCompatibilityOptions = () =>
  axios.get(`${BASE_URL}/compatibility-options`, authHeaders());
