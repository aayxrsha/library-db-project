import api from './api';

// ── Books ────────────────────────────────────────────────
export const bookService = {
  getAll:    (search = '') => api.get(`/books${search ? `?search=${search}` : ''}`),
  getById:   (id)          => api.get(`/books/${id}`),
  create:    (data)        => api.post('/books', data),
  update:    (id, data)    => api.put(`/books/${id}`, data),
  remove:    (id)          => api.delete(`/books/${id}`),
};

// ── Members ──────────────────────────────────────────────
export const memberService = {
  getAll:       ()    => api.get('/members'),
  getById:      (id)  => api.get(`/members/${id}`),
  getIssues:    (id)  => api.get(`/members/${id}/issues`),
  create:       (data) => api.post('/members', data),
  update:       (id, data) => api.put(`/members/${id}`, data),
  remove:       (id)  => api.delete(`/members/${id}`),
};

// ── Issues ───────────────────────────────────────────────
export const issueService = {
  getAll:     ()   => api.get('/issues'),
  getOverdue: ()   => api.get('/issues/overdue'),
  create:     (data) => api.post('/issues', data),
  returnBook: (id) => api.patch(`/issues/${id}/return`),
  getRequests: (params = {}) => api.get('/issues/requests', { params }),
  requestBook: (Book_Id) => api.post('/issues/requests', { Book_Id }),
  approveRequest: (id, payload) => api.patch(`/issues/requests/${id}/approve`, payload),
  rejectRequest: (id, payload) => api.patch(`/issues/requests/${id}/reject`, payload),
};

// ── Fines ────────────────────────────────────────────────
export const fineService = {
  getAll:       ()         => api.get('/fines'),
  getUnpaid:    ()         => api.get('/fines/unpaid'),
  getByMember:  (memberId) => api.get(`/fines/member/${memberId}`),
  create:       (data)     => api.post('/fines', data),
  markPaid:     (id)       => api.patch(`/fines/${id}/pay`),
};

// ── Auth ─────────────────────────────────────────────────
export const authService = {
  login: (credentials) => api.post('/auth/login', credentials),
  memberLogin: (credentials) => api.post('/auth/member-login', credentials),
  memberRegister: (payload) => api.post('/auth/member-register', payload),
};

// ── Employees ───────────────────────────────────────────────
export const employeeService = {
  getAll: () => api.get('/employees'),
  getById: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  remove: (id) => api.delete(`/employees/${id}`),
};

// ── Authors ───────────────────────────────────────────────
export const authorService = {
  getAll: () => api.get('/authors'),
  create: (data) => api.post('/authors', data),
  remove: (id) => api.delete(`/authors/${id}`),
};
