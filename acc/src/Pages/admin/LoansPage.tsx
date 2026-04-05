import { useEffect, useState } from "react";
import { Landmark, Plus, CheckCircle } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { loansApi, accountsApi } from "../../api/client";
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
  StatCard,
  ConfirmDialog,
} from "../../components";
import { fmt, loanStatusColor, getErrorMessage } from "../../utils/helpers";

export default function LoansPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;
  const toast = useToast();
  const [loans, setLoans] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirm, setConfirm] = useState<string | null>(null);

  const [form, setForm] = useState({
    amount: "",
    lender: "",
    description: "",
    dateReceived: new Date().toISOString().split("T")[0],
    repaymentDate: "",
    liabilityAccountId: "",
    cashAccountId: "",
  });

  const liabilityAccounts = accounts
    .filter((a) => a.accountType === "LIABILITY" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));
  const cashAccounts = accounts
    .filter((a) => a.accountType === "ASSET" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [lRes, aRes] = await Promise.all([
        loansApi.getAll(schoolId, { sessionId: currentSessionId || undefined }),
        accountsApi.getAll(schoolId),
      ]);
      setLoans(lRes.data);
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

  const handleRecord = async () => {
    if (
      !form.amount ||
      !form.lender ||
      !form.dateReceived ||
      !form.liabilityAccountId ||
      !form.cashAccountId
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await loansApi.record({
        ...form,
        amount: parseFloat(form.amount),
        sessionId: currentSessionId,
        schoolId,
        createdById: userId,
      });
      toast.success("Loan recorded and journal entry created.");
      setModal(false);
      setForm({
        amount: "",
        lender: "",
        description: "",
        dateReceived: new Date().toISOString().split("T")[0],
        repaymentDate: "",
        liabilityAccountId: "",
        cashAccountId: "",
      });
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleMarkPaid = async () => {
    if (!confirm) return;
    setSaving(true);
    try {
      await loansApi.markPaid(confirm);
      toast.success("Loan marked as paid.");
      setConfirm(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const activeLoans = loans.filter((l) => l.status === "ACTIVE");
  const totalActive = activeLoans.reduce((s, l) => s + l.amount, 0);

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Loans"
        subtitle="Track borrowed funds and liabilities"
        icon={<Landmark size={20} />}
        action={
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal(true)}>
            <span className="hidden sm:inline">Record Loan</span>
            <span className="sm:hidden">Record</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Active Loans"
          value={activeLoans.length}
          icon={<Landmark size={18} />}
          accent
          className="col-span-2 sm:col-span-1"
        />
        <StatCard
          label="Total Outstanding"
          value={fmt.currency(totalActive)}
          icon={<Landmark size={18} />}
        />
        <StatCard
          label="Total Loans"
          value={loans.length}
          icon={<Landmark size={18} />}
          sub="All time"
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : loans.length === 0 ? (
          <EmptyState
            icon={<Landmark size={40} />}
            title="No loans recorded"
            action={<Button onClick={() => setModal(true)}>Record Loan</Button>}
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Lender</Th>
                <Th>Amount</Th>
                <Th className="hidden sm:table-cell">Date Received</Th>
                <Th className="hidden md:table-cell">Repayment Date</Th>
                <Th className="hidden lg:table-cell">Liability Account</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {loans.map((l) => {
                const statusVariant: any =
                  loanStatusColor[l.status] === "success" ? "success" : "info";

                return (
                  <Tr key={l.id}>
                    <Td>
                      <p className="m-0 font-semibold text-white text-[13px]">
                        {l.lender}
                      </p>
                      {l.description && (
                        <p className="m-0 text-[11px] text-light hidden sm:block">
                          {l.description}
                        </p>
                      )}
                      <p className="m-0 text-[11px] text-light sm:hidden">
                        {fmt.date(l.dateReceived)}
                        {l.repaymentDate
                          ? ` → ${fmt.date(l.repaymentDate)}`
                          : ""}
                      </p>
                    </Td>

                    <Td>
                      <span className="font-bold text-warning whitespace-nowrap">
                        {fmt.currency(l.amount)}
                      </span>
                    </Td>

                    <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                      {fmt.date(l.dateReceived)}
                    </Td>

                    <Td className="text-light hidden md:table-cell whitespace-nowrap">
                      {l.repaymentDate ? fmt.date(l.repaymentDate) : "—"}
                    </Td>

                    <Td className="text-light hidden lg:table-cell">
                      {l.LiabilityAccount?.name}
                    </Td>

                    <Td>
                      <Badge variant={statusVariant} dot>
                        {l.status}
                      </Badge>
                    </Td>

                    <Td>
                      {l.status === "ACTIVE" && (
                        <Button
                          variant="success"
                          size="sm"
                          leftIcon={<CheckCircle size={13} />}
                          onClick={() => setConfirm(l.id)}
                        >
                          <span className="hidden sm:inline">Mark Paid</span>
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Record Loan Received"
        size="lg"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Lender Name"
              placeholder="Bank or individual..."
              value={form.lender}
              onChange={(e) => setForm({ ...form, lender: e.target.value })}
              required
            />
            <Input
              label="Amount (₦)"
              type="number"
              placeholder="0.00"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Date Received"
              type="date"
              value={form.dateReceived}
              onChange={(e) =>
                setForm({ ...form, dateReceived: e.target.value })
              }
              required
            />
            <Input
              label="Repayment Date"
              type="date"
              value={form.repaymentDate}
              onChange={(e) =>
                setForm({ ...form, repaymentDate: e.target.value })
              }
            />
          </div>

          <Select
            label="Cash / Bank Account (Debit)"
            options={cashAccounts}
            value={form.cashAccountId}
            onChange={(e) =>
              setForm({ ...form, cashAccountId: e.target.value })
            }
            placeholder="Where the money was received..."
            required
          />

          <Select
            label="Loan Liability Account (Credit)"
            options={liabilityAccounts}
            value={form.liabilityAccountId}
            onChange={(e) =>
              setForm({ ...form, liabilityAccountId: e.target.value })
            }
            placeholder="Select liability account..."
            required
          />

          <Textarea
            label="Description"
            placeholder="Optional notes..."
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
            <Button loading={saving} onClick={handleRecord} className="flex-1">
              Record Loan
            </Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        title="Mark Loan as Paid"
        message="Are you sure this loan has been fully repaid? This action cannot be undone."
        confirmLabel="Mark as Paid"
        variant="primary"
        loading={saving}
        onConfirm={handleMarkPaid}
        onCancel={() => setConfirm(null)}
      />
    </div>
  );
}
