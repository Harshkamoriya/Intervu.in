import { NextResponse } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

import prisma from "@/app/lib/db";
import { getCoachPersona } from "@/app/lib/coachPersonas";

interface FinalReportShape {
  overallScore?: number;
  verdict?: string;
  scoreBreakdown?: Record<string, number>;
  strengths?: string[];
  improvements?: string[];
}

export async function GET() {
  try {
    const { userId: clerkId } = getAuth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ sessions: [], stats: emptyStats() });
    }

    const sessions = await prisma.interviewSession.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        jobRole: true,
        status: true,
        aiInterviewerId: true,
        modelVersion: true,
        finalReport: true,
        finalScore: true,
        startedAt: true,
        endedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const completed = sessions.filter((s) => s.status === "ENDED");
    const scores = completed
      .map((s) => {
        const report = s.finalReport as FinalReportShape | null;
        return report?.overallScore ?? s.finalScore ?? null;
      })
      .filter((s): s is number => s !== null);

    const avgScore =
      scores.length > 0
        ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
        : 0;

    const breakdownCounts: Record<string, number[]> = {};
    for (const session of completed) {
      const report = session.finalReport as FinalReportShape | null;
      const breakdown = report?.scoreBreakdown;
      if (!breakdown) continue;
      for (const [key, val] of Object.entries(breakdown)) {
        if (!breakdownCounts[key]) breakdownCounts[key] = [];
        breakdownCounts[key].push(val);
      }
    }

    const areaAverages = Object.entries(breakdownCounts).map(([area, vals]) => ({
      area,
      score: Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10,
    }));

    const strongest =
      areaAverages.length > 0
        ? areaAverages.reduce((a, b) => (b.score > a.score ? b : a)).area
        : null;
    const weakest =
      areaAverages.length > 0
        ? areaAverages.reduce((a, b) => (b.score < a.score ? b : a)).area
        : null;

    const formattedSessions = sessions.map((s) => {
      const report = s.finalReport as FinalReportShape | null;
      const coach = getCoachPersona(s.modelVersion ?? s.aiInterviewerId);
      return {
        id: s.id,
        jobRole: s.jobRole,
        status: s.status,
        coachName: coach.name,
        overallScore: report?.overallScore ?? s.finalScore ?? null,
        verdict: report?.verdict ?? null,
        date: s.endedAt ?? s.startedAt ?? s.createdAt,
      };
    });

    return NextResponse.json({
      sessions: formattedSessions,
      stats: {
        totalCompleted: completed.length,
        averageScore: avgScore,
        strongestArea: strongest,
        weakestArea: weakest,
      },
    });
  } catch (error: any) {
    console.error("[practice/sessions]", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

function emptyStats() {
  return {
    totalCompleted: 0,
    averageScore: 0,
    strongestArea: null,
    weakestArea: null,
  };
}
