/**
 * TurnManager — smart end-of-turn detection
 *
 * Strategy (Option 2 + 3):
 *   - Primary signal:  AssemblyAI `speech_end` event (audio-level silence)
 *   - Secondary check: sentence completeness heuristic on the transcript text
 *   - Adaptive window: short replies get a longer grace period; long replies submit faster
 *
 * Usage:
 *   const tm = new TurnManager({ onTurnEnd: (text) => sendReply(text) });
 *   // wire AssemblyAI WS messages:
 *   tm.onPartialTranscript(text)
 *   tm.onFinalTranscript(text)
 *   tm.onSpeechEnd()          // called when AssemblyAI fires speech_end
 *   // clean up:
 *   tm.reset()
 */

export interface TurnManagerOptions {
  /** Called when the turn is considered complete — passes the accumulated transcript */
  onTurnEnd: (transcript: string) => void;
  /** Minimum words before a turn can be auto-submitted (guards against noise/coughs) */
  minWords?: number;
  /** Base silence window in ms after speech_end is detected (default 1800) */
  baseSilenceMs?: number;
}

// Terminal punctuation or phrases that signal a complete thought
const TERMINAL_PUNCTUATION = /[.?!](\s|$)/;
const TERMINAL_PHRASES = [
  /\b(that('?s| is) (it|all|everything)\b)/i,
  /\b(i think (so|that covers it))\b/i,
  /\b(yeah|yes|no)[,.]?\s*$/i,
  /\b(done|finished|end)\b/i,
];

function isComplete(text: string): boolean {
  if (TERMINAL_PUNCTUATION.test(text)) return true;
  return TERMINAL_PHRASES.some((re) => re.test(text));
}

/** How long to wait after speech_end based on how much was said */
function adaptiveSilenceMs(wordCount: number, base: number): number {
  if (wordCount < 5) return base + 2000;   // very short — give more time, might be thinking
  if (wordCount < 20) return base;          // medium — use base window
  return Math.max(base - 500, 800);         // long reply — submit a bit faster
}

export class TurnManager {
  private finalText = "";
  private partialText = "";
  private speechEndReceived = false;
  private submitTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onTurnEnd: (text: string) => void;
  private readonly minWords: number;
  private readonly baseSilenceMs: number;

  constructor(options: TurnManagerOptions) {
    this.onTurnEnd = options.onTurnEnd;
    this.minWords = options.minWords ?? 2;
    this.baseSilenceMs = options.baseSilenceMs ?? 1800;
    console.log("[TurnManager] initialized");
  }

  /** Called on every PartialTranscript event from AssemblyAI */
  onPartialTranscript(text: string) {
    this.partialText = text;
    // If a submit timer is running, keep it alive — speech is still ongoing
    this._cancelTimer();
  }

  /** Called on every FinalTranscript event from AssemblyAI */
  onFinalTranscript(text: string) {
    if (!text.trim()) return;
    this.finalText = (this.finalText + " " + text).trim();
    this.partialText = "";

    // If speech_end already arrived before this final chunk, schedule now
    if (this.speechEndReceived) {
      this._scheduleSubmit();
    }
  }

  /**
   * Called when AssemblyAI fires a `speech_end` event.
   * This is the audio-level signal that the user went quiet.
   */
  onSpeechEnd() {
    console.log("[TurnManager] speech_end received, accumulated:", JSON.stringify(this.finalText));
    this.speechEndReceived = true;
    // Small delay to allow any in-flight FinalTranscript to arrive
    setTimeout(() => this._scheduleSubmit(), 300);
  }

  /** Reset all state — call this when starting a new turn (after reply is sent) */
  reset() {
    this._cancelTimer();
    this.finalText = "";
    this.partialText = "";
    this.speechEndReceived = false;
    console.log("[TurnManager] reset");
  }

  /** Get current accumulated text (final + any trailing partial) */
  getAccumulatedText(): string {
    const partial = this.partialText.trim();
    const full = this.finalText.trim();
    if (!partial) return full;
    // Avoid duplicating text that's already in finalText
    if (full.endsWith(partial)) return full;
    return (full + " " + partial).trim();
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private _scheduleSubmit() {
    this._cancelTimer();

    const text = this.getAccumulatedText();
    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

    // Guard: don't submit noise or single words
    if (wordCount < this.minWords) {
      console.log("[TurnManager] too few words, skipping submit:", wordCount);
      return;
    }

    const complete = isComplete(text);
    const silenceMs = adaptiveSilenceMs(wordCount, this.baseSilenceMs);

    // If the sentence looks complete, submit after a short confirmation window.
    // If it looks incomplete, give extra time for the user to continue.
    const delay = complete ? Math.min(silenceMs, 1200) : silenceMs;

    console.log(
      `[TurnManager] scheduling submit in ${delay}ms — words=${wordCount} complete=${complete}`
    );

    this.submitTimer = setTimeout(() => {
      const finalContent = this.getAccumulatedText();
      if (!finalContent.trim() || finalContent.trim().split(/\s+/).length < this.minWords) return;
      console.log("[TurnManager] submitting turn:", JSON.stringify(finalContent));
      this.onTurnEnd(finalContent);
    }, delay);
  }

  private _cancelTimer() {
    if (this.submitTimer) {
      clearTimeout(this.submitTimer);
      this.submitTimer = null;
    }
  }
}
