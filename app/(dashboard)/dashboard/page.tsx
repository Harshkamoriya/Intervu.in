"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axios from "axios";
import {
  Upload,
  Mic,
  TrendingUp,
  Award,
  AlertCircle,
  ChevronRight,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

import { useUploadResume, useStartPracticeSession } from "@/hooks/useUploadResume";
import { COACH_PERSONAS, TARGET_ROLES } from "@/app/lib/coachPersonas";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";
import AppHeader from "../_components/AppHeader";

interface PracticeSession {
  id: string;
  jobRole: string | null;
  status: string;
  coachName: string;
  overallScore: number | null;
  verdict: string | null;
  date: string;
}

interface PracticeStats {
  totalCompleted: number;
  averageScore: number;
  strongestArea: string | null;
  weakestArea: string | null;
}

export default function PracticeHubPage() {
  const { isSignedIn, user } = useUser();
  const router = useRouter();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeName, setResumeName] = useState("");
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [jobRole, setJobRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [selectedCoach, setSelectedCoach] = useState(COACH_PERSONAS[0].id);
  const [step, setStep] = useState(1);

  const uploadMutation = useUploadResume({
    onSuccess: (data) => {
      setResumeId(data.resumeId);
      setStep(2);
    },
  });

  const startMutation = useStartPracticeSession();

  const { data: practiceData, isLoading: sessionsLoading } = useQuery({
    queryKey: ["practice-sessions"],
    queryFn: async () => {
      const res = await axios.get("/api/practice/sessions");
      return res.data as { sessions: PracticeSession[]; stats: PracticeStats };
    },
    enabled: !!isSignedIn,
  });

  const effectiveRole = jobRole === "custom" ? customRole.trim() : jobRole;

  const handleResumeUpload = () => {
    if (!resumeFile) {
      toast.error("Please select a resume file first");
      return;
    }
    uploadMutation.mutate(resumeFile);
  };

  const handleStartInterview = async () => {
    if (!resumeId) {
      toast.error("Please upload your resume first");
      return;
    }
    if (!effectiveRole) {
      toast.error("Please select or enter a target role");
      return;
    }

    try {
      const result = await startMutation.mutateAsync({
        resumeId,
        jobRole: effectiveRole,
        coachId: selectedCoach,
      });
      router.push(`/dashboard/session/${result.sessionId}`);
    } catch {
      // Error handled by mutation
    }
  };

  const verdictColor = useCallback((verdict: string | null) => {
    if (verdict === "Hire") return "bg-chart-2/20 text-chart-2 border-chart-2/30";
    if (verdict === "Maybe") return "bg-chart-3/20 text-chart-3 border-chart-3/30";
    if (verdict === "No Hire") return "bg-chart-4/20 text-chart-4 border-chart-4/30";
    return "bg-muted/20 text-muted-foreground border-muted/30";
  }, []);

  useEffect(() => {
    if (isSignedIn === false) {
      router.push("/");
    }
  }, [isSignedIn, router]);

  if (!isSignedIn) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Redirecting to login...</p>
      </div>
    );
  }

  const stats = practiceData?.stats;
  const sessions = practiceData?.sessions ?? [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <main className="mx-auto max-w-6xl px-6 py-8 sm:px-8 lg:px-12">
        {/* Quick Stats Banner */}
        <motion.section
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
        >
          <StatCard
            icon={<Mic className="h-5 w-5 text-primary" />}
            label="Interviews Completed"
            value={stats?.totalCompleted ?? 0}
            loading={sessionsLoading}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-primary" />}
            label="Average Score"
            value={stats?.averageScore ? `${stats.averageScore}/10` : "—"}
            loading={sessionsLoading}
          />
          <StatCard
            icon={<Award className="h-5 w-5 text-primary" />}
            label="Strongest / Weakest"
            value={
              stats?.strongestArea
                ? `${stats.strongestArea} / ${stats.weakestArea ?? "—"}`
                : "Complete an interview to see"
            }
            loading={sessionsLoading}
            small
          />
        </motion.section>

        {/* Start New Mock Interview */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12 rounded-lg border border-border bg-card p-6 sm:p-8"
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Mic className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Start New Mock Interview</h2>
              <p className="text-sm text-muted-foreground">
                Upload your resume, pick a role, choose your AI coach
              </p>
            </div>
          </div>

          {/* Step indicators */}
          <div className="mb-8 flex gap-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-1 flex-1 rounded-full transition-colors",
                  step >= s ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>

          {/* Step 1: Upload Resume */}
          <div className={cn("space-y-4", step !== 1 && "hidden")}>
            <label className="block text-sm font-medium text-foreground">
              Step 1 — Upload Resume (PDF, max 5MB)
            </label>
            <div
              className={cn(
                "flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
                resumeFile
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50 bg-secondary"
              )}
              onClick={() => document.getElementById("resumeUpload")?.click()}
            >
              <Upload className={cn("mb-3 h-8 w-8", resumeFile ? "text-primary" : "text-muted-foreground")} />
              {resumeFile ? (
                <p className="font-medium text-primary">{resumeName}</p>
              ) : (
                <>
                  <p className="font-medium text-foreground">Click to upload or drag & drop</p>
                  <p className="mt-1 text-sm text-muted-foreground">PDF up to 5MB</p>
                </>
              )}
              <input
                id="resumeUpload"
                type="file"
                accept=".pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    if (file.size > 5 * 1024 * 1024) {
                      toast.error("File size exceeds 5MB limit");
                      return;
                    }
                    setResumeFile(file);
                    setResumeName(file.name);
                  }
                }}
              />
            </div>
            <Button
              onClick={handleResumeUpload}
              disabled={!resumeFile || uploadMutation.isPending}
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {uploadMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...
                </>
              ) : (
                "Upload & Continue"
              )}
            </Button>
          </div>

          {/* Step 2: Select Role */}
          <div className={cn("space-y-4", step !== 2 && "hidden")}>
            <label className="block text-sm font-medium text-foreground">
              Step 2 — Select Target Role
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TARGET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setJobRole(role);
                    setCustomRole("");
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                    jobRole === role
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary text-foreground hover:border-primary/50"
                  )}
                >
                  {role}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setJobRole("custom")}
                className={cn(
                  "rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                  jobRole === "custom"
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground hover:border-primary/50"
                )}
              >
                Custom Role
              </button>
            </div>
            {jobRole === "custom" && (
              <input
                type="text"
                placeholder="Enter your target role..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder-muted-foreground focus:border-primary focus:outline-none"
              />
            )}
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)} className="border-border text-foreground">
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!effectiveRole}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Continue
              </Button>
            </div>
          </div>

          {/* Step 3: Choose Coach */}
          <div className={cn("space-y-4", step !== 3 && "hidden")}>
            <label className="block text-sm font-medium text-foreground">
              Step 3 — Choose Your AI Coach
            </label>
            <div className="grid gap-4 sm:grid-cols-3">
              {COACH_PERSONAS.map((coach) => (
                <motion.button
                  key={coach.id}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedCoach(coach.id)}
                  className={cn(
                    "flex flex-col items-center rounded-lg border p-5 text-center transition-all",
                    selectedCoach === coach.id
                      ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                      : "border-border bg-secondary hover:border-primary/50"
                  )}
                >
                  <div
                    className={cn(
                      "mb-3 flex h-16 w-16 items-center justify-center rounded-lg bg-primary text-2xl font-bold text-primary-foreground",
                      coach.accentColor
                    )}
                  >
                    {coach.avatar}
                  </div>
                  <span className="font-semibold text-foreground">{coach.name}</span>
                  <span className="mt-1 text-xs text-primary">{coach.tagline}</span>
                  <p className="mt-2 text-xs text-muted-foreground">{coach.description}</p>
                </motion.button>
              ))}
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)} className="border-border text-foreground">
                Back
              </Button>
              <Button
                onClick={handleStartInterview}
                disabled={startMutation.isPending}
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {startMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Starting...
                  </>
                ) : (
                  <>
                    Start Interview <ChevronRight className="ml-1 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.section>

        {/* Past Interview Sessions */}
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="mb-6 text-xl font-bold text-foreground">Past Interview Sessions</h2>

          {sessionsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="rounded-lg border border-border bg-secondary p-10 text-center">
              <AlertCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
              <p className="text-muted-foreground">No previous sessions yet.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Complete your first mock interview to see feedback here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <motion.button
                  key={session.id}
                  type="button"
                  whileHover={{ y: -2 }}
                  onClick={() => {
                    if (session.status === "ENDED") {
                      router.push(`/dashboard/session/${session.id}/report`);
                    } else {
                      router.push(`/dashboard/session/${session.id}`);
                    }
                  }}
                  className="rounded-lg border border-border bg-card p-5 text-left transition-all hover:border-primary/50 hover:bg-secondary"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-foreground">{session.jobRole ?? "Interview"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.date).toLocaleDateString()} · {session.coachName}
                      </p>
                    </div>
                    {session.verdict && (
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-xs font-medium",
                          verdictColor(session.verdict)
                        )}
                      >
                        {session.verdict}
                      </span>
                    )}
                  </div>
                  {session.overallScore !== null ? (
                    <p className="text-2xl font-bold text-primary">
                      {session.overallScore}
                      <span className="text-sm font-normal text-muted-foreground">/10</span>
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground capitalize">{session.status.toLowerCase().replace("_", " ")}</p>
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  loading,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  loading?: boolean;
  small?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="mb-2 flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      ) : (
        <p className={cn("font-bold text-foreground", small ? "text-sm" : "text-2xl")}>{value}</p>
      )}
    </div>
  );
}
