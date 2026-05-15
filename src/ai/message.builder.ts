// ai/message.builder.ts

import { AI_MODEL_CONFIG } from "~/configs/model.config";
import { PromptBuilder } from "./prompt.builder";
import type { ChatMessage } from "~/types/chat-message";

export class MessageBuilder {
  constructor(private readonly promptBuilder = new PromptBuilder()) {}

  buildMessages(history: ChatMessage[]): ChatMessage[] {
    if (AI_MODEL_CONFIG.usesModelfile) {
      return history;
    }
    return [
      {
        role: "system",
        content: this.promptBuilder.buildSystemPrompt(),
      },
      ...history,
    ];
  }
}
