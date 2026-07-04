import prisma from "@/app/lib/db";

export async function createInterviewSession({
  userId,
  resumeId,
  jobRole,
  aiInterviewerId,
  coachPersonaId,
}: {
  userId: string;
  resumeId: string;
  jobRole: string;
  /** FK to AIInterviewer table — only set if a real DB row exists */
  aiInterviewerId?: string;
  /** Free-text coach persona ID (e.g. "ava", "marcus", "priya") */
  coachPersonaId?: string;
}) {
  console.log("📩 [createInterviewSession] called with:", { userId, resumeId, jobRole, coachPersonaId });

  if (!resumeId) throw new Error("Missing resumeId");

  // 1. Create the session record immediately — this is what the user waits for.
  const session = await prisma.interviewSession.create({
    data: {
      userId,
      resumeId,
      jobRole,
      aiInterviewerId: aiInterviewerId ?? null,
      // Store the coach persona slug (ava/marcus/priya) in modelVersion — no FK constraint
      modelVersion: coachPersonaId ?? aiInterviewerId ?? null,
      status: "PENDING",
      questionQueue: [],
      transcript: [],
      scores: [],
    },
  });
  console.log("✅ Created interview session:", session.id);

  // Pre-generation of questions is intentionally disabled.
  // The interview generates questions live via Gemini on each turn,
  // so pre-filling the questionQueue is unnecessary and burns rate limits.

  return session.id;
}

