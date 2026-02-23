import { Link, useLocation } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

interface Props {
  children: React.ReactNode;
  navItems: NavItem[];
  onSignOut: () => void;
}

export default function DashboardLayout({ children, navItems, onSignOut }: Props) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border/50 p-6">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
            ZF
          </div>
          <span className="font-display font-bold text-foreground">ZamFund</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                pathname === item.path
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>

        <button
          onClick={onSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 md:p-10 overflow-auto">{children}</main>
    </div>
  );
}
