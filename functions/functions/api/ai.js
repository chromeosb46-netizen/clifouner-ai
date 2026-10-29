
export async function onRequestPost({ request, env }) {
  const headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), { status, headers });

  if (!env?.AI || typeof env.AI.run !== "function") {
    return json({
      error: "Aura AI is not configured. Deploy to Cloudflare Pages and add a Workers AI binding named AI."
    }, 503);
  }

  let body;

  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON request." }, 400);
  }

  const prompt = String(
    body?.prompt ?? body?.question ?? body?.message ?? ""
  ).trim();

  if (!prompt) {
    return json({ error: "Please type a message for Aura." }, 400);
  }

  if (prompt.length > 4000) {
    return json({
      error: "Please keep your message under 4,000 characters."
    }, 413);
  }

  try {
    const result = await env.AI.run(
      "@cf/meta/llama-3.1-8b-instruct",
      {
        messages: [
          {
            role: "system",
            content:
              "You are Aura, the friendly AI assistant for CLIFOUNER Business AI. Help beginners with business, marketing, writing, learning, and coding. Give clear and practical answers. Never promise guaranteed earnings, invent facts, or claim to access accounts or live data unless an authorized connected tool actually provides them."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 800
      }
    );

    const answer =
      result?.response ||
      result?.output_text ||
      result?.result?.response ||
      result?.answer ||
      result?.choices?.[0]?.message?.content;

    if (typeof answer !== "string" || !answer.trim()) {
      return json({
        error: "Aura received no answer from the AI model. Please try again."
      }, 502);
    }

    const text = answer.trim();

    return json({
      text,
      answer: text,
      response: text
    });
  } catch (error) {
    return json({
      error: "The AI request failed. Check your Cloudflare AI binding, model access, and account limits."
    }, 502);
  }
}
