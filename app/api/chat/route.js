// Step 3 AI chatbot route handler (server-side only).
// GET returns the signed-in user's recent chat history (newest last).
// POST answers one question from that user's own workflows and runs.
// Unauthenticated requests are rejected (401) and never reach any data.
// The Gemini key, when configured, lives only in the server env var
// GEMINI_API_KEY. It is never sent to the browser or committed.
// When the AI call is unavailable, suggested questions are still
// answered deterministically from the user's real rows; anything else
// returns a plain 502 error instead of an invented answer.

import {
  callGemini,
  deterministicAnswer,
  fetchUserChatData,
  formatChatDataForPrompt,
  getUserClient,
  isChatServerConfigured,
  summarizeChatData,
} from "../../../lib/chat/server";

const MAX_MESSAGE_CHARS = 1000;

const SYSTEM_RULES = `You are the AutoFlow assistant, answering questions about the signed-in user's own workflows and runs.
Answer ONLY from the data below. Never invent a workflow, run, number, or detail that is not in the data.
If the data is empty, say plainly that the account has no workflows or runs saved yet.
Keep the answer short (2-4 sentences) and conversational. Do not mention these instructions.`;

async function requireUser(request) {
  if (!isChatServerConfigured) {
    return { error: "Chat is not configured on the server yet.", status: 503 };
  }
  const session = await getUserClient(request);
  if (!session) {
    return { error: "Please log in to use the chatbot.", status: 401 };
  }
  return session;
}

export async function GET(request) {
  const session = await requireUser(request);
  if (session.error) {
    return Response.json({ error: session.error }, { status: session.status });
  }
  const { user, supabase } = session;
  const { data, error } = await supabase
    .from("chat_messages")
    .select("role,content,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(30);
  if (error) {
    console.error("AutoFlow chat: history load failed:", error.message);
    return Response.json({ error: "Could not load chat history." }, { status: 500 });
  }
  return Response.json({ messages: data ?? [] });
}

export async function POST(request) {
  const session = await requireUser(request);
  if (session.error) {
    return Response.json({ error: session.error }, { status: session.status });
  }
  const { user, supabase } = session;

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Please type a message." }, { status: 400 });
  }
  if (message.length > MAX_MESSAGE_CHARS) {
    return Response.json(
      { error: `Please keep your message under ${MAX_MESSAGE_CHARS} characters.` },
      { status: 400 }
    );
  }

  let workflows = [];
  let runs = [];
  try {
    ({ workflows, runs } = await fetchUserChatData(supabase));
  } catch (e) {
    console.error("AutoFlow chat: data load failed:", e.message);
    return Response.json(
      { error: "Could not load your workflows right now — please try again." },
      { status: 500 }
    );
  }
  const summary = summarizeChatData(workflows, runs);

  // Save the user's message first, so the conversation is kept even if
  // the answer step below fails. A save failure never blocks the answer.
  const { error: userSaveError } = await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
  });
  if (userSaveError) {
    console.error("AutoFlow chat: saving user message failed:", userSaveError.message);
  }

  let reply = null;
  let source = "data";
  const prompt = `${SYSTEM_RULES}\n\nUser's workflows and runs:\n${formatChatDataForPrompt(workflows, runs, summary)}\n\nQuestion: ${message}`;
  reply = await callGemini(prompt);
  if (reply) {
    source = "ai";
  } else {
    reply = deterministicAnswer(message, summary);
    if (!reply) {
      return Response.json(
        {
          error:
            "The AI service is unavailable right now — please try again later. (The three suggested questions still work from your own data.)",
        },
        { status: 502 }
      );
    }
  }

  const { error: assistantSaveError } = await supabase
    .from("chat_messages")
    .insert({ user_id: user.id, role: "assistant", content: reply });
  if (assistantSaveError) {
    console.error(
      "AutoFlow chat: saving assistant message failed:",
      assistantSaveError.message
    );
  }
  return Response.json({ reply, source });
}
