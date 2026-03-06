// services/codexOrchestrator.ts

import { generateStyleSuggestion as geminiSuggest, CodexMode } from "./geminiService";
import {
  suggestStyleWithGPT,
  generateSceneScriptWithGPT,
  generateVoiceoverWithGPT,
  generateMetadataWithGPT,
} from "./openaiCodex";
import {
  suggestStyleWithClaude,
  generateSceneScriptWithClaude,
  generateVoiceoverWithClaude,
  generateMetadataWithClaude,
} from "./claudeCodex";

export type ModelProvider = "gemini" | "gpt" | "claude";

export interface CodexBundle {
  style: string;          // art direction line
  sceneScript?: string;   // optional: camera + motion description
  voiceover?: string;     // optional: 1–2 sentence VO or headline
  tags?: string[];        // optional: metadata tags
}

/**
 * Single entry point:
 * - Given text + codex + provider,
 * - Call ONLY that provider's codex functions
 * - Return everything you need for Veo + UI
 */
export async function generateCodexBundle(
  text: string,
  codex: CodexMode,
  provider: ModelProvider
): Promise<CodexBundle> {
  if (!text.trim()) {
    throw new Error("Text is required for codex bundle.");
  }

  switch (provider) {
    case "gpt": {
      const [style, sceneScript, voiceover, tags] = await Promise.all([
        suggestStyleWithGPT(text, codex),
        generateSceneScriptWithGPT(text, codex),
        generateVoiceoverWithGPT(text, codex),
        generateMetadataWithGPT(text, codex),
      ]);
      return { style, sceneScript, voiceover, tags };
    }

    case "claude": {
      const [style, sceneScript, voiceover, tags] = await Promise.all([
        suggestStyleWithClaude(text, codex),
        generateSceneScriptWithClaude(text, codex),
        generateVoiceoverWithClaude(text, codex),
        generateMetadataWithClaude(text, codex),
      ]);
      return { style, sceneScript, voiceover, tags };
    }

    case "gemini":
    default: {
      // Right now geminiService only has style; you can extend it later
      const style = await geminiSuggest(text, codex);
      return { style };
    }
  }
}
