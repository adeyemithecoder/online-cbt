import { useEffect, useRef, useState } from "react";
import { CreditCard, Plus, Receipt, Search, X, User } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { paymentsApi, studentFeesApi, accountsApi } from "../../api/client";
import { studentsApi } from "../../api/client";
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
} from "../../components";
import { fmt, PAYMENT_METHODS, getErrorMessage } from "../../utils/helpers";

// ─── Student Search Dropdown ───────────────────────────────────────────────
function StudentSearchInput({
  schoolId,
  onSelect,
  selectedStudent,
  onClear,
}: {
  schoolId: string;
  onSelect: (student: any) => void;
  selectedStudent: any | null;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!value.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await studentsApi.search(schoolId, value.trim());
        setResults(res.data);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  };

  const handleSelect = (student: any) => {
    setQuery("");
    setResults([]);
    setOpen(false);
    onSelect(student);
  };

  if (selectedStudent) {
    return (
      <div>
        <label className="block text-[12px] font-medium text-light mb-1">
          Student <span className="text-danger">*</span>
        </label>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border bg-surface">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0 ">
            <p className="m-0 text-[13px] font-semibold text-white">
              {selectedStudent.name} {selectedStudent.surname}
            </p>
            <p className="m-0 text-[11px] text-light">
              {selectedStudent.level} · {selectedStudent.username}
            </p>
          </div>
          <button
            onClick={onClear}
            className="text-light hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[12px] font-medium text-light mb-1">
        Student <span className="text-danger">*</span>
      </label>
      <Input
        placeholder="Search by name or surname..."
        leftIcon={<Search size={14} />}
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        rightElement={
          searching ? (
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          ) : undefined
        }
      />

      {open && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-border rounded-lg shadow-xl overflow-hidden max-h-52 overflow-y-auto">
          {results.length === 0 ? (
            <p className="text-center text-light text-[12px] py-4 m-0">
              No students found
            </p>
          ) : (
            results.map((s) => (
              <button
                key={s.id}
                onClick={() => handleSelect(s)}
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-bg-deep z-30 bg-bg transition-colors border-b border-border/50 last:border-0"
              >
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <User size={12} className="text-primary" />
                </div>
                <div>
                  <p className="m-0 text-[13px] font-medium text-white">
                    {s.name} {s.surname}
                  </p>
                  <p className="m-0 text-[11px] text-light">
                    {s.level} · {s.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────
export default function PaymentsPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;
  const toast = useToast();

  const [payments, setPayments] = useState<any[]>([]);
  const [totalCollected, setTotalCollected] = useState(0);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [loadingFees, setLoadingFees] = useState(false);

  // Selected student object (from search dropdown)
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const [form, setForm] = useState({
    studentId: "",
    studentFeeId: "",
    amountPaid: "",
    paymentDate: new Date().toISOString().split("T")[0],
    paymentMethod: "",
    cashAccountId: "",
    reference: "",
    note: "",
  });

  const cashAccounts = accounts
    .filter((a) => a.accountType === "ASSET" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const studentFeeOptions = studentFees.map((f) => ({
    value: f.id,
    label: `${f.FeeStructure?.name} — Balance: ${fmt.currency(f.amountCharged - f.amountPaid)}`,
  }));

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        paymentsApi.getAll(schoolId, currentSessionId || undefined),
        accountsApi.getAll(schoolId),
      ]);
      setPayments(pRes.data);
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

  useEffect(() => {
    const total = payments.reduce((s, p) => s + p.amountPaid, 0);
    setTotalCollected(total);
  }, [payments]);
  // When a student is selected from the search, auto-load their unpaid fees
  const handleStudentSelect = async (student: any) => {
    setSelectedStudent(student);
    setForm((f) => ({ ...f, studentId: student.id, studentFeeId: "" }));
    setStudentFees([]);
    setLoadingFees(true);
    try {
      const res = await studentFeesApi.getForStudent(
        student.id,
        currentSessionId || undefined,
      );
      const unpaid = res.data.filter((f: any) => f.status !== "PAID");
      setStudentFees(unpaid);
      if (unpaid.length === 0) {
        toast.info("This student has no outstanding fees.");
      }
    } catch {
      toast.error("Could not load student fees.");
    } finally {
      setLoadingFees(false);
    }
  };

  const handleClearStudent = () => {
    setSelectedStudent(null);
    setStudentFees([]);
    setForm((f) => ({ ...f, studentId: "", studentFeeId: "" }));
  };

  const resetModal = () => {
    setModal(false);
    setSelectedStudent(null);
    setStudentFees([]);
    setForm({
      studentId: "",
      studentFeeId: "",
      amountPaid: "",
      paymentDate: new Date().toISOString().split("T")[0],
      paymentMethod: "",
      cashAccountId: "",
      reference: "",
      note: "",
    });
  };

  const handleRecord = async () => {
    if (
      !form.studentId ||
      !form.studentFeeId ||
      !form.amountPaid ||
      !form.paymentMethod ||
      !form.cashAccountId ||
      !form.paymentDate
    ) {
      toast.error("All required fields must be filled.");
      return;
    }
    setSaving(true);
    try {
      await paymentsApi.record({
        ...form,
        amountPaid: parseFloat(form.amountPaid),
        sessionId: currentSessionId,
        schoolId,
        recordedById: userId,
      });
      toast.success("Payment recorded. Receipt generated.");
      resetModal();
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const filtered = payments.filter(
    (p) =>
      !search ||
      `${p.Student?.name} ${p.Student?.surname}`
        .toLowerCase()
        .includes(search.toLowerCase()) ||
      p.receiptNumber.toLowerCase().includes(search.toLowerCase()),
  );

  const todayTotal = payments
    .filter((p) => {
      const today = new Date().toDateString();
      return new Date(p.paymentDate).toDateString() === today;
    })
    .reduce((s, p) => s + p.amountPaid, 0);

  // Find the selected fee's remaining balance for quick display
  const selectedFee = studentFees.find((f) => f.id === form.studentFeeId);
  const remainingBalance = selectedFee
    ? selectedFee.amountCharged - selectedFee.amountPaid
    : null;

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Fee Payments"
        subtitle="Record and track fee collections"
        icon={<CreditCard size={20} />}
        action={
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal(true)}>
            <span className="hidden sm:inline">Record Payment</span>
            <span className="sm:hidden">Record</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Total Collected"
          value={fmt.currency(totalCollected)}
          icon={<CreditCard size={18} />}
          accent
          className="col-span-2 sm:col-span-1"
        />
        <StatCard
          label="Today's Collections"
          value={fmt.currency(todayTotal)}
          icon={<Receipt size={18} />}
        />
        <StatCard
          label="Total Transactions"
          value={payments.length}
          icon={<Receipt size={18} />}
          sub="This session"
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by student or receipt..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CreditCard size={40} />}
            title="No payments yet"
            action={
              <Button onClick={() => setModal(true)}>Record Payment</Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th className="hidden sm:table-cell">Receipt #</Th>
                <Th>Student</Th>
                <Th className="hidden md:table-cell">Fee</Th>
                <Th>Amount Paid</Th>
                <Th className="hidden md:table-cell">Method</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status = p.StudentFee?.status;
                const badgeVariant =
                  status === "PAID"
                    ? "success"
                    : status === "PARTIALLY_PAID"
                      ? "warning"
                      : "danger";
                return (
                  <Tr key={p.id}>
                    <Td className="hidden sm:table-cell">
                      <span className="font-mono text-[12px] text-primary">
                        {p.receiptNumber}
                      </span>
                    </Td>
                    <Td>
                      <p className="m-0 font-medium text-white text-[13px]">
                        {p.Student?.name} {p.Student?.surname}
                      </p>
                      <p className="m-0 text-[11px] text-light">
                        {p.Student?.level}
                      </p>
                      <p className="m-0 text-[11px] font-mono text-primary sm:hidden">
                        {p.receiptNumber}
                      </p>
                    </Td>
                    <Td className="text-light hidden md:table-cell">
                      {p.StudentFee?.FeeStructure?.name}
                    </Td>
                    <Td>
                      <span className="text-success font-bold whitespace-nowrap">
                        {fmt.currency(p.amountPaid)}
                      </span>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Badge variant="neutral">{p.paymentMethod}</Badge>
                    </Td>
                    <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                      {fmt.date(p.paymentDate)}
                    </Td>
                    <Td>
                      {status && (
                        <Badge variant={badgeVariant} dot>
                          <span className="hidden sm:inline">
                            {status.replace("_", " ")}
                          </span>
                          <span className="sm:hidden">
                            {status === "PAID"
                              ? "Paid"
                              : status === "PARTIALLY_PAID"
                                ? "Part"
                                : "Unp"}
                          </span>
                        </Badge>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* Record Payment Modal */}
      <Modal
        open={modal}
        onClose={resetModal}
        title="Record Fee Payment"
        size="lg"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <StudentSearchInput
            schoolId={schoolId}
            onSelect={handleStudentSelect}
            selectedStudent={selectedStudent}
            onClear={handleClearStudent}
          />

          {selectedStudent && (
            <>
              {loadingFees ? (
                <div className="flex items-center gap-2 text-light text-[13px]">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading fees...
                </div>
              ) : studentFees.length > 0 ? (
                <Select
                  label="Select Fee"
                  options={studentFeeOptions}
                  value={form.studentFeeId}
                  onChange={(e) =>
                    setForm({ ...form, studentFeeId: e.target.value })
                  }
                  placeholder="Choose an outstanding fee..."
                  required
                />
              ) : (
                <div className="px-3 py-2.5 rounded-lg border border-border bg-surface text-light text-[13px]">
                  No outstanding fees for this student.
                </div>
              )}
            </>
          )}

          {remainingBalance !== null && (
            <div className="px-3 py-2 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-between gap-2">
              <span className="text-[12px] text-light">
                Outstanding balance
              </span>
              <span className="text-[13px] font-bold text-primary whitespace-nowrap">
                {fmt.currency(remainingBalance)}
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Amount Paid (₦)"
              type="number"
              placeholder="0.00"
              value={form.amountPaid}
              onChange={(e) => setForm({ ...form, amountPaid: e.target.value })}
              required
            />
            <Input
              label="Payment Date"
              type="date"
              value={form.paymentDate}
              onChange={(e) =>
                setForm({ ...form, paymentDate: e.target.value })
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
            <Select
              label="Cash / Bank Account"
              options={cashAccounts}
              value={form.cashAccountId}
              onChange={(e) =>
                setForm({ ...form, cashAccountId: e.target.value })
              }
              placeholder="Select account..."
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Reference"
              placeholder="e.g. Teller number..."
              value={form.reference}
              onChange={(e) => setForm({ ...form, reference: e.target.value })}
            />
            <Input
              label="Note"
              placeholder="Optional note..."
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button variant="secondary" onClick={resetModal} className="flex-1">
              Cancel
            </Button>
            <Button loading={saving} onClick={handleRecord} className="flex-1">
              Record Payment
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
