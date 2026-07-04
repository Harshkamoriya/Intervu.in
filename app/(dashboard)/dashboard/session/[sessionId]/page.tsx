"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Mic,
  MicOff,
  PhoneOff,
  Send,
  Video,
  VideoOff,
  Loader2,
} from "lucide-react";

import {
  Room,
  RoomEvent,
} from "livekit-client";


import { getCoachPersona } from "@/app/lib/coachPersonas";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface TranscriptEntry {
  type: string;
  message?: string;
  reply?: string;
  timestamp?: string;
}

interface SessionData {
  id: string;
  jobRole: string;
  status: string;
  aiInterviewerId?: string | null;
  modelVersion?: string | null;
  transcript: TranscriptEntry[];
}

type TurnState = "idle" | "ai_thinking" | "ai_speaking" | "your_turn" | "listening";

// TEMP DEBUG FLAG — set back to true once STT is confirmed working again.
// While false, LiveKit room connect + mic publish are skipped entirely so we
// can isolate whether LiveKit is interfering with the AssemblyAI audio pipeline.
const ENABLE_LIVEKIT = false;

// AssemblyAI native end-of-turn tuning. Higher confidence threshold / more
// silence = safer against cutting the candidate off, but slower to respond.
// Lower = snappier, more risk of premature submission.
const END_OF_TURN_CONFIDENCE_THRESHOLD = 0.7;
const MIN_END_OF_TURN_SILENCE_WHEN_CONFIDENT = 400; // ms, used when model is confident
const MAX_TURN_SILENCE = 2400; // ms, hard fallback ceiling when model isn't confident

