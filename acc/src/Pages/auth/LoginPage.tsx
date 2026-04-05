import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { Input } from "../../components";
import axios from "axios";

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAccountingAuth } = useApp();

  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const apiUrl =
    import.meta.env.MODE == "development"
      ? "http://localhost:5000/api/users"
      : "https://cbt-api-rho.vercel.app/api/users";
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${apiUrl}/login-user`, form);
      const { user, token, currentSessionId } = res.data;
      setAccountingAuth({
        userId: user.id,
        schoolId: user.schoolId,
        token,
        currentSessionId,
      });
      navigate("/");
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-(--color-bg) via-(--color-bg-deep) to-(--color-bg) flex items-center justify-center px-4 overflow-hidden relative">
      {/* Glow blobs */}
      <div className="absolute w-[500px] h-[500px] bg-(--color-primary-variant) blur-[120px] rounded-full top-[-100px] left-[-100px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] bg-(--color-primary-variant) blur-[100px] rounded-full bottom-[-100px] right-[-100px] pointer-events-none" />

      {/* Card */}
      <div className="relative w-full max-w-[400px] bg-white/5 backdrop-blur-xl border border-(--color-border) rounded-2xl p-8 shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-(--color-primary) flex items-center justify-center shadow-[0_4px_20px_rgba(77,181,255,0.4)]">
            <span className="text-(--color-bg) font-bold text-2xl">₦</span>
          </div>
          <h2 className="text-white text-[22px] font-bold leading-tight">
            School Accounting
          </h2>
          <p className="text-light text-[13px] mt-1.5">
            Sign in to your financial system
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Username"
            placeholder="Enter your username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            leftIcon={<User size={14} />}
            required
            autoComplete="username"
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            leftIcon={<Lock size={14} />}
            required
            autoComplete="current-password"
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

          {/* Error message */}
          {error && (
            <p className="text-[12px] text-danger bg-danger/10 border border-danger/20 rounded-lg px-3 py-2 m-0">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 rounded-lg bg-(--color-primary) text-(--color-bg) font-semibold text-[14px] hover:bg-(--color-primary-variant) hover:text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-[0_2px_16px_rgba(77,181,255,0.35)]"
          >
            {loading && (
              <span className="w-4 h-4 border-2 border-(--color-bg) border-t-transparent rounded-full animate-spin" />
            )}
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-[11px] text-light mt-6 m-0">
          Secure access · School Finance System
        </p>
      </div>
    </div>
  );
}
