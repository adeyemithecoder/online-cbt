import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import SuperAdminLayout from "./SuperAdminLayout";

export default function Layout() {
  const { accountingAuth, clearAccountingAuth } = useApp();
  const { userId, role, token } = accountingAuth;

  if (!userId || !token) {
    clearAccountingAuth();
    return <Navigate to="/login" replace />;
  }

  if (role === "SUPER_ADMIN") return <SuperAdminLayout />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-bg pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
