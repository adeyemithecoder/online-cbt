import { useEffect, useState } from "react";
import { CalendarDays, Plus, Lock, Unlock, Star } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { sessionsApi } from "../../api/client";
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
} from "../../components";
import { fmt, TERM_TYPES, getErrorMessage } from "../../utils/helpers";

const SESSION_OPTIONS = Array.from({ length: 6 }, (_, i) => {
  const start = 2026 + i;
  const end = start + 1;

  return {
    value: `${start}/${end}`,
    label: `${start}/${end}`,
  };
});

export default function SessionsPage() {
  const { accountingAuth, setAccountingAuth } = useApp();
  const { schoolId } = accountingAuth;
  const toast = useToast();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    term: "",
    startDate: "",
    endDate: "",
  });

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await sessionsApi.getAll(schoolId);
      setSessions(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId]);

  const handleCreate = async () => {
    if (!form.name || !form.term || !form.startDate || !form.endDate) {
      toast.error("All fields are required.");
      return;
    }
    setSaving(true);
    try {
      await sessionsApi.create({ ...form, schoolId });
      toast.success("Session created.");
      setModal(false);
      setForm({ name: "", term: "", startDate: "", endDate: "" });
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };
  const handleSetCurrent = async (id: string) => {
    setActionId(id);
    try {
      await sessionsApi.setCurrent(id, schoolId);
      setAccountingAuth({
        ...accountingAuth,
        currentSessionId: id,
      });
      toast.success("Current session updated.");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionId(null);
    }
  };

  const handleToggleLock = async (session: any) => {
    setActionId(session.id);
    try {
      if (session.isLocked) {
        await sessionsApi.unlock(session.id);
        toast.success("Session unlocked.");
      } else {
        await sessionsApi.lock(session.id);
        toast.success("Session locked.");
      }
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      <PageHeader
        title="Academic Sessions"
        subtitle="Manage academic terms and periods"
        icon={<CalendarDays size={20} />}
        action={
          <Button leftIcon={<Plus size={15} />} onClick={() => setModal(true)}>
            New Session
          </Button>
        }
      />

      <Card padding={false}>
        {loading ? (
          <Loader text="Loading sessions..." />
        ) : sessions.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={40} />}
            title="No sessions yet"
            description="Create your first academic session to get started."
            action={
              <Button
                leftIcon={<Plus size={15} />}
                onClick={() => setModal(true)}
              >
                New Session
              </Button>
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Session</Th>
                <Th>Term</Th>
                <Th className="hidden sm:table-cell">Period</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>

            <tbody>
              {sessions.map((s) => (
                <Tr key={s.id}>
                  <Td>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="m-0 font-semibold text-white text-[13px]">
                        {s.name}
                      </p>
                      {s.isCurrent && (
                        <Badge variant="info" dot>
                          Current
                        </Badge>
                      )}
                    </div>
                  </Td>

                  <Td>
                    <div className="flex items-center">
                      <Badge
                        variant={
                          s.term === "FIRST"
                            ? "info"
                            : s.term === "SECOND"
                              ? "neutral"
                              : "warning"
                        }
                      >
                        {s.term} Term
                      </Badge>
                    </div>
                  </Td>

                  <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                    {fmt.date(s.startDate)} — {fmt.date(s.endDate)}
                  </Td>

                  <Td>
                    <Badge variant={s.isLocked ? "danger" : "success"} dot>
                      {s.isLocked ? "Locked" : "Open"}
                    </Badge>
                  </Td>

                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      {!s.isCurrent && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={actionId === s.id}
                          leftIcon={<Star size={13} />}
                          onClick={() => handleSetCurrent(s.id)}
                        >
                          <span className="hidden sm:inline">Set Current</span>
                          <span className="sm:hidden">Set</span>
                        </Button>
                      )}

                      <Button
                        variant={s.isLocked ? "success" : "danger"}
                        size="sm"
                        loading={actionId === s.id}
                        leftIcon={
                          s.isLocked ? <Unlock size={13} /> : <Lock size={13} />
                        }
                        onClick={() => handleToggleLock(s)}
                      >
                        {s.isLocked ? "Unlock" : "Lock"}
                      </Button>
                    </div>
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
        title="Create Academic Session"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <Select
            label="Session Name"
            options={SESSION_OPTIONS}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Select session"
            required
          />

          <Select
            label="Term"
            options={TERM_TYPES}
            value={form.term}
            onChange={(e) => setForm({ ...form, term: e.target.value })}
            placeholder="Select term"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
              required
            />

            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              required
            />
          </div>

          <div className="flex gap-2 sm:gap-3 pt-2">
            <Button
              variant="secondary"
              onClick={() => setModal(false)}
              className="flex-1"
            >
              Cancel
            </Button>

            <Button loading={saving} onClick={handleCreate} className="flex-1">
              Create Session
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
