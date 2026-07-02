"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Download,
  ArrowLeft,
  Loader2,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import type { FinalReport, QuestionReview } from "@/app/lib/interviewUtils";

const BREAKDOWN_LABELS: Record<string, string> = {
  technicalDepth: "Technical Depth",
  communication: "Communication",
  problemSolving: "Problem Solving",
  resumeAccuracy: "Resume Accuracy",
  confidence: "Confidence",
};

const BREAKDOWN_KEYS = Object.keys(BREAKDOWN_LABELS);

function RadarChart({ scores }: { scores: Record<string, number> }) {
  const size = 220;
  const center = size / 2;
  const radius = 80;
  const axes = BREAKDOWN_KEYS.length;
  const angleStep = (2 * Math.PI) / axes;

  const getPoint = (index: number, value: number) => {
    const angle = index * angleStep - Math.PI / 2;
    const r = (value / 10) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  const dataPoints = BREAKDOWN_KEYS.map((key, i) =>
    getPoint(i, scores[key] ?? 0)
  );
  const polygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const gridLevels = [2, 4, 6, 8, 10];

  return (
    <svg width={size} height={size} className="mx-auto">
      {gridLevels.map((level) => {
        const pts = BREAKDOWN_KEYS.map((_, i) => {
          const p = getPoint(i, level);
          return `${p.x},${p.y}`;
        }).join(" ");
        return (
          <polygon
            key={level}
            points={pts}
            fill="none"
            stroke="#374151"
            strokeWidth="1"
          />
        );
      })}

      {BREAKDOWN_KEYS.map((key, i) => {
        const outer = getPoint(i, 10);
        const label = getPoint(i, 12.5);
        return (
          <g key={key}>
            <line
              x1={center}
              y1={center}
              x2={outer.x}
              y2={outer.y}
              stroke="#374151"
              strokeWidth="1"
            />
            <text
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="fill-gray-400 text-[8px]"
            >
              {BREAKDOWN_LABELS[key]?.split(" ")[0]}
            </text>
          </g>
        );
      })}

      <polygon
        points={polygon}
        fill="rgba(59,130,246,0.25)"
        stroke="#3b82f6"
        strokeWidth="2"
      />

      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#3b82f6" />
      ))}
    </svg>
  );
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 7
      ? "text-emerald-400 bg-emerald-500/20"
      : score >= 5
      ? "text-amber-400 bg-amber-500/20"
      : "text-rose-400 bg-rose-500/20";
  return (
    <span className={cn("rounded-full px-2.5 py-0.5 text-sm font-bold", color)}>
      {score}/10
    </span>
  );
}