const InterviewPage = () => {
  const { sessionId } = useParams();
  const router = useRouter();

  const [reply, setReply] = useState("");
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [sessionData, setSessionData] = useState<SessionData | null>(null);
  const [turnState, setTurnState] = useState<TurnState>("idle");
  const [isStarted, setIsStarted] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const roomRef = useRef<Room | null>(null);

  // Use a ref for the send callback so the AssemblyAI ws handler can always
  // call the latest version without needing to be re-created.
  const sendReplyCallbackRef = useRef<(text: string) => void>(() => {});

  const coach = getCoachPersona(sessionData?.modelVersion ?? sessionData?.aiInterviewerId);

  const connectLiveKit = async () => {
    if (!ENABLE_LIVEKIT) {
      console.log("[LiveKit] skipped — ENABLE_LIVEKIT is false");
      return;
    }
    const res = await fetch("/api/livekit/token");
    const { token, url } = await res.json();

    const room = new Room();

    await room.connect(url, token);

    roomRef.current = room;

    console.log("✅ Room connected");
  };

  const fetchTranscript = useCallback(async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}`);
      const data = await res.json();
      if (data.error) return;
      setSessionData(data.session);
      setTranscript(Array.isArray(data.session.transcript) ? data.session.transcript : []);
      if (data.session.status === "ENDED") {
        router.push(`/dashboard/session/${sessionId}/report`);
      }
      // If session is already in progress (e.g. page refresh), sync local state
      if (data.session.status === "IN_PROGRESS") {
        setIsStarted(true);
        setTurnState("your_turn");
      }
    } catch (err) {
      console.error("fetchTranscript error", err);
    }
  }, [sessionId, router]);

  useEffect(() => {
    fetchTranscript();
    return () => {
      stopRealtimeSTT();
      stopCamera();
      speechSynthesis.cancel();
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [fetchTranscript]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [transcript]);

  useEffect(() => {
    if (isStarted && !timerInterval.current) {
      timerInterval.current = setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);
    }
    if (!isStarted && timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
  }, [isStarted]);

  useEffect(() => {
    if (showCamera && cameraStreamRef.current && videoRef.current) {
      videoRef.current.srcObject = cameraStreamRef.current;
    }
  }, [showCamera]);

  const formatElapsed = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, "0");
    const s = (secs % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  const speak = (ttsText: string, onEnd?: () => void) => {
    if (!ttsText) {
      onEnd?.();
      return;
    }
    setTurnState("ai_speaking");
    const utter = new SpeechSynthesisUtterance(ttsText);
    utter.onstart = () => setSpeaking(true);
    utter.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utter.onerror = () => {
      setSpeaking(false);
      toast.error("Text-to-speech failed — read the message on screen");
      onEnd?.();
    };
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      cameraStreamRef.current = stream;
      setShowCamera(true);
    } catch {
      toast.error("Camera permission denied");
    }
  };

  const stopCamera = () => {
    cameraStreamRef.current?.getTracks().forEach((t) => t.stop());
    cameraStreamRef.current = null;
    setShowCamera(false);
  };

  const toggleCamera = () => {
    if (showCamera) stopCamera();
    else startCamera();
  };

  const startInterviewFlow = async () => {
    if (isStarted) return;
    setIsStarted(true);
    setTurnState("ai_thinking");

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ start: true }),
      });
      const data = await res.json();

      // Session already started (e.g. from a previous attempt) — just resume listening
      if (data.error === "Session already started") {
        setTurnState("your_turn");
        await connectLiveKit();
        startRealtimeSTT();
        return;
      }

      if (data.error) {
        toast.error(data.error);
        setIsStarted(false);
        setTurnState("idle");
        return;
      }
      if (Array.isArray(data.transcript)) {
        setTranscript(data.transcript);
      }
      const aiMessage = data.aiMessage ?? null;
      if (aiMessage) {
        speak(aiMessage, async () => {
          setTurnState("your_turn");
          await connectLiveKit();
          startRealtimeSTT();
        });
      } else {
        setTurnState("your_turn");
        await connectLiveKit();
        startRealtimeSTT();
      }
    } catch {
      toast.error("Failed to start interview");
      setIsStarted(false);
      setTurnState("idle");
    }
  };

  const startRealtimeSTT = async () => {
    if (socketRef.current?.readyState === WebSocket.OPEN) return;
    setMicError(null);
    setTurnState("listening");

    try {
      const tokenRes = await fetch("/api/getToken");
      const tokenData = await tokenRes.json();
      const token = tokenData.token;
      if (!token) throw new Error("No STT token");

      const params = new URLSearchParams({
        sample_rate: "16000",
        encoding: "pcm_s16le",
        token,
        format_turns: "true",
        end_of_turn_confidence_threshold: String(END_OF_TURN_CONFIDENCE_THRESHOLD),
        min_end_of_turn_silence_when_confident: String(
          MIN_END_OF_TURN_SILENCE_WHEN_CONFIDENT
        ),
        max_turn_silence: String(MAX_TURN_SILENCE),
      });

      const ws = new WebSocket(`wss://streaming.assemblyai.com/v3/ws?${params.toString()}`);
      socketRef.current = ws;

      ws.onopen = async () => {
        console.log("[AAI ws] connection opened");
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          micStreamRef.current = stream;
          console.log("[AAI ws] mic acquired, tracks:", stream.getAudioTracks().length);

          if (ENABLE_LIVEKIT) {
            if (roomRef.current) {
              console.log("Publishing to LiveKit...");
              const audioTrack = stream.getAudioTracks()[0];
              await roomRef.current.localParticipant.publishTrack(audioTrack);
              console.log("✅ Mic published to LiveKit");
            } else {
              console.log("❌ roomRef.current is null");
            }
          }

          const audioContext = new AudioContext({ sampleRate: 16000 });
          console.log("[AAI ws] AudioContext state:", audioContext.state);
          const source = audioContext.createMediaStreamSource(stream);
          const processor = audioContext.createScriptProcessor(4096, 1, 1);

          source.connect(processor);
          processor.connect(audioContext.destination);

          let chunkCount = 0;
          processor.onaudioprocess = (e) => {
            const inputData = e.inputBuffer.getChannelData(0);
            const buffer = floatTo16BitPCM(inputData);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(buffer);
              chunkCount++;
              if (chunkCount % 50 === 0) {
                console.log(`[AAI ws] sent ${chunkCount} audio chunks so far`);
              }
            } else if (chunkCount === 0) {
              console.warn("[AAI ws] audioprocess firing but ws not OPEN, readyState:", ws.readyState);
            }
          };

          audioContextRef.current = audioContext;
          processorRef.current = processor;
          sourceRef.current = source;
          setIsRecording(true);
        } catch {
          setMicError("Microphone permission denied");
          toast.error("Microphone permission denied — use the Send button to type replies");
          setTurnState("your_turn");
        }
      };

      ws.onmessage = (msg) => {
        try {
          const payload = JSON.parse(msg.data);

          // DEBUG: log every message type we get from AssemblyAI so we can see
          // Begin / Turn / Error / Termination events while diagnosing.
          console.log("[AAI ws] message_type:", payload.type, payload);

          if (payload.type === "Error") {
            console.error("[AAI ws] AssemblyAI returned an Error message:", payload);
            toast.error(payload.error ?? "Speech service error");
            return;
          }

          // AssemblyAI v3 streaming sends message_type: "Turn" for every update.
          // payload.transcript          -> current text for this turn
          // payload.end_of_turn         -> true once the model decides the turn is done
          // payload.turn_is_formatted   -> true once punctuation/casing applied
          // payload.end_of_turn_confidence -> 0..1 confidence for the end-of-turn call
          if (payload.type !== "Turn") return;

          const text: string = (payload.transcript ?? "").trim();

          if (payload.end_of_turn) {
            // Wait for the formatted version so the submitted text has proper
            // punctuation/casing — the unformatted end_of_turn event fires first.
            if (!payload.turn_is_formatted) return;
            if (!text) return;

            console.log(
              `[AAI ws] end_of_turn (confidence=${payload.end_of_turn_confidence}):`,
              text
            );
            sendReplyCallbackRef.current(text);
          } else if (text) {
            setReply(text);
          }
        } catch (err) {
          console.error("[AAI ws] parse error", err, "raw data:", msg.data);
        }
      };

      ws.onerror = (e) => {
        console.error("[AAI ws] error", e);
        toast.error("Speech connection lost — use Send Reply as fallback");
        setTurnState("your_turn");
      };

      ws.onclose = (e) => {
        console.warn("[AAI ws] closed — code:", e.code, "reason:", e.reason, "wasClean:", e.wasClean);
        stopRealtimeSTT(false);
      };
    } catch {
      setMicError("Could not connect to speech service");
      toast.error("Speech service unavailable — use Send Reply button");
      setTurnState("your_turn");
    }
  };

  const floatTo16BitPCM = (input: Float32Array) => {
    const buffer = new ArrayBuffer(input.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return buffer;
  };

  const stopRealtimeSTT = (resetTurn = true) => {
    try {
      socketRef.current?.close();
      socketRef.current = null;
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      audioContextRef.current?.close();
      micStreamRef.current?.getTracks().forEach((t) => t.stop());
      micStreamRef.current = null;
    } catch {
      // ignore cleanup errors
    } finally {
      processorRef.current = null;
      sourceRef.current = null;
      audioContextRef.current = null;
      setIsRecording(false);
      if (resetTurn && isStarted) setTurnState("your_turn");
    }
  };

  // Keep sendReplyCallbackRef pointing to the latest handleSendReply closure.
  useEffect(() => {
    sendReplyCallbackRef.current = (text: string) => {
      stopRealtimeSTT(false);
      setReply("");
      handleSendReply(text);
    };
  });

  const handleSendReply = async (content: string) => {
    if (!content.trim()) return;
    setTurnState("ai_thinking");

    try {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: content }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        setTurnState("your_turn");
        return;
      }

      if (Array.isArray(data.transcript)) {
        setTranscript(data.transcript);
      }

      if (data.ended) {
        toast.success("Interview completed!");
        setIsStarted(false);
        setTurnState("idle");
        router.push(`/dashboard/session/${sessionId}/report`);
        return;
      }

      const aiMessage = data.aiMessage ?? null;
      if (aiMessage) {
        speak(aiMessage, () => {
          setTurnState("your_turn");
          connectLiveKit()
            .then(() => {
              console.log("LiveKit connected");
              startRealtimeSTT();
            })
            .catch(console.error);
        });
      } else {
        setTurnState("your_turn");
        startRealtimeSTT();
      }
    } catch {
      toast.error("Failed to send reply");
      setTurnState("your_turn");
    }
  };

  const handleManualSend = () => {
    if (!reply.trim()) return;
    stopRealtimeSTT();
    const content = reply;
    setReply("");
    handleSendReply(content);
  };

  const resetSession = async () => {
    try {
      const res = await fetch(`/api/interviews/${sessionId}/reset`, { method: "POST" });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      stopRealtimeSTT(false);
      speechSynthesis.cancel();
      setReply("");
      setTranscript([]);
      setIsStarted(false);
      setTurnState("idle");
      setElapsedSeconds(0);
      toast.success("Session reset — ready to start again");
    } catch {
      toast.error("Failed to reset session");
    }
  };

  const endInterview = async () => {
    try {
      stopRealtimeSTT(false);
      stopCamera();
      speechSynthesis.cancel();
      setTurnState("ai_thinking");

      const res = await fetch(`/api/interviews/${sessionId}/end`, { method: "POST" });
      const data = await res.json();

      if (data.success || data.report || data.finalReport) {
        toast.success("Interview ended!");
        setIsStarted(false);
        router.push(`/dashboard/session/${sessionId}/report`);
      } else {
        toast.error(data.error || "Failed to end interview");
        setTurnState("idle");
      }
    } catch {
      toast.error("Failed to end interview");
    }
  };

  const turnLabel: Record<TurnState, string> = {
    idle: "Ready to start",
    ai_thinking: "AI is thinking...",
    ai_speaking: "AI is speaking...",
    your_turn: "Your turn — speak now",
    listening: "Listening...",
  };

  const turnColor: Record<TurnState, string> = {
    idle: "bg-gray-500",
    ai_thinking: "bg-amber-500 animate-pulse",
    ai_speaking: "bg-blue-500 animate-pulse",
    your_turn: "bg-emerald-500",
    listening: "bg-red-500 animate-pulse",
  };

  return (
    <div className="flex h-screen flex-col bg-gray-950 text-gray-100">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-800 px-4 py-3 sm:px-6">
        <div>
          <h1 className="text-base font-bold sm:text-lg">
            {sessionData?.jobRole ?? "Mock Interview"}
          </h1>
          <p className="text-xs text-gray-500">Coach: {coach.name}</p>
        </div>
        <div className="flex items-center gap-4">
          {isStarted && (
            <span className="font-mono text-sm text-gray-400">{formatElapsed(elapsedSeconds)}</span>
          )}
          <div className="flex items-center gap-2">
            <span className={cn("h-2 w-2 rounded-full", turnColor[turnState])} />
            <span className="text-xs text-gray-400">{turnLabel[turnState]}</span>
          </div>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-medium",
              sessionData?.status === "IN_PROGRESS"
                ? "bg-emerald-500/20 text-emerald-400"
                : sessionData?.status === "ENDED"
                ? "bg-gray-500/20 text-gray-400"
                : "bg-blue-500/20 text-blue-400"
            )}
          >
            {sessionData?.status ?? "Loading"}
          </span>
        </div>
      </header>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: AI Coach + Camera */}
        <div className="flex w-full flex-col border-r border-gray-800 sm:w-80 lg:w-96">
          {/* AI Coach Panel */}
          <div className="flex flex-1 flex-col items-center justify-center p-6">
            <div className="relative">
              {speaking && (
                <>
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-40", coach.accentColor)}
                  />
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5, delay: 0.3 }}
                    className={cn("absolute inset-0 rounded-full bg-gradient-to-br opacity-30", coach.accentColor)}
                  />
                </>
              )}
              <div
                className={cn(
                  "relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br text-4xl font-bold text-white shadow-xl",
                  coach.accentColor
                )}
              >
                {coach.avatar}
              </div>
            </div>
            <p className="mt-4 text-lg font-semibold">{coach.name}</p>
            <p className="text-xs text-gray-500">{coach.tagline}</p>

            {/* Voice wave bars when speaking */}
            {speaking && (
              <div className="mt-4 flex items-end gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <motion.div
                    key={i}
                    animate={{ height: ["8px", "24px", "8px"] }}
                    transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.1 }}
                    className="w-1 rounded-full bg-blue-400"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Camera preview */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-500">Your Camera</span>
              <button
                type="button"
                onClick={toggleCamera}
                className="text-gray-400 hover:text-white"
                title={showCamera ? "Hide camera" : "Show camera"}
              >
                {showCamera ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </button>
            </div>
            <div className="aspect-video overflow-hidden rounded-lg bg-gray-900">
              {showCamera ? (
                <video ref={videoRef} autoPlay muted playsInline className="h-full w-full object-cover scale-x-[-1]" />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-600">
                  Camera off
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Transcript */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
            <AnimatePresence>
              {transcript.map((entry, idx) => (
                <motion.div
                  key={`${entry.timestamp ?? idx}-${entry.type}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn("flex", entry.type === "reply" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-3 text-sm",
                      entry.type === "reply"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-800 text-gray-100"
                    )}
                  >
                    <p className="text-xs opacity-60 mb-1">
                      {entry.type === "reply" ? "You" : coach.name}
                    </p>
                    <p>{entry.message || entry.reply}</p>
                    <p className="mt-1 text-xs opacity-40">
                      {entry.timestamp
                        ? format(new Date(entry.timestamp), "HH:mm")
                        : format(new Date(), "HH:mm")}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {turnState === "ai_thinking" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-gray-800 px-4 py-3">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      <div className="border-t border-gray-800 bg-gray-900/80 p-4">
        {/* Live transcription bar */}
        {(isRecording || reply) && isStarted && (
          <div className="mb-3 rounded-lg border border-gray-700 bg-gray-800/60 px-4 py-2">
            <div className="flex items-center gap-2">
              {isRecording ? (
                <Mic className="h-4 w-4 text-red-400 animate-pulse" />
              ) : (
                <MicOff className="h-4 w-4 text-gray-500" />
              )}
              <span className="text-sm text-gray-300 font-mono">
                {reply || "Listening..."}
              </span>
            </div>
          </div>
        )}

        {micError && (
          <p className="mb-2 text-xs text-amber-400">{micError}</p>
        )}

        <div className="flex items-center gap-3">
          {!isStarted ? (
            <>
              <Button
                onClick={startInterviewFlow}
                className="flex-1 bg-blue-600 hover:bg-blue-700 py-5"
              >
                Start Interview
              </Button>
              {sessionData?.status === "IN_PROGRESS" && (
                <Button
                  onClick={resetSession}
                  variant="outline"
                  className="border-amber-700 text-amber-400 hover:bg-amber-950"
                  title="Reset this session back to PENDING so you can restart"
                >
                  Reset Session
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                {isRecording ? (
                  <Mic className="h-5 w-5 text-red-400" />
                ) : (
                  <MicOff className="h-5 w-5 text-gray-600" />
                )}
                <span className="hidden sm:inline">
                  {isRecording ? "Mic active" : "Mic off"}
                </span>
              </div>

              <Button
                onClick={handleManualSend}
                disabled={!reply.trim() || turnState === "ai_thinking" || turnState === "ai_speaking"}
                variant="outline"
                className="border-gray-700 text-gray-300"
              >
                <Send className="mr-1 h-4 w-4" /> Send Reply
              </Button>

              <Button
                onClick={endInterview}
                className="bg-red-600 hover:bg-red-700"
              >
                <PhoneOff className="mr-1 h-4 w-4" /> End
              </Button>

              <Button
                onClick={resetSession}
                variant="outline"
                className="border-amber-700 text-amber-400 hover:bg-amber-950 text-xs px-2"
                title="Reset session to restart from scratch"
              >
                Reset
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default InterviewPage;