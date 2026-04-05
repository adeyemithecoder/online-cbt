import { useEffect, useState } from "react";
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Scale,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { reportsApi, accountsApi } from "../../api/client";
import { useToast } from "../../context/ToastContext";
import {
  Button,
  Select,
  Loader,
  PageHeader,
  Card,
  Table,
  Th,
  Td,
  Tr,
  Tabs,
  Badge,
  Divider,
} from "../../components";
import { fmt, getErrorMessage } from "../../utils/helpers";

const reportTabs = [
  { value: "trial-balance", label: "Trial Balance" },
  { value: "balance-sheet", label: "Balance Sheet" },
  { value: "income-statement", label: "Income Statement" },
  { value: "ledger", label: "Ledger" },
];

export default function ReportsPage() {
  const { accountingAuth } = useApp();
  const { schoolId, currentSessionId } = accountingAuth;
  const toast = useToast();
  const [tab, setTab] = useState("trial-balance");
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccount, setSelectedAccount] = useState("");
  const [data, setData] = useState<any>(null);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.code} — ${a.name}`,
  }));

  useEffect(() => {
    if (schoolId) {
      accountsApi.getAll(schoolId).then((res) => setAccounts(res.data));
    }
  }, [schoolId]);

  const load = async () => {
    if (!schoolId || !currentSessionId) {
      toast.error("Please set School ID and Session ID first.");
      return;
    }
    setLoading(true);
    setData(null);
    try {
      let res;
      if (tab === "trial-balance") {
        res = await reportsApi.trialBalance(schoolId, currentSessionId);
      } else if (tab === "balance-sheet") {
        res = await reportsApi.balanceSheet(schoolId, currentSessionId);
      } else if (tab === "income-statement") {
        res = await reportsApi.incomeStatement(schoolId, currentSessionId);
      } else if (tab === "ledger") {
        if (!selectedAccount) {
          toast.error("Please select an account for the ledger.");
          setLoading(false);
          return;
        }
        res = await reportsApi.ledger(
          selectedAccount,
          currentSessionId,
          schoolId,
        );
      }
      setData(res?.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 animate-fade-in">
      <PageHeader
        title="Financial Reports"
        subtitle="Session-based accounting reports (posted entries only)"
        icon={<BarChart3 size={20} />}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <Tabs
          tabs={reportTabs}
          active={tab}
          onChange={(v) => {
            setTab(v);
            setData(null);
          }}
        />
        <div className="flex items-center gap-2 sm:gap-3">
          {tab === "ledger" && (
            <div className="flex-1 sm:flex-none sm:w-64">
              <Select
                options={accountOptions}
                value={selectedAccount}
                onChange={(e) => setSelectedAccount(e.target.value)}
                placeholder="Select account..."
              />
            </div>
          )}
          <Button
            leftIcon={<RefreshCw size={14} />}
            onClick={load}
            className="shrink-0"
          >
            <span className="hidden sm:inline">Generate Report</span>
            <span className="sm:hidden">Generate</span>
          </Button>
        </div>
      </div>

      {loading && <Loader text="Generating report..." />}

      {/* Trial Balance */}
      {!loading && data && tab === "trial-balance" && (
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-border gap-2">
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-white m-0">
              Trial Balance
            </h3>
            <Badge variant={data.isBalanced ? "success" : "danger"} dot>
              {data.isBalanced
                ? "Balanced"
                : `Off by ${fmt.currency(Math.abs(data.difference))}`}
            </Badge>
          </div>

          <Table>
            <thead>
              <tr>
                <Th>Code</Th>
                <Th>Account Name</Th>
                <Th className="hidden sm:table-cell">Type</Th>
                <Th className="text-right">Debit</Th>
                <Th className="text-right">Credit</Th>
                <Th className="text-right hidden sm:table-cell">Net Balance</Th>
              </tr>
            </thead>
            <tbody>
              {data.rows.map((r: any) => (
                <Tr key={r.code}>
                  <Td>
                    <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary)">
                      {r.code}
                    </span>
                  </Td>
                  <Td>
                    <p className="m-0 font-medium text-white text-[13px]">
                      {r.name}
                    </p>
                    <div className="sm:hidden mt-0.5">
                      <Badge variant="neutral">{r.accountType}</Badge>
                    </div>
                  </Td>
                  <Td className="hidden sm:table-cell">
                    <Badge variant="neutral">{r.accountType}</Badge>
                  </Td>
                  <Td className="text-right text-primary whitespace-nowrap">
                    {r.totalDebit > 0 ? fmt.currency(r.totalDebit) : "—"}
                  </Td>
                  <Td className="text-right text-light whitespace-nowrap">
                    {r.totalCredit > 0 ? fmt.currency(r.totalCredit) : "—"}
                  </Td>
                  <Td className="text-right font-semibold hidden sm:table-cell whitespace-nowrap">
                    {fmt.currency(r.netBalance)}
                  </Td>
                </Tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border">
                <Td colSpan={3} className="font-bold text-white">
                  TOTALS
                </Td>
                <Td className="text-right font-bold text-primary whitespace-nowrap">
                  {fmt.currency(data.grandTotalDebit)}
                </Td>
                <Td className="text-right font-bold text-light whitespace-nowrap">
                  {fmt.currency(data.grandTotalCredit)}
                </Td>
                <Td className="hidden sm:table-cell" />
              </tr>
            </tfoot>
          </Table>
        </Card>
      )}

      {/* Balance Sheet */}
      {!loading && data && tab === "balance-sheet" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-center gap-3 mb-2">
            {data.isBalanced ? (
              <Badge variant="success" dot>
                Assets = Liabilities + Equity ✓
              </Badge>
            ) : (
              <Badge variant="danger" dot>
                {data.note}
              </Badge>
            )}
          </div>

          {/* Assets */}
          <Card>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingUp size={18} className="text-primary" />
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-white m-0">
                Assets
              </h3>
              <span className="ml-auto text-[15px] sm:text-[16px] font-bold text-primary whitespace-nowrap">
                {fmt.currency(data.assets.total)}
              </span>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th className="text-right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {data.assets.items.map((a: any) => (
                  <Tr key={a.code}>
                    <Td>
                      <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                        {a.code}
                      </span>
                      {a.name}
                    </Td>
                    <Td className="text-right font-medium text-primary whitespace-nowrap">
                      {fmt.currency(a.balance)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Liabilities */}
          <Card>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <TrendingDown size={18} className="text-danger" />
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-white m-0">
                Liabilities
              </h3>
              <span className="ml-auto text-[15px] sm:text-[16px] font-bold text-danger whitespace-nowrap">
                {fmt.currency(data.liabilities.total)}
              </span>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th className="text-right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {data.liabilities.items.map((a: any) => (
                  <Tr key={a.code}>
                    <Td>
                      <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                        {a.code}
                      </span>
                      {a.name}
                    </Td>
                    <Td className="text-right font-medium text-danger whitespace-nowrap">
                      {fmt.currency(a.balance)}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </Card>

          {/* Equity */}
          <Card>
            <div className="flex items-center gap-2 mb-3 sm:mb-4">
              <Scale size={18} className="text-light" />
              <h3 className="text-[14px] sm:text-[15px] font-semibold text-white m-0">
                Equity
              </h3>
              <span className="ml-auto text-[15px] sm:text-[16px] font-bold text-light whitespace-nowrap">
                {fmt.currency(data.equity.total)}
              </span>
            </div>
            <Table>
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th className="text-right">Balance</Th>
                </tr>
              </thead>
              <tbody>
                {data.equity.items.map((a: any) => (
                  <Tr key={a.code}>
                    <Td>
                      <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                        {a.code}
                      </span>
                      {a.name}
                    </Td>
                    <Td className="text-right font-medium text-light whitespace-nowrap">
                      {fmt.currency(a.balance)}
                    </Td>
                  </Tr>
                ))}

                {/* ADD THIS: */}
                {data.netProfit !== 0 && (
                  <Tr>
                    <Td>
                      <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary) mr-1.5">
                        —
                      </span>
                      Current Period{" "}
                      {data.profitOrLoss === "PROFIT" ? "Profit" : "Loss"}
                    </Td>
                    <Td
                      className={`text-right font-medium whitespace-nowrap ${data.netProfit >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {fmt.currency(data.netProfit)}
                    </Td>
                  </Tr>
                )}
              </tbody>
            </Table>
            <Divider />
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold text-white text-[13px] sm:text-[14px]">
                Total Liabilities + Equity
              </span>
              <span className="font-bold text-[16px] sm:text-[18px] text-light whitespace-nowrap">
                {fmt.currency(data.totalLiabilitiesPlusEquity)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Income Statement */}
      {!loading && data && tab === "income-statement" && (
        <div className="space-y-3 sm:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-3 sm:mb-4">
            <Card>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                Total Revenue
              </p>
              <p className="text-[20px] sm:text-[22px] font-bold text-success m-0">
                {fmt.currency(data.revenue.total)}
              </p>
            </Card>
            <Card>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                Total Expenses
              </p>
              <p className="text-[20px] sm:text-[22px] font-bold text-danger m-0">
                {fmt.currency(data.expenses.total)}
              </p>
            </Card>
            <Card>
              <p className="text-[11px] text-light uppercase tracking-wider m-0 mb-1">
                {data.profitOrLoss}
              </p>
              <p
                className={`text-[20px] sm:text-[22px] font-bold m-0 ${
                  data.netProfit >= 0 ? "text-(--color-primary)" : "text-danger"
                }`}
              >
                {fmt.currency(data.netProfit)}
              </p>
            </Card>
          </div>
        </div>
      )}

      {/* Ledger */}
      {!loading && data && tab === "ledger" && (
        <Card padding={false}>
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
            <h3 className="text-[14px] sm:text-[15px] font-semibold text-white m-0">
              Ledger: {data.account?.name}
            </h3>
            <p className="text-[11px] sm:text-[12px] text-light m-0 mt-0.5">
              Normal balance: {data.account?.normalBalance} · Closing:{" "}
              <strong className="text-(--color-primary)">
                {fmt.currency(data.closingBalance)}
              </strong>
            </p>
          </div>

          <Table>
            <thead>
              <tr>
                <Th className="hidden sm:table-cell">Date</Th>
                <Th>Entry #</Th>
                <Th>Description</Th>
                <Th className="hidden md:table-cell">Narration</Th>
                <Th className="text-right">Debit</Th>
                <Th className="text-right hidden sm:table-cell">Credit</Th>
                <Th className="text-right">Balance</Th>
              </tr>
            </thead>
            <tbody>
              {data.lines.map((l: any, i: number) => (
                <Tr key={i}>
                  <Td className="text-light hidden sm:table-cell whitespace-nowrap">
                    {fmt.date(l.date)}
                  </Td>
                  <Td>
                    <span className="font-mono text-[11px] sm:text-[12px] text-(--color-primary)">
                      {l.entryNumber}
                    </span>
                    <p className="m-0 text-[11px] text-light sm:hidden">
                      {fmt.date(l.date)}
                    </p>
                  </Td>
                  <Td>
                    <p className="m-0 text-white text-[13px] max-w-[120px] sm:max-w-none">
                      {l.description}
                    </p>
                  </Td>
                  <Td className="text-light hidden md:table-cell">
                    {l.narration || "—"}
                  </Td>
                  <Td className="text-right text-primary whitespace-nowrap">
                    {l.debit > 0 ? fmt.currency(l.debit) : "—"}
                  </Td>
                  <Td className="text-right text-light hidden sm:table-cell whitespace-nowrap">
                    {l.credit > 0 ? fmt.currency(l.credit) : "—"}
                  </Td>
                  <Td
                    className={`text-right font-semibold whitespace-nowrap ${
                      l.runningBalance >= 0 ? "text-success" : "text-danger"
                    }`}
                  >
                    {fmt.currency(l.runningBalance)}
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </Card>
      )}
    </div>
  );
}
