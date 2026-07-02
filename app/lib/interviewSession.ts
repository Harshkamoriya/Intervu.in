import prisma from "@/app/lib/db";
import { generateWithGemini } from "@/app/lib/llm";
import { queryResumeChunks } from "@/app/lib/pinecone";

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

  // 2. Pre-generate questions in the background (fire-and-forget).
  //    The interview flow works without them — the POST /api/interviews/[id] handler
  //    generates questions live from Gemini on each turn anyway.
  //    If this fails, the session still starts correctly.
  prefillQuestions(session.id, resumeId, jobRole).catch((err) => {
    console.warn("⚠️ Background question pre-generation failed (non-fatal):", err?.message ?? err);
  });

  return session.id;
}

// ---------------------------------------------------------------------------
// Background: extract resume sections + generate question queue
// ---------------------------------------------------------------------------
async function prefillQuestions(sessionId: string, resumeId: string, jobRole: string) {
  const INTERVIEWER_TONE = `
You are a calm, conversational senior software engineer conducting a technical interview. 
Ask naturally phrased questions — concise, curious, and human-like. 
Avoid robotic transitions like "you mentioned" or "based on your resume". 
Keep each question under 2 sentences.
`;

  // Fetch resume chunks from Pinecone
  const allChunks = await queryResumeChunks(resumeId, " ", 30);
  const fullResumeText = allChunks.map((c) => c.content).join("\n");

  if (!fullResumeText) {
    console.warn("⚠️ No resume chunks found in Pinecone for:", resumeId);
    return;
  }

  // Step 1: Extract sections
  const sectionPrompt = `
You are an expert at analyzing resumes. Given the text below, categorize its content into these sections:
- Skills or Technologies
- Projects or Achievements  
- Education
- Experience or Internships
- Certifications or Extracurriculars

Return ONLY a raw JSON object (no markdown, no code fences):
{"skills":"...","projects":"...","education":"...","experience":"...","certifications":"..."}

Resume Text:
${fullResumeText}
`;

  let sectionResults: Record<string, string>;
  try {
    const sectionJson = await generateWithGemini(sectionPrompt);
    sectionResults = JSON.parse(sectionJson);
    console.log("✅ Resume sections extracted for session:", sessionId);
  } catch (err) {
    console.warn("⚠️ Section extraction failed, using empty sections:", err);
    sectionResults = { skills: "", projects: "", education: "", experience: "", certifications: "" };
  }

  // Step 2: Generate questions
  const questionPrompt = `${INTERVIEWER_TONE}
You are interviewing a candidate for a ${jobRole} position.
Generate 5–8 targeted technical questions based on this resume data:

SKILLS: ${sectionResults.skills || ""}
PROJECTS: ${sectionResults.projects || ""}
EDUCATION: ${sectionResults.education || ""}
EXPERIENCE: ${sectionResults.experience || ""}
CERTIFICATIONS: ${sectionResults.certifications || ""}

Requirements:
- Reference specific items from the resume
- Probe technical depth and decision-making
- Mix conceptual and project-related questions
- Include 3–5 expected answer keywords per question

Respond ONLY with a raw JSON array, no markdown:
[{"question":"...","primaryKeywords":["key1","key2"]}]
`;

  const questionsJson = await generateWithGemini(questionPrompt);
  const questions: { question: string; primaryKeywords: string[] }[] = JSON.parse(questionsJson);

  await prisma.interviewSession.update({
    where: { id: sessionId },
    data: { questionQueue: questions },
  });
  console.log("✅ Question queue pre-filled for session:", sessionId, `(${questions.length} questions)`);
}
