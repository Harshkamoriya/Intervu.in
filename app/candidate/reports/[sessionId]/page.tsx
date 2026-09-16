"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, Clock, Target, TrendingUp, MessageCircle } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

interface ReportData {
  id: string;
  jobRole: string;
  coachName: string;
  status: string;
  overallScore: number;
  createdAt: string;
  feedback: string;
  verdict?: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}

export default function ReportDetailPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;
  
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch(`/api/interviews/${sessionId}/report`);
        if (!res.ok) {
          throw new Error("Failed to load report");
        }
        const data = await res.json();
        setReport(data.data || data);
      } catch (err: any) {
        console.error("[v0] Report fetch error:", err);
        setError(err.message || "Failed to load report");
      } finally {
        setLoading(false);
      }
    }
    
    if (sessionId) {
      fetchReport();
    }
  }, [sessionId]);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse max-w-4xl mx-auto">
        <div className="h-12 bg-muted rounded-lg w-24" />
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-40 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Link href="/candidate/reports">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={18} />
            Back to Reports
          </Button>
        </Link>
        <div className="border border-dashed border-border rounded-lg p-12 text-center space-y-3">
          <p className="text-lg font-semibold text-foreground">Report not found</p>
          <p className="text-muted-foreground">{error || "This interview report is not available"}</p>
        </div>
      </div>
    );
  }

  const verdictColor = (verdict?: string) => {
    if (verdict === "Hire") return "bg-chart-2/10 text-chart-2 border-chart-2/30";
    if (verdict === "Maybe") return "bg-chart-3/10 text-chart-3 border-chart-3/30";
    if (verdict === "No Hire") return "bg-destructive/10 text-destructive border-destructive/30";
    return "bg-muted/20 text-muted-foreground border-muted/30";
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Link href="/candidate/reports">
          <Button variant="outline" className="gap-2">
            <ArrowLeft size={18} />
            Back to Reports
          </Button>
        </Link>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="gap-2">
            <Download size={16} />
            Download
          </Button>
          <Button variant="outline" size="sm" className="gap-2">
            <Share2 size={16} />
            Share
          </Button>
        </div>
      </motion.div>

      {/* Score Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="border border-border bg-card rounded-lg p-8 space-y-6"
      >
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider font-semibold">
            Interview Report
          </p>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{report.jobRole}</h1>
              <p className="text-muted-foreground mt-1">Coach: {report.coachName}</p>
            </div>
            {report.verdict && (
              <span className={cn("px-4 py-2 rounded-lg border font-semibold text-sm", verdictColor(report.verdict))}>
                {report.verdict}
              </span>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-border">
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Score</p>
            <p className="text-4xl font-bold text-primary">{report.overallScore}/10</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</p>
            <p className="text-lg font-semibold text-foreground">{new Date(report.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <span className={cn(
              "inline-block px-3 py-1 rounded-full text-xs font-semibold",
              report.status === "ENDED" ? "bg-chart-2/10 text-chart-2" : "bg-chart-3/10 text-chart-3"
            )}>
              {report.status === "ENDED" ? "Completed" : report.status}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Feedback */}
      {report.feedback && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="border border-border bg-card rounded-lg p-6 space-y-3"
        >
          <div className="flex items-center gap-2">
            <MessageCircle size={20} className="text-primary" />
            <h2 className="text-lg font-bold text-foreground">Feedback</h2>
          </div>
          <p className="text-muted-foreground leading-relaxed">{report.feedback}</p>
        </motion.div>
      )}

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Strengths */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={20} className="text-chart-2" />
            <h3 className="text-lg font-bold text-foreground">Strengths</h3>
          </div>
          <ul className="space-y-2">
            {report.strengths && report.strengths.length > 0 ? (
              report.strengths.map((strength, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="text-chart-2 font-bold flex-shrink-0">✓</span>
                  <span>{strength}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No specific strengths recorded</p>
            )}
          </ul>
        </motion.div>

        {/* Weaknesses */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="border border-border bg-card rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Target size={20} className="text-chart-3" />
            <h3 className="text-lg font-bold text-foreground">Areas to Improve</h3>
          </div>
          <ul className="space-y-2">
            {report.weaknesses && report.weaknesses.length > 0 ? (
              report.weaknesses.map((weakness, idx) => (
                <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="text-chart-3 font-bold flex-shrink-0">•</span>
                  <span>{weakness}</span>
                </li>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No specific areas recorded</p>
            )}
          </ul>
        </motion.div>
      </div>

      {/* Recommendations */}
      {report.recommendations && report.recommendations.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="border border-border bg-card rounded-lg p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Clock size={20} className="text-primary" />
            <h3 className="text-lg font-bold text-foreground">Recommendations</h3>
          </div>
          <ul className="space-y-2">
            {report.recommendations.map((rec, idx) => (
              <li key={idx} className="flex gap-3 text-sm text-muted-foreground">
                <span className="text-primary font-bold flex-shrink-0">{idx + 1}.</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="border border-dashed border-border rounded-lg p-6 space-y-4 text-center"
      >
        <h3 className="text-lg font-semibold text-foreground">Ready for another round?</h3>
        <p className="text-muted-foreground">Practice more interviews to improve your skills</p>
        <Link href="/candidate/interviews">
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
            Start Another Interview
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
