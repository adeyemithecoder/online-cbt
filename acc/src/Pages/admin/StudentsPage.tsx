import { useEffect, useState } from "react";
import { Users, Eye, EyeOff, UserPlus, Pencil, Trash2 } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { studentsApi, studentFeesApi } from "../../api/client";
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
  Tabs,
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";

const emptyForm = {
  name: "",
  surname: "",
  username: "",
  password: "",
  level: "",
};

const LEVEL_OPTIONS = ["js1", "js2", "js3", "ss1", "ss2", "ss3"].map((l) => ({
  value: l,
  label: l.toUpperCase(),
}));

export default function StudentsPage() {
  const { accountingAuth } = useApp();
  const { schoolId, currentSessionId } = accountingAuth;
  const toast = useToast();

  const [students, setStudents] = useState<any[]>([]);
  const [studentFees, setStudentFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingFees, setLoadingFees] = useState(false);
  const [levelFilter, setLevelFilter] = useState("js1");
  const [modal, setModal] = useState<
    "create" | "edit" | "view" | "delete" | null
  >(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await studentsApi.getAll(schoolId, levelFilter);
      setStudents(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId, levelFilter]);

  const openView = async (s: any) => {
    setSelectedStudent(s);
    setModal("view");
    setStudentFees([]);
    setLoadingFees(true);
    try {
      const res = await studentFeesApi.getForStudent(
        s.id,
        currentSessionId || undefined,
      );
      setStudentFees(res.data);
    } catch {
      setStudentFees([]);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleCreate = async () => {
    if (
      !form.name ||
      !form.surname ||
      !form.username ||
      !form.password ||
      !form.level
    ) {
      toast.error("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await studentsApi.create({ ...form, schoolId });
      toast.success("Student registered successfully.");
      resetModal();
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = async () => {
    if (!form.name || !form.surname || !form.level) {
      toast.error("Name, surname and level are required.");
      return;
    }
    setSaving(true);
    try {
      await studentsApi.update(selectedStudent.id, {
        name: form.name,
        surname: form.surname,
        level: form.level,
        ...(form.password ? { password: form.password } : {}),
      });
      toast.success("Student updated successfully.");
      resetModal();
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setDeleting(true);
    try {
      await studentsApi.delete(selectedStudent.id);
      toast.success("Student deleted.");
      resetModal();
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleRemoveFee = async (feeId: string) => {
    try {
      await studentFeesApi.remove(feeId);
      toast.success("Fee removed successfully.");
      // Refresh fees list
      const res = await studentFeesApi.getForStudent(
        selectedStudent.id,
        currentSessionId || undefined,
      );
      setStudentFees(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const openEdit = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(s);
    setForm({
      name: s.name,
      surname: s.surname,
      username: s.username,
      password: "",
      level: s.level,
    });
    setShowPassword(false);
    setModal("edit");
  };

  const openDelete = (s: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedStudent(s);
    setModal("delete");
  };

  const resetModal = () => {
    setModal(null);
    setForm(emptyForm);
    setShowPassword(false);
    setSelectedStudent(null);
    setStudentFees([]);
  };

  const filtered = students.filter(
    (s) =>
      !search ||
      `${s.name} ${s.surname} ${s.username}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Students"
        subtitle="Register and manage student accounts"
        icon={<Users size={20} />}
        action={
          <Button
            leftIcon={<UserPlus size={15} />}
            onClick={() => {
              setForm(emptyForm);
              setModal("create");
            }}
          >
            <span className="hidden sm:inline">Register Student</span>
            <span className="sm:hidden">Register</span>
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Students in Level"
          value={students.length}
          icon={<Users size={18} />}
          accent
        />
        <StatCard
          label="Current Level"
          value={levelFilter.toUpperCase()}
          icon={<Users size={18} />}
          sub="Viewing"
        />
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Search Results"
          value={filtered.length}
          icon={<Users size={18} />}
          sub="Matching students"
        />
      </div>

      {/* Level tabs + search */}
      <div className="flex flex-col gap-3 mb-3 sm:mb-4">
        <Tabs
          tabs={LEVEL_OPTIONS}
          active={levelFilter}
          onChange={(val) => {
            setLevelFilter(val);
            setSearch("");
          }}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or surname..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={40} />}
            title={
              search
                ? "No students match your search"
                : `No students in ${levelFilter.toUpperCase()} yet`
            }
            action={
              <Button onClick={() => setModal("create")}>
                Register Student
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th className="hidden sm:table-cell">Username</Th>
                <Th>Level</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <Tr key={s.id} clickable onClick={() => openView(s)}>
                  <Td>
                    <p className="m-0 font-semibold text-white text-[13px]">
                      {s.surname} {s.name}
                    </p>
                    <p className="m-0 text-[11px] text-light font-mono sm:hidden">
                      {s.username}
                    </p>
                  </Td>
                  <Td className="text-light font-mono text-[12px] hidden sm:table-cell">
                    {s.username}
                  </Td>
                  <Td>
                    <Badge variant="info">{s.level.toUpperCase()}</Badge>
                  </Td>
                  <Td>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={(e) => openEdit(s, e)}
                        className="p-1.5 rounded-md cursor-pointer text-light hover:text-primary hover:bg-primary/10 transition-all"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => openDelete(s, e)}
                        className="p-1.5 rounded-md text-light cursor-pointer hover:text-danger hover:bg-danger/10 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── Register Modal ─────────────────────────────────────────────── */}
      <Modal
        open={modal === "create"}
        onClose={resetModal}
        title="Register New Student"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Surname"
              placeholder="e.g. Okafor"
              value={form.surname}
              onChange={(e) => setForm({ ...form, surname: e.target.value })}
              required
            />
            <Input
              label="Name"
              placeholder="e.g. Amara"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <Input
            label="Username"
            placeholder="e.g. amara.okafor"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Set a password..."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-light hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          <Select
            label="Level / Class"
            options={LEVEL_OPTIONS}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            placeholder="Select level..."
            required
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button variant="secondary" onClick={resetModal} className="flex-1">
              Cancel
            </Button>
            <Button loading={saving} onClick={handleCreate} className="flex-1">
              Register Student
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ─────────────────────────────────────────────────── */}
      <Modal open={modal === "edit"} onClose={resetModal} title="Edit Student">
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Surname"
              value={form.surname}
              onChange={(e) => setForm({ ...form, surname: e.target.value })}
              required
            />
            <Input
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="block text-[12px] font-medium text-light mb-1">
              Username
            </label>
            <div className="px-3 py-2 rounded-lg border border-border bg-surface/50 text-light text-[13px] font-mono truncate">
              {form.username}
            </div>
          </div>
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Leave blank to keep current..."
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            hint="Leave blank to keep current password"
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="text-light hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            }
          />
          <Select
            label="Level / Class"
            options={LEVEL_OPTIONS}
            value={form.level}
            onChange={(e) => setForm({ ...form, level: e.target.value })}
            required
          />
          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button variant="secondary" onClick={resetModal} className="flex-1">
              Cancel
            </Button>
            <Button loading={saving} onClick={handleEdit} className="flex-1">
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete Confirm Modal ────────────────────────────────────────── */}
      <Modal
        open={modal === "delete"}
        onClose={resetModal}
        title="Delete Student"
      >
        {selectedStudent && (
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            <p className="text-[13px] sm:text-[14px] text-light m-0">
              Are you sure you want to delete{" "}
              <span className="text-white font-semibold">
                {selectedStudent.name} {selectedStudent.surname}
              </span>
              ? This will also remove all their fee and payment records. This
              cannot be undone.
            </p>
            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={resetModal}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                loading={deleting}
                onClick={handleDelete}
                className="flex-1 bg-danger! hover:bg-danger/80!"
              >
                Delete Student
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── View Modal ─────────────────────────────────────────────────── */}
      <Modal
        open={modal === "view"}
        onClose={resetModal}
        title="Student Details"
        size="lg"
      >
        {selectedStudent && (
          <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
            {/* Student info */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Users size={20} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[15px] sm:text-[16px] font-bold text-white truncate">
                  {selectedStudent.surname} {selectedStudent.name}
                </p>
                <p className="m-0 text-[11px] sm:text-[12px] text-light font-mono truncate">
                  {selectedStudent.username}
                </p>
              </div>
              <Badge variant="info">
                {selectedStudent.level.toUpperCase()}
              </Badge>
            </div>

            {/* Assigned fees */}
            <div>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-2">
                Assigned Fees — This Session
              </p>
              {loadingFees ? (
                <div className="flex items-center gap-2 text-light text-[13px] py-2">
                  <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  Loading fees...
                </div>
              ) : studentFees.length === 0 ? (
                <div className="px-3 py-2.5 rounded-lg border border-border bg-surface text-light text-[13px]">
                  No fees assigned this session.
                </div>
              ) : (
                <div className="space-y-2">
                  {studentFees.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between px-3 py-2.5 rounded-lg border border-border bg-surface gap-3"
                    >
                      <div className="min-w-0">
                        <p className="m-0 text-[13px] text-white font-medium truncate">
                          {f.FeeStructure?.name}
                        </p>
                        <p className="m-0 text-[11px] text-light">
                          {fmt.currency(f.amountPaid)} paid of{" "}
                          {fmt.currency(f.amountCharged)}
                          {" · "}
                          <span
                            className={
                              f.status === "PAID"
                                ? "text-success"
                                : f.status === "PARTIALLY_PAID"
                                  ? "text-warning"
                                  : "text-danger"
                            }
                          >
                            {f.status.replace("_", " ")}
                          </span>
                        </p>
                      </div>
                      {f.amountPaid === 0 && (
                        <button
                          onClick={() => handleRemoveFee(f.id)}
                          className="p-1.5 rounded-md cursor-pointer text-light hover:text-danger hover:bg-danger/10 transition-all shrink-0"
                          title="Remove fee assignment"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={resetModal}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="secondary"
                leftIcon={<Pencil size={13} />}
                onClick={(e) => openEdit(selectedStudent, e as any)}
                className="flex-1"
              >
                Edit Student
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
