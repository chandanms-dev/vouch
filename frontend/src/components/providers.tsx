"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type AnticipationView, type Show, type User } from "@/lib/api";
import { Composer } from "@/components/app/composer";
import { MeTooSheet } from "@/components/app/me-too-sheet";
import { Toast } from "@/components/ui/toast";

interface AuthCtx {
  status: "loading" | "signed-out" | "signed-in";
  user: User | null;
  setUser: (u: User | null) => void;
}
const AuthContext = createContext<AuthCtx | null>(null);

interface AppCtx {
  openComposer: (opts?: { show?: Show }) => void;
  openMeToo: (a: AnticipationView) => void;
  notify: (message: string) => void;
  /** Email a magic link was requested for. Held in memory so it never travels in a URL. */
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  /** Bumped whenever the viewer changes data (post a vouch, Me too) so lists refetch. */
  version: number;
}
const AppContext = createContext<AppCtx | null>(null);

export function useAuth(): AuthCtx {
  const c = useContext(AuthContext);
  if (!c) throw new Error("useAuth outside Providers");
  return c;
}
export function useApp(): AppCtx {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp outside Providers");
  return c;
}

export function Providers({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthCtx["status"]>("loading");
  const [version, setVersion] = useState(0);
  const [pendingEmail, setPendingEmail] = useState("");
  const [composer, setComposer] = useState<{ open: boolean; show?: Show }>({ open: false });
  const [meToo, setMeToo] = useState<{ open: boolean; item: AnticipationView | null }>({ open: false, item: null });
  const [toast, setToast] = useState<{ id: number; message: string } | null>(null);

  useEffect(() => {
    let live = true;
    api.auth.getSession().then((s) => {
      if (!live) return;
      setUserState(s?.user ?? null);
      setStatus(s ? "signed-in" : "signed-out");
    });
    return () => {
      live = false;
    };
  }, []);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setStatus(u ? "signed-in" : "signed-out");
  }, []);

  const notify = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  const openComposer = useCallback((opts?: { show?: Show }) => setComposer({ open: true, show: opts?.show }), []);
  const openMeToo = useCallback((item: AnticipationView) => setMeToo({ open: true, item }), []);

  const auth = useMemo(() => ({ status, user, setUser }), [status, user, setUser]);
  const app = useMemo(
    () => ({ openComposer, openMeToo, notify, pendingEmail, setPendingEmail, version }),
    [openComposer, openMeToo, notify, pendingEmail, version],
  );

  return (
    <AuthContext.Provider value={auth}>
      <AppContext.Provider value={app}>
        {children}
        {status === "signed-in" && (
          <>
            <Composer
              open={composer.open}
              initialShow={composer.show}
              onClose={() => setComposer((c) => ({ ...c, open: false }))}
              onPosted={() => {
                setVersion((v) => v + 1);
                notify("Vouch posted");
              }}
            />
            <MeTooSheet
              open={meToo.open}
              item={meToo.item}
              onClose={() => setMeToo((m) => ({ ...m, open: false }))}
              onDone={() => {
                setVersion((v) => v + 1);
                notify("You are in");
              }}
              onVouchFirst={() => {
                setMeToo((m) => ({ ...m, open: false }));
                setComposer({ open: true });
              }}
            />
          </>
        )}
        <Toast toast={toast} />
      </AppContext.Provider>
    </AuthContext.Provider>
  );
}
