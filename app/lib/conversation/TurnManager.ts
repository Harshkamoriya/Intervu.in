/**
 * TurnManager — reliable end-of-turn detection
 *
 * Strategy:
 *   - Every incoming transcript (partial or final) resets a silence timer
 *   - When the timer fires without new speech → turn is complete
 *   - Adaptive window: short replies wait longer, long replies submit faster
 *   - Minimum word guard prevents noise/coughs from triggering submission
 *   - Sentence completeness heuristic shortens the window when the answer looks done
 */

export interface TurnManagerOptions {
  onTurnEnd: (transcript: string) => void;
  /** Minimum words before a turn can be auto-submitted (default 3) */
  minWords?: number;
  /** Base silence window in ms (default 2500) */
  baseSilenceMs?: number;
}

const TERMINAL_PUNCTUATION = /[.?!](\s|$)/;
const TERMINAL_PHRASES = [
  /\b(that'?s (it|all|everything))\b/i,
  /\b(i think (so|that covers it))\b/i,
  /\b(done|finished)\b/i,
];

function isComplete(text: string): boolean {
  if (TERMINAL_PUNCTUATION.test(text)) return true;
  return TERMINAL_PHRASES.some((re) => re.test(text));
}

function adaptiveSilenceMs(wordCount: number, base: number): number {
  if (wordCount < 5) return base + 1500;  // very short — give extra time
  if (wordCount < 20) return base;         // medium — use base
  return Math.max(base - 600, 1000);       // long — submit a bit faster
}

export class TurnManager {
  private accumulated = "";
  private submitTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly onTurnEnd: (text: string) => void;
  private readonly minWords: number;
  private readonly baseSilenceMs: number;

  constructor(options: TurnManagerOptions) {
    this.onTurnEnd = options.onTurnEnd;
    this.minWords = options.minWords ?? 3;
    this.baseSilenceMs = options.baseSilenceMs ?? 2500;
  }

  /**
   * Call this for EVERY transcript event — both partial and final.
   * Pass the full accumulated text (not just the new chunk).
   */
  onTranscript(fullText: string) {
    if (!fullText.trim()) return;
    this.accumulated = fullText;

    // Reset the silence timer on every new word received
    this._resetTimer();
  }

  /** Reset all state — call after reply is sent */
  reset() {
    this._cancelTimer();
    this.accumulated = "";
    console.log("[TurnManager] reset");
  }

  // ---------------------------------------------------------------------------

  private _resetTimer() {
    this._cancelTimer();

    const wordCount = this.accumulated.trim().split(/\s+/).filter(Boolean).length;

    if (wordCount < this.minWords) return; // not enough content yet

    const complete = isComplete(this.accumulated);
    const silenceMs = adaptiveSilenceMs(wordCount, this.baseSilenceMs);
    const delay = complete ? Math.min(silenceMs, 1500) : silenceMs;

    this.submitTimer = setTimeout(() => {
      const text = this.accumulated.trim();
      const words = text.split(/\s+/).filter(Boolean).length;
      if (words < this.minWords) return;
      console.log(`[TurnManager] firing — words=${words} complete=${complete} delay=${delay}ms`);
      this.onTurnEnd(text);
    }, delay);
  }

  private _cancelTimer() {
    if (this.submitTimer) {
      clearTimeout(this.submitTimer);
      this.submitTimer = null;
    }
  }
}
