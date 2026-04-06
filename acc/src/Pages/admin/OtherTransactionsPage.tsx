import { useEffect, useState } from "react";
import { Receipt, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
// import { otherTransactionsApi, accountsApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Input,
  Select,
  Modal,
  Badge,
  Loader,
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  EmptyState,
  SearchInput,
  StatCard,
  Textarea,
  Tabs,
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";
import { accountsApi, otherTransactionsApi } from "../../api/client";

const TYPE_OPTIONS = [
  { value: "INCOME", label: "Income — money coming in" },
  { value: "EXPENSE", label: "Expense — money going out" },
];

const typeTabs = [
  { value: "ALL", label: "All" },
  { value: "INCOME", label: "Income" },
  { value: "EXPENSE", label: "Expense" },
];

const emptyForm = {
  type: "",
  accountId: "",
  cashAccountId: "",
  amount: "",
  date: new Date().toISOString().split("T")[0],
  description: "",
  reference: "",
};

export default function OtherTransactionsPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;
  const toast = useToast();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [form, setForm] = useState(emptyForm);

  // Cash/asset accounts for the cash side
  const cashAccounts = accounts
    .filter((a) => a.accountType === "ASSET" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  // Income accounts when type is INCOME, expense accounts when EXPENSE
  const targetAccounts = accounts
    .filter((a) => {
      if (!form.type) return false;
      return form.type === "INCOME"
        ? a.accountType === "REVENUE" && a.isActive
        : a.accountType === "EXPENSE" && a.isActive;
    })
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [tRes, aRes] = await Promise.all([
        otherTransactionsApi.getAll(schoolId, currentSessionId || undefined),
        accountsApi.getAll(schoolId),
      ]);
      setTransactions(tRes.data);
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
      !form.type ||
      !form.accountId ||
      !form.cashAccountId ||
      !form.amount ||
      !form.date ||
      !form.description
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await otherTransactionsApi.create({
        ...form,
        amount: parseFloat(form.amount),
        sessionId: currentSessionId,
        schoolId,
        createdById: userId,
      });
      toast.success("Transaction recorded successfully.");
      setModal(false);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  // Detect if a transaction is income or expense from its lines
  const getTransactionType = (t: any) => {
    const debitLine = t.lines?.find((l: any) => l.entryType === "DEBIT");
    if (!debitLine) return "UNKNOWN";
    const accountType = debitLine.Account?.accountType;
    return accountType === "ASSET" ? "INCOME" : "EXPENSE";
  };

  const getAmount = (t: any) => {
    const line = t.lines?.[0];
    return line?.amount || 0;
  };

  const filtered = transactions.filter((t) => {
    const txType = getTransactionType(t);
    const matchType = typeFilter === "ALL" || txType === typeFilter;
    const matchSearch =
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      t.entryNumber.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIncome = transactions
    .filter((t) => getTransactionType(t) === "INCOME")
    .reduce((s, t) => s + getAmount(t), 0);

  const totalExpense = transactions
    .filter((t) => getTransactionType(t) === "EXPENSE")
    .reduce((s, t) => s + getAmount(t), 0);

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Other Transactions"
        subtitle="Record miscellaneous income and expenses"
        icon={<Receipt size={20} />}
        action={
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setForm(emptyForm);
              setModal(true);
            }}
          >
            <span className="hidden sm:inline">Record Transaction</span>
            <span className="sm:hidden">Record</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Total Income"
          value={fmt.currency(totalIncome)}
          icon={<Receipt size={18} />}
          accent
        />
        <StatCard
          label="Total Expense"
          value={fmt.currency(totalExpense)}
          icon={<Receipt size={18} />}
        />
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Transactions"
          value={transactions.length}
          icon={<Receipt size={18} />}
          sub="This session"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 sm:mb-4">
        <Tabs tabs={typeTabs} active={typeFilter} onChange={setTypeFilter} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search transactions..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Receipt size={40} />}
            title="No transactions yet"
            description="Record miscellaneous income or expenses that don't fall under fees, loans or donations."
            action={
              <Button onClick={() => setModal(true)}>Record Transaction</Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Entry #</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th>Description</Th>
                <Th className="hidden md:table-cell">Account</Th>
                <Th>Type</Th>
                <Th className="text-right">Amount</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => {
                const txType = getTransactionType(t);
                const targetLine = t.lines?.find((l: any) =>
                  txType === "INCOME"
                    ? l.entryType === "CREDIT"
                    : l.entryType === "DEBIT",
                );
                return (
                  <Tr key={t.id}>
                    <Td>
                      <span className="font-mono text-[12px] text-primary">
                        {t.entryNumber}
                      </span>
                    </Td>
                    <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                      {fmt.date(t.date)}
                    </Td>
                    <Td>
                      <p className="m-0 font-medium text-white text-[13px] truncate max-w-[160px] sm:max-w-[280px]">
                        {t.description}
                      </p>
                      {t.reference && (
                        <p className="m-0 text-[11px] text-light">
                          Ref: {t.reference}
                        </p>
                      )}
                    </Td>
                    <Td className="text-light hidden md:table-cell">
                      {targetLine?.Account?.name || "—"}
                    </Td>
                    <Td>
                      <Badge
                        variant={txType === "INCOME" ? "success" : "danger"}
                        dot
                      >
                        {txType}
                      </Badge>
                    </Td>
                    <Td className="text-right font-semibold whitespace-nowrap">
                      <span
                        className={
                          txType === "INCOME" ? "text-success" : "text-danger"
                        }
                      >
                        {fmt.currency(getAmount(t))}
                      </span>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Record Transaction Modal */}
      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Record Transaction"
        size="lg"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          {/* Type selector as big toggle */}
          <div className="grid grid-cols-2 gap-3">
            {TYPE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() =>
                  setForm({ ...form, type: opt.value, accountId: "" })
                }
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                  form.type === opt.value
                    ? opt.value === "INCOME"
                      ? "border-success bg-success/10 text-success"
                      : "border-danger bg-danger/10 text-danger"
                    : "border-bg-deep bg-bg text-light hover:border-primary-variant"
                }`}
              >
                <p className="m-0 text-[13px] font-semibold">
                  {opt.value === "INCOME" ? "₦ Income" : "₦ Expense"}
                </p>
                <p className="m-0 text-[11px] opacity-80 mt-0.5">
                  {opt.value === "INCOME"
                    ? "Money coming in"
                    : "Money going out"}
                </p>
              </button>
            ))}
          </div>

          {form.type && (
            <>
              <Select
                label={
                  form.type === "INCOME" ? "Income Account" : "Expense Account"
                }
                options={targetAccounts}
                value={form.accountId}
                onChange={(e) =>
                  setForm({ ...form, accountId: e.target.value })
                }
                placeholder={
                  form.type === "INCOME"
                    ? "Select income account..."
                    : "Select expense account..."
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
                placeholder="Where is the money coming from or going to..."
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
                  label="Date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <Textarea
                label="Description"
                placeholder="Describe this transaction e.g. Sale of old chairs, Government grant..."
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                required
              />

              <Input
                label="Reference"
                placeholder="Optional — invoice, receipt number..."
                value={form.reference}
                onChange={(e) =>
                  setForm({ ...form, reference: e.target.value })
                }
              />
            </>
          )}

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleCreate}
              className="flex-1"
              disabled={!form.type}
            >
              Record Transaction
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
