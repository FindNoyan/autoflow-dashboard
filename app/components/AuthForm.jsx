"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase/client";

// Shared login / signup form. mode is "login" or "signup".
// Step 1 scope: email + password only, no social login, no password reset.
// If Supabase env vars are missing, the form shows a clear message and
// does not attempt a request — the demo dashboard still works.
export default function AuthForm({ mode }) {
  const isSignup = mode === "signup";
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setInfo("");

    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your env vars (Vercel), then try again."
      );
      return;
    }

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address, like name@example.com.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase is not configured yet.");
      setLoading(false);
      return;
    }

    if (isSignup) {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      setLoading(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      // If email confirmation is on, there is no session yet.
      if (data.user && !data.session) {
        setInfo("Account created. Check your email to confirm, then log in.");
        return;
      }
      router.push("/");
      router.refresh();
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });
    setLoading(false);
    if (signInError) {
      setError(signInError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto flex w-full max-w-md flex-col justify-center px-6 py-16">
      <h1 className="font-display text-2xl font-semibold text-ink">
        {isSignup ? "Create your account" : "Log in to AutoFlow"}
      </h1>
      <p className="mt-2 text-sm text-muted">
        {isSignup
          ? "Sign up with email and password to save your own workflows."
          : "Welcome back. Log in to see your own workflows."}
      </p>

      {!isSupabaseConfigured && (
        <p className="mt-4 rounded-md border border-line bg-surface px-4 py-3 text-sm text-muted">
          Supabase is not configured yet. The demo dashboard still works, but
          login needs NEXT_PUBLIC_SUPABASE_URL and
          NEXT_PUBLIC_SUPABASE_ANON_KEY in your env vars.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-6 flex flex-col gap-4"
      >
        <div>
          <label
            htmlFor="auth-email"
            className="mb-1 block text-sm text-ink"
          >
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            placeholder="name@example.com"
          />
        </div>
        <div>
          <label
            htmlFor="auth-password"
            className="mb-1 block text-sm text-ink"
          >
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            placeholder="At least 6 characters"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red">
            {error}
          </p>
        )}
        {info && <p className="text-sm text-teal">{info}</p>}

        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-teal px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
        >
          {loading
            ? "Please wait…"
            : isSignup
              ? "Sign up"
              : "Log in"}
        </button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {isSignup ? (
          <>
            Already have an account?{" "}
            <Link href="/login" className="text-ink underline">
              Log in
            </Link>
          </>
        ) : (
          <>
            No account yet?{" "}
            <Link href="/signup" className="text-ink underline">
              Sign up
            </Link>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-muted">
        <Link href="/" className="text-ink underline">
          Back to dashboard demo
        </Link>
      </p>
    </main>
  );
}
