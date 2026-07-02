// /app/lib/interviewUtils.ts

import prisma from "./db";
import { generateWithGemini } from "./llm";

interface ScoreEntry {
  question: string;
  score: number;
  reason: string;
  sentiment: "High" | "Medium" | "Low";
}

export interface QuestionReview {
  question: string;
  answer: string;
  score: number;
  reasoning: string;
  idealAnswerHint: string;
}

export interface FinalReport {
  overallScore: number;
  summary: string;
  strengths: string[];
  improvements: string[];
  verdict: string;
  scoreBreakdown: {
    technicalDepth: number;
    communication: number;
    problemSolving: number;
    resumeAccuracy: number;
    confidence: number;
  };
  questionReviews: QuestionReview[];
  improvementRoadmap: string[];
}

/**
 * Generates a final interview report for a given session.
 */
export async function generateFinalInterviewReport(sessionId: string) {
  console.log("🧠 Generating final report for session:", sessionId);

  const session = await prisma.interviewSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      jobRole: true,
      status: true,
      transcript: true,
      scores: true,
    },
  });

  if (!session) throw new Error("Session not found");
  if (session.status === "ENDED") throw new Error("Session already ended");

  const transcript = Array.isArray(session.transcript) ? session.transcript : [];
  const scores = Array.isArray(session.scores)
    ? (session.scores as unknown as ScoreEntry[])
    : [];

  const avgScore =
    scores.length > 0
      ? scores.reduce((acc, s) => acc + (s.score ?? 0), 0) / scores.length
      : 0;

  const summaryPrompt = `
You are an AI interviewer generating a comprehensive final performance report for a candidate applying for the "${session.jobRole}" position.

Transcript: ${JSON.stringify(transcript, null, 2)}
Per-question Scores: ${JSON.stringify(scores, null, 2)}

Provide a detailed JSON report with ALL of the following fields:
{
  "overallScore": number (0-10, one decimal),
  "summary": string (2-3 sentences overall assessment),
  "strengths": string[] (3-5 specific strengths),
  "improvements": string[] (3-5 specific areas to improve),
  "verdict": "Hire" | "Maybe" | "No Hire",
  "scoreBreakdown": {
    "technicalDepth": number (0-10),
    "communication": number (0-10),
    "problemSolving": number (0-10),
    "resumeAccuracy": number (0-10),
    "confidence": number (0-10)
  },
  "questionReviews": [
    {
      "question": string,
      "answer": string (candidate's transcribed answer),
      "score": number (0-10),
      "reasoning": string (why this score was given),
      "idealAnswerHint": string (what a stronger answer would include)
    }
  ],
  "improvementRoadmap": string[] (3-5 actionable next steps, e.g. "Review System Design basics")
}

Match each questionReview entry to a Q&A pair from the transcript. Respond ONLY with valid JSON, no markdown fences.
`;

  const rawReport = await generateWithGemini(summaryPrompt);

  let finalReport: FinalReport;
  try {
    const cleaned = rawReport.replace(/```json/g, "").replace(/```/g, "").trim();
    finalReport = JSON.parse(cleaned);
  } catch {
    finalReport = {
      overallScore: Math.round(avgScore * 10) / 10,
      summary:
        "Candidate performed reasonably well. Demonstrated fair understanding of core topics.",
      strengths: ["Good communication", "Logical reasoning"],
      improvements: ["Needs deeper project-level answers"],
      verdict: avgScore > 7 ? "Hire" : avgScore > 5 ? "Maybe" : "No Hire",
      scoreBreakdown: {
        technicalDepth: avgScore,
        communication: avgScore,
        problemSolving: avgScore,
        resumeAccuracy: avgScore,
        confidence: avgScore,
      },
      questionReviews: scores.map((s) => ({
        question: s.question,
        answer: "",
        score: s.score,
        reasoning: s.reason,
        idealAnswerHint: "Provide more specific examples and technical details.",
      })),
      improvementRoadmap: [
        "Practice explaining projects concisely",
        "Review core technical concepts for your target role",
      ],
    };
  }

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      transcript: JSON.parse(JSON.stringify(transcript)),
      scores: JSON.parse(JSON.stringify(scores)),
      finalReport: JSON.parse(JSON.stringify(finalReport)),
      finalScore: finalReport.overallScore,
      status: "ENDED",
      endedAt: new Date(),
    },
  });

  console.log("✅ Interview ended for session:", sessionId);

  return {
    success: true,
    ended: true,
    report: finalReport,
    finalReport,
  };
}

export async function updateSession(
  sessionId: string,
  transcript: any[],
  questionQueue: any[],
  scores: any[]
) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: { transcript, questionQueue, scores, updatedAt: new Date() },
  });
}

export async function endInterview(
  sessionId: string,
  transcript: any[],
  scores: any[]
) {
  return prisma.interviewSession.update({
    where: { id: sessionId },
    data: {
      transcript,
      scores,
      status: "ENDED",
      endedAt: new Date(),
      updatedAt: new Date(),
    },
  });
}
