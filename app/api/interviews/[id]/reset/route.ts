import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/db";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: sessionId } = await params;

  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: sessionId },
      select: { id: true, status: true },
    });

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "ENDED") {
      return NextResponse.json({ error: "Cannot reset a completed session" }, { status: 400 });
    }

    await prisma.interviewSession.update({
      where: { id: sessionId },
      data: {
        status: "PENDING",
        transcript: [] as any,
        scores: [] as any,
        startedAt: null,
        finalScore: null,
        // omit finalReport/report — they stay untouched until a new interview completes
      },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[reset session] error:", err);
    return NextResponse.json({ error: "Failed to reset session" }, { status: 500 });
  }
}
