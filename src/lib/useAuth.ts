import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabase";
import { refreshAdminSession, getSession, clearSession, type AppSession, type AdminRole, can } from "./session";

export function useAuth() {
  const [session, setSession] = useState<AppSession | null>(getSession());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const init = async () => {
      const s = await refreshAdminSession();
      setSession(s);
      setLoading(false);
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      refreshAdminSession().then(setSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const s = await refreshAdminSession();
    if (!s) throw new Error("No admin access for this account");
    setSession(s);
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    clearSession();
    setSession(null);
  }, []);

  const hasPermission = useCallback(
    (resource: Parameters<typeof can>[1], action: string) => {
      if (!session) return false;
      return can(session.admin.role, resource, action);
    },
    [session]
  );

  return {
    session,
    loading,
    login,
    logout,
    hasPermission,
    role: session?.admin.role ?? null,
    user: session?.user ?? null,
    admin: session?.admin ?? null,
  };
}
