import CandidateSidebar from "@/components/candidate/Sidebar";
import { UserButton } from "@clerk/nextjs";
import { Bell, Search } from "lucide-react";

export default function CandidateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background flex transition-colors duration-300">
      <CandidateSidebar />
      
      <main className="flex-1 ml-64 min-h-screen flex flex-col">
        {/* Top Navbar */}
        <header className="h-16 bg-background/95 backdrop-blur-sm sticky top-0 z-40 px-8 flex items-center justify-between border-b border-border">
          <div className="flex items-center gap-3 bg-secondary px-4 py-2 rounded-lg w-96 border border-border focus-within:border-primary transition-colors">
            <Search size={18} className="text-muted-foreground" />
            <input 
                type="text" 
                placeholder="Search interviews, reports..." 
                className="bg-transparent border-none outline-none text-sm w-full placeholder:text-muted-foreground text-foreground"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2.5 bg-secondary border border-border rounded-lg hover:bg-secondary/80 transition-colors relative">
              <Bell size={20} className="text-foreground" />
              <div className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full border-2 border-background" />
            </button>
            <div className="h-8 w-[1px] bg-border mx-2" />
            <div className="flex items-center gap-3 px-2 py-1.5 hover:bg-secondary rounded-lg transition-colors cursor-pointer">
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 pb-12">
          {children}
        </div>
      </main>
    </div>
  );
}
