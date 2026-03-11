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
      return Response.json({ completion: "", error: "API key requerida" }, { status: 401 });
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
            "You are an autocomplete assistant. Continue the user's text naturally. Output only the continuation, nothing else. Maximum 1-2 sentences.",
        },
        { role: "user", content: text },
      ],
      max_tokens: 80,
      temperature: 0.7,
    });

    const completion = response.choices[0]?.message?.content ?? "";
    return Response.json({ completion });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[autocomplete]", message);
    return Response.json({ completion: "", error: message });
  }
}
