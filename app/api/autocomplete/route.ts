import OpenAI from "openai";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") ?? "";
  const apiKey = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  try {
    const { text, model = "gpt-4o-mini", provider = "openai" } = await req.json();

    if (provider !== "openai") {
      return Response.json(
        { completion: "", error: "Solo se admite provider openai" },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return Response.json({ completion: "", error: "API key requerida" }, { status: 401 });
    }

    const openai = new OpenAI({
      apiKey,
      baseURL: "https://api.openai.com/v1",
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
