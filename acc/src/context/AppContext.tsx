import { createContext, useContext, useState, type ReactNode } from "react";

interface AccountingAuth {
  userId: string;
  schoolId: string;
  token: string;
  currentSessionId: string;
  role: string;
  classes: string[];
}

interface AppContextType {
  accountingAuth: AccountingAuth;
  setAccountingAuth: (auth: AccountingAuth) => void;
  clearAccountingAuth: () => void;
}

const defaultAuth: AccountingAuth = {
  userId: "",
  schoolId: "",
  token: "",
  currentSessionId: "",
  role: "",
  classes: [],
};

const AppContext = createContext<AppContextType>({
  accountingAuth: defaultAuth,
  setAccountingAuth: () => {},
  clearAccountingAuth: () => {},
});

export function AppProvider({ children }: { children: ReactNode }) {
  const [accountingAuth, setAccountingAuthState] = useState<AccountingAuth>(
    () => {
      const stored = localStorage.getItem("accountingAuth");
      return stored ? JSON.parse(stored) : defaultAuth;
    },
  );

  const setAccountingAuth = (newAuth: AccountingAuth) => {
    setAccountingAuthState(newAuth);
    localStorage.setItem("accountingAuth", JSON.stringify(newAuth));
  };

  const clearAccountingAuth = () => {
    setAccountingAuthState(defaultAuth);
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
