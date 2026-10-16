// Single source of truth for the dashboard demo data.
// Components import from here instead of defining their own copies,
// so workflow names, stats, and links cannot drift apart.

export const workspaceName = "Noyan's Automations";

export const sidebarLinks = [
  { label: "Overview", active: true },
  { label: "Workflows" },
  { label: "Runs" },
  { label: "Settings" },
];

export const stats = [
  { label: "Runs today", value: "1,284", trend: "+12% vs yesterday" },
  { label: "Success rate", value: "98.6%", trend: "+0.4pt this week" },
  { label: "Time saved", value: "37 hrs", trend: "estimated this month" },
  { label: "Active workflows", value: "14", trend: "2 paused" },
];

export const workflows = [
  { name: "New lead → CRM sync", status: "active", lastRun: "3 min ago", successRate: 99 },
  { name: "Invoice reminder emails", status: "active", lastRun: "18 min ago", successRate: 100 },
  { name: "Weekly report digest", status: "paused", lastRun: "2 days ago", successRate: 96 },
  { name: "Order fulfillment webhook", status: "failed", lastRun: "1 hr ago", successRate: 82 },
  { name: "Slack standup summary", status: "active", lastRun: "42 min ago", successRate: 100 },
];

export const runs = [
  {
    id: "run-1",
    workflow: "New lead → CRM sync",
    time: "10:42 AM",
    status: "success",
    detail: "Completed without errors",
  },
  {
    id: "run-2",
    workflow: "Order fulfillment webhook",
    time: "10:15 AM",
    status: "failed",
    detail: "Failed — webhook returned a 500",
  },
  {
    id: "run-3",
    workflow: "Slack standup summary",
    time: "9:58 AM",
    status: "success",
    detail: "Completed without errors",
  },
  {
    id: "run-4",
    workflow: "Invoice reminder emails",
    time: "9:40 AM",
    status: "success",
    detail: "Completed without errors",
  },
];
