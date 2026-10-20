"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import StatsRow from "./StatsRow";
import WorkflowsSection from "./WorkflowsSection";
import RunsFeed from "./RunsFeed";
import { getSupabaseClient } from "../../lib/supabase/client";
import {
  computeStats,
  fetchUserRuns,
  fetchUserWorkflows,
  loadDemoData,
} from "../../lib/supabase/queries";

// Dashboard body (Step 2): decides which data to show.
// - Logged out (or Supabase not configured): the existing public demo
//   data, with a clear "Demo data" label. The page is NOT locked.
// - Logged in: the user's own real workflows/runs/stats from Supabase.
// - Logged in but no rows yet: a friendly empty state with an explicit
//   "Load demo workflows" button — nothing is seeded automatically.
function toTableWorkflows(rows) {
  return rows.map((row) => ({
    name: row.name,
    status: row.status,
    lastRun: row.last_run ?? "—",
    successRate: row.success_rate ?? 0,
  }));
}

function toFeedRuns(rows) {
  return rows.map((row) => ({
    id: row.id,
    workflow: row.workflow_name,
    time: row.time ?? "",
    status: row.status,
    detail: row.detail ?? "",
  }));
}

export default function DashboardBody() {
  const [mode, setMode] = useState("checking"); // checking | demo | real
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState("");
  const [seeding, setSeeding] = useState(false);
  const [seedError, setSeedError] = useState("");

  const loadRealData = useCallback(async () => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    setLoadingData(true);
    setError("");
    try {
      const [fetchedWorkflows, fetchedRuns] = await Promise.all([
        fetchUserWorkflows(supabase),
        fetchUserRuns(supabase),
      ]);
      setWorkflows(fetchedWorkflows);
      setRuns(fetchedRuns);
      setStats(computeStats(fetchedWorkflows, fetchedRuns));
      setMode("real");
    } catch (e) {
      setError(e.message || "Could not load your workflows.");
      setMode("real");
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      setMode("demo");
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (cancelled) {
        return;
      }
      if (data.session?.user) {
        loadRealData();
      } else {
        setMode("demo");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (cancelled) {
          return;
        }
        if (session?.user) {
          loadRealData();
        } else {
          setMode("demo");
          setWorkflows([]);
          setRuns([]);
          setStats(null);
          setError("");
        }
      }
    );
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, [loadRealData]);

  async function handleLoadDemo() {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    setSeeding(true);
    setSeedError("");
    try {
      const { data } = await supabase.auth.getSession();
      const userId = data.session?.user?.id;
      if (!userId) {
        setSeedError("You are not logged in. Please log in and try again.");
        return;
      }
      await loadDemoData(supabase, userId);
      await loadRealData();
    } catch (e) {
      setSeedError(e.message || "Could not load demo workflows.");
    } finally {
      setSeeding(false);
    }
  }

  if (mode === "checking") {
    return <p className="px-6 py-8 text-sm text-muted sm:px-8">Loading dashboard…</p>;
  }

  if (mode === "demo") {
    return (
      <>
        <p className="border-b border-line px-6 py-3 text-sm text-muted sm:px-8">
          Demo data —{" "}
          <Link href="/login" className="text-ink underline">
            log in
          </Link>{" "}
          to see your workflows.
        </p>
        <StatsRow />
        <WorkflowsSection key="demo" />
        <RunsFeed />
      </>
    );
  }

  if (loadingData) {
    return (
      <>
        <p className="border-b border-line px-6 py-3 text-sm text-muted sm:px-8">
          Your workflows — saved to your account.
        </p>
        <p className="px-6 py-8 text-sm text-muted sm:px-8">
          Loading your workflows…
        </p>
      </>
    );
  }

  if (error) {
    return (
      <>
        <p className="border-b border-line px-6 py-3 text-sm text-muted sm:px-8">
          Your workflows — saved to your account.
        </p>
        <div className="px-6 py-8 sm:px-8">
          <p role="alert" className="text-sm text-red">
            {error}
          </p>
          <button
            type="button"
            onClick={loadRealData}
            className="mt-4 rounded-md border border-line px-3 py-1.5 text-sm text-muted hover:text-ink"
          >
            Retry
          </button>
        </div>
      </>
    );
  }

  if (workflows.length === 0 && runs.length === 0) {
    return (
      <>
        <p className="border-b border-line px-6 py-3 text-sm text-muted sm:px-8">
          Your workflows — saved to your account.
        </p>
        <section className="px-6 py-8 sm:px-8">
          <h2 className="font-display text-base font-semibold text-ink">
            No workflows yet
          </h2>
          <p className="mt-2 text-sm text-muted">
            Your account has no workflows or runs saved yet. Load the demo
            set to see how the dashboard looks with real data.
          </p>
          {seedError && (
            <p role="alert" className="mt-4 text-sm text-red">
              {seedError}
            </p>
          )}
          <button
            type="button"
            onClick={handleLoadDemo}
            disabled={seeding}
            className="mt-4 rounded-md bg-teal px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {seeding ? "Loading…" : "Load demo workflows"}
          </button>
          <p className="mt-2 text-xs text-muted">
            This loads 5 demo workflows + 4 runs into your account only.
            Nothing is created until you click.
          </p>
        </section>
      </>
    );
  }

  return (
    <>
      <p className="border-b border-line px-6 py-3 text-sm text-muted sm:px-8">
        Your workflows — saved to your account.
      </p>
      <StatsRow items={stats} />
      <WorkflowsSection key="real" items={toTableWorkflows(workflows)} />
      <RunsFeed items={toFeedRuns(runs)} />
    </>
  );
}
