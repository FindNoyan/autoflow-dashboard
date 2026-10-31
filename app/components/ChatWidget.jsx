"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase/client";
import { runs as demoRuns, stats as demoStats, workflows as demoWorkflows } from "../data/dashboard";

// Step 3 AI chatbot (approved preview, 2026-10-31): a floating button at
// the bottom-right of the dashboard and a 360px panel above it, with the
// same three suggested questions as the preview. Position and size match
// the preview; colours follow this dashboard's dark theme.
// - Logged in: questions go to the server-only /api/chat route, which
//   answers from the user's own Supabase rows and saves the conversation
//   to chat_messages. The AI key never reaches this component.
// - Logged out: answers are computed locally from the public demo data
//   only, clearly labelled "Demo data", and no request is sent anywhere.

export const SUGGESTED_QUESTIONS = [
  "Which workflow failed most recently?",
  "What is my success rate?",
  "Which workflows are paused?",
];

// Demo answers, mirroring the approved preview. Computed from the same
// demo data the dashboard shows, never from a real account.
function demoAnswer(question) {
  const q = question.toLowerCase();
  if (q.includes("fail")) {
    const failed = demoWorkflows.find((w) => w.status === "failed");
    const failedRun = demoRuns.find((r) => r.status === "failed");
    return `The most recent failure is "${failed.name}": its last run was ${failed.lastRun}, success rate ${failed.successRate}%, and the latest run at ${failedRun.time} failed because the webhook returned a 500.`;
  }
  if (q.includes("paus")) {
    const paused = demoWorkflows.filter((w) => w.status === "paused");
    return `${paused.length === 1 ? "One workflow is paused" : `${paused.length} workflows are paused`}: ${paused.map((w) => `"${w.name}", last run ${w.lastRun}, success rate ${w.successRate}%`).join("; ")}.`;
  }
  if (q.includes("success") || q.includes("rate")) {
    const rate = demoStats.find((s) => s.label === "Success rate");
    const runsToday = demoStats.find((s) => s.label === "Runs today");
    return `Your overall success rate is ${rate.value} this week (${rate.trend}), with ${runsToday.value} ${runsToday.label.toLowerCase()}.`;
  }
  return "In demo mode I can only answer the three suggested questions. Log in for answers about your own workflows.";
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(null); // null = checking
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [lastQuestion, setLastQuestion] = useState("");
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesRef = useRef(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) {
      // No Supabase configured: loggedIn stays null, which the widget
      // already treats as logged out (demo answers, no server calls).
      return;
    }
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) {
        setLoggedIn(Boolean(data.session?.user));
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!cancelled) {
          setLoggedIn(Boolean(session?.user));
          setHistoryLoaded(false);
        }
      }
    );
    return () => {
      cancelled = true;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }
  }, [messages, sending]);

  const loadHistory = useCallback(async () => {
    if (historyLoaded) {
      return;
    }
    setHistoryLoaded(true);
    const supabase = getSupabaseClient();
    if (!supabase) {
      return;
    }
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        return;
      }
      const res = await fetch("/api/chat", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        return;
      }
      const json = await res.json();
      setMessages(
        (json.messages ?? []).map((m) => ({
          role: m.role,
          text: m.content,
          source: "history",
        }))
      );
    } catch {
      // History is a nicety; a failed load just starts a fresh chat.
    }
  }, [historyLoaded]);

  function togglePanel() {
    const next = !open;
    setOpen(next);
    if (next && loggedIn) {
      loadHistory();
    }
  }

  async function sendQuestion(question) {
    const text = question.trim();
    if (!text || sending) {
      return;
    }
    setError("");
    setLastQuestion(text);
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    if (!loggedIn) {
      // Logged out: demo answer only, no network request at all.
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: demoAnswer(text), source: "demo" },
      ]);
      return;
    }

    setSending(true);
    try {
      const supabase = getSupabaseClient();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        setError("You are not logged in. Please log in and try again.");
        return;
      }
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: text }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(
          json.error || "The chatbot could not answer right now — please try again."
        );
        return;
      }
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: json.reply, source: json.source },
      ]);
    } catch {
      setError("Could not reach the chatbot — please try again.");
    } finally {
      setSending(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    sendQuestion(input);
  }

  function handleRetry() {
    if (lastQuestion) {
      setError("");
      sendQuestion(lastQuestion);
    }
  }

  const headerSub = loggedIn
    ? "Answers from your own workflows and runs."
    : "Demo answers only — log in for answers about your account.";

  return (
    <div className="fixed right-5 bottom-5 z-50">
      {open && (
        <div className="mb-4 flex w-[360px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">AutoFlow Assistant</p>
            <p className="mt-0.5 text-xs text-muted">{headerSub}</p>
          </div>
          <div
            ref={messagesRef}
            className="flex h-[260px] flex-col gap-2.5 overflow-y-auto bg-background px-3 py-3"
          >
            {messages.length === 0 && (
              <div className="max-w-[92%] self-start rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] leading-relaxed text-ink">
                Hi. Ask me about your workflows and runs, for example which
                workflow failed most recently.
                <p className="mt-1.5 text-[11px] text-muted">
                  {loggedIn
                    ? "Source: your account data."
                    : "Source: demo data only. Log in for your own data."}
                </p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`max-w-[92%] rounded-xl px-3 py-2.5 text-[13px] leading-relaxed ${
                  msg.role === "user"
                    ? "self-end bg-teal text-background"
                    : "self-start border border-line bg-surface text-ink"
                }`}
              >
                {msg.text}
                {msg.role === "assistant" && msg.source && msg.source !== "history" && (
                  <p className="mt-1.5 text-[11px] text-muted">
                    {msg.source === "demo"
                      ? "Source: demo data only. Log in for your own data."
                      : msg.source === "ai"
                        ? "Source: your workflows and runs (AI answer)."
                        : "Source: your workflows and runs."}
                  </p>
                )}
              </div>
            ))}
            {sending && (
              <div className="max-w-[92%] self-start rounded-xl border border-line bg-surface px-3 py-2.5 text-[13px] text-muted">
                Thinking…
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5 bg-background px-3 pt-2.5">
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => sendQuestion(q)}
                disabled={sending}
                className="rounded-full border border-line bg-surface px-2.5 py-1 text-xs text-muted hover:text-ink disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
          {error && (
            <div role="alert" className="bg-background px-3 pt-2">
              <p className="text-[13px] text-red">{error}</p>
              <button
                type="button"
                onClick={handleRetry}
                className="mt-1.5 rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
              >
                Retry
              </button>
            </div>
          )}
          <form
            onSubmit={handleSubmit}
            className="flex gap-2 border-t border-line px-3 py-2.5"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about your workflows…"
              aria-label="Ask about your workflows"
              className="flex-1 rounded-lg border border-line bg-background px-2.5 py-2 text-[13px] text-ink"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="rounded-lg bg-teal px-3.5 py-2 text-[13px] font-medium text-background hover:opacity-90 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
      <button
        type="button"
        onClick={togglePanel}
        aria-label={open ? "Close AI assistant" : "Open AI assistant"}
        className="ml-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal text-xl text-background shadow-xl hover:opacity-90"
      >
        💬
      </button>
    </div>
  );
}
