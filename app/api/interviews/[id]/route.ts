import { NextResponse, NextRequest } from "next/server";
import type { JsonValue } from "@prisma/client/runtime/library";
import { Prisma } from "@prisma/client";

import prisma from "@/app/lib/db";
import { generateWithGemini } from "@/app/lib/llm";
import { queryResumeChunks } from "@/app/lib/pinecone";
import { updateSession, endInterview } from "@/app/lib/interviewUtils";
import { INTERVIEW_SYSTEM_PROMPT } from "@/app/lib/prompt";
import { generateFinalInterviewReport } from "@/app/lib/interviewUtils";
import { getCoachPersona } from "@/app/lib/coachPersonas";

// ----------------------
// Interfaces
// ----------------------
interface GeminiInterviewResponse {
  analysis: {
    correctness: number;
    relevance: number;
    confidence: "High" | "Medium" | "Low";
    reason: string;
  };
  score: number;
  nextMessage: string;
  type: "question" | "followup" | "hint_followup" | "encouragement" | "intro";
  endInterview: boolean;
}

interface TranscriptEntry {
  type: string;
  message?: string;
  reply?: string;
  question?: string;
  sentiment?: {
    confidence: "High" | "Medium" | "Low";
    reason?: string;
  };
  timestamp?: string;
}

interface ScoreEntry {
  question: string;
  score: number;
  reason: string;
  sentiment: "High" | "Medium" | "Low";
}

// ----------------------
// Type Guards & Safe Parsers
// ----------------------
function isTranscriptEntryArray(value: unknown): value is TranscriptEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        "type" in v &&
        typeof (v as any).type === "string"
    )
  );
}

function isScoreEntryArray(value: unknown): value is ScoreEntry[] {
  return (
    Array.isArray(value) &&
    value.every(
      (v) =>
        typeof v === "object" &&
        v !== null &&
        "question" in v &&
        "score" in v
    )
  );
}

function safeParseJSON<T>(input: string, fallback: T): T {
  try {
    const parsed = JSON.parse(input);
    return parsed as T;
  } catch {
    return fallback;
  }
}

