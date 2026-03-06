/**
 * Claude Codex service for Mostar Video Camp
 * Uses Anthropic Messages API to generate the same things as GPT:
 *  - style suggestion
 *  - scene script
 *  - voiceover
 *  - metadata tags
 *
 * Env:
 *   ANTHROPIC_API_KEY=sk-ant-...
 */

import { CodexMode } from "./geminiService";

async function callServerCodex(text: string, codex: CodexMode, type: string): Promise<string> {
  const response = await fetch("/api/codex/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, codex, type }),
  });
  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error || "Failed to call Claude codex");
  }
  const data = await response.json();
  return data.content.trim();
}

/**
 * STYLE SUGGESTION (Claude)
 */
export async function suggestStyleWithClaude(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "style");
}

/**
 * SCENE SCRIPT (Claude)
 */
export async function generateSceneScriptWithClaude(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "script");
}

/**
 * VOICEOVER (Claude)
 */
export async function generateVoiceoverWithClaude(
  text: string,
  codex: CodexMode = "generic"
): Promise<string> {
  return callServerCodex(text, codex, "voiceover");
}

/**
 * METADATA TAGS (Claude)
 */
export async function generateMetadataWithClaude(
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
