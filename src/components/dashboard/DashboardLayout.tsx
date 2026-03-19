import { Link } from "react-router-dom";
import { LogOut, type LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  tab: string;
}

interface Props {
  children: React.ReactNode;
  navItems: NavItem[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSignOut: () => void;
}

export default function DashboardLayout({ children, navItems, activeTab, onTabChange, onSignOut }: Props) {
  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden md:flex w-64 flex-col bg-card operation border-r border-border/50 p-6">
        <Link to="/dashboard" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
            ZF
          </div>
          <span className="font-display font-bold text-foreground">ZamFund</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map((item) => (
            <button
              key={item.tab}
              onClick={() => onTabChange(item.tab)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                activeTab === item.tab
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              <item.icon size={18} />
              {item.label}
            </button>
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