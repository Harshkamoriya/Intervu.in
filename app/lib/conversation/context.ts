import { ConversationState } from "./types";

export interface ConversationContext {
  state: ConversationState;

  transcript: string;

  lastTranscriptUpdate: number;

  speechStartedAt: number | null;

  silenceStartedAt: number | null;

  speechDuration: number;

  silenceDuration: number;

  confidence: number;

  lastWords: string[];

  fillerDetected: boolean;
}