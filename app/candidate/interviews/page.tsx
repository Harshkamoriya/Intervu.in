"use client";

import { useEffect, useState } from "react";
import { 
  Plus,
  Play,
  RotateCcw,
  Zap,
  Sparkles,
  BookOpen,
  Clock,
  ChevronRight,
  Search,
  Filter
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function InterviewsPage() {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchSessions() {
      try {
        const res = await fetch("/api/candidate/sessions");
        const data = await res.json();
        if (data.success) {
          setSessions(data.data || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-32 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-40 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const unfinishedSession = sessions.find(s => s.status === "IN_PROGRESS");

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-foreground">Interview Hub</h1>
        <p className="text-lg text-muted-foreground">Discover, create, and practice interviews to improve your skills</p>
      </motion.div>

      {/* Continue Interview */}
      {unfinishedSession && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <h2 className="text-xl font-bold text-foreground">Continue Interview</h2>
          <Link href={`/candidate/interviews/${unfinishedSession.id}`}>
            <div className="border-2 border-primary bg-primary/5 rounded-lg p-6 hover:bg-primary/10 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">{unfinishedSession.jobRole || "Interview in Progress"}</h3>
                  <p className="text-sm text-muted-foreground">Started: {new Date(unfinishedSession.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-semibold">Continue</span>
                  <ChevronRight className="text-primary" />
                </div>
              </div>
            </div>
          </Link>
        </motion.section>
      )}

      {/* Quick Start */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: unfinishedSession ? 0.2 : 0.1 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Quick Start</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { name: "General Interview", icon: "🎯", desc: "General conversation" },
            { name: "Technical Interview", icon: "💻", desc: "Coding & algorithms" },
            { name: "HR Interview", icon: "👥", desc: "HR round preparation" },
            { name: "Behavioral Interview", icon: "🤝", desc: "Soft skills & stories" },
            { name: "Resume-Based", icon: "📄", desc: "Questions about resume" },
            { name: "JD-Based Interview", icon: "📋", desc: "Role-specific questions" },
          ].map((type, idx) => (
            <motion.button
              key={type.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: (unfinishedSession ? 0.2 : 0.1) + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 hover:bg-secondary transition-all text-left group"
            >
              <div className="text-3xl mb-3">{type.icon}</div>
              <h3 className="font-semibold text-foreground mb-1">{type.name}</h3>
              <p className="text-xs text-muted-foreground">{type.desc}</p>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* AI Custom Interview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">AI Custom Interview</h2>
          <Sparkles size={20} className="text-primary" />
        </div>

        <div className="border border-border bg-card rounded-lg p-8 space-y-6">
          <p className="text-muted-foreground">Generate personalized interviews based on your preferences</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: "Company", placeholder: "e.g., Google, Amazon" },
              { label: "Role", placeholder: "e.g., Backend Engineer" },
              { label: "Difficulty", placeholder: "e.g., Senior" },
              { label: "Duration", placeholder: "e.g., 45 minutes" },
              { label: "Focus Area", placeholder: "e.g., System Design" },
              { label: "Skills", placeholder: "e.g., Python, AWS" },
            ].map((field) => (
              <div key={field.label} className="space-y-2">
                <label className="text-sm font-medium text-foreground">{field.label}</label>
                <input
                  type="text"
                  placeholder={field.placeholder}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
                />
              </div>
            ))}
          </div>

          <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2">
            <Sparkles size={18} />
            Generate Interview
          </Button>
        </div>
      </motion.section>

      {/* Recommended Interviews */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Recommended for You</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { company: "Google", role: "Backend Engineer", reason: "Based on recent attempts", difficulty: "Hard" },
            { company: "Amazon", role: "SDE II", reason: "System Design focus area", difficulty: "Medium" },
            { company: "Microsoft", role: "Software Engineer", reason: "Your target role", difficulty: "Hard" },
          ].map((rec, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">{rec.company}</p>
                  <h3 className="font-semibold text-foreground">{rec.role}</h3>
                </div>
                <span className={cn(
                  "px-2 py-1 rounded text-xs font-semibold",
                  rec.difficulty === "Hard" ? "bg-destructive/10 text-destructive" : "bg-chart-3/10 text-chart-3"
                )}>
                  {rec.difficulty}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mb-4">{rec.reason}</p>
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm" size="sm">
                Start Interview
              </Button>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Interview Library */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Interview Library</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "Amazon Backend", count: 12, topics: ["DSA", "System Design", "Behavioral"] },
            { name: "Google SDE", count: 15, topics: ["DSA", "Design", "Culture"] },
            { name: "Frontend Stack", count: 10, topics: ["React", "CSS", "JavaScript"] },
            { name: "Data Science", count: 8, topics: ["ML", "Statistics", "Python"] },
            { name: "Backend Engineering", count: 18, topics: ["Databases", "APIs", "Architecture"] },
            { name: "DevOps & Cloud", count: 9, topics: ["Docker", "Kubernetes", "AWS"] },
          ].map((library, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-5 hover:border-primary/50 transition-colors cursor-pointer group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{library.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{library.count} interviews</p>
                </div>
                <BookOpen size={20} className="text-muted-foreground group-hover:text-primary transition-colors" />
              </div>
              <div className="flex gap-1 flex-wrap">
                {library.topics.map(topic => (
                  <span key={topic} className="text-xs px-2 py-1 bg-primary/10 text-primary rounded">
                    {topic}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Practice Tracks */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6 pb-12"
      >
        <h2 className="text-xl font-bold text-foreground">Practice Tracks</h2>

        <div className="space-y-3">
          {[
            { name: "Complete SDE Roadmap", steps: ["Resume", "DSA Basics", "Advanced DSA", "System Design", "Behavioral"], progress: 40 },
            { name: "Backend Master", steps: ["Databases", "APIs", "Caching", "Message Queues", "Deployment"], progress: 20 },
            { name: "Frontend Expert", steps: ["HTML/CSS", "JavaScript", "React", "Performance", "Advanced"], progress: 60 },
          ].map((track, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-6 hover:border-primary/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-semibold text-foreground">{track.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{track.steps.length} steps</p>
                </div>
                <span className="text-sm font-bold text-primary">{track.progress}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-4">
                <div className="h-full bg-primary rounded-full" style={{ width: `${track.progress}%` }} />
              </div>
              <div className="flex gap-2 flex-wrap">
                {track.steps.map((step, i) => (
                  <span
                    key={step}
                    className={cn(
                      "text-xs px-2 py-1 rounded",
                      i < Math.ceil(track.steps.length * track.progress / 100)
                        ? "bg-chart-2/10 text-chart-2"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {step}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Interview History */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className="space-y-6 pb-12"
      >
        <h2 className="text-xl font-bold text-foreground">Interview History</h2>

        <div className="space-y-3">
          {sessions.slice(0, 5).map((session, idx) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.45 + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-5 flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <div className="space-y-1">
                <p className="font-semibold text-foreground">{session.jobRole || "Interview"}</p>
                <p className="text-sm text-muted-foreground">{new Date(session.date || session.createdAt).toLocaleDateString()} • Duration: ~45m</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-lg font-bold text-primary">{session.overallScore || "—"}/10</span>
                <ChevronRight className="text-muted-foreground" />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>
    </div>
  );
}
