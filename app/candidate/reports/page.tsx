"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  TrendingUp, 
  Award, 
  Zap, 
  FileText,
  Download,
  Calendar,
  Target,
  Flame,
  Book
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"newest" | "highest" | "lowest">("newest");

  useEffect(() => {
    async function fetchReportData() {
      try {
        const [statsRes, sessionsRes] = await Promise.all([
          fetch("/api/candidate/stats"),
          fetch("/api/candidate/sessions")
        ]);

        const statsData = await statsRes.json();
        const sessionsData = await sessionsRes.json();

        if (statsData.success) {
          setStats(statsData.data);
        }
        if (sessionsData.success) {
          setSessions(sessionsData.data || []);
        }
      } catch (err) {
        console.error("[v0] Report fetch error:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchReportData();
  }, []);

  const filteredSessions = sessions
    .filter(s => 
      (s.jobRole?.toLowerCase().includes(searchQuery.toLowerCase()) || 
       s.coachName?.toLowerCase().includes(searchQuery.toLowerCase())) &&
      s.status === "ENDED"
    )
    .sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "highest") {
        return (b.overallScore || 0) - (a.overallScore || 0);
      } else {
        return (a.overallScore || 0) - (b.overallScore || 0);
      }
    });

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
          ))}
        </div>
        <div className="h-80 bg-muted rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <h1 className="text-4xl font-bold text-foreground">Performance Reports</h1>
        <p className="text-lg text-muted-foreground">Track your progress and improve over time</p>
      </motion.div>

      {/* Performance Overview */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Performance Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="border border-border bg-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Overall Score</span>
              <Award size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.overallScore || "—"}</p>
            <p className="text-xs text-muted-foreground mt-2">/10</p>
          </div>

          <div className="border border-border bg-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Interviews</span>
              <FileText size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.totalCompleted || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">completed</p>
          </div>

          <div className="border border-border bg-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Avg Duration</span>
              <Zap size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">45m</p>
            <p className="text-xs text-muted-foreground mt-2">per interview</p>
          </div>

          <div className="border border-border bg-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Practice Hours</span>
              <TrendingUp size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">12h</p>
            <p className="text-xs text-muted-foreground mt-2">total</p>
          </div>

          <div className="border border-border bg-card rounded-lg p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Current Streak</span>
              <Flame size={18} className="text-primary" />
            </div>
            <p className="text-3xl font-bold text-foreground">{stats?.streak || 0}</p>
            <p className="text-xs text-muted-foreground mt-2">days</p>
          </div>
        </div>
      </motion.section>

      {/* Skill Breakdown */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Skill Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            { name: "Technical Skills", score: 78 },
            { name: "Communication", score: 82 },
            { name: "Problem Solving", score: 75 },
            { name: "System Design", score: 68 },
            { name: "Behavioral", score: 85 },
            { name: "Subject Knowledge", score: 72 },
          ].map((skill, idx) => (
            <motion.div
              key={skill.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + idx * 0.05 }}
              className="border border-border bg-card rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">{skill.name}</h3>
                <span className="text-lg font-bold text-primary">{skill.score}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all duration-500"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Topic-wise Analysis */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">Topic-wise Analysis</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { topic: "DSA", interviews: 8, avgScore: 7.2 },
            { topic: "DBMS", interviews: 6, avgScore: 7.8 },
            { topic: "Operating Systems", interviews: 4, avgScore: 6.9 },
            { topic: "Networking", interviews: 3, avgScore: 7.5 },
            { topic: "HR", interviews: 5, avgScore: 8.1 },
            { topic: "Behavioral", interviews: 5, avgScore: 8.3 },
          ].map((topic) => (
            <motion.div
              key={topic.topic}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-border bg-card rounded-lg p-5 hover:border-primary/50 transition-colors"
            >
              <h3 className="font-semibold text-foreground mb-3">{topic.topic}</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Interviews</span>
                  <span className="font-semibold text-foreground">{topic.interviews}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Avg Score</span>
                  <span className="font-semibold text-primary">{topic.avgScore}/10</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Interview Timeline */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-6"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Interview History</h2>
          <div className="flex gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground focus:border-primary outline-none transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Score</option>
              <option value="lowest">Lowest Score</option>
            </select>
          </div>
        </div>

        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by role or coach..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground focus:border-primary outline-none transition-colors"
          />
        </div>
        
        <div className="space-y-3">
          {filteredSessions.length === 0 ? (
            <div className="border border-dashed border-border rounded-lg p-8 text-center space-y-2">
              <p className="text-muted-foreground">No interviews found</p>
              <p className="text-sm text-muted-foreground">Start practicing to see your interview history here</p>
            </div>
          ) : (
            filteredSessions.map((interview, idx) => (
              <motion.a
                key={interview.id}
                href={`/candidate/reports/${interview.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + idx * 0.05 }}
                className="border border-border bg-card rounded-lg p-5 flex items-center justify-between hover:border-primary/50 hover:bg-secondary transition-all cursor-pointer group"
              >
                <div className="space-y-1 flex-1">
                  <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{interview.jobRole || "Interview"}</p>
                  <p className="text-sm text-muted-foreground">{new Date(interview.createdAt).toLocaleDateString()} • Duration: ~45m</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-lg font-bold ${interview.overallScore ? "text-primary" : "text-muted-foreground"}`}>
                    {interview.overallScore || "—"}/10
                  </span>
                  <FileText size={18} className="text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </motion.a>
            ))
          )}
        </div>
      </motion.section>

      {/* AI Coach Insights */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="space-y-6"
      >
        <h2 className="text-xl font-bold text-foreground">AI Coach Insights</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border border-border bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Target size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Weakest Topics</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Based on recent interviews</p>
              <ul className="space-y-1 text-sm">
                <li className="text-foreground">• System Design - Focus on scalability concepts</li>
                <li className="text-foreground">• Operating Systems - Review memory management</li>
              </ul>
            </div>
          </div>

          <div className="border border-border bg-card rounded-lg p-6 space-y-4">
            <div className="flex items-center gap-3">
              <Book size={20} className="text-primary" />
              <h3 className="font-semibold text-foreground">Recommended Next Steps</h3>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Practice these areas next</p>
              <ul className="space-y-1 text-sm">
                <li className="text-foreground">• Take 3 more System Design interviews</li>
                <li className="text-foreground">• Review OS fundamentals guide</li>
              </ul>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Export Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-6 pb-12"
      >
        <h2 className="text-xl font-bold text-foreground">Export Reports</h2>
        
        <div className="flex gap-4">
          <Button className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground">
            <Download size={18} />
            Download PDF
          </Button>
          <Button variant="outline" className="flex items-center gap-2">
            <Download size={18} />
            Download CSV
          </Button>
        </div>
      </motion.section>
    </div>
  );
}
