import axios from "axios";

const apiUrl =
  import.meta.env.MODE == "development"
    ? "http://localhost:5000/api/accounting"
    : "https://cbt-api-rho.vercel.app/api/accounting";

const api = axios.create({
  baseURL: apiUrl || "http://localhost:5000/api/accounting",
  headers: { "Content-Type": "application/json" },
});

// ✅ Attach token automatically to every request
api.interceptors.request.use(
  (config) => {
    const stored = localStorage.getItem("accountingAuth");
    const token = stored ? JSON.parse(stored).token : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ─── Sessions ──────────────────────────────────────────────────────────────
export const sessionsApi = {
  create: (data: any) => api.post("/sessions", data),
  getAll: (schoolId: string) => api.get(`/sessions/school/${schoolId}`),
  getCurrent: (schoolId: string) => api.get(`/sessions/current/${schoolId}`),
  setCurrent: (id: string, schoolId: string) =>
    api.put(`/sessions/${id}/set-current`, { schoolId }),
  lock: (id: string) => api.put(`/sessions/${id}/lock`),
  unlock: (id: string) => api.put(`/sessions/${id}/unlock`),
};

// ─── Chart of Accounts ────────────────────────────────────────────────────
export const accountsApi = {
  create: (data: any) => api.post("/accounts", data),
  update: (id: string, data: any) => api.put(`/accounts/${id}`, data),
  toggleStatus: (id: string) => api.put(`/accounts/${id}/toggle-status`),
  getAll: (schoolId: string) => api.get(`/accounts/school/${schoolId}`),
  getByType: (schoolId: string, accountType: string) =>
    api.get(`/accounts/school/${schoolId}/type/${accountType}`),
};

// ─── Journal Entries ──────────────────────────────────────────────────────
export const journalApi = {
  create: (data: any) => api.post("/journal", data),
  addLines: (id: string, lines: any[]) =>
    api.post(`/journal/${id}/lines`, { lines }),
  post: (id: string) => api.put(`/journal/${id}/post`),
  reverse: (id: string, data: any) => api.post(`/journal/${id}/reverse`, data),
  getAll: (schoolId: string, params?: any) =>
    api.get(`/journal/school/${schoolId}`, { params }),
  getOne: (id: string) => api.get(`/journal/${id}`),
  generateClosingEntry: (schoolId: string, sessionId: string) =>
    api.get(`/journal/closing-entry/${schoolId}`, { params: { sessionId } }),
};

// ─── Fee Structures ───────────────────────────────────────────────────────
export const feeStructuresApi = {
  create: (data: any) => api.post("/fees/structures", data),
  update: (id: string, data: any) => api.put(`/fees/structures/${id}`, data),
  toggleStatus: (id: string) => api.put(`/fees/structures/${id}/toggle-status`),
  getAll: (schoolId: string, sessionId?: string) =>
    api.get(`/fees/structures/school/${schoolId}`, {
      params: sessionId ? { sessionId } : {},
    }),
  getByLevel: (schoolId: string, level: string, sessionId?: string) =>
    api.get(`/fees/structures/school/${schoolId}/level/${level}`, {
      params: sessionId ? { sessionId } : {},
    }),
};

// ─── Student Fees ─────────────────────────────────────────────────────────
export const studentFeesApi = {
  assign: (data: any) => api.post("/fees/student-fees", data),
  bulkAssign: (data: any) => api.post("/fees/student-fees/bulk-assign", data),
  getForStudent: (studentId: string, sessionId?: string) =>
    api.get(`/fees/student-fees/student/${studentId}`, {
      params: sessionId ? { sessionId } : {},
    }),
  getOutstanding: (schoolId: string, sessionId?: string) =>
    api.get(`/fees/student-fees/outstanding/${schoolId}`, {
      params: sessionId ? { sessionId } : {},
    }),
  remove: (id: string) => api.delete(`/fees/student-fees/${id}`),
};

// ─── Students ─────────────────────────────────────────────────────────────
// ─── Add to client.ts — replace the existing studentsApi block ───────────────

export const studentsApi = {
  getAll: (schoolId: string, level?: string) =>
    api.get(`/fees/students/school/${schoolId}`, {
      params: level ? { level } : {},
    }),

  create: (data: {
    name: string;
    surname: string;
    username: string;
    password: string;
    level: string;
    schoolId: string;
  }) => api.post("/fees/students", data),

  update: (
    id: string,
    data: {
      name?: string;
      surname?: string;
      level?: string;
      password?: string;
    },
  ) => api.put(`/fees/students/${id}`, data),

  delete: (id: string) => api.delete(`/fees/students/${id}`),

  search: (schoolId: string, q: string) =>
    api.get("/fees/students/search", { params: { schoolId, q } }),
};

// ─── Payments ─────────────────────────────────────────────────────────────
export const paymentsApi = {
  record: (data: any) => api.post("/payments", data),
  getAll: (schoolId: string, sessionId?: string) =>
    api.get(`/payments/school/${schoolId}`, {
      params: sessionId ? { sessionId } : {},
    }),
  getByStudent: (studentId: string, sessionId?: string) =>
    api.get(`/payments/student/${studentId}`, {
      params: sessionId ? { sessionId } : {},
    }),
  getBySession: (sessionId: string) =>
    api.get(`/payments/session/${sessionId}`),
};

// ─── Expenses ─────────────────────────────────────────────────────────────
export const expensesApi = {
  create: (data: any) => api.post("/expenses", data),
  approve: (id: string, approvedById: string) =>
    api.put(`/expenses/${id}/approve`, { approvedById }),
  reject: (id: string, approvedById: string) =>
    api.put(`/expenses/${id}/reject`, { approvedById }),
  getAll: (schoolId: string, params?: any) =>
    api.get(`/expenses/school/${schoolId}`, { params }),
};

// ─── Loans ────────────────────────────────────────────────────────────────
export const loansApi = {
  record: (data: any) => api.post("/loans-donations/loans", data),
  markPaid: (id: string) => api.put(`/loans-donations/loans/${id}/mark-paid`),
  getAll: (schoolId: string, params?: any) =>
    api.get(`/loans-donations/loans/school/${schoolId}`, { params }),
};

// ─── Donations ────────────────────────────────────────────────────────────
export const donationsApi = {
  record: (data: any) => api.post("/loans-donations/donations", data),
  getAll: (schoolId: string, sessionId?: string) =>
    api.get(`/loans-donations/donations/school/${schoolId}`, {
      params: sessionId ? { sessionId } : {},
    }),
};

export const otherTransactionsApi = {
  create: (data: any) => api.post("/other-transactions", data),
  getAll: (schoolId: string, sessionId?: string) =>
    api.get(`/other-transactions/school/${schoolId}`, {
      params: sessionId ? { sessionId } : {},
    }),
};
// ─── Audit ────────────────────────────────────────────────────────────────
export const auditApi = {
  getByEntity: (entity: string, entityId: string) =>
    api.get(`/audit/entity/${entity}/${entityId}`),
  getByUser: (userId: string, schoolId?: string) =>
    api.get(`/audit/user/${userId}`, {
      params: schoolId ? { schoolId } : {},
    }),
  getBySchool: (schoolId: string, params?: any) =>
    api.get(`/audit/school/${schoolId}`, { params }),
};

// ─── Reports ─────────────────────────────────────────────────────────────
export const reportsApi = {
  ledger: (accountId: string, sessionId: string, schoolId: string) =>
    api.get(`/reports/ledger/${accountId}`, {
      params: { sessionId, schoolId },
    }),
  trialBalance: (schoolId: string, sessionId: string) =>
    api.get(`/reports/trial-balance/${schoolId}`, { params: { sessionId } }),
  balanceSheet: (schoolId: string, sessionId: string) =>
    api.get(`/reports/balance-sheet/${schoolId}`, { params: { sessionId } }),
  incomeStatement: (schoolId: string, sessionId: string) =>
    api.get(`/reports/income-statement/${schoolId}`, {
      params: { sessionId },
    }),
};

export const superAdminApi = {
  getSchools: () => api.get("/super-admin/schools"),
  getSchool: (id: string) => api.get(`/super-admin/schools/${id}`),
  createSchool: (data: any) => api.post("/super-admin/schools", data),
  updateSchool: (id: string, data: any) =>
    api.put(`/super-admin/schools/${id}`, data),
  deleteSchool: (id: string) => api.delete(`/super-admin/schools/${id}`),
  createAdmin: (schoolId: string, data: any) =>
    api.post(`/super-admin/schools/${schoolId}/admins`, data),
};

export default api;
