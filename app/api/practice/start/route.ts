import { NextRequest, NextResponse } from "next/server";
import { getAuth, currentUser } from "@clerk/nextjs/server";

import prisma from "@/app/lib/db";
import { createInterviewSession } from "@/app/lib/interviewSession";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = getAuth(req);
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      const clerkUser = await currentUser();
      if (!clerkUser) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const email = clerkUser.emailAddresses?.[0]?.emailAddress;
      if (!email) {
        return NextResponse.json({ error: "Email not found" }, { status: 400 });
      }
      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || undefined,
        },
      });
    }

    const { resumeId, jobRole, coachId } = await req.json();
    if (!resumeId || !jobRole || !coachId) {
      return NextResponse.json(
        { error: "resumeId, jobRole, and coachId are required" },
        { status: 400 }
      );
    }

    const resume = await prisma.resume.findUnique({ where: { id: resumeId } });
    if (!resume || resume.userId !== user.id) {
      return NextResponse.json({ error: "Resume not found" }, { status: 404 });
    }

    const sessionId = await createInterviewSession({
      userId: user.id,
      resumeId,
      jobRole,
      // aiInterviewerId is a FK to the AIInterviewer table — pass null to avoid
      // the constraint violation. The coach persona ID is stored in modelVersion.
      aiInterviewerId: undefined,
      coachPersonaId: coachId,
    });

    return NextResponse.json({ success: true, sessionId });
  } catch (error: any) {
    console.error("[practice/start]", error);
    return NextResponse.json(
      { error: error.message || "Failed to start session" },
      { status: 500 }
    );
  }
}
