"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api, type AnticipationView, type Show, type User, type Vouch } from "@/lib/api";
import { Composer } from "@/components/app/composer";
import { MeTooSheet } from "@/components/app/me-too-sheet";
import { Toast } from "@/components/ui/toast";

interface AuthCtx {
  status: "loading" | "signed-out" | "signed-in";
  user: User | null;
  setUser: (u: User | null) => void;
  /** Ends the session. The app shell then sends the viewer to the landing page. */
  signOut: () => Promise<void>;
  /** True after the viewer chose to sign out, as opposed to arriving signed out. */
  signedOutByUser: boolean;
}
const AuthContext = createContext<AuthCtx | null>(null);

interface AppCtx {
  /** Pass `vouch` (with its show) to edit one of your own vouches. */
  openComposer: (opts?: { show?: Show; vouch?: Vouch }) => void;
  openMeToo: (a: AnticipationView) => void;
  notify: (message: string) => void;
  /** Email a magic link was requested for. Held in memory so it never travels in a URL. */
  pendingEmail: string;
  setPendingEmail: (email: string) => void;
  /** Bumped whenever the viewer changes data (post a vouch, Me too) so lists refetch. */
  version: number;
  /** Call after changing data (edit, delete) so lists refetch. */
  refresh: () => void;
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
  const [composer, setComposer] = useState<{ open: boolean; show?: Show; vouch?: Vouch }>({ open: false });
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

  const [signedOutByUser, setSignedOutByUser] = useState(false);

  const setUser = useCallback((u: User | null) => {
    setUserState(u);
    setStatus(u ? "signed-in" : "signed-out");
    if (u) setSignedOutByUser(false);
  }, []);
  const signOut = useCallback(async () => {
    await api.auth.signOut();
    setSignedOutByUser(true);
    setUserState(null);
    setStatus("signed-out");
  }, []);

  const notify = useCallback((message: string) => setToast({ id: Date.now(), message }), []);
  const openComposer = useCallback(
    (opts?: { show?: Show; vouch?: Vouch }) => setComposer({ open: true, show: opts?.show, vouch: opts?.vouch }),
    [],
  );
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const openMeToo = useCallback((item: AnticipationView) => setMeToo({ open: true, item }), []);

  const auth = useMemo(
    () => ({ status, user, setUser, signOut, signedOutByUser }),
    [status, user, setUser, signOut, signedOutByUser],
  );
  const app = useMemo(
    () => ({ openComposer, openMeToo, notify, pendingEmail, setPendingEmail, version, refresh }),
    [openComposer, openMeToo, notify, pendingEmail, version, refresh],
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
              initialVouch={composer.vouch}
              onClose={() => setComposer((c) => ({ ...c, open: false }))}
              onPosted={(edited) => {
                refresh();
                notify(edited ? "Vouch updated" : "Vouch posted");
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
