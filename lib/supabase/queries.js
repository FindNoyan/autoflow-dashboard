// Supabase data layer for the dashboard (Step 2).
// All reads/writes go through the authenticated browser client, so
// Supabase RLS (auth.uid() = user_id) enforces per-user isolation:
// each user only ever sees their own workflows, runs, and chats.
// Never put a service-role key or any secret in this file.

import { workflows as demoWorkflows, runs as demoRuns } from "../../app/data/dashboard";

// Fetch the logged-in user's workflows, newest first.
// Throws an Error with Supabase's message when the query fails.
export async function fetchUserWorkflows(supabase) {
  const { data, error } = await supabase
    .from("workflows")
    .select("id,name,status,last_run,success_rate,created_at")
    .order("created_at", { ascending: false });
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

// Fetch the logged-in user's runs, newest first (max 50 for the feed).
export async function fetchUserRuns(supabase) {
  const { data, error } = await supabase
    .from("runs")
    .select("id,workflow_id,workflow_name,time,status,detail,created_at")
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) {
    throw new Error(error.message);
  }
  return data ?? [];
}

// Compute the four stat cards from REAL data. Same shape as the demo
// stats ({ label, value, trend }) so StatsRow needs no changes.
// Time saved is an honest estimate: 15 minutes per successful run.
// With no runs, every value is 0 — never a faked-up number.
export function computeStats(workflows, runs) {
  const totalRuns = runs.length;
  const succeeded = runs.filter((run) => run.status === "success").length;
  const successRate =
    totalRuns === 0 ? 0 : Math.round((succeeded / totalRuns) * 1000) / 10;
  const active = workflows.filter((w) => w.status === "active").length;
  const paused = workflows.filter((w) => w.status === "paused").length;
  const timeSavedHours = Math.round(succeeded * 0.25 * 10) / 10;
  return [
    { label: "Total runs", value: String(totalRuns), trend: `${succeeded} succeeded` },
    {
      label: "Success rate",
      value: `${successRate}%`,
      trend: totalRuns === 0 ? "No runs yet" : `${totalRuns} runs`,
    },
    {
      label: "Time saved",
      value: `${timeSavedHours} hrs`,
      trend: "est. 15 min per successful run",
    },
    { label: "Active workflows", value: String(active), trend: `${paused} paused` },
  ];
}

// Insert the demo workflows + runs for ONE user, on their explicit click.
// Called only from the empty-state "Load demo workflows" button — nothing
// is auto-seeded for any user. Rows carry this user's user_id, so RLS
// keeps them private to that user.
export async function loadDemoData(supabase, userId) {
  const { data: insertedWorkflows, error: workflowsError } = await supabase
    .from("workflows")
    .insert(
      demoWorkflows.map((w) => ({
        user_id: userId,
        name: w.name,
        status: w.status,
        last_run: w.lastRun,
        success_rate: w.successRate,
      }))
    )
    .select("id,name");
  if (workflowsError) {
    throw new Error(workflowsError.message);
  }
  const idByName = new Map(
    (insertedWorkflows ?? []).map((w) => [w.name, w.id])
  );
  const { error: runsError } = await supabase.from("runs").insert(
    demoRuns.map((r) => ({
      user_id: userId,
      workflow_id: idByName.get(r.workflow) ?? null,
      workflow_name: r.workflow,
      time: r.time,
      status: r.status,
      detail: r.detail,
    }))
  );
  if (runsError) {
    throw new Error(runsError.message);
  }
}
