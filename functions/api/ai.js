
export async function onRequestPost({ request, env }) {
  if (!env.AI) {
    return Response.json(
      { error: "AI is not configured yet." },
      { status: 503 }
    );
  }

  try {
    const body = await request.json();
    const prompt = String(body.prompt || "").trim();

    if (!prompt) {
      return Response.json(
        { error: "Enter a prompt first." },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return Response.json(
        { error: "Your prompt is too long. Use fewer than 4000 characters." },
        { status: 400 }
      );
    }

    const result = await env.AI.run(
      "@cf/zai-org/glm-4.7-flash",
      {
        messages: [
          {
            role: "system",
            content:
              "You are Aura, the helpful CLIFOUNER Business AI assistant. Give practical, clear and honest business advice. Never invent sales, customers or research."
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 800
      }
    );

    const answer = result?.response;

    if (typeof answer !== "string" || !answer.trim()) {
      return Response.json(
        { error: "The AI returned no text. Please try again." },
        { status: 502 }
      );
    }

    return Response.json({ text: answer });
  } catch (error) {
    return Response.json(
      { error: "AI request failed. Please try again later." },
      { status: 502 }
    );
  }
}
