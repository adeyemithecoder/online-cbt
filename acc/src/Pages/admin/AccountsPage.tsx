import { useEffect, useState } from "react";
import { BookOpen, Plus, Edit2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { accountsApi } from "../../api/client";
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
  StatusToggle,
  Tabs,
} from "../../components";
import {
  ACCOUNT_TYPES,
  NORMAL_BALANCE,
  accountTypeColor,
  getErrorMessage,
} from "../../utils/helpers";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  accountType: "",
  normalBalance: "",
};

const ACCOUNT_SUGGESTIONS: Record<string, string[]> = {
  ASSET: [
    "Cash on Hand",
    "Bank Account",
    "Petty Cash",
    "School Equipment",
    "Land & Buildings",
    "Other Assets",
  ],
  LIABILITY: [
    "Loans Payable",
    "Accounts Payable",
    "Salaries Payable",
    "Tax Payable",
    "Other Liabilities",
  ],
  EQUITY: ["Retained Earnings", "Owner's Capital", "School Reserve Fund"],
  REVENUE: [
    "Tuition Fees",
    "Admission Fees",
    "Examination Fees",
    "Transport Fees",
    "Donation Income",
    "Sport Fees",
    "Miscellaneous Income",
  ],
  EXPENSE: [
    "Salaries Expense",
    "Maintenance Expense",
    "Utilities Expense",
    "Transport Expense",
    "Stationery Expense",
    "Examination Expense",
    "Security Expense",
    "Miscellaneous Expense",
  ],
};

export default function AccountsPage() {
  const { accountingAuth } = useApp();
  const { schoolId } = accountingAuth;

  const toast = useToast();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const getNextCode = (type: string) => {
    const prefixes: Record<string, number> = {
      ASSET: 1000,
      LIABILITY: 2000,
      EQUITY: 3000,
      REVENUE: 4000,
      EXPENSE: 5000,
    };
    const base = prefixes[type];
    if (!base) return "";
    const existing = accounts
      .filter((a) => a.accountType === type)
      .map((a) => parseInt(a.code))
      .filter((n) => !isNaN(n));
    if (existing.length === 0) return String(base);
    return String(Math.max(...existing) + 1);
  };
  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await accountsApi.getAll(schoolId);
      setAccounts(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [schoolId]);

  const filtered = accounts.filter((a) => {
    const matchType = typeFilter === "ALL" || a.accountType === typeFilter;
    const matchSearch =
      !search ||
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const handleCreate = async () => {
    if (!form.code || !form.name || !form.accountType || !form.normalBalance) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await accountsApi.create({ ...form, schoolId });
      toast.success("Account created.");
      setModal(null);
      setForm(emptyForm);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    setSaving(true);
    try {
      await accountsApi.update(selected.id, {
        name: form.name,
        description: form.description,
      });
      toast.success("Account updated.");
      setModal(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const res = await accountsApi.toggleStatus(id);
      toast.success(res.data.message);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const openEdit = (a: any) => {
    setSelected(a);
    setForm({ ...emptyForm, name: a.name, description: a.description || "" });
    setModal("edit");
  };

  const typeTabs = [
    { value: "ALL", label: "All" },
    ...ACCOUNT_TYPES.map((t) => ({ value: t.value, label: t.label })),
  ];
  const NORMAL_BALANCE_MAP: Record<string, string> = {
    ASSET: "DEBIT",
    EXPENSE: "DEBIT",
    LIABILITY: "CREDIT",
    EQUITY: "CREDIT",
    REVENUE: "CREDIT",
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <PageHeader
        title="Chart of Accounts"
        subtitle={`${accounts.length} accounts configured`}
        icon={<BookOpen size={20} />}
        action={
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setForm(emptyForm);
              setModal("create");
            }}
          >
            New Account
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
        <Tabs tabs={typeTabs} active={typeFilter} onChange={setTypeFilter} />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search accounts..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader text="Loading accounts..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<BookOpen size={40} />}
            title="No accounts found"
            description={
              search ? "Try a different search." : "Create your first account."
            }
            action={
              <Button onClick={() => setModal("create")}>New Account</Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Account Name</Th>
                <Th className="hidden sm:table-cell">Type</Th>
                <Th className="hidden md:table-cell">Normal Balance</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((a) => {
                const typeVariant = accountTypeColor[a.accountType] as any;

                return (
                  <Tr key={a.id}>
                    <Td>
                      <span className="font-mono text-[12px] sm:text-[13px] text-(--color-primary)">
                        {a.code}
                      </span>
                    </Td>

                    <Td>
                      <p className="m-0 font-medium text-white text-[13px]">
                        {a.name}
                      </p>
                      {a.description && (
                        <p className="m-0 text-[11px] text-light mt-0.5 hidden sm:block">
                          {a.description}
                        </p>
                      )}
                    </Td>

                    <Td className="hidden sm:table-cell">
                      <Badge variant={typeVariant}>{a.accountType}</Badge>
                    </Td>

                    <Td className="hidden md:table-cell">
                      <Badge
                        variant={
                          a.normalBalance === "DEBIT" ? "info" : "neutral"
                        }
                      >
                        {a.normalBalance}
                      </Badge>
                    </Td>

                    <Td>
                      <StatusToggle
                        active={a.isActive}
                        onToggle={() => handleToggle(a.id)}
                        label={a.isActive ? "Active" : "Inactive"}
                      />
                    </Td>

                    <Td>
                      <Button
                        variant="ghost"
                        size="icon"
                        leftIcon={<Edit2 size={14} />}
                        onClick={() => openEdit(a)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* CREATE MODAL */}
      <Modal
        open={modal === "create"}
        onClose={() => setModal(null)}
        title="Create Account"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Account Code"
              value={form.code}
              disabled
              hint="Auto-generated based on account type"
            />

            <Select
              label="Account Type"
              options={ACCOUNT_TYPES}
              value={form.accountType}
              onChange={(e) => {
                const type = e.target.value;
                setForm({
                  ...form,
                  accountType: type,
                  code: getNextCode(type),
                  normalBalance: NORMAL_BALANCE_MAP[type] || "",
                });
              }}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Input
              label="Account Name"
              placeholder="e.g. Cash on Hand"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            {form.accountType && ACCOUNT_SUGGESTIONS[form.accountType] && (
              <div className="flex flex-wrap gap-1.5">
                {ACCOUNT_SUGGESTIONS[form.accountType].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setForm({ ...form, name: suggestion })}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                      form.name === suggestion
                        ? "bg-primary-variant border-primary-variant text-white"
                        : "bg-bg border-bg-deep text-light hover:text-white hover:border-primary-variant"
                    }`}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>

          <Select
            label="Normal Balance"
            options={NORMAL_BALANCE}
            value={form.normalBalance}
            disabled
          />

          <Textarea
            label="Description"
            placeholder="Optional description..."
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button loading={saving} onClick={handleCreate} className="flex-1">
              Create Account
            </Button>
          </div>
        </div>
      </Modal>

      {/* EDIT MODAL */}
      <Modal
        open={modal === "edit"}
        onClose={() => setModal(null)}
        title="Edit Account"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Account Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />

          <Textarea
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button loading={saving} onClick={handleEdit} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
