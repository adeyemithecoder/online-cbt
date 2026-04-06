import { useEffect, useState } from "react";
import { Gift, Plus } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { donationsApi, accountsApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Input,
  Select,
  Modal,
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
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";

export default function DonationsPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;

  const toast = useToast();
  const [donations, setDonations] = useState<any[]>([]);
  const [totalDonated, setTotalDonated] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    donorName: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    revenueAccountId: "",
    cashAccountId: "",
  });

  const revenueAccounts = accounts
    .filter((a) => a.accountType === "REVENUE" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));
  const cashAccounts = accounts
    .filter((a) => a.accountType === "ASSET" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [dRes, aRes] = await Promise.all([
        donationsApi.getAll(schoolId, currentSessionId || undefined),
        accountsApi.getAll(schoolId),
      ]);
      setDonations(dRes.data.donations || []);
      setTotalDonated(dRes.data.totalDonated || 0);
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
      !form.date ||
      !form.revenueAccountId ||
      !form.cashAccountId
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await donationsApi.record({
        ...form,
        amount: parseFloat(form.amount),
        sessionId: currentSessionId,
        schoolId,
        createdById: userId,
      });
      toast.success("Donation recorded and journal entry created.");
      setModal(false);
      setForm({
        donorName: "",
        amount: "",
        description: "",
        date: new Date().toISOString().split("T")[0],
        revenueAccountId: "",
        cashAccountId: "",
      });
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Donations"
        subtitle="Record and track school donations"
        icon={<Gift size={20} />}
        action={
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal(true)}>
            <span className="hidden sm:inline">Record Donation</span>
            <span className="sm:hidden">Record</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Total Donations"
          value={donations.length}
          icon={<Gift size={18} />}
        />
        <StatCard
          label="Total Donated"
          value={fmt.currency(totalDonated)}
          icon={<Gift size={18} />}
          accent
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : donations.length === 0 ? (
          <EmptyState
            icon={<Gift size={40} />}
            title="No donations recorded"
            action={
              <Button onClick={() => setModal(true)}>Record Donation</Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Donor</Th>
                <Th>Amount</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th className="hidden md:table-cell">Revenue Account</Th>
                <Th className="hidden md:table-cell">Cash Account</Th>
                <Th className="hidden lg:table-cell">Description</Th>
              </tr>
            </thead>
            <tbody>
              {donations.map((d) => (
                <Tr key={d.id}>
                  <Td>
                    <p className="m-0 font-semibold text-white text-[13px]">
                      {d.donorName || "Anonymous"}
                    </p>
                    <p className="m-0 text-[11px] text-light sm:hidden">
                      {fmt.date(d.date)}
                    </p>
                  </Td>
                  <Td>
                    <span className="font-bold text-[var(--color-success)] whitespace-nowrap">
                      {fmt.currency(d.amount)}
                    </span>
                  </Td>
                  <Td className="text-[var(--color-light)] hidden sm:table-cell whitespace-nowrap">
                    {fmt.date(d.date)}
                  </Td>
                  <Td className="text-[var(--color-light)] hidden md:table-cell">
                    {d.RevenueAccount?.name}
                  </Td>
                  <Td className="text-[var(--color-light)] hidden md:table-cell">
                    {d.CashAccount?.name}
                  </Td>
                  <Td className="text-[var(--color-light)] hidden lg:table-cell">
                    {d.description || "—"}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        title="Record Donation"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Donor Name"
              placeholder="Leave blank for anonymous..."
              value={form.donorName}
              onChange={(e) => setForm({ ...form, donorName: e.target.value })}
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
          <Input
            label="Date"
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            required
          />
          <Select
            label="Cash / Bank Account (Debit)"
            options={cashAccounts}
            value={form.cashAccountId}
            onChange={(e) =>
              setForm({ ...form, cashAccountId: e.target.value })
            }
            required
          />
          <Select
            label="Donation Revenue Account (Credit)"
            options={revenueAccounts}
            value={form.revenueAccountId}
            onChange={(e) =>
              setForm({ ...form, revenueAccountId: e.target.value })
            }
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
              Record Donation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
