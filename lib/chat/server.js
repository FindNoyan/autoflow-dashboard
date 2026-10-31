// Server-only helpers for the Step 3 AI chatbot (app/api/chat).
// This file must never be imported by a client component: it reads the
// server env var GEMINI_API_KEY, which must never reach the browser.
// The browser only ever sends its own Supabase access token, and only
// to the /api/chat route.
//
// Security flow for every chat request:
// 1. The browser sends its Supabase access token in an Authorization header.
// 2. The route validates the token with supabase.auth.getUser(token).
//    A missing or invalid token means no data access at all (401).
// 3. Data queries use a Supabase client that sends the user's token with
//    every query, so the workflows / runs / chat_messages Row Level
//    Security policies apply: a user can only read or write their own
//    rows. The service_role key is never used anywhere in this app.
// 4. Only that user's rows are ever put into the AI prompt. The prompt
//    also forbids inventing numbers: with no data, the answer says so.

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isChatServerConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Validate a user's access token and return a Supabase client that
// queries as that user (RLS applies). Returns null when the token is
// missing, invalid, or Supabase is not configured.
export async function getUserClient(request) {
  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ")
    ? header.slice("Bearer ".length)
    : null;
  if (!token || !supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  const authClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data, error } = await authClient.auth.getUser(token);
  if (error || !data?.user) {
    return null;
  }
  const userClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
  return { user: data.user, supabase: userClient };
}

// Fetch one user's workflows and recent runs, through RLS.
export async function fetchUserChatData(supabase) {
  const [{ data: workflows, error: workflowsError }, { data: runs, error: runsError }] =
    await Promise.all([
      supabase
        .from("workflows")
        .select("id,name,status,last_run,success_rate,created_at")
        .order("created_at", { ascending: false })
        .limit(100),
      supabase
        .from("runs")
        .select("id,workflow_name,time,status,detail,created_at")
        .order("created_at", { ascending: false })
        .limit(50),
    ]);
  if (workflowsError) {
    throw new Error(workflowsError.message);
  }
  if (runsError) {
    throw new Error(runsError.message);
  }
  return { workflows: workflows ?? [], runs: runs ?? [] };
}

// Small aggregate summary, included in the AI prompt so aggregate
// questions ("what is my success rate?") work even when no single row
// matches a keyword. Runs are capped at the 50 most recent, and the
// summary says so when the cap may apply.
export function summarizeChatData(workflows, runs) {
  const byStatus = { active: 0, paused: 0, failed: 0 };
  workflows.forEach((w) => {
    if (byStatus[w.status] !== undefined) {
      byStatus[w.status] += 1;
    }
  });
  const succeeded = runs.filter((r) => r.status === "success").length;
  const failed = runs.filter((r) => r.status === "failed").length;
  const successRate =
    runs.length === 0 ? null : Math.round((succeeded / runs.length) * 1000) / 10;
  const pausedNames = workflows
    .filter((w) => w.status === "paused")
    .map((w) => w.name);
  const failedWorkflowNames = workflows
    .filter((w) => w.status === "failed")
    .map((w) => w.name);
  const mostRecentFailedRun = runs.find((r) => r.status === "failed") || null;
  return {
    totalWorkflows: workflows.length,
    byStatus,
    totalRuns: runs.length,
    succeeded,
    failed,
    successRate,
    pausedNames,
    failedWorkflowNames,
    mostRecentFailedRun,
  };
}

export function formatChatDataForPrompt(workflows, runs, summary) {
  const workflowLines = workflows.map(
    (w) =>
      `- ${w.name} (status: ${w.status}, last run: ${w.last_run ?? "unknown"}, success rate: ${w.success_rate ?? "unknown"}%)`
  );
  const runLines = runs.map(
    (r) =>
      `- ${r.workflow_name} (${r.time ?? "no time label"}): ${r.status}${r.detail ? ` — ${r.detail}` : ""}`
  );
  return [
    `Summary: ${summary.totalWorkflows} workflows (${summary.byStatus.active} active, ${summary.byStatus.paused} paused, ${summary.byStatus.failed} failed); ${summary.totalRuns} recent runs (${summary.succeeded} succeeded, ${summary.failed} failed)${summary.successRate === null ? "" : `; success rate ${summary.successRate}%`}.`,
    "Workflows:",
    ...(workflowLines.length > 0 ? workflowLines : ["(none)"]),
    "Recent runs (newest first, at most 50):",
    ...(runLines.length > 0 ? runLines : ["(none)"]),
  ].join("\n");
}

// Call Gemini with a plain server-side fetch. No new dependency. The key
// travels only in the x-goog-api-key header, never in a URL. Returns the
// generated text, or null when the key is missing or the call fails.
export async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    return null;
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": key,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2, maxOutputTokens: 300 },
        }),
        signal: controller.signal,
      }
    );
    if (!response.ok) {
      // Diagnostic only: HTTP status. Never the key, the prompt, or user data.
      console.error("AutoFlow chat: Gemini API error:", response.status);
      return null;
    }
    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts
      ?.map((part) => part.text || "")
      .join("")
      .trim();
    return text || null;
  } catch (error) {
    // Diagnostic only: error name. Never the key or the prompt.
    console.error("AutoFlow chat: Gemini call failed:", error?.name || "error");
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Deterministic answers computed straight from the user's own rows.
// Used for the suggested questions when the AI call is unavailable
// (no key configured, or a failed call), so the chatbot still answers
// from real data instead of inventing anything or dead-ending.
// Returns null when the question matches no known intent.
export function deterministicAnswer(question, summary) {
  const q = (question || "").toLowerCase();
  if (q.includes("fail")) {
    if (summary.mostRecentFailedRun) {
      const r = summary.mostRecentFailedRun;
      return `The most recent failed run is "${r.workflow_name}"${r.time ? ` (${r.time})` : ""}${r.detail ? ` — ${r.detail}` : ""}.`;
    }
    if (summary.failedWorkflowNames.length > 0) {
      return `No failed runs are recorded, but ${summary.failedWorkflowNames.length === 1 ? "this workflow is marked failed" : "these workflows are marked failed"}: ${summary.failedWorkflowNames.join(", ")}.`;
    }
    return "You have no failed runs recorded yet.";
  }
  if (q.includes("paus")) {
    if (summary.pausedNames.length === 0) {
      return "No workflows are paused right now.";
    }
    return `${summary.pausedNames.length === 1 ? "One workflow is paused" : `${summary.pausedNames.length} workflows are paused`}: ${summary.pausedNames.join(", ")}.`;
  }
  if (q.includes("success") || q.includes("rate")) {
    if (summary.successRate === null) {
      return "You have no runs recorded yet, so there is no success rate to report.";
    }
    return `Your success rate is ${summary.successRate}% across your ${summary.totalRuns} most recent runs (${summary.succeeded} succeeded, ${summary.failed} failed).`;
  }
  if (q.includes("how many") || q.includes("count") || q.includes("total")) {
    return `You have ${summary.totalWorkflows} workflows (${summary.byStatus.active} active, ${summary.byStatus.paused} paused, ${summary.byStatus.failed} failed) and ${summary.totalRuns} recent runs recorded.`;
  }
  return null;
}
