import { useEffect, useState } from "react";
import { FileText, Eye, Send, RotateCcw, Sparkles } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { journalApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
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
  Divider,
} from "../../components";
import { fmt, journalStatusColor, getErrorMessage } from "../../utils/helpers";

const statusTabs = [
  { value: "ALL", label: "All" },
  { value: "DRAFT", label: "Draft" },
  { value: "POSTED", label: "Posted" },
  { value: "REVERSED", label: "Reversed" },
];

export default function JournalPage() {
  const { accountingAuth } = useApp();
  const { schoolId, userId, currentSessionId } = accountingAuth;
  const toast = useToast();
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"closing" | "view" | "reverse" | null>(
    null,
  );
  const [selected, setSelected] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [reverseReason, setReverseReason] = useState("");

  // Closing entry state
  const [closingPreview, setClosingPreview] = useState<any>(null);
  const [closingDescription, setClosingDescription] = useState("");

  const load = async () => {
    if (!schoolId) return;
    setLoading(true);
    try {
      const jRes = await journalApi.getAll(schoolId, {
        sessionId: currentSessionId || undefined,
      });
      setEntries(jRes.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [schoolId, currentSessionId]);

  const filtered = entries.filter((e) => {
    const matchStatus = statusFilter === "ALL" || e.status === statusFilter;
    const matchSearch =
      !search ||
      e.description.toLowerCase().includes(search.toLowerCase()) ||
      e.entryNumber.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  // Generate closing entry preview from backend
  const handleOpenClosing = async () => {
    if (!currentSessionId) {
      toast.error("No active session selected.");
      return;
    }
    setGenerating(true);
    setClosingPreview(null);
    setClosingDescription("");
    setModal("closing");
    try {
      const res = await journalApi.generateClosingEntry(
        schoolId,
        currentSessionId,
      );
      setClosingPreview(res.data);
      setClosingDescription(res.data.description);
    } catch (e) {
      toast.error(getErrorMessage(e));
      setModal(null);
    } finally {
      setGenerating(false);
    }
  };

  // Post the closing entry
  const handlePostClosing = async () => {
    if (!closingPreview || !closingDescription) {
      toast.error("Description is required.");
      return;
    }
    setSaving(true);
    try {
      // 1. Create the journal entry as DRAFT
      const res = await journalApi.create({
        date: new Date().toISOString().split("T")[0],
        description: closingDescription,
        sessionId: currentSessionId,
        schoolId,
        createdById: userId,
      });
      const entry = res.data;

      // 2. Add the pre-filled lines
      await journalApi.addLines(
        entry.id,
        closingPreview.lines.map((l: any) => ({
          accountId: l.accountId,
          entryType: l.entryType,
          amount: l.amount,
          narration: l.narration,
        })),
      );

      // 3. Post immediately
      await journalApi.post(entry.id);

      toast.success("Closing entry posted successfully.");
      setModal(null);
      setClosingPreview(null);
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handlePost = async (id: string) => {
    try {
      await journalApi.post(id);
      toast.success("Entry posted successfully.");
      load();
      if (selected?.id === id) {
        const res = await journalApi.getOne(id);
        setSelected(res.data);
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  const handleReverse = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await journalApi.reverse(selected.id, {
        createdById: userId,
        reason: reverseReason,
      });
      toast.success("Entry reversed successfully.");
      setModal(null);
      setReverseReason("");
      load();
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const openView = async (id: string) => {
    try {
      const res = await journalApi.getOne(id);
      setSelected(res.data);
      setModal("view");
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Journal Entries"
        subtitle="Double-entry accounting ledger"
        icon={<FileText size={20} />}
        action={
          <Button leftIcon={<Sparkles size={15} />} onClick={handleOpenClosing}>
            <span className="hidden sm:inline">Period-End Closing</span>
            <span className="sm:hidden">Closing</span>
          </Button>
        }
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <Tabs
          tabs={statusTabs}
          active={statusFilter}
          onChange={setStatusFilter}
        />
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search entries..."
        />
      </div>

      <Card padding={false}>
        {loading ? (
          <Loader text="Loading journal entries..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<FileText size={40} />}
            title="No journal entries"
            description="Journal entries are created automatically when payments, expenses, loans and donations are recorded."
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Entry #</Th>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th>Description</Th>
                <Th className="hidden md:table-cell">Source</Th>
                <Th>Status</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => {
                const statusVar = journalStatusColor[e.status] as any;
                return (
                  <Tr key={e.id} clickable onClick={() => openView(e.id)}>
                    <Td>
                      <span className="font-mono text-[12px] sm:text-[13px] text-(--color-primary)">
                        {e.entryNumber}
                      </span>
                    </Td>
                    <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                      {fmt.date(e.date)}
                    </Td>
                    <Td>
                      <p className="m-0 font-medium text-white truncate max-w-[140px] sm:max-w-[280px]">
                        {e.description}
                      </p>
                    </Td>
                    <Td className="hidden md:table-cell">
                      <Badge variant="neutral">
                        {e.source.replace("_", " ")}
                      </Badge>
                    </Td>
                    <Td>
                      <Badge
                        variant={
                          statusVar === "neutral"
                            ? "neutral"
                            : statusVar === "success"
                              ? "success"
                              : "danger"
                        }
                        dot
                      >
                        {e.status}
                      </Badge>
                    </Td>
                    <Td>
                      <div
                        className="flex items-center gap-1.5 sm:gap-2"
                        onClick={(ev) => ev.stopPropagation()}
                      >
                        <Button
                          variant="ghost"
                          size="icon"
                          leftIcon={<Eye size={14} />}
                          onClick={() => openView(e.id)}
                        />
                        {e.status === "DRAFT" && (
                          <Button
                            variant="success"
                            size="sm"
                            leftIcon={<Send size={13} />}
                            onClick={() => handlePost(e.id)}
                          >
                            <span className="hidden sm:inline">Post</span>
                          </Button>
                        )}
                        {e.status === "POSTED" && (
                          <Button
                            variant="danger"
                            size="sm"
                            leftIcon={<RotateCcw size={13} />}
                            onClick={() => {
                              setSelected(e);
                              setModal("reverse");
                            }}
                          >
                            <span className="hidden sm:inline">Reverse</span>
                          </Button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      {/* ── Period-End Closing Modal ──────────────────────────────────── */}
      <Modal
        open={modal === "closing"}
        onClose={() => setModal(null)}
        title="Period-End Closing Entry"
        size="lg"
      >
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {generating ? (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-light text-[13px] m-0">
                Calculating closing entry from your income statement...
              </p>
            </div>
          ) : closingPreview ? (
            <>
              {/* Net profit summary */}
              <div
                className={`px-4 py-3 rounded-lg border ${closingPreview.netProfit >= 0 ? "border-success/30 bg-success/10" : "border-danger/30 bg-danger/10"}`}
              >
                <p className="m-0 text-[12px] text-light">
                  Net {closingPreview.profitOrLoss} this period
                </p>
                <p
                  className={`m-0 text-[18px] font-bold ${closingPreview.netProfit >= 0 ? "text-success" : "text-danger"}`}
                >
                  {fmt.currency(Math.abs(closingPreview.netProfit))}
                </p>
              </div>

              <Textarea
                label="Description"
                value={closingDescription}
                onChange={(e) => setClosingDescription(e.target.value)}
                required
              />

              <Divider label="Lines to be posted" />

              <Table>
                <thead>
                  <tr>
                    <Th>Account</Th>
                    <Th>Type</Th>
                    <Th className="text-right">Amount</Th>
                    <Th className="hidden sm:table-cell">Narration</Th>
                  </tr>
                </thead>
                <tbody>
                  {closingPreview.lines.map((l: any, i: number) => (
                    <Tr key={i}>
                      <Td>
                        <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                          {l.accountCode}
                        </span>
                        <span className="text-[13px]">{l.accountName}</span>
                      </Td>
                      <Td>
                        <Badge
                          variant={
                            l.entryType === "DEBIT" ? "success" : "danger"
                          }
                        >
                          {l.entryType}
                        </Badge>
                      </Td>
                      <Td className="text-right font-semibold whitespace-nowrap">
                        {fmt.currency(l.amount)}
                      </Td>
                      <Td className="text-light hidden sm:table-cell text-[12px]">
                        {l.narration}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>

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
                  onClick={handlePostClosing}
                  className="flex-1"
                >
                  Post Closing Entry
                </Button>
              </div>
            </>
          ) : null}
        </div>
      </Modal>

      {/* ── View Modal ────────────────────────────────────────────────── */}
      {selected && (
        <Modal
          open={modal === "view"}
          onClose={() => setModal(null)}
          title={`Journal Entry — ${selected.entryNumber}`}
          size="lg"
        >
          <div className="p-4 sm:p-6 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Date
                </p>
                <p className="text-[13px] sm:text-[14px] text-white font-medium m-0">
                  {fmt.date(selected.date)}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Status
                </p>
                <Badge
                  variant={
                    selected.status === "POSTED"
                      ? "success"
                      : selected.status === "REVERSED"
                        ? "danger"
                        : "neutral"
                  }
                  dot
                >
                  {selected.status}
                </Badge>
              </div>
              <div>
                <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                  Source
                </p>
                <Badge variant="neutral">{selected.source}</Badge>
              </div>
            </div>

            <div>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                Description
              </p>
              <p className="text-[13px] sm:text-[14px] text-white m-0">
                {selected.description}
              </p>
            </div>

            <Divider label="Lines" />

            <Table>
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th className="text-right">Amount</Th>
                  <Th className="hidden sm:table-cell">Narration</Th>
                </tr>
              </thead>
              <tbody>
                {selected.lines?.map((l: any) => (
                  <Tr key={l.id}>
                    <Td>
                      <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                        {l.Account?.code}
                      </span>
                      <span className="text-[13px]">{l.Account?.name}</span>
                    </Td>
                    <Td>
                      <Badge
                        variant={l.entryType === "DEBIT" ? "success" : "danger"}
                      >
                        {l.entryType}
                      </Badge>
                    </Td>
                    <Td className="text-right font-semibold whitespace-nowrap">
                      {fmt.currency(l.amount)}
                    </Td>
                    <Td className="text-light hidden sm:table-cell">
                      {l.narration || "—"}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>

            {selected.status === "DRAFT" && (
              <div className="pt-2">
                <Button
                  leftIcon={<Send size={15} />}
                  onClick={() => handlePost(selected.id)}
                  className="w-full"
                >
                  Post This Entry
                </Button>
              </div>
            )}
            {selected.status === "POSTED" && (
              <div className="pt-2">
                <Button
                  variant="danger"
                  leftIcon={<RotateCcw size={15} />}
                  onClick={() => setModal("reverse")}
                  className="w-full"
                >
                  Reverse This Entry
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* ── Reverse Modal ─────────────────────────────────────────────── */}
      <Modal
        open={modal === "reverse"}
        onClose={() => setModal(null)}
        title="Reverse Entry"
        size="sm"
      >
        <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
          <p className="text-[13px] sm:text-[14px] text-light m-0">
            This will create a new entry with all debits and credits flipped,
            and mark the original as REVERSED.
          </p>
          <Textarea
            label="Reason for reversal"
            placeholder="Explain why this is being reversed..."
            value={reverseReason}
            onChange={(e) => setReverseReason(e.target.value)}
          />
          <div className="flex gap-2 sm:gap-3">
            <Button
              variant="secondary"
              onClick={() => setModal(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              loading={saving}
              onClick={handleReverse}
              className="flex-1"
            >
              Confirm Reversal
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
