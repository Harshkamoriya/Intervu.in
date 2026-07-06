import { UserButton } from "@clerk/nextjs";
import Link from "next/link";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 sm:px-8 lg:px-12">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground font-semibold text-lg">
            I
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Intervu</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="hidden sm:flex items-center gap-5 text-sm font-medium text-muted-foreground">
            <Link href="/how-it-works" className="hover:text-foreground transition-colors">
              How it works
            </Link>
            <Link href="/for-companies" className="hover:text-foreground transition-colors">
              For companies
            </Link>
          </div>

          <UserButton 
            afterSignOutUrl="/"
            appearance={{
              elements: {
                userButtonAvatarBox: "w-9 h-9 rounded-lg border border-border shadow-sm hover:bg-secondary transition-colors",
                userButtonPopoverCard: "mt-2 border border-border shadow-lg rounded-lg bg-card",
              }
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
