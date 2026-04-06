import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  LayoutDashboard,
  BookOpen,
  FileText,
  CreditCard,
  TrendingDown,
  Landmark,
  Gift,
  Shield,
  BarChart3,
  CalendarDays,
  ChevronRight,
  GraduationCap,
  Users,
  LogOut,
  Menu,
  X,
  Receipt,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ConfirmDialog } from "..";

const navGroups = [
  {
    label: "Overview",
    items: [
      { to: "/", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/sessions", icon: CalendarDays, label: "Academic Sessions" },
    ],
  },
  {
    label: "Accounting",
    items: [
      { to: "/accounts", icon: BookOpen, label: "Chart of Accounts" },
      { to: "/journal", icon: FileText, label: "Journal Entries" },
    ],
  },
  {
    label: "School Finance",
    items: [
      { to: "/students", icon: Users, label: "Students" },
      { to: "/fees", icon: GraduationCap, label: "Fee Management" },
      { to: "/payments", icon: CreditCard, label: "Fee Payments" },
      { to: "/expenses", icon: TrendingDown, label: "Expenses" },
    ],
  },
  {
    label: "Other Transactions",
    items: [
      { to: "/loans", icon: Landmark, label: "Loans" },
      { to: "/donations", icon: Gift, label: "Donations" },
      { to: "/other-transactions", icon: Receipt, label: "Other Transactions" },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/reports", icon: BarChart3, label: "Reports" },
      { to: "/audit", icon: Shield, label: "Audit Log" },
    ],
  },
];

// ─── Nav items renderer (shared between sidebar and mobile drawer) ──────────
function NavItems({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();

  return (
    <nav className="flex-1 px-3 py-4 flex flex-col gap-5 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="text-[10px] font-bold text-light uppercase tracking-widest mb-2 px-3">
            {group.label}
          </p>
          <div className="flex flex-col gap-0.5">
            {group.items.map(({ to, icon: Icon, label }) => {
              const isActive =
                to === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(to);

              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onNavigate}
                  className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group ${
                    isActive
                      ? "bg-(--color-primary-variant) text-white border border-(--color-primary-variant)"
                      : "text-light hover:text-(--color-primary) hover:bg-bg-deep"
                  }`}
                >
                  <Icon
                    size={15}
                    className={`shrink-0 ${
                      isActive
                        ? "text-(--color-primary)"
                        : "text-light group-hover:text-white"
                    }`}
                  />
                  {label}
                  {isActive && (
                    <ChevronRight
                      size={12}
                      className="ml-auto text-(--color-primary-variant)"
                    />
                  )}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );
}

// ─── Shared header logo block ───────────────────────────────────────────────
function SidebarLogo() {
  return (
    <div className="px-5 py-6 border-b border-bg-deep shrink-0">
      <div className="flex items-center gap-3">
        <img src="/logo.png" alt="Logo" className="w-8 h-8 object-contain" />
        <div>
          <p className="text-[14px] font-bold text-white m-0 leading-none">
            Accounts
          </p>
          <p className="text-[11px] text-light m-0 mt-0.5">School Finance</p>
        </div>
      </div>
    </div>
  );
}

// ─── Shared logout + footer block ──────────────────────────────────────────
function SidebarFooter({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="px-3 py-4 border-t border-bg-deep shrink-0 space-y-2">
      <button
        onClick={onLogout}
        className="w-full flex items-center cursor-pointer gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-light hover:text-danger hover:bg-danger/10 transition-all group"
      >
        <LogOut
          size={15}
          className="shrink-0 group-hover:text-danger transition-colors"
        />
        Logout
      </button>
      <div className="px-3">
        <p className="text-[11px] text-light m-0">School Accounting System</p>
        <p className="text-[11px] text-light opacity-70 m-0">v1.0.0</p>
      </div>
    </div>
  );
}

// ─── Main Sidebar export ────────────────────────────────────────────────────
export default function Sidebar() {
  const { clearAccountingAuth } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false); // ← add this

  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccountingAuth();
    setConfirmLogout(false);
    navigate("/");
  };

  return (
    <>
      {/* ── Mobile top bar ─────────────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-bg border-b border-bg-deep flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="w-7 h-7 object-contain" />
          <p className="text-[14px] font-bold text-white m-0">Accounts</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-light hover:text-white hover:bg-bg-deep transition-all"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
      </div>

      {/* ── Mobile drawer backdrop ──────────────────────────────────────── */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile drawer ───────────────────────────────────────────────── */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-[260px] bg-bg border-r border-bg-deep flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Close button */}
        <div className="px-5 py-6 border-b border-bg-deep flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <p className="text-[14px] font-bold text-white m-0 leading-none">
                Accounts
              </p>
              <p className="text-[11px] text-light m-0 mt-0.5">
                School Finance
              </p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-light hover:text-white hover:bg-bg-deep transition-all"
            aria-label="Close menu"
          >
            <X size={16} />
          </button>
        </div>

        <NavItems onNavigate={() => setMobileOpen(false)} />
        <SidebarFooter onLogout={() => setConfirmLogout(true)} />
      </aside>

      {/* ── Desktop sidebar (always visible on lg+) ─────────────────────── */}
      <aside className="hidden lg:flex w-[240px] shrink-0 bg-bg border-r border-bg-deep flex-col h-screen sticky top-0 overflow-hidden">
        <SidebarLogo />
        <NavItems />
        <SidebarFooter onLogout={() => setConfirmLogout(true)} />
      </aside>

      <ConfirmDialog
        open={confirmLogout}
        title="Logout"
        message="Are you sure you want to log out of the accounting system?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
