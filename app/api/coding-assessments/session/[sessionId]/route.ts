import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params;
  console.log("🔍 [GET] /assessment-session");
  console.log("➡️ sessionId:", sessionId);

  try {
    const session = await prisma.assessmentSession.findUnique({
      where: { id: sessionId },
      include: {
        questions: {
          orderBy: { order: "asc" },
          include: {
            question: {
              include: {
                content: true, // MUST exist
              },
            },
          },
        },
        assessment: true,
      },
    });

      if (!session) {
        console.error("❌ Session not found:", sessionId);
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 }
        );
      }

    console.log("✅ Session found");
    console.log("🕒 endsAt:", session.endsAt);
    console.log("🧠 language:", session.assessment?.language);
    console.log("📌 total questions:", session.questions.length);

    const questions = session.questions.map((sq, index) => {
      console.log(`➡️ Processing question #${index + 1}`);
      console.log("   questionId:", sq.question.id);
      console.log("   title:", sq.question.title);

      if (!sq.question.content) {
        console.error(
          "❌ ProblemContent missing for question:",
          sq.question.id
        );
        throw new Error(
          `ProblemContent missing for question ${sq.question.id}`
        );
      }

      console.log("   ✅ ProblemContent found");
      console.log(sq.question)
      return {
        id: sq.question.id,
        title: sq.question.title,
        topic:sq.question.topic,
        difficulty:sq.question.difficulty,
        leetcodeSlug:sq.question.leetcodeSlug,
        source:sq.question.source,
        problemId:sq.question.problemId,
        fronetendId:sq.question.frontendId,
        statement: sq.question.content.statement,
        constraints: sq.question.content.constraints,
        examples: sq.question.content.examples,
        testCases: sq.question.content.testCases,
        codeSnippets:sq.question.codeSnippets
      };
    });

    console.log("✅ All questions processed successfully");

    return NextResponse.json({
      endsAt: session.endsAt,
      language: session.assessment.language,
      questions,
    });
  } catch (error) {
    console.error("🔥 Error in GET /assessment-session:", error);

    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
