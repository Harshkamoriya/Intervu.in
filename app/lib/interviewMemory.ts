// /app/lib/interviewMemory.ts

export interface TopicMemory {
  topic: string;
  status: "strong" | "average" | "weak";
  note: string;
  lastAskedAt: string;
}

export interface InterviewMemory {
  topicsCovered: TopicMemory[];
  strengths: string[];
  weaknesses: string[];
  confidenceTrend: ("High" | "Medium" | "Low")[];
  questionCount: number;
}

export function createEmptyMemory(): InterviewMemory {
  return {
    topicsCovered: [],
    strengths: [],
    weaknesses: [],
    confidenceTrend: [],
    questionCount: 0,
  };
}

export function isInterviewMemory(value: unknown): value is InterviewMemory {
  return (
    typeof value === "object" &&
    value !== null &&
    Array.isArray((value as any).topicsCovered)
  );
}

interface MemoryUpdateInput {
  topic?: string;
  status?: "strong" | "average" | "weak";
  note?: string;
  confidence?: "High" | "Medium" | "Low";
}

/** Pure merge — takes old memory + this turn's update, returns new memory. */
export function mergeMemoryUpdate(
  memory: InterviewMemory,
  update: MemoryUpdateInput
): InterviewMemory {
  const next: InterviewMemory = {
    topicsCovered: [...memory.topicsCovered],
    strengths: [...memory.strengths],
    weaknesses: [...memory.weaknesses],
    confidenceTrend: [...memory.confidenceTrend],
    questionCount: memory.questionCount + 1,
  };

  if (update.topic) {
    const idx = next.topicsCovered.findIndex(
      (t) => t.topic.toLowerCase() === update.topic!.toLowerCase()
    );
    const entry: TopicMemory = {
      topic: update.topic,
      status: update.status ?? "average",
      note: update.note ?? "",
      lastAskedAt: new Date().toISOString(),
    };
    if (idx >= 0) next.topicsCovered[idx] = entry; // latest take wins
    else next.topicsCovered.push(entry);

    if (entry.status === "strong" && !next.strengths.includes(update.topic)) {
      next.strengths.push(update.topic);
    }
    if (entry.status === "weak" && !next.weaknesses.includes(update.topic)) {
      next.weaknesses.push(update.topic);
    }
  }

  if (update.confidence) {
    next.confidenceTrend.push(update.confidence);
    if (next.confidenceTrend.length > 10) next.confidenceTrend.shift();
  }

  return next;
}

/** Compact bullet summary — this is what actually goes into the prompt. */
export function formatMemoryForPrompt(memory: InterviewMemory): string {
  if (!memory.topicsCovered.length) {
    return "No topics covered yet — this is the first substantive question.";
  }

  const topicLines = memory.topicsCovered
    .map((t) => `- ${t.topic}: ${t.status}${t.note ? ` (${t.note})` : ""}`)
    .join("\n");

  const recentConfidence = memory.confidenceTrend.slice(-3).join(", ") || "N/A";

  return `Topics already covered:
${topicLines}

Recent confidence trend: ${recentConfidence}
Strengths so far: ${memory.strengths.join(", ") || "none noted yet"}
Weaknesses so far: ${memory.weaknesses.join(", ") || "none noted yet"}
Total questions asked so far: ${memory.questionCount}

Instructions: Do NOT re-ask a topic already marked "strong" unless probing a genuinely new angle. Prioritize topics not yet covered, or "weak" topics worth reinforcing. Avoid near-duplicate questions.`;
}