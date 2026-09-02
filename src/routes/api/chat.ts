import { createFileRoute } from "@tanstack/react-router";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SYSTEM_PROMPT = `You are "Study Assistant", a professional, friendly AI study tutor for a general education website.

Scope: you help with ANY academic degree or subject — Computer Science, Software Engineering, IT, AI, Data Science, all Engineering branches, Medical and health sciences, Business, Accounting, Finance, Economics, Mathematics, Statistics, Physics, Chemistry, Biology, Arts, History, English and other languages, Islamic studies, social sciences, and general study skills.

Languages: reply in the SAME language the student used — English, Urdu (اردو script), or Roman Urdu. If they mix, mirror their style.

How to answer:
- Be clear, accurate and easy to understand; prefer simple words over jargon, and define jargon when needed.
- For difficult topics, explain step-by-step with short numbered steps and a concrete example.
- For problems (math, physics, accounting, code), show the working step by step and state the final answer clearly.
- For programming, give clean commented code in fenced code blocks plus a short explanation.
- For exam help, give focused revision points, likely question types, and practice questions.
- Use markdown: short paragraphs, bullet points, bold key terms, LaTeX-free plain notation when possible.
- Keep answers relevant and proportionate to the question; do not pad.
- If the question is ambiguous or missing details (course level, subject, language, what exactly is asked), ask ONE short clarifying question first.
- Never invent facts, citations, statistics, formulas or exam patterns. If you are unsure or the topic needs verification, say so plainly and tell the student how to verify (textbook, teacher, official syllabus).
- Use earlier turns of the conversation to answer follow-up questions in context.
- Encourage learning and academic honesty: explain rather than only handing over answers for graded work.
- Stay educational and safe. For medical, legal or financial questions, answer academically and add a short note that it is not professional advice. Politely decline non-educational, unsafe or harmful requests and steer back to studying.`;

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) {
          return new Response(
            JSON.stringify({ error: "AI is not configured on this site." }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }

        let messages: ChatMessage[] = [];
        try {
          const body = (await request.json()) as { messages?: ChatMessage[] };
          messages = Array.isArray(body.messages) ? body.messages : [];
        } catch {
          return new Response(JSON.stringify({ error: "Invalid request." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        if (messages.length === 0) {
          return new Response(JSON.stringify({ error: "No messages provided." }), {
            status: 400,
            headers: { "content-type": "application/json" },
          });
        }

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "openai/gpt-5.6-sol",
            stream: true,
            instructions: SYSTEM_PROMPT,
            input: messages.slice(-24).map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const detail = await upstream.text().catch(() => "");
          console.error(`AI gateway error [${upstream.status}]: ${detail}`);
          const message =
            upstream.status === 429
              ? "Too many requests right now. Please try again in a moment."
              : upstream.status === 402
                ? "The site's AI credits have run out. Please contact the site owner."
                : upstream.status === 403
                  ? "AI access is currently blocked for this site."
                  : "The assistant could not respond. Please try again.";
          return new Response(JSON.stringify({ error: message, detail }), {
            status: upstream.status,
            headers: { "content-type": "application/json" },
          });
        }

        const decoder = new TextDecoder();
        const encoder = new TextEncoder();
        let buffer = "";

        const stream = new ReadableStream<Uint8Array>({
          async start(controller) {
            const reader = upstream.body!.getReader();
            try {
              for (;;) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split("\n");
                buffer = lines.pop() ?? "";
                for (const line of lines) {
                  const trimmed = line.trim();
                  if (!trimmed.startsWith("data:")) continue;
                  const data = trimmed.slice(5).trim();
                  if (!data || data === "[DONE]") continue;
                  try {
                    const event = JSON.parse(data) as {
                      type?: string;
                      delta?: string;
                    };
                    if (
                      event.type === "response.output_text.delta" &&
                      typeof event.delta === "string"
                    ) {
                      controller.enqueue(encoder.encode(event.delta));
                    }
                  } catch {
                    // ignore keep-alive / partial frames
                  }
                }
              }
            } catch (error) {
              console.error("Stream error", error);
            } finally {
              controller.close();
            }
          },
        });

        return new Response(stream, {
          headers: {
            "content-type": "text/plain; charset=utf-8",
            "cache-control": "no-store",
          },
        });
      },
    },
  },
});
