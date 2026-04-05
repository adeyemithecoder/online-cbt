export const fmt = {
  currency: (n: number) =>
    new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
    }).format(n),

  date: (d: string | Date) =>
    new Date(d).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }),

  datetime: (d: string | Date) =>
    new Date(d).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // ✅ THIS enables 12-hour format
    }),

  number: (n: number) => new Intl.NumberFormat("en-NG").format(n),
};

export const feeStatusColor: Record<string, string> = {
  UNPAID: "red",
  PARTIALLY_PAID: "gold",
  PAID: "green",
};

export const expenseStatusColor: Record<string, string> = {
  PENDING: "gold",
  APPROVED: "green",
  REJECTED: "red",
};

export const journalStatusColor: Record<string, string> = {
  DRAFT: "gray",
  POSTED: "green",
  REVERSED: "red",
};

export const loanStatusColor: Record<string, string> = {
  ACTIVE: "blue",
  PAID: "green",
};

export const accountTypeColor: Record<string, string> = {
  ASSET: "blue",
  LIABILITY: "red",
  EQUITY: "purple",
  REVENUE: "green",
  EXPENSE: "gold",
};

export const ACCOUNT_TYPES = [
  { value: "ASSET", label: "Asset" },
  { value: "LIABILITY", label: "Liability" },
  { value: "EQUITY", label: "Equity" },
  { value: "REVENUE", label: "Revenue" },
  { value: "EXPENSE", label: "Expense" },
];

export const NORMAL_BALANCE = [
  { value: "DEBIT", label: "Debit" },
  { value: "CREDIT", label: "Credit" },
];

export const PAYMENT_METHODS = [
  { value: "CASH", label: "Cash" },
  { value: "BANK_TRANSFER", label: "Bank Transfer" },
  { value: "POS", label: "POS" },
  { value: "ONLINE", label: "Online" },
  { value: "OTHER", label: "Other" },
];

export const TERM_TYPES = [
  { value: "FIRST", label: "First Term" },
  { value: "SECOND", label: "Second Term" },
  { value: "THIRD", label: "Third Term" },
];

export const getErrorMessage = (err: any): string =>
  err?.response?.data?.message || err?.message || "Something went wrong.";
