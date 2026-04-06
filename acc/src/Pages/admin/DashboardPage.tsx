import { useEffect, useState } from "react";
import {
  TrendingUp,
  TrendingDown,
  CreditCard,
  AlertCircle,
  BookOpen,
  Users,
  Landmark,
  Gift,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  paymentsApi,
  expensesApi,
  studentFeesApi,
  loansApi,
  donationsApi,
  reportsApi,
} from "../../api/client";
import {
  StatCard,
  Card,
  Badge,
  Loader,
  Table,
  Th,
  Td,
  Tr,
} from "../../components";

import { fmt, feeStatusColor } from "../../utils/helpers";
import { useApp } from "../../context/AppContext";

export default function DashboardPage() {
  const { accountingAuth } = useApp();
  const { schoolId, currentSessionId } = accountingAuth;

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>({
    totalCollected: 0,
    totalExpenses: 0,
    outstanding: [],
    recentPayments: [],
    loans: [],
    donations: { totalDonated: 0 },
    incomeStatement: null,
  });

  useEffect(() => {
    if (!schoolId || !currentSessionId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      setLoading(true);
      try {
        const [payments, expenses, outstanding, loans, donations, is_] =
          await Promise.allSettled([
            paymentsApi.getBySession(currentSessionId),
            expensesApi.getAll(schoolId, {
              sessionId: currentSessionId,
              status: "APPROVED",
            }),
            studentFeesApi.getOutstanding(schoolId, currentSessionId),
            loansApi.getAll(schoolId, { sessionId: currentSessionId }),
            donationsApi.getAll(schoolId, currentSessionId),
            reportsApi.incomeStatement(schoolId, currentSessionId),
          ]);

        setData({
          totalCollected:
            payments.status === "fulfilled"
              ? payments.value.data.totalCollected
              : 0,
          totalExpenses:
            expenses.status === "fulfilled"
              ? expenses.value.data.reduce(
                  (s: number, e: any) => s + e.amount,
                  0,
                )
              : 0,
          outstanding:
            outstanding.status === "fulfilled"
              ? outstanding.value.data.fees?.slice(0, 5) || [] // ✅
              : [],
          outstandingCount:
            outstanding.status === "fulfilled"
              ? (outstanding.value.data.count ?? 0) // 🆕
              : 0,
          recentPayments:
            payments.status === "fulfilled"
              ? payments.value.data.payments?.slice(0, 5) || []
              : [],
          loans:
            loans.status === "fulfilled"
              ? loans.value.data.filter((l: any) => l.status === "ACTIVE")
              : [],
          donations:
            donations.status === "fulfilled"
              ? donations.value.data
              : { totalDonated: 0 },
          incomeStatement: is_.status === "fulfilled" ? is_.value.data : null,
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [schoolId, currentSessionId]);

  if (!schoolId) {
    return (
      <div className="p-8 min-h-screen bg-bg">
        <Card className="max-w-lg mx-auto text-center py-12">
          <AlertCircle
            color="red"
            size={40}
            className="text-gold-400 mx-auto mb-4"
          />
          <h2 className="text-[20px] font-semibold text-white m-0 mb-2">
            Setup Required
          </h2>
          <p className="text-white text-[14px] m-0 mb-4">
            Please configure your School ID and Session ID in settings to get
            started.
          </p>
        </Card>
      </div>
    );
  }

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size={32} text="Loading dashboard..." />
      </div>
    );

  const netProfit = data.incomeStatement?.netProfit ?? 0;

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-[22px] sm:text-[26px] font-bold text-white m-0">
          Financial Overview
        </h1>
        <p className="text-light text-[13px] sm:text-[14px] m-0 mt-1">
          Current session performance at a glance
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          label="Total Collected"
          value={fmt.currency(data.totalCollected)}
          icon={<CreditCard size={18} />}
          accent
        />
        <StatCard
          label="Total Expenses"
          value={fmt.currency(data.totalExpenses)}
          icon={<TrendingDown size={18} />}
        />
        <StatCard
          label="Net Profit/Loss"
          value={fmt.currency(netProfit)}
          icon={<TrendingUp size={18} />}
          sub={netProfit >= 0 ? "Surplus" : "Deficit"}
        />

        <StatCard
          label="Outstanding Fees"
          value={data.outstandingCount}
          icon={<AlertCircle size={18} />}
          sub="Students with balance"
        />
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        <StatCard
          label="Active Loans"
          value={data.loans.length}
          icon={<Landmark size={18} />}
          sub={
            data.loans.length > 0
              ? fmt.currency(
                  data.loans.reduce((s: number, l: any) => s + l.amount, 0),
                )
              : "No active loans"
          }
        />
        <StatCard
          label="Total Donations"
          value={fmt.currency(data.donations?.totalDonated || 0)}
          icon={<Gift size={18} />}
          sub={`${data.donations?.donations?.length || 0} donations this session`}
        />
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Recent Payments */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-bg-deep">
            <h3 className="text-[13px] sm:text-[14px] font-semibold text-white m-0">
              Recent Payments
            </h3>
            <Link
              to="/payments"
              className="text-[12px] text-primary hover:text-primary-variant flex items-center gap-1 no-underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {data.recentPayments.length === 0 ? (
            <div className="py-10 text-center text-light text-[13px]">
              No payments yet
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Amount</Th>
                    <Th>Date</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentPayments.map((p: any) => (
                    <Tr key={p.id}>
                      <Td>
                        <p className="m-0 text-[13px] font-medium text-white">
                          {p.Student?.name} {p.Student?.surname}
                        </p>
                        <p className="m-0 text-[11px] text-light">
                          {p.receiptNumber}
                        </p>
                      </Td>
                      <Td>
                        <span className="text-success font-semibold">
                          {fmt.currency(p.amountPaid)}
                        </span>
                      </Td>
                      <Td className="text-light whitespace-nowrap">
                        {fmt.date(p.paymentDate)}
                      </Td>
                    </Tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card>

        {/* Outstanding Fees */}
        <Card padding={false}>
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-bg-deep">
            <h3 className="text-[13px] sm:text-[14px] font-semibold text-white m-0">
              Outstanding Fees
            </h3>
            <Link
              to="/fees"
              className="text-[12px] text-primary hover:text-primary-variant flex items-center gap-1 no-underline"
            >
              View all <ArrowRight size={12} />
            </Link>
          </div>

          {data.outstanding.length === 0 ? (
            <div className="py-10 text-center text-light text-[13px]">
              No outstanding fees
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <thead>
                  <tr>
                    <Th>Student</Th>
                    <Th>Balance</Th>
                    <Th>Status</Th>
                  </tr>
                </thead>
                <tbody>
                  {data.outstanding.map((f: any) => {
                    const balance = f.amountCharged - f.amountPaid;

                    const statusVariant: any =
                      feeStatusColor[f.status] === "danger"
                        ? "danger"
                        : feeStatusColor[f.status] === "warning"
                          ? "warning"
                          : "success";

                    return (
                      <Tr key={f.id}>
                        <Td>
                          <p className="m-0 text-[13px] font-medium text-white">
                            {f.Student?.name} {f.Student?.surname}
                          </p>
                          <p className="m-0 text-[11px] text-light">
                            {f.Student?.level}
                          </p>
                        </Td>

                        <Td>
                          <span className="text-danger font-semibold whitespace-nowrap">
                            {fmt.currency(balance)}
                          </span>
                        </Td>

                        <Td>
                          <Badge variant={statusVariant} dot>
                            {f.status.replace("_", " ")}
                          </Badge>
                        </Td>
                      </Tr>
                    );
                  })}
                </tbody>
              </Table>
            </div>
          )}
        </Card>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {[
          {
            to: "/payments",
            icon: CreditCard,
            label: "Record Payment",
            color: "success",
          },
          {
            to: "/expenses",
            icon: TrendingDown,
            label: "Add Expense",
            color: "danger",
          },
          {
            to: "/journal",
            icon: BookOpen,
            label: "New Journal",
            color: "info",
          },
          {
            to: "/reports",
            icon: Users,
            label: "View Reports",
            color: "warning",
          },
        ].map(({ to, icon: Icon, label, color }) => (
          <Link key={to} to={to} className="no-underline group">
            <div className="bg-bg-deep border border-bg-deep rounded-xl p-3 sm:p-4 hover:border-primary-variant transition-all hover:bg-bg flex items-center gap-2 sm:gap-3">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0 ${
                  color === "success"
                    ? "bg-success-variant text-success"
                    : color === "danger"
                      ? "bg-danger-variant text-danger"
                      : color === "info"
                        ? "bg-primary-variant text-primary"
                        : "bg-warning-variant text-warning"
                }`}
              >
                <Icon size={16} />
              </div>

              <span className="text-[12px] sm:text-[13px] font-medium text-light group-hover:text-white transition-colors">
                {label}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
