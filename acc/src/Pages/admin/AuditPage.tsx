import { useEffect, useState } from "react";
import { Shield, RefreshCw } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { auditApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Loader,
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  EmptyState,
  SearchInput,
  Badge,
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";

const actionColor: Record<string, string> = {
  CREATE: "green",
  UPDATE: "blue",
  POST: "gold",
  REVERSE: "red",
  DELETE: "red",
};

export default function AuditPage() {
  const { accountingAuth } = useApp();
  const { schoolId } = accountingAuth;
  const toast = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const res = await auditApi.getBySchool(schoolId);
      setLogs(res.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId]);

  const filtered = logs.filter(
    (l) =>
      !search ||
      l.entity.toLowerCase().includes(search.toLowerCase()) ||
      l.action.toLowerCase().includes(search.toLowerCase()) ||
      (l.User?.name || "").toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Audit Log"
        subtitle="Track all financial actions and changes"
        icon={<Shield size={20} />}
        action={
          <Button
            variant="secondary"
            leftIcon={<RefreshCw size={14} />}
            onClick={load}
          >
            <span className="hidden sm:inline">Refresh</span>
          </Button>
        }
      />

      <div className="mb-3 sm:mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by entity, action or user..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader />
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Shield size={40} />} title="No audit logs" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Action</Th>
                <Th>Entity</Th>
                <Th className="hidden md:table-cell">Entity ID</Th>
                <Th className="hidden sm:table-cell">User</Th>
                <Th>Timestamp</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const av: any = actionColor[l.action] || "gray";
                return (
                  <Tr key={l.id}>
                    <Td>
                      <Badge variant={av}>{l.action}</Badge>
                    </Td>
                    <Td>
                      <p className="m-0 font-medium text-white text-[13px]">
                        {l.entity}
                      </p>
                      <p className="m-0 text-[11px] text-[var(--color-light)] sm:hidden">
                        {l.User?.name || l.User?.username || "System"}
                      </p>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <span className="font-mono text-[11px] text-[var(--color-light)]">
                        {l.entityId}
                      </span>
                    </Td>
                    <Td className="text-[var(--color-light)] hidden sm:table-cell">
                      {l.User?.name || l.User?.username || "System"}
                    </Td>
                    <Td className="text-[var(--color-light)] whitespace-nowrap text-[12px] sm:text-[13px]">
                      {fmt.datetime(l.createdAt)}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>
    </div>
  );
}
