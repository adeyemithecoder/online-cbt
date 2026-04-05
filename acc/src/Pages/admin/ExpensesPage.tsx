import { useEffect, useState } from "react";
import { TrendingDown, Plus, CheckCircle, XCircle, Filter } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { expensesApi, accountsApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Loader,
  Textarea,
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  EmptyState,
  SearchInput,
  Tabs,
  StatCard,
  ConfirmDialog,
} from "../../components";
import {
  fmt,
  PAYMENT_METHODS,
  expenseStatusColor,
  getErrorMessage,
} from "../../utils/helpers";

const statusTabs = [
  { value: "ALL", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "APPROVED", label: "Approved" },
  { value: "REJECTED", label: "Rejected" },
];

const emptyForm = {
  title: "",
  description: "",
  amount: "",
  expenseDate: new Date().toISOString().split("T")[0],
  paymentMethod: "",
  vendor: "",
  invoiceNumber: "",
  receiptUrl: "",
  expenseAccountId: "",
  cashAccountId: "",
};

export default function ExpensesPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;
  const toast = useToast();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [confirm, setConfirm] = useState<{
    type: "approve" | "reject";
    id: string;
  } | null>(null);

  const expenseAccounts = accounts
    .filter((a) => a.accountType === "EXPENSE" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const cashAccounts = accounts
    .filter((a) => a.accountType === "ASSET" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [eRes, aRes] = await Promise.all([
        expensesApi.getAll(schoolId, {
          sessionId: currentSessionId || undefined,
        }),
        accountsApi.getAll(schoolId),
      ]);
      setExpenses(eRes.data);
      setAccounts(aRes.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId, currentSessionId]);

  const handleCreate = async () => {
    if (
      !form.title ||
      !form.amount ||
      !form.expenseAccountId ||
      !form.cashAccountId ||
      !form.paymentMethod
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await expensesApi.create({
        ...form,
        amount: parseFloat(form.amount),
        sessionId: currentSessionId,
        schoolId,
        createdById: userId,
      });
      toast.success("Expense created. Pending approval.");
      setModal(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      await expensesApi.approve(confirm.id, userId);
      toast.success("Expense approved. Journal entry created.");
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleReject = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      await expensesApi.reject(confirm.id, userId);
      toast.success("Expense rejected.");
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const filtered = expenses.filter((e) => {
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchSearch =
      !search ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      (e.vendor || "").toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const totals = {
    pending: expenses
      .filter((e) => e.status === "PENDING")
      .reduce((s, e) => s + e.amount, 0),
    approved: expenses
      .filter((e) => e.status === "APPROVED")
      .reduce((s, e) => s + e.amount, 0),
    total: expenses.reduce((s, e) => s + e.amount, 0),
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Expenses"
        subtitle="Track and approve school expenditures"
        icon={<TrendingDown size={20} />}
        action={
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setForm(emptyForm);
              setModal(true);
            }}
          >
            <span className="hidden sm:inline">New Expense</span>
            <span className="sm:hidden">New</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Total Approved"
          value={fmt.currency(totals.approved)}
          icon={<CheckCircle size={18} />}
          accent
          className="col-span-2 sm:col-span-1"
        />
        <StatCard
          label="Pending Approval"
          value={fmt.currency(totals.pending)}
          icon={<TrendingDown size={18} />}
          sub={`${expenses.filter((e) => e.status === "PENDING").length} expenses`}
        />
        <StatCard
          label="Total Expenses"
          value={fmt.currency(totals.total)}
          icon={<Filter size={18} />}
          sub="All statuses"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
        <Tabs
          tabs={statusTabs}
          active={statusFilter}
          onChange={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search expenses..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<TrendingDown size={40} />}
            title="No expenses found"
            action={<Button onClick={() => setModal(true)}>New Expense</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Title</Th>
                <Th className="hidden md:table-cell">Vendor</Th>
                <Th>Amount</Th>
                <Th className="hidden md:table-cell">Method</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const sv: any =
                  expenseStatusColor[e.status] === "green"
                    ? "green"
                    : expenseStatusColor[e.status] === "red"
                      ? "red"
                      : "warning";
                return (
                  <Tr key={e.id}>
                    <Td>
                      <p className="m-0 font-semibold text-white text-[13px]">
                        {e.title}
                      </p>
                      {e.description && (
                        <p className="m-0 text-[11px] text-light hidden sm:block">
                          {e.description}
                        </p>
                      )}
                      <p className="m-0 text-[11px] text-light sm:hidden">
                        {fmt.date(e.expenseDate)}
                        {e.vendor ? ` · ${e.vendor}` : ""}
                      </p>
                    </Td>
                    <Td className="text-light hidden md:table-cell">
                      {e.vendor || "—"}
                    </Td>
                    <Td>
                      <span className="font-bold text-danger whitespace-nowrap">
                        {fmt.currency(e.amount)}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Badge variant="info">{e.paymentMethod}</Badge>
                    </Td>
                    <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                      {fmt.date(e.expenseDate)}
                    </Td>
                    <Td>
                      <Badge variant={sv} dot>
                        {e.status}
                      </Badge>
                    </Td>
                    <Td>
                      {e.status === "PENDING" && (
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<CheckCircle size={13} />}
                            onClick={() =>
                              setConfirm({ type: "approve", id: e.id })
                            }
                          >
                            <span className="hidden sm:inline">Approve</span>
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<XCircle size={13} />}
                            onClick={() =>
                              setConfirm({ type: "reject", id: e.id })
                            }
                          >
                            <span className="hidden sm:inline">Reject</span>
                          </Button>
                        </div>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Create Expense Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="New Expense"
        size="lg"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Title"
            placeholder="e.g. Generator Fuel"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Amount (₦)"
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
            <Input
              label="Expense Date"
              type="date"
              value={form.expenseDate}
              onChange={(e) =>
                setForm({ ...form, expenseDate: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Expense Account"
              options={expenseAccounts}
              value={form.expenseAccountId}
              onChange={(e) =>
                setForm({ ...form, expenseAccountId: e.target.value })
              }
              required
            />
            <Select
              label="Cash / Bank Account"
              options={cashAccounts}
              value={form.cashAccountId}
              onChange={(e) =>
                setForm({ ...form, cashAccountId: e.target.value })
              }
              required
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Select
              label="Payment Method"
              options={PAYMENT_METHODS}
              value={form.paymentMethod}
              onChange={(e) =>
                setForm({ ...form, paymentMethod: e.target.value })
              }
              required
            />
            <Input
              label="Vendor"
              placeholder="Supplier name..."
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Invoice Number"
              placeholder="Optional..."
              value={form.invoiceNumber}
              onChange={(e) =>
                setForm({ ...form, invoiceNumber: e.target.value })
              }
            />
            <Input
              label="Receipt URL"
              placeholder="Optional link..."
              value={form.receiptUrl}
              onChange={(e) => setForm({ ...form, receiptUrl: e.target.value })}
            />
          </div>
          <Textarea
            label="Description"
            placeholder="Additional details..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate} className="flex-1">
              Submit Expense
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={confirm?.type === "approve"}
        title="Approve Expense"
        message="This will approve the expense and automatically create a journal entry. This cannot be undone."
        confirmLabel="Approve"
        variant="primary"
        loading={saving}
        onConfirm={handleApprove}
        onCancel={() => setConfirm(null)}
      />
      <ConfirmDialog
        open={confirm?.type === "reject"}
        title="Reject Expense"
        message="Are you sure you want to reject this expense?"
        confirmLabel="Reject"
        variant="danger"
        loading={saving}
        onConfirm={handleReject}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
