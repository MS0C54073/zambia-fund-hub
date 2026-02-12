import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { LayoutDashboard, Briefcase, TrendingUp, FileText, LogOut, User } from "lucide-react";
import { motion } from "framer-motion";

const Dashboard = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
      if (!session?.user) navigate("/auth");
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-card border-r border-border/50 p-6">
        <Link to="/" className="flex items-center gap-2 mb-10">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
            ZF
          </div>
          <span className="font-display font-bold text-foreground">ZamFund</span>
        </Link>

        <nav className="flex flex-col gap-1 flex-1">
          {[
            { icon: LayoutDashboard, label: "Overview", active: true },
            { icon: Briefcase, label: "My Businesses" },
            { icon: TrendingUp, label: "Investments" },
            { icon: FileText, label: "Documents" },
            { icon: User, label: "Profile" },
          ].map((item) => (
            <button
              key={item.label}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                item.active
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
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive transition-colors"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 md:p-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground">
              Welcome back 👋
            </h1>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>

          {/* Quick stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { label: "Total Invested", value: "K0", change: "Start investing" },
              { label: "Portfolio Value", value: "K0", change: "No investments yet" },
              { label: "Active Campaigns", value: "0", change: "Create one" },
              { label: "Returns Earned", value: "K0", change: "—" },
            ].map((stat) => (
              <div key={stat.label} className="bg-card rounded-xl border border-border/50 p-5">
                <p className="text-xs text-muted-foreground mb-1">{stat.label}</p>
                <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
            ))}
          </div>

          {/* Empty state */}
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4">
              <Briefcase size={28} />
            </div>
            <h2 className="text-xl font-display font-semibold text-foreground mb-2">
              Get started with ZamFund
            </h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Browse investment opportunities or list your business to start raising capital from local and diaspora investors.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Button variant="hero" asChild>
                <Link to="/browse">Browse Businesses</Link>
              </Button>
              <Button variant="hero-outline">List Your Business</Button>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
};

export default Dashboard;
