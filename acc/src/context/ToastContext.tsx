import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { CheckCircle, XCircle, AlertTriangle, Info, X } from "lucide-react";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  timeoutId?: ReturnType<typeof setTimeout>;
}

interface ToastContextType {
  toast: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  warning: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toast: () => {},
  success: () => {},
  error: () => {},
  warning: () => {},
  info: () => {},
});

const icons: Record<ToastType, ReactNode> = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
};

const colors: Record<ToastType, string> = {
  success: "border-green-500 bg-green-500 text-black",
  error: "border-red-500 bg-red-500 text-white",
  warning: "border-yellow-500 bg-yellow-500 text-black",
  info: "border-blue-500 bg-blue-500 text-white",
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => {
      const toast = prev.find((t) => t.id === id);
      if (toast?.timeoutId) clearTimeout(toast.timeoutId);
      return prev.filter((t) => t.id !== id);
    });
  }, []);

  const toast = useCallback(
    (type: ToastType, message: string) => {
      const id = Math.random().toString(36).slice(2);

      const timeoutId = setTimeout(() => remove(id), 4000);

      setToasts((prev) => [...prev, { id, type, message, timeoutId }]);
    },
    [remove],
  );

  const pauseTimer = (id: string) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id === id && t.timeoutId) {
          clearTimeout(t.timeoutId);
          return { ...t, timeoutId: undefined };
        }
        return t;
      }),
    );
  };

  const resumeTimer = (id: string) => {
    const timeoutId = setTimeout(() => remove(id), 4000);

    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, timeoutId } : t)),
    );
  };

  const success = useCallback((m: string) => toast("success", m), [toast]);
  const error = useCallback((m: string) => toast("error", m), [toast]);
  const warning = useCallback((m: string) => toast("warning", m), [toast]);
  const info = useCallback((m: string) => toast("info", m), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onMouseEnter={() => pauseTimer(t.id)}
            onMouseLeave={() => resumeTimer(t.id)}
            className={`pointer-events-auto flex items-start gap-3 px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl min-w-[300px] max-w-[420px] animate-slide-up ${colors[t.type]}`}
          >
            <span className="mt-0.5 shrink-0">{icons[t.type]}</span>

            <p className="text-[13.5px] leading-relaxed flex-1 m-0">
              {t.message}
            </p>

            <button
              onClick={() => remove(t.id)}
              className="ml-1 opacity-60 hover:opacity-100 transition-opacity bg-transparent border-none cursor-pointer text-current p-0"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