// ----------------------
// GET Handler
// ----------------------
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        resumeId: true,
        transcript: true,
        scores: true,
        status: true,
        jobRole: true,
        aiInterviewerId: true,
        modelVersion: true,
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Safely cast transcript/scores
    const transcript: TranscriptEntry[] = isTranscriptEntryArray(session.transcript)
      ? session.transcript
      : [];
    const scores: ScoreEntry[] = isScoreEntryArray(session.scores)
      ? session.scores
      : [];

      console.log(session , "session")
      console.log(session.transcript , "session.transcript")
      console.log(session.scores  ,"session.scores")
    return NextResponse.json({ session: { ...session, transcript, scores } });
  } catch (err) {
    console.error("❌ Error fetching session:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ----------------------
// POST Handler
// ----------------------
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { reply, start } = body;
  const { id: sessionId } = await params;

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
  });
  if (!session) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const transcript: TranscriptEntry[] = isTranscriptEntryArray(session.transcript)
    ? session.transcript
    : [];
  const scores: ScoreEntry[] = isScoreEntryArray(session.scores)
    ? session.scores
    : [];

  // ----------------------
  // START flow
  // ----------------------
  if (start) {
    if (session.status !== "PENDING") {
      return NextResponse.json(
        { error: "Session already started" },
        { status: 400 }
      );
    }
    const coach = getCoachPersona(session.modelVersion ?? session.aiInterviewerId);
    const introMessage = `Hello, I'm ${coach.name}, your AI interview coach for the ${session.jobRole} role. ${coach.tagline}. We'll have a conversational interview about your experiences, skills, and projects. To get started, could you briefly introduce yourself and your background?`;

    transcript.push({
      type: "intro",
      message: introMessage,
      timestamp: new Date().toISOString(),
    });

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
    transcript:transcript as any
, // ✅ FIXED
        status: "IN_PROGRESS",
        startedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      aiMessage: introMessage,
      transcript,
    });
  }

  // ----------------------
  // REPLY flow
  // ----------------------
  if (session.status !== "IN_PROGRESS") {
    return NextResponse.json(
      { error: "Session not in progress" },
      { status: 400 }
    );
  }

  if (!reply || typeof reply !== "string") {
    return NextResponse.json({ error: "Missing reply" }, { status: 400 });
  }

  if (!transcript.length) {
    return NextResponse.json(
      { error: "Invalid session state" },
      { status: 400 }
    );
  }

  const current = transcript.at(-1)!;

  const history = transcript.slice(-4).map((entry) => ({
    role: entry.type === "reply" ? "user" : "assistant",
    content: entry.reply || entry.message || "",
  }));

  try {
    let resumeContext = "";
    let geminiResponse: GeminiInterviewResponse;
    const coach = getCoachPersona(session.modelVersion ?? session.aiInterviewerId);
    const personaPrompt = `${coach.systemPromptAddition}\n\n${INTERVIEW_SYSTEM_PROMPT}`;

    if (current.type === "intro") {
      const prompt = personaPrompt.replace(
        "{jobRole}",
        session.jobRole ?? "Software Engineer"
      ).replace("{resumeContext}", "");

      const fullPrompt = `${prompt}\n\nConversation history: ${JSON.stringify(
        history
      )}\nCandidate reply: "${reply}"`;

      const rawResponse = await generateWithGemini(fullPrompt);
      geminiResponse = safeParseJSON<GeminiInterviewResponse>(rawResponse, {
        analysis: {
          correctness: 5,
          relevance: 5,
          confidence: "Medium",
          reason: "Fallback response",
        },
        score: 5,
        nextMessage: "Could you share more about a key project you’ve worked on?",
        type: "question",
        endInterview: false,
      });

      if (
        geminiResponse.analysis.correctness < 5 ||
        geminiResponse.analysis.relevance < 5
      ) {
        const chunks = session.resumeId
          ? await queryResumeChunks(session.resumeId, "Key skills, projects, and experiences.", 10)
          : [];
        resumeContext = chunks.map((c) => c.content).join("\n\n");
      }

      transcript.push({
        type: "reply",
        reply,
        sentiment: {
          confidence: geminiResponse.analysis.confidence,
          reason: geminiResponse.analysis.reason,
        },
        timestamp: new Date().toISOString(),
      });

      if (geminiResponse.nextMessage) {
        transcript.push({
          type: geminiResponse.type,
          message: geminiResponse.nextMessage,
          timestamp: new Date().toISOString(),
        });
      }

      scores.push({
        question: current.message || "Intro",
        score: geminiResponse.score,
        reason: geminiResponse.analysis.reason,
        sentiment: geminiResponse.analysis.confidence,
      });
    } else {
      // Regular Q&A flow
      const query = `${current.message} ${reply}`;
      const chunks = session.resumeId
        ? await queryResumeChunks(session.resumeId, query, 5)
        : [];
      resumeContext = chunks.map((c) => c.content).join("\n\n");

      const prompt = personaPrompt.replace(
        "{jobRole}",
        session.jobRole ?? "Software Engineer"
      ).replace("{resumeContext}", resumeContext);

      const fullPrompt = `${prompt}\n\nConversation history: ${JSON.stringify(
        history
      )}\nCandidate reply: "${reply}"`;

      const rawResponse = await generateWithGemini(fullPrompt);
      geminiResponse = safeParseJSON<GeminiInterviewResponse>(rawResponse, {
        analysis: {
          correctness: 5,
          relevance: 5,
          confidence: "Medium",
          reason: "Fallback response",
        },
        score: 5,
        nextMessage: "Can you elaborate on that topic further?",
        type: "followup",
        endInterview: false,
      });

      transcript.push({
        type: "reply",
        question: current.message,
        reply,
        sentiment: {
          confidence: geminiResponse.analysis.confidence,
          reason: geminiResponse.analysis.reason,
        },
        timestamp: new Date().toISOString(),
      });

      if (geminiResponse.nextMessage) {
        transcript.push({
          type: geminiResponse.type,
          message: geminiResponse.nextMessage,
          timestamp: new Date().toISOString(),
        });
      }

      scores.push({
        question: current.message || "Q",
        score: geminiResponse.score,
        reason: geminiResponse.analysis.reason,
        sentiment: geminiResponse.analysis.confidence,
      });

    if (geminiResponse.endInterview) {
       const result =  await generateFinalInterviewReport(sessionId);
        return NextResponse.json({
          ended: true,
          aiMessage: geminiResponse.nextMessage || null,
          transcript,
          finalReport: result.finalReport,
          result
        });
      }
    }

    await updateSession(sessionId, transcript, [], scores);

    const aiMessage =
      transcript.at(-1)?.type !== "reply"
        ? transcript.at(-1)?.message
        : null;

    return NextResponse.json({
      success: true,
      aiMessage: aiMessage || null,
      transcript,
      ended: false,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("❌ Error in POST handler:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
