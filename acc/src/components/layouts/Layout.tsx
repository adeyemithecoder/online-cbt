import { Navigate, Outlet } from "react-router-dom";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";

export default function Layout() {
  const { accountingAuth } = useApp();
  const { userId } = accountingAuth;

  if (!userId) return <Navigate to="/login" replace />;

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-bg pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
