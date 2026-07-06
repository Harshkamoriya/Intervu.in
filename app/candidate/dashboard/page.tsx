"use client";

import { useEffect, useState } from "react";
import { 
  Bell, 
  ChevronRight, 
  Clock, 
  FileText, 
  MoreHorizontal, 
  Plus, 
  Sparkles, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Timer,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const stats = [
  { label: "Pending Tests", value: "2", icon: Clock, color: "text-primary", bg: "bg-primary/10" },
  { label: "Interviews", value: "4", icon: FileText, color: "text-primary", bg: "bg-primary/10" },
  { label: "Days Active", value: "12", icon: Zap, color: "text-primary", bg: "bg-primary/10" },
];

export default function CandidateDashboard() {
  const [invites, setInvites] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [invRes, sessRes, statsRes] = await Promise.all([
          fetch("/api/invites"),
          fetch("/api/candidate/sessions"),
          fetch("/api/candidate/stats")
        ]);

        const [invData, sessData, stData] = await Promise.all([
          invRes.json(),
          sessRes.json(),
          statsRes.json()
        ]);

        if (invData.success) setInvites(invData.data);
        if (sessData.success) setSessions(sessData.data);
        if (stData.success) setStatsData(stData.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) return (
    <div className="space-y-8 animate-pulse px-6 sm:px-8 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
        </div>
        <div className="h-96 bg-muted rounded-lg" />
    </div>
  );

  return (
    <div className="space-y-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight text-foreground">Good morning, Candidate!</h1>
          <p className="text-lg text-muted-foreground font-medium">You have <span className="text-foreground font-semibold">{invites.length} pending invitations</span> this week.</p>
        </div>
        <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium shadow-sm">
                <Timer size={16} className="text-muted-foreground" />
                Next Test: <span className="text-primary">Tomorrow, 10 AM</span>
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-card border border-border p-6 rounded-lg shadow-sm hover:border-primary/50 transition-all group flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{i === 0 ? invites.length : (i === 1 ? sessions.length : stat.value)}</p>
            </div>
            <div className={cn("p-4 rounded-lg transition-colors", stat.bg)}>
              <stat.icon size={24} className={stat.color} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content: Applications */}
        <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Sparkles size={20} className="text-primary" /> My Applications
                </h2>
                <button className="text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider">View All</button>
            </div>

            <div className="space-y-4">
                {sessions.length > 0 ? sessions.map((session) => (
                    <Link 
                        key={session.id} 
                        href={`/candidate/interviews/${session.id}`}
                        className="block bg-card border border-border p-6 rounded-lg hover:border-primary/50 transition-all group hover:bg-secondary relative overflow-hidden"
                    >
                        <div className="flex items-start justify-between">
                            <div className="space-y-4 flex-1">
                                <div>
                                    <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors text-foreground">{session.job.title}</h3>
                                    <p className="text-sm text-muted-foreground font-semibold uppercase tracking-wider flex items-center gap-2">
                                        <span className="w-1.5 h-1.5 bg-muted rounded-full" /> {session.job.companyId}
                                    </p>
                                </div>
                                
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-secondary rounded-lg transition-colors">
                                        <span className="text-xs text-muted-foreground font-semibold uppercase tracking-tighter">Current Status</span>
                                        <span className={cn(
                                            "text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded",
                                            session.status === "PENDING" ? "text-chart-3 bg-chart-3/10" : "text-chart-2 bg-chart-2/10"
                                        )}>{session.status}</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground font-medium">Applied {new Date(session.createdAt).toLocaleDateString()}</div>
                                </div>
                            </div>

                            <div className="p-2.5 bg-secondary rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                <ArrowRight size={18} />
                            </div>
                        </div>
                    </Link>
                )) : (
                    <div className="py-20 bg-card border border-dashed border-border rounded-lg text-center space-y-4">
                        <div className="w-16 h-16 bg-secondary rounded-lg flex items-center justify-center mx-auto">
                            <FileText className="text-muted-foreground" />
                        </div>
                        <div className="space-y-1">
                            <p className="font-semibold text-foreground">No active applications</p>
                            <p className="text-sm text-muted-foreground">Your interview sessions will appear here once you consume an invite.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Sidebar: Invites */}
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Zap size={20} className="text-primary" /> Pending Invites
            </h2>

            <div className="space-y-4">
                {invites.map((invite) => (
                    <Link 
                        key={invite.id} 
                        href={`/invite/${invite.token}`}
                        className="block bg-primary/5 border border-primary/20 p-6 rounded-lg hover:bg-primary/10 hover:border-primary/30 transition-all group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="w-10 h-10 bg-primary/10 shadow-sm rounded-lg flex items-center justify-center">
                                <Bell size={20} className="text-primary" />
                            </div>
                            <span className="text-xs bg-primary/10 px-2 py-1 rounded-lg text-primary font-semibold uppercase tracking-wider border border-primary/20">Action Needed</span>
                        </div>
                        
                        <div className="space-y-3">
                            <h4 className="font-semibold text-lg leading-tight text-foreground">{invite.job.title}</h4>
                            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Expires in 3 days</p>
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <span className="text-sm font-semibold group-hover:text-primary transition-colors">Start Process</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </Link>
                ))}

                {invites.length === 0 && (
                    <div className="p-8 bg-secondary border border-dashed border-border rounded-lg text-center space-y-3">
                        <p className="text-sm font-semibold text-foreground uppercase tracking-tighter">All caught up!</p>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">When a recruiter invites you, it will show up here instantly.</p>
                    </div>
                )}
            </div>

            {/* Premium Card */}
            <div className="bg-primary p-8 rounded-lg text-primary-foreground shadow-lg relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-10 -mt-10 blur-3xl group-hover:bg-white/20 transition-all" />
                <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                        <h3 className="text-2xl font-bold">AI Readiness</h3>
                        <p className="text-sm font-medium leading-relaxed opacity-90">Prepare for your next technical interview with personalized AI mock tests.</p>
                    </div>
                    <button className="w-full py-3 bg-primary-foreground text-primary rounded-lg text-xs font-semibold uppercase tracking-wider hover:bg-white/90 transition-colors">Start Prep</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
