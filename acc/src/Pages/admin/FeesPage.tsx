import { useEffect, useRef, useState } from "react";
import {
  GraduationCap,
  Plus,
  Users,
  AlertCircle,
  Search,
  User,
  X,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  feeStructuresApi,
  studentFeesApi,
  accountsApi,
  studentsApi,
} from "../../api/client";
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
  StatusToggle,
  StatCard,
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";

const tabList = [
  { value: "structures", label: "Fee Structures" },
  { value: "student-fees", label: "Student Fees" },
  { value: "outstanding", label: "Outstanding" },
];

const emptyFeeForm = {
  name: "",
  description: "",
  level: "",
  isAllLevels: false, // ← add this
  amount: "",
  dueDate: "",
  revenueAccountId: "",
};
const LEVEL_OPTIONS = ["js1", "js2", "js3", "ss1", "ss2", "ss3"].map((l) => ({
  value: l,
  label: l.toUpperCase(),
}));
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
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-border bg-surface">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
            <User size={14} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
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
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-light pointer-events-none"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder="Search by name or surname..."
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-border bg-surface text-white text-[13px] placeholder:text-light focus:outline-none focus:border-primary transition-colors"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

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
                className="w-full text-left px-3 py-2.5 flex items-center gap-3 bg-bg transition-colors border-b border-border/50 last:border-0"
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
export default function FeesPage() {
  const { accountingAuth } = useApp();
  const { schoolId, currentSessionId } = accountingAuth;
  const toast = useToast();
  const [tab, setTab] = useState("structures");
  const [structures, setStructures] = useState<any[]>([]);
  const [outstanding, setOutstanding] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<
    "createStructure" | "editStructure" | "assign" | "bulkAssign" | null
  >(null);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [feeForm, setFeeForm] = useState(emptyFeeForm);
  const [search, setSearch] = useState("");

  // Assign modal: selected student
  const [assignStudent, setAssignStudent] = useState<any | null>(null);
  const [assignFeeStructureId, setAssignFeeStructureId] = useState("");
  const [bulkFeeStructureId, setBulkFeeStructureId] = useState("");
  const [outstandingMeta, setOutstandingMeta] = useState({
    totalOutstanding: 0,
    count: 0,
  });
  const revenueAccounts = accounts
    .filter((a) => a.accountType === "REVENUE" && a.isActive)
    .map((a) => ({ value: a.id, label: `${a.code} — ${a.name}` }));

  const structureOptions = structures.map((s) => ({
    value: s.id,
    label: `${s.name} (${s.level}) — ${fmt.currency(s.amount)}`,
  }));

  const [selectedSessionId, setSelectedSessionId] = useState(
    currentSessionId || "",
  );

  const SESSION_OPTIONS = [
    { value: "", label: "All Sessions" },
    ...(accountingAuth.sessions ?? []).map((s) => ({
      value: s.id,
      label: `${s.name} — ${s.term} Term`,
    })),
  ];

  const handleEditStructure = async () => {
    if (!feeForm.name || !feeForm.amount) {
      toast.error("Name and amount are required.");
      return;
    }
    setSaving(true);
    try {
      await feeStructuresApi.update(selectedStructure.id, {
        name: feeForm.name,
        description: feeForm.description,
        amount: parseFloat(feeForm.amount),
        dueDate: feeForm.dueDate || null,
      });
      toast.success("Fee structure updated.");
      setModal(null);
      setSelectedStructure(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  useEffect(() => {
    load();
  }, [schoolId, currentSessionId, selectedSessionId]); // 🆕

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const [sRes, oRes, aRes] = await Promise.all([
        feeStructuresApi.getAll(schoolId, currentSessionId || undefined),
        studentFeesApi.getOutstanding(schoolId, selectedSessionId || undefined), // 🆕
        accountsApi.getAll(schoolId),
      ]);
      setStructures(sRes.data);
      setOutstanding(oRes.data.fees ?? []);
      setOutstandingMeta({
        totalOutstanding: oRes.data.totalOutstanding ?? 0,
        count: oRes.data.count ?? 0,
      });
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
  const handleCreateStructure = async () => {
    if (!feeForm.name || !feeForm.amount || !feeForm.revenueAccountId) {
      toast.error("All required fields must be filled.");
      return;
    }
    if (!feeForm.isAllLevels && !feeForm.level) {
      toast.error("Please select a level or mark as school-wide fee.");
      return;
    }
    setSaving(true);
    try {
      await feeStructuresApi.create({
        ...feeForm,
        amount: parseFloat(feeForm.amount),
        sessionId: currentSessionId,
        schoolId,
      });
      toast.success("Fee structure created.");
      setModal(null);
      setFeeForm(emptyFeeForm);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleAssign = async () => {
    if (!assignStudent || !assignFeeStructureId) {
      toast.error("Select a student and fee structure.");
      return;
    }
    setSaving(true);
    try {
      await studentFeesApi.assign({
        studentId: assignStudent.id,
        feeStructureId: assignFeeStructureId,
        sessionId: currentSessionId,
        schoolId,
      });
      toast.success("Fee assigned to student.");
      setModal(null);
      setAssignStudent(null);
      setAssignFeeStructureId("");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAssign = async () => {
    if (!bulkFeeStructureId) {
      toast.error("Select a fee structure.");
      return;
    }
    setSaving(true);
    try {
      const res = await studentFeesApi.bulkAssign({
        feeStructureId: bulkFeeStructureId,
        sessionId: currentSessionId,
        schoolId,
      });
      toast.success(res.data.message);
      setModal(null);
      setBulkFeeStructureId("");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStructure = async (id: string) => {
    try {
      const res = await feeStructuresApi.toggleStatus(id);
      toast.success(res.data.message);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const filteredOutstanding = outstanding.filter(
    (f) =>
      !search ||
      `${f.Student?.name} ${f.Student?.surname}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  console.log("first");
  console.log(outstanding);

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Fee Management"
        subtitle="Fee structures, assignments and outstanding balances"
        icon={<GraduationCap size={20} />}
        action={
          <div className="flex gap-1.5 sm:gap-2 flex-wrap justify-end">
            <Button
              variant="secondary"
              leftIcon={<Users size={15} />}
              onClick={() => {
                setBulkFeeStructureId("");
                setModal("bulkAssign");
              }}
            >
              <span className="hidden sm:inline">Bulk Assign</span>
              <span className="sm:hidden">Bulk</span>
            </Button>
            <Button
              variant="secondary"
              leftIcon={<Users size={15} />}
              onClick={() => {
                setAssignStudent(null);
                setAssignFeeStructureId("");
                setModal("assign");
              }}
            >
              <span className="hidden sm:inline">Assign Student</span>
              <span className="sm:hidden">Assign</span>
            </Button>
            <Button
              leftIcon={<Plus size={15} />}
              onClick={() => {
                setFeeForm(emptyFeeForm);
                setModal("createStructure");
              }}
            >
              <span className="hidden sm:inline">New Structure</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        }
      />

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Fee Structures"
          value={structures.filter((s) => s.isActive).length}
          icon={<GraduationCap size={18} />}
          sub={`${structures.length} total`}
        />
        <StatCard
          label="Outstanding Fees"
          value={outstanding.length}
          icon={<AlertCircle size={18} />}
          sub="Students with balance"
        />
        <StatCard
          label="Total Outstanding"
          value={fmt.currency(outstandingMeta.totalOutstanding)}
          icon={<AlertCircle size={18} />}
          accent
        />
      </div>

      <Tabs tabs={tabList} active={tab} onChange={setTab} />
      <div className="mt-3 sm:mt-4" />

      {/* Fee Structures Tab */}
      {tab === "structures" && (
        <Card padding={false}>
          {loading ? (
            <Loader />
          ) : structures.length === 0 ? (
            <EmptyState
              icon={<GraduationCap size={40} />}
              title="No fee structures"
              action={
                <Button onClick={() => setModal("createStructure")}>
                  New Structure
                </Button>
              }
            />
          ) : (
            <Table>
              <thead>
                <tr>
                  <Th>Name</Th>
                  <Th>Level</Th>
                  <Th>Amount</Th>
                  <Th className="hidden md:table-cell">Due Date</Th>
                  <Th className="hidden lg:table-cell">Revenue Account</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody>
                {structures.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <p className="m-0 font-semibold text-white text-[13px]">
                        {s.name}
                      </p>
                      {s.description && (
                        <p className="m-0 text-[11px] text-light hidden sm:block">
                          {s.description}
                        </p>
                      )}
                    </Td>
                    <Td>
                      {s.isAllLevels ? (
                        <Badge variant="success">All Levels</Badge>
                      ) : (
                        <Badge variant="info">{s.level?.toUpperCase()}</Badge>
                      )}
                    </Td>
                    <Td>
                      <span className="font-semibold text-(--color-primary) whitespace-nowrap">
                        {fmt.currency(s.amount)}
                      </span>
                    </Td>
                    <Td className="text-light hidden md:table-cell whitespace-nowrap">
                      {s.dueDate ? fmt.date(s.dueDate) : "—"}
                    </Td>
                    <Td className="text-light hidden lg:table-cell">
                      {s.RevenueAccount?.name || "—"}
                    </Td>

                    <Td>
                      <StatusToggle
                        active={s.isActive}
                        onToggle={() => handleToggleStructure(s.id)}
                        label={s.isActive ? "Active" : "Inactive"}
                      />
                    </Td>

                    <Td>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStructure(s);
                          setFeeForm({
                            name: s.name,
                            description: s.description || "",
                            level: s.level || "",
                            isAllLevels: s.isAllLevels ?? false,
                            amount: String(s.amount),
                            dueDate: s.dueDate ? s.dueDate.split("T")[0] : "",
                            revenueAccountId: s.revenueAccountId,
                          });
                          setModal("editStructure");
                        }}
                      >
                        Edit
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      )}

      {/* Outstanding Tab */}
      {tab === "outstanding" && (
        <>
          <div className="flex flex-col sm:flex-row gap-3 mb-3 sm:mb-4">
            <div className="w-full sm:w-64">
              <Select
                label=""
                options={SESSION_OPTIONS}
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                placeholder="Filter by session..."
              />
            </div>
            <div className="flex-1">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search students..."
              />
            </div>
          </div>
          <Card padding={false}>
            {loading ? (
              <Loader />
            ) : filteredOutstanding.length === 0 ? (
              <EmptyState
                icon={<AlertCircle size={40} />}
                title="No outstanding fees"
              />
            ) : (
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th className="hidden sm:table-cell">Level</Th>
                    <Th className="hidden md:table-cell">Fee</Th>
                    <Th className="hidden md:table-cell">Term</Th>

                    <Th className="hidden lg:table-cell">Charged</Th>
                    <Th className="hidden lg:table-cell">Paid</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutstanding.map((f) => {
                    const balance = f.amountCharged - f.amountPaid;
                    return (
                      <Tr key={f.id}>
                        <Td>
                          <p className="m-0 font-medium text-white text-[13px]">
                            {f.Student?.name} {f.Student?.surname}
                          </p>
                          <p className="m-0 text-[11px] text-light sm:hidden">
                            {f.Student?.level} · {f.FeeStructure?.name}
                          </p>
                        </Td>
                        <Td className="hidden sm:table-cell">
                          <Badge variant="info">{f.Student?.level}</Badge>
                        </Td>
                        <Td className="text-light hidden md:table-cell">
                          {f.FeeStructure?.name}
                        </Td>
                        <Td className="text-light hidden md:table-cell">
                          {f.Session?.name} · {f.Session?.term}
                        </Td>
                        <Td className="font-medium hidden lg:table-cell whitespace-nowrap">
                          {fmt.currency(f.amountCharged)}
                        </Td>
                        <Td className="text-success font-medium hidden lg:table-cell whitespace-nowrap">
                          {fmt.currency(f.amountPaid)}
                        </Td>
                        <Td className="text-danger font-semibold whitespace-nowrap">
                          {fmt.currency(balance)}
                        </Td>
                        <Td>
                          <Badge variant={"danger"} dot>
                            {f.status.replace("_", " ")}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            )}
          </Card>
        </>
      )}

      {/* Create Structure Modal */}
      <Modal
        open={modal === "createStructure"}
        onClose={() => setModal(null)}
        title="Create Fee Structure"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Fee Name"
            placeholder="e.g. School Fees"
            value={feeForm.name}
            onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
            required
          />
          <div className="space-y-3 sm:space-y-4">
            <label
              htmlFor="isAllLevels"
              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-surface cursor-pointer hover:border-primary transition-colors"
            >
              <input
                type="checkbox"
                id="isAllLevels"
                checked={feeForm.isAllLevels}
                onChange={(e) =>
                  setFeeForm({
                    ...feeForm,
                    isAllLevels: e.target.checked,
                    level: "",
                  })
                }
                className="w-6 h-6 accent-primary cursor-pointer"
              />
              <div>
                <p className="m-0 text-[13px] font-medium text-white">
                  Charge all students
                </p>
                <p className="m-0 text-[11px] text-light">
                  Applies to every class e.g. Transport, Sport wear
                </p>
              </div>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {!feeForm.isAllLevels && (
                <Select
                  label="Level / Class"
                  options={LEVEL_OPTIONS}
                  value={feeForm.level}
                  onChange={(e) =>
                    setFeeForm({ ...feeForm, level: e.target.value })
                  }
                  placeholder="Select level..."
                  required
                />
              )}
              <Input
                label="Amount (₦)"
                type="number"
                placeholder="0.00"
                value={feeForm.amount}
                onChange={(e) =>
                  setFeeForm({ ...feeForm, amount: e.target.value })
                }
                required
                className={!feeForm.isAllLevels ? "" : "sm:col-span-2"}
              />
            </div>
          </div>
          <Select
            label="Revenue Account"
            options={revenueAccounts}
            value={feeForm.revenueAccountId}
            onChange={(e) =>
              setFeeForm({ ...feeForm, revenueAccountId: e.target.value })
            }
            placeholder="Select revenue account..."
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={feeForm.dueDate}
            onChange={(e) =>
              setFeeForm({ ...feeForm, dueDate: e.target.value })
            }
          />
          <Textarea
            label="Description"
            placeholder="Optional..."
            value={feeForm.description}
            onChange={(e) =>
              setFeeForm({ ...feeForm, description: e.target.value })
            }
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleCreateStructure}
              className="flex-1"
            >
              Create Structure
            </Button>
          </div>
        </div>
      </Modal>

      {/* Assign Modal */}
      <Modal
        open={modal === "assign"}
        onClose={() => setModal(null)}
        title="Assign Fee to Student"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <StudentSearchInput
            schoolId={schoolId}
            onSelect={setAssignStudent}
            selectedStudent={assignStudent}
            onClear={() => setAssignStudent(null)}
          />
          <Select
            label="Fee Structure"
            options={structureOptions}
            value={assignFeeStructureId}
            onChange={(e) => setAssignFeeStructureId(e.target.value)}
            placeholder="Select a fee structure..."
            required
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button loading={saving} onClick={handleAssign} className="flex-1">
              Assign Fee
            </Button>
          </div>
        </div>
      </Modal>

      {/* Bulk Assign Modal */}
      <Modal
        open={modal === "bulkAssign"}
        onClose={() => setModal(null)}
        title="Bulk Assign Fee"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <p className="text-[13px] sm:text-[14px] text-light m-0">
            This will assign the selected fee to all students in the
            corresponding class level.
          </p>
          <Select
            label="Fee Structure"
            options={structureOptions}
            value={bulkFeeStructureId}
            onChange={(e) => setBulkFeeStructureId(e.target.value)}
            placeholder="Select a fee structure..."
            required
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleBulkAssign}
              className="flex-1"
            >
              Bulk Assign
            </Button>
          </div>
        </div>
      </Modal>
      {/* Edit Structure Modal */}
      <Modal
        open={modal === "editStructure"}
        onClose={() => setModal(null)}
        title="Edit Fee Structure"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Fee Name"
            value={feeForm.name}
            onChange={(e) => setFeeForm({ ...feeForm, name: e.target.value })}
            required
          />
          <Input
            label="Amount (₦)"
            type="number"
            value={feeForm.amount}
            onChange={(e) => setFeeForm({ ...feeForm, amount: e.target.value })}
            required
          />
          <Input
            label="Due Date"
            type="date"
            value={feeForm.dueDate}
            onChange={(e) =>
              setFeeForm({ ...feeForm, dueDate: e.target.value })
            }
          />
          <Textarea
            label="Description"
            placeholder="Optional..."
            value={feeForm.description}
            onChange={(e) =>
              setFeeForm({ ...feeForm, description: e.target.value })
            }
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              loading={saving}
              onClick={handleEditStructure}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
