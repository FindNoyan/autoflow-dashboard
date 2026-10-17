"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase/client";

// Shown in the Topbar. When no session exists, shows Log in / Sign up links.
// When a session exists, shows the signed-in email + a Log out button.
// Renders nothing session-related until the client has checked auth state,
// so the demo never flashes a wrong state.
export default function LogoutButton() {
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setChecked(true);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setChecked(true);
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  if (!checked) {
    return null;
  }

  if (!isSupabaseConfigured) {
    return (
      <Link
        href="/login"
        className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
      >
        Log in
      </Link>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-teal px-3 py-1.5 text-sm font-medium text-background hover:opacity-90"
        >
          Sign up
        </Link>
      </div>
    );
  }

  async function handleLogout() {
    const supabase = getSupabaseClient();
    if (supabase) {
      await supabase.auth.signOut();
    }
    window.location.href = "/";
  }

  return (
    <div className="flex items-center gap-2">
      <span className="hidden max-w-40 truncate text-xs text-muted sm:block">
        {user.email}
      </span>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
      >
        Log out
      </button>
    </div>
  );
}