function QuestionAccordion({ review, index }: { review: QuestionReview; index: number }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900/60 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between p-4 text-left hover:bg-gray-800/40"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-xs text-gray-500 shrink-0">Q{index + 1}</span>
          <p className="text-sm font-medium text-gray-200 truncate">{review.question}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
          <ScoreBadge score={review.score} />
          <ChevronDown
            className={cn("h-4 w-4 text-gray-500 transition-transform", open && "rotate-180")}
          />
        </div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-t border-gray-800"
          >
            <div className="p-4 space-y-3 text-sm">
              {review.answer && (
                <div>
                  <p className="text-xs text-gray-500 mb-1">Your Answer</p>
                  <p className="text-gray-300 bg-gray-800/60 rounded-lg p-3">{review.answer}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-500 mb-1">AI Reasoning</p>
                <p className="text-gray-400">{review.reasoning}</p>
              </div>
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <p className="text-xs text-blue-400 mb-1">Ideal Answer Hint</p>
                <p className="text-gray-300">{review.idealAnswerHint}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ReportPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [report, setReport] = useState<FinalReport | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const sessionRes = await fetch(`/api/interviews/${sessionId}`);
        const sessionData = await sessionRes.json();
        if (sessionData.session?.jobRole) {
          setJobRole(sessionData.session.jobRole);
        }

        const res = await fetch(`/api/interviews/${sessionId}/end`);
        const data = await res.json();

        if (data.finalReport) {
          setReport(data.finalReport as FinalReport);
        } else if (data.report) {
          setReport(data.report as FinalReport);
        } else {
          setError("Report not yet available. Please wait a moment and refresh.");
        }
      } catch {
        setError("Failed to load report");
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const handleDownload = () => {
    window.print();
  };

  const VerdictIcon =
    report?.verdict === "Hire"
      ? CheckCircle
      : report?.verdict === "Maybe"
      ? AlertTriangle
      : XCircle;

  const verdictColor =
    report?.verdict === "Hire"
      ? "from-emerald-500 to-teal-600"
      : report?.verdict === "Maybe"
      ? "from-amber-500 to-orange-500"
      : "from-rose-500 to-red-600";

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-950">
        <div className="text-center">
          <Loader2 className="mx-auto h-10 w-10 animate-spin text-blue-500" />
          <p className="mt-4 text-gray-400">Generating your performance report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-gray-950 gap-4">
        <p className="text-gray-400">{error ?? "Report unavailable"}</p>
        <Button onClick={() => router.push("/dashboard")} variant="outline">
          Back to Practice Hub
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 print:bg-white print:text-black">
      {/* Toolbar */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-800 bg-gray-950/90 px-4 py-3 backdrop-blur print:hidden">
        <button
          type="button"
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-2 text-sm text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" /> Practice Hub
        </button>
        <Button onClick={handleDownload} variant="outline" className="border-gray-700 text-gray-300">
          <Download className="mr-2 h-4 w-4" /> Download / Print
        </Button>
      </div>

      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 text-center"
        >
          <h1 className="text-3xl font-bold text-white print:text-black">
            Performance Report
          </h1>
          {jobRole && <p className="mt-1 text-gray-400">{jobRole} Mock Interview</p>}
        </motion.div>

        {/* Overall score + verdict */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8 rounded-2xl border border-gray-800 bg-gray-900/60 p-8 text-center"
        >
          <p className="text-6xl font-extrabold text-blue-400">
            {report.overallScore}
            <span className="text-2xl text-gray-500 font-normal">/10</span>
          </p>
          <p className="mt-3 text-gray-400 max-w-xl mx-auto">{report.summary}</p>
          <div
            className={cn(
              "mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-6 py-2.5 text-white font-bold",
              verdictColor
            )}
          >
            <VerdictIcon className="h-5 w-5" />
            {report.verdict}
          </div>
        </motion.div>

        {/* Score breakdown radar */}
        {report.scoreBreakdown && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8 rounded-2xl border border-gray-800 bg-gray-900/60 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Score Breakdown</h2>
            <RadarChart scores={report.scoreBreakdown as unknown as Record<string, number>} />
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BREAKDOWN_KEYS.map((key) => {
                const val = (report.scoreBreakdown as Record<string, number>)[key] ?? 0;
                return (
                  <div key={key} className="rounded-lg bg-gray-800/60 p-3 text-center">
                    <p className="text-xs text-gray-500">{BREAKDOWN_LABELS[key]}</p>
                    <p className="text-lg font-bold text-blue-400">{val}/10</p>
                  </div>
                );
              })}
            </div>
          </motion.section>
        )}

        {/* Strengths & Improvements */}
        <div className="mb-8 grid gap-6 sm:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6"
          >
            <h3 className="mb-4 font-semibold text-emerald-400">Strengths</h3>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6"
          >
            <h3 className="mb-4 font-semibold text-amber-400">Areas for Improvement</h3>
            <ul className="space-y-2">
              {report.improvements.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Question-by-question review */}
        {report.questionReviews?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mb-8"
          >
            <h2 className="mb-4 text-lg font-semibold">Question-by-Question Review</h2>
            <div className="space-y-3">
              {report.questionReviews.map((review, i) => (
                <QuestionAccordion key={i} review={review} index={i} />
              ))}
            </div>
          </motion.section>
        )}

        {/* Improvement roadmap */}
        {report.improvementRoadmap?.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl border border-gray-800 bg-gray-900/60 p-6"
          >
            <h2 className="mb-4 text-lg font-semibold">Improvement Roadmap</h2>
            <ol className="space-y-3">
              {report.improvementRoadmap.map((step, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600/20 text-xs font-bold text-blue-400">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>
          </motion.section>
        )}
      </main>
    </div>
  );
}
