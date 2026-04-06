import { useState } from "react";
import { NavLink, useLocation, useNavigate, Outlet } from "react-router-dom";
import { School, LogOut, Menu, X, ChevronRight } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { ConfirmDialog } from "..";

export default function SuperAdminLayout() {
  const { clearAccountingAuth } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAccountingAuth();
    setConfirmLogout(false);
    navigate("/login");
  };

  const NavContent = () => (
    <>
      <div className="px-5 py-6 border-b border-bg-deep shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary-variant flex items-center justify-center">
            <School size={16} className="text-primary" />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white m-0 leading-none">
              Super Admin
            </p>
            <p className="text-[11px] text-light m-0 mt-0.5">
              School Management
            </p>
          </div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-lg text-light hover:text-white hover:bg-bg-deep transition-all"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <p className="text-[10px] font-bold text-light uppercase tracking-widest mb-2 px-3">
          Management
        </p>
        {[{ to: "/super-admin", label: "Schools", icon: School }].map(
          ({ to, label, icon: Icon }) => {
            const isActive = location.pathname.startsWith(to);
            return (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all group ${
                  isActive
                    ? "bg-(--color-primary-variant) text-white border border-(--color-primary-variant)"
                    : "text-light hover:text-(--color-primary) hover:bg-bg-deep"
                }`}
              >
                <Icon
                  size={15}
                  className={`shrink-0 ${isActive ? "text-(--color-primary)" : "text-light group-hover:text-white"}`}
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
          },
        )}
      </nav>

      <div className="px-3 py-4 border-t border-bg-deep shrink-0">
        <button
          onClick={() => setConfirmLogout(true)}
          className="w-full flex items-center cursor-pointer gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium text-light hover:text-danger hover:bg-danger/10 transition-all group"
        >
          <LogOut
            size={15}
            className="shrink-0 group-hover:text-danger transition-colors"
          />
          Logout
        </button>
        <div className="px-3 mt-2">
          <p className="text-[11px] text-light m-0">School Accounting System</p>
          <p className="text-[11px] text-light opacity-70 m-0">v1.0.0</p>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-bg border-b border-bg-deep flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <School size={18} className="text-primary" />
          <p className="text-[14px] font-bold text-white m-0">Super Admin</p>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-light hover:text-white hover:bg-bg-deep transition-all"
        >
          <Menu size={20} />
        </button>
      </div>

      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`lg:hidden fixed top-0 left-0 z-50 h-screen w-[260px] bg-bg border-r border-bg-deep flex flex-col transition-transform duration-300 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent />
      </aside>

      <div className="flex min-h-screen">
        <aside className="hidden lg:flex w-[240px] shrink-0 bg-bg border-r border-bg-deep flex-col h-screen sticky top-0 overflow-hidden">
          <NavContent />
        </aside>
        <main className="flex-1 overflow-y-auto bg-bg pt-14 lg:pt-0">
          <Outlet />
        </main>
      </div>

      <ConfirmDialog
        open={confirmLogout}
        title="Logout"
        message="Are you sure you want to log out?"
        confirmLabel="Logout"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}
