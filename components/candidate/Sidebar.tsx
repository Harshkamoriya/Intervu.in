"use client";

import { 
  BarChart3, 
  LayoutDashboard, 
  FileText, 
  Settings
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserButton } from "@clerk/nextjs";

const links = [
  { label: "Dashboard", href: "/candidate/dashboard", icon: LayoutDashboard },
  { label: "My Applications", href: "/candidate/interviews", icon: FileText },
  { label: "Performance", href: "/candidate/performance", icon: BarChart3 },
];

export default function CandidateSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-background border-r border-border flex flex-col z-50">
      <div className="p-6">
        <Link href="/candidate/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">I</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Intervu</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto pt-4">
        <p className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">Navigation</p>
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <Icon size={18} className="transition-colors" />
              {link.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-primary-foreground rounded-full" />
              )}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <Link
          href="/candidate/settings"
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
        >
          <Settings size={18} />
          Settings
        </Link>
        <div className="flex items-center justify-between px-4 py-3 bg-secondary rounded-lg border border-border hover:border-primary/50 transition-all">
          <div className="flex items-center gap-3">
             <UserButton afterSignOutUrl="/" />
             <div className="text-left">
                <p className="text-xs font-semibold text-foreground leading-none">Candidate</p>
                <p className="text-xs text-muted-foreground font-medium truncate max-w-[80px]">Account</p>
             </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
