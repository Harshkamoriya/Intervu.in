export class TurnManager {

  private transcript = "";

  private isSpeaking = false;

  private speechStartedAt: number | null = null;

  private silenceStartedAt: number | null = null;

  private hasSpeech = false;

  constructor() {
    console.log("TurnManager Initialized");
  }

  onTranscript(text: string) {
    this.transcript = text;
    console.log("Current Transcript:", this.transcript);
  }

  getTranscript() {
    return this.transcript;
  }

  onSpeechStart() {

    if (this.isSpeaking) return;

    this.isSpeaking = true;

    this.speechStartedAt = Date.now();

    this.silenceStartedAt = null;

    console.log("Speech Started");
}

onSpeechStop() {

    if (!this.isSpeaking) return;

    this.isSpeaking = false;

    this.silenceStartedAt = Date.now();

    console.log("Speech Stopped");
}

}