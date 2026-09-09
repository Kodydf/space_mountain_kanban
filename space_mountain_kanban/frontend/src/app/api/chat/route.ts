import { NextRequest, NextResponse } from "next/server";
import "@/lib/load-root-env";
import { CHAT_TOOLS, buildSystemPrompt } from "@/lib/chat-tools";
import type { ChatApiRequest, ToolCall } from "@/lib/chat-types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-oss-120b";

type OpenRouterToolCall = {
  function: { name: string; arguments: string };
};

type OpenRouterResponse = {
  choices?: {
    message?: {
      content: string | null;
      tool_calls?: OpenRouterToolCall[];
    };
  }[];
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OpenRouter_API_Key;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing the OpenRouter API key." }, { status: 500 });
  }

  const { messages, board } = (await req.json()) as ChatApiRequest;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "X-Title": "Space Mountain Task Tracker",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [{ role: "system", content: buildSystemPrompt(board) }, ...messages],
      tools: CHAT_TOOLS,
      tool_choice: "auto",
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    return NextResponse.json({ error: `OpenRouter error (${response.status}): ${text}` }, { status: 502 });
  }

  const data = (await response.json()) as OpenRouterResponse;
  const message = data.choices?.[0]?.message;
  if (!message) {
    return NextResponse.json({ error: "The assistant returned no response." }, { status: 502 });
  }

  const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((tc) => ({
    name: tc.function.name as ToolCall["name"],
    arguments: JSON.parse(tc.function.arguments || "{}") as Record<string, string>,
  }));

  return NextResponse.json({ content: message.content, toolCalls });
}
