/**
 * OpenAI Codex service for Mostar Video Camp
 * Uses the Responses API to generate:
 *  - style suggestions
 *  - scene scripts
 *  - voiceover text
 *  - metadata
 *
 * Env:
 *   OPENAI_API_KEY=sk-...
 */

import { CodexMode } from "./geminiService";

async function callServerCodex(text: string, codex: CodexMode, type: string): Promise<string> {
  const response = await fetch("/api/codex/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, codex, type }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to call OpenAI codex");
  }
  const data = await response.json();
  return data.content.trim();
}

/**
 * STYLE SUGGESTION
 * Short visual art-direction line, 10–15 words.
 */
export async function suggestStyleWithGPT(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "style");
}

/**
 * SCENE SCRIPT
 * A short structured description of what happens in a 10–15s loop.
 */
export async function generateSceneScriptWithGPT(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "script");
}

/**
 * VOICEOVER TEXT
 * 1–2 sentences that could be used as narration or on-screen copy.
 */
export async function generateVoiceoverWithGPT(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "voiceover");
}

/**
 * METADATA TAGS
 * Returns a comma-separated list of tags you can split on the frontend.
 */
export async function generateMetadataWithGPT(
  text: string,
  codex: CodexMode = "generic"
): Promise<string[]> {
  const raw = await callServerCodex(text, codex, "metadata");
  if (!raw) return [];
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}
