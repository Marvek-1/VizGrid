import "dotenv/config";
import express from "express";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
const PORT = 3000;

app.use(express.json());

// Lazy initialization of AI clients to prevent crash if keys are missing on startup
let openai: OpenAI | null = null;
let anthropic: Anthropic | null = null;

function getOpenAI() {
  if (!openai) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set in the environment.");
    }
    openai = new OpenAI({ apiKey });
  }
  return openai;
}

function getAnthropic() {
  if (!anthropic) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY is not set in the environment.");
    }
    anthropic = new Anthropic({ apiKey });
  }
  return anthropic;
}

// API Routes
app.post("/api/codex/openai", async (req, res) => {
  try {
    const client = getOpenAI();
    const { text, codex, type } = req.body;
    const context = getCodexContext(codex);
    
    let systemPrompt = "";
    let userPrompt = "";
    let model = "gpt-4o";

    switch (type) {
      case "style":
        systemPrompt = `${context}\nOnly respond with a single short visual art direction sentence (10–15 words).`;
        userPrompt = `Phrase / title: "${text}". Describe the video background style in 10–15 words.`;
        break;
      case "script":
        systemPrompt = `${context}\nWrite a concise scene description for a loopable 10–15 second Veo 3 background. No dialogue. Just camera movement, environment, and key visual beats.`;
        userPrompt = `Scene name or phrase: "${text}".`;
        break;
      case "voiceover":
        systemPrompt = `${context}\nWrite a powerful, concise 1–2 sentence voiceover / headline to match the scene. No more than 35 words total.`;
        userPrompt = `Scene or concept: "${text}".`;
        break;
      case "metadata":
        systemPrompt = `${context}\nReturn 6–10 short metadata tags for this scene, comma-separated. Example: "myth-tech, cyan glow, industrial skyline, energy pillars"`;
        userPrompt = `Scene or prompt: "${text}".`;
        break;
    }

    const response = await client.chat.completions.create({
      model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const content = response.choices[0].message.content ?? "";
    res.json({ content });
  } catch (error: any) {
    console.error("OpenAI Error:", error);
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/codex/claude", async (req, res) => {
  try {
    const client = getAnthropic();
    const { text, codex, type } = req.body;
    const context = getCodexContext(codex);
    
    let systemPrompt = "";
    let userPrompt = "";
    const model = "claude-3-5-sonnet-20240620";

    switch (type) {
      case "style":
        systemPrompt = `${context}\nReturn only one short visual art direction sentence (10–15 words).`;
        userPrompt = `Phrase / scene title: "${text}".`;
        break;
      case "script":
        systemPrompt = `${context}\nDescribe a loopable 10–15 second background shot for Veo 3. Mention camera movement, key visual elements, and light rhythm. 4–6 sentences max.`;
        userPrompt = `Scene or concept: "${text}".`;
        break;
      case "voiceover":
        systemPrompt = `${context}\nWrite a 1–2 sentence voiceover or on-screen headline (max 35 words).`;
        userPrompt = `Scene / concept: "${text}".`;
        break;
      case "metadata":
        systemPrompt = `${context}\nReturn 6–10 metadata tags as a single comma-separated line.`;
        userPrompt = `Scene or concept: "${text}".`;
        break;
    }

    const message = await client.messages.create({
      model,
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = message.content.find((c) => c.type === "text");
    const content = (textBlock && "text" in textBlock) ? textBlock.text : "";
    res.json({ content });
  } catch (error: any) {
    console.error("Claude Error:", error);
    res.status(500).json({ error: error.message });
  }
});

function getCodexContext(codex: string): string {
  switch (codex) {
    case "mostar":
      return `You are the visual director for MOSTAR INDUSTRIES, a myth-tech execution civilization. Use industrial skylines, black metals, cyan/yellow beams, and precise control-room vibes.`;
    case "flameborn":
      return `You are the visual director for Flameborn, an outbreak-response civilization. Use African landscapes, statues, totems, health grids, beacons, and sacred tech.`;
    default:
      return `You are a neutral cinematic director. No specific brand, just clean visuals.`;
  }
}

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static("dist"));
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
