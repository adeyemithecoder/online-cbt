import { useEffect, useState } from "react";
import {
  School,
  Plus,
  Pencil,
  Trash2,
  Users,
  Eye,
  EyeOff,
  UserPlus,
  X,
} from "lucide-react";
import { superAdminApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Input,
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
  ConfirmDialog,
  Divider,
} from "../../components";
import { getErrorMessage } from "../../utils/helpers";

const emptySchoolForm = { name: "", fullName: "", classes: [] as string[] };
const emptyAdminForm = { name: "", username: "", password: "", role: "ADMIN" };

export default function SuperAdminPage() {
  const toast = useToast();
  const [schools, setSchools] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<
    | "createSchool"
    | "editSchool"
    | "viewSchool"
    | "createAdmin"
    | "deleteSchool"
    | null
  >(null);
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [schoolForm, setSchoolForm] = useState(emptySchoolForm);
  const [adminForm, setAdminForm] = useState(emptyAdminForm);
  const [newClass, setNewClass] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await superAdminApi.getSchools();
      setSchools(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreateSchool = async () => {
    if (!schoolForm.name || schoolForm.classes.length === 0) {
      toast.error("School name and at least one class are required.");
      return;
    }
    setSaving(true);
    try {
      await superAdminApi.createSchool(schoolForm);
      toast.success("School created successfully.");
      setModal(null);
      setSchoolForm(emptySchoolForm);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleEditSchool = async () => {
    if (!schoolForm.name || schoolForm.classes.length === 0) {
      toast.error("School name and at least one class are required.");
      return;
    }
    setSaving(true);
    try {
      await superAdminApi.updateSchool(selected.id, schoolForm);
      toast.success("School updated successfully.");
      setModal(null);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSchool = async () => {
    if (!selected) return;
    setDeleting(true);
    try {
      await superAdminApi.deleteSchool(selected.id);
      toast.success("School and all data deleted.");
      setModal(null);
      setSelected(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setDeleting(false);
    }
  };

  const handleCreateAdmin = async () => {
    if (!adminForm.username || !adminForm.password) {
      toast.error("Username and password are required.");
      return;
    }
    setSaving(true);
    try {
      await superAdminApi.createAdmin(selected.id, adminForm);
      toast.success("Admin user created successfully.");
      setModal(null);
      setAdminForm(emptyAdminForm);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const addClass = () => {
    const trimmed = newClass.trim().toLowerCase();
    if (!trimmed) return;
    if (schoolForm.classes.includes(trimmed)) {
      toast.error("Class already added.");
      return;
    }
    setSchoolForm({ ...schoolForm, classes: [...schoolForm.classes, trimmed] });
    setNewClass("");
  };

  const removeClass = (cls: string) => {
    setSchoolForm({
      ...schoolForm,
      classes: schoolForm.classes.filter((c) => c !== cls),
    });
  };

  const filtered = schools.filter(
    (s) =>
      !search ||
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="School Management"
        subtitle="Create and manage schools"
        icon={<School size={20} />}
        action={
          <Button
            leftIcon={<Plus size={15} />}
            onClick={() => {
              setSchoolForm(emptySchoolForm);
              setNewClass("");
              setModal("createSchool");
            }}
          >
            New School
          </Button>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <StatCard
          label="Total Schools"
          value={schools.length}
          icon={<School size={18} />}
          accent
        />
        <StatCard
          label="Total Students"
          value={schools.reduce((s, sc) => s + (sc._count?.students || 0), 0)}
          icon={<Users size={18} />}
          sub="Across all schools"
        />
        <StatCard
          className="col-span-2 sm:col-span-1"
          label="Total Admins"
          value={schools.reduce((s, sc) => s + (sc._count?.users || 0), 0)}
          icon={<UserPlus size={18} />}
          sub="Across all schools"
        />
      </div>

      <div className="mb-3 sm:mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search schools..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<School size={40} />}
            title="No schools yet"
            action={
              <Button onClick={() => setModal("createSchool")}>
                New School
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>School</Th>
                <Th className="hidden sm:table-cell">Classes</Th>
                <Th className="hidden md:table-cell">Students</Th>
                <Th className="hidden md:table-cell">Admins</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <Tr
                  key={s.id}
                  clickable
                  onClick={() => {
                    setSelected(s);
                    setModal("viewSchool");
                  }}
                >
                  <Td>
                    <p className="m-0 font-semibold text-white text-[13px]">
                      {s.fullName || s.name}
                    </p>
                    <p className="m-0 text-[11px] text-light font-mono">
                      {s.name}
                    </p>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <div className="flex flex-wrap gap-1">
                      {s.classes?.slice(0, 4).map((c: string) => (
                        <Badge key={c} variant="info">
                          {c.toUpperCase()}
                        </Badge>
                      ))}
                      {s.classes?.length > 4 && (
                        <Badge variant="neutral">+{s.classes.length - 4}</Badge>
                      )}
                    </div>
                  </Td>
                  <Td className="hidden md:table-cell text-light">
                    {s._count?.students || 0}
                  </Td>
                  <Td className="hidden md:table-cell text-light">
                    {s._count?.users || 0}
                  </Td>
                  <Td>
                    <div
                      className="flex items-center gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => {
                          setSelected(s);
                          setSchoolForm({
                            name: s.name,
                            fullName: s.fullName || "",
                            classes: s.classes || [],
                          });
                          setNewClass("");
                          setModal("editSchool");
                        }}
                        className="p-1.5 rounded-md cursor-pointer text-light hover:text-primary hover:bg-primary/10 transition-all"
                        title="Edit"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(s);
                          setAdminForm(emptyAdminForm);
                          setModal("createAdmin");
                        }}
                        className="p-1.5 rounded-md cursor-pointer text-light hover:text-success hover:bg-success/10 transition-all"
                        title="Add Admin"
                      >
                        <UserPlus size={13} />
                      </button>
                      <button
                        onClick={() => {
                          setSelected(s);
                          setModal("deleteSchool");
                        }}
                        className="p-1.5 rounded-md cursor-pointer text-light hover:text-danger hover:bg-danger/10 transition-all"
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

      {/* ── Create School Modal ───────────────────────────────────────── */}
      <Modal
        open={modal === "createSchool"}
        onClose={() => setModal(null)}
        title="Create New School"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="School Short Name"
            placeholder="e.g. greenfield (used as unique ID)"
            value={schoolForm.name}
            onChange={(e) =>
              setSchoolForm({ ...schoolForm, name: e.target.value })
            }
            hint="Lowercase, no spaces. This is the unique identifier."
            required
          />
          <Input
            label="Full School Name"
            placeholder="e.g. Greenfield Academy"
            value={schoolForm.fullName}
            onChange={(e) =>
              setSchoolForm({ ...schoolForm, fullName: e.target.value })
            }
          />

          <Divider label="Classes / Levels" />

          <div className="flex gap-2">
            <Input
              placeholder="e.g. js1 or primary1"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addClass();
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addClass}>
              Add
            </Button>
          </div>

          {schoolForm.classes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schoolForm.classes.map((cls) => (
                <span
                  key={cls}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-variant border border-primary-variant text-[12px] text-white font-medium"
                >
                  {cls.toUpperCase()}
                  <button
                    onClick={() => removeClass(cls)}
                    className="text-light hover:text-danger transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

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
              onClick={handleCreateSchool}
              className="flex-1"
            >
              Create School
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit School Modal ─────────────────────────────────────────── */}
      <Modal
        open={modal === "editSchool"}
        onClose={() => setModal(null)}
        title="Edit School"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="School Short Name"
            value={schoolForm.name}
            onChange={(e) =>
              setSchoolForm({ ...schoolForm, name: e.target.value })
            }
            required
          />
          <Input
            label="Full School Name"
            value={schoolForm.fullName}
            onChange={(e) =>
              setSchoolForm({ ...schoolForm, fullName: e.target.value })
            }
          />

          <Divider label="Classes / Levels" />

          <div className="flex gap-2">
            <Input
              placeholder="e.g. js1 or primary1"
              value={newClass}
              onChange={(e) => setNewClass(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addClass();
                }
              }}
              className="flex-1"
            />
            <Button variant="secondary" onClick={addClass}>
              Add
            </Button>
          </div>

          {schoolForm.classes.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {schoolForm.classes.map((cls) => (
                <span
                  key={cls}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary-variant border border-primary-variant text-[12px] text-white font-medium"
                >
                  {cls.toUpperCase()}
                  <button
                    onClick={() => removeClass(cls)}
                    className="text-light hover:text-danger transition-colors"
                  >
                    <X size={11} />
                  </button>
                </span>
              ))}
            </div>
          )}

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
              onClick={handleEditSchool}
              className="flex-1"
            >
              Save Changes
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── View School Modal ─────────────────────────────────────────── */}
      <Modal
        open={modal === "viewSchool"}
        onClose={() => setModal(null)}
        title="School Details"
        size="lg"
      >
        {selected && (
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Short Name
                </p>
                <p className="text-[14px] font-mono text-primary m-0">
                  {selected.name}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Full Name
                </p>
                <p className="text-[14px] text-white font-medium m-0">
                  {selected.fullName || "—"}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Students
                </p>
                <p className="text-[14px] text-white font-medium m-0">
                  {selected._count?.students || 0}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Admin Users
                </p>
                <p className="text-[14px] text-white font-medium m-0">
                  {selected._count?.users || 0}
                </p>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-2">
                Classes
              </p>
              <div className="flex flex-wrap gap-2">
                {selected.classes?.map((c: string) => (
                  <Badge key={c} variant="info">
                    {c.toUpperCase()}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setModal(null)}
                className="flex-1"
              >
                Close
              </Button>
              <Button
                variant="secondary"
                leftIcon={<UserPlus size={13} />}
                onClick={() => {
                  setAdminForm(emptyAdminForm);
                  setModal("createAdmin");
                }}
                className="flex-1"
              >
                Add Admin
              </Button>
              <Button
                leftIcon={<Pencil size={13} />}
                onClick={() => {
                  setSchoolForm({
                    name: selected.name,
                    fullName: selected.fullName || "",
                    classes: selected.classes || [],
                  });
                  setNewClass("");
                  setModal("editSchool");
                }}
                className="flex-1"
              >
                Edit
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ── Create Admin Modal ────────────────────────────────────────── */}
      <Modal
        open={modal === "createAdmin"}
        onClose={() => setModal(null)}
        title={`Add Admin — ${selected?.name}`}
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Input
            label="Full Name"
            placeholder="e.g. John Adeyemi"
            value={adminForm.name}
            onChange={(e) =>
              setAdminForm({ ...adminForm, name: e.target.value })
            }
          />
          <Input
            label="Username"
            placeholder="e.g. john.admin"
            value={adminForm.username}
            onChange={(e) =>
              setAdminForm({ ...adminForm, username: e.target.value })
            }
            required
          />
          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Set a strong password..."
            value={adminForm.password}
            onChange={(e) =>
              setAdminForm({ ...adminForm, password: e.target.value })
            }
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
              onClick={handleCreateAdmin}
              className="flex-1"
            >
              Create Admin
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Delete School Confirm ─────────────────────────────────────── */}
      <ConfirmDialog
        open={modal === "deleteSchool"}
        title="Delete School"
        message={`Are you sure you want to delete "${selected?.fullName || selected?.name}"? This will permanently delete ALL students, fees, payments, journals and every record. This cannot be undone.`}
        confirmLabel="Delete School"
        variant="danger"
        loading={deleting}
        onConfirm={handleDeleteSchool}
        onCancel={() => setModal(null)}
      />
    </div>
  );
}
