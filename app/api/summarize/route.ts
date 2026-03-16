import OpenAI from "openai";
import { NextRequest } from "next/server";

const PROVIDER_CONFIG: Record<string, { baseURL: string; requiresKey: boolean }> = {
  openai: { baseURL: "https://api.openai.com/v1", requiresKey: true },
  groq:   { baseURL: "https://api.groq.com/openai/v1", requiresKey: true },
  ollama: { baseURL: "http://localhost:11434/v1", requiresKey: false },
};

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  try {
    const { text, model = "llama-3.1-8b-instant", provider = "groq" } = await req.json();

    const config = PROVIDER_CONFIG[provider] ?? PROVIDER_CONFIG.groq;

    if (config.requiresKey && !apiKey) {
      return Response.json({ summary: "", error: "API key requerida" }, { status: 401 });
    }

    const openai = new OpenAI({
      apiKey: apiKey || "ollama",
      baseURL: config.baseURL,
    });

    const response = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: "system",
          content:
            "You are a summarization assistant. Summarize the provided text concisely, preserving the key points. Output only the summary, nothing else.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 300,
      temperature: 0.5,
    });

    const summary = response.choices[0]?.message?.content ?? "";
    return Response.json({ summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[summarize]", message);
    return Response.json({ summary: "", error: message });
  }
}
