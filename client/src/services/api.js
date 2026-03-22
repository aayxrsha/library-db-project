import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'
});

const AUTH_KEY = 'library_auth';

export function getStoredAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredAuth(auth) {
  localStorage.setItem(AUTH_KEY, JSON.stringify(auth));
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_KEY);
}

API.interceptors.request.use((config) => {
  const auth = getStoredAuth();
  if (auth?.token) {
    config.headers.Authorization = `Bearer ${auth.token}`;
  }

  return config;
});

export const login = (data) => API.post('/auth/login', data);
export const registerMember = (data) => API.post('/auth/register-member', data);
export const registerAdmin = (data) => API.post('/auth/register-admin', data);
export const fetchMyProfile = () => API.get('/auth/me');

export const fetchMemberBooks = () => API.get('/member/books');
export const createMemberRequest = (data) => API.post('/member/requests', data);
export const fetchMyRequests = () => API.get('/member/requests');
export const fetchMyFines = () => API.get('/member/fines');

export const fetchLibrarianRequests = () => API.get('/librarian/requests');
export const issueLibrarianRequest = (requestId, data) =>
  API.post(`/librarian/requests/${requestId}/issue`, data);
export const rejectLibrarianRequest = (requestId) => API.post(`/librarian/requests/${requestId}/reject`);
export const fetchLibrarianFines = () => API.get('/librarian/fines');
export const createLibrarianFine = (data) => API.post('/librarian/fines', data);

export const issueBook = (data) => API.post('/issues/issue', data);
export const returnBook = (data) => API.post('/issues/return', data);

export const fetchStats = () => API.get('/dashboard/stats');
export const fetchBooks = () => API.get('/books');
export const fetchMembers = () => API.get('/members');
export const fetchMemberDetails = (memberId) => API.get(`/members/${memberId}/details`);
export const fetchIssueHistory = () => API.get('/issues/history');
export const fetchAdminOverview = () => API.get('/admin/overview');

// Aliases used by redesigned pages.
export const getBooks = () => API.get('/books');
export const getMembers = () => API.get('/members');
export const getIssues = () => API.get('/issues/history');
export const addBook = (data) => API.post('/books', data);
export const deleteBook = (bookId) => API.delete(`/books/${bookId}`);
