"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase";

/* ─── types ──────────────────────────────────────────────────────────── */

interface AuthContextValue {
  /** The currently authenticated Supabase auth user, or null. */
  user: User | null;
  /** The current session object, or null. */
  session: Session | null;
  /** True while the initial session is being resolved. */
  loading: boolean;
  /** Sign the current user out. */
  signOut: () => Promise<void>;
}

/* ─── context ────────────────────────────────────────────────────────── */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  session: null,
  loading: true,
  signOut: async () => {},
});

/* ─── provider ───────────────────────────────────────────────────────── */

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // createClient() is memoised by @supabase/ssr — safe to call on every render.
  const supabase = createClient();

  useEffect(() => {
    // 1. Resolve the current session immediately (avoids flash of unauthenticated UI).
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // 2. Keep state in sync with auth events (sign-in, sign-out, token refresh).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, [supabase]);

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

/* ─── hook ───────────────────────────────────────────────────────────── */

/**
 * Returns the current auth context.
 *
 * ```tsx
 * const { user, loading, signOut } = useUser();
 * ```
 */
export function useUser(): AuthContextValue {
  return useContext(AuthContext);
}
