import { createContext, useContext, useState, type ReactNode } from "react";

interface AccountingAuth {
  userId: string;
  schoolId: string;
  token: string;
  currentSessionId: string;
}

interface AppContextType {
  accountingAuth: AccountingAuth;
  setAccountingAuth: (auth: AccountingAuth) => void;
  clearAccountingAuth: () => void;
}

const AppContext = createContext<AppContextType>({
  accountingAuth: { userId: "", schoolId: "", token: "", currentSessionId: "" },
  setAccountingAuth: () => {},
  clearAccountingAuth: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [accountingAuth, setAccountingAuthState] = useState<AccountingAuth>(
    () => {
      const stored = localStorage.getItem("accountingAuth");
      return stored
        ? JSON.parse(stored)
        : { userId: "", schoolId: "", token: "", currentSessionId: "" };
    },
  );

  const setAccountingAuth = (newAuth: AccountingAuth) => {
    setAccountingAuthState(newAuth);
    localStorage.setItem("accountingAuth", JSON.stringify(newAuth));
  };

  const clearAccountingAuth = () => {
    setAccountingAuthState({
      userId: "",
      schoolId: "",
      token: "",
      currentSessionId: "",
    });
    localStorage.removeItem("accountingAuth");
  };

  return (
    <AppContext.Provider
      value={{ accountingAuth, setAccountingAuth, clearAccountingAuth }}
    >
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
