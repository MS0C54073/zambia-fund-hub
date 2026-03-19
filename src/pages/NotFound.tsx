import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, Search } from "lucide-react";
import { motion } from "framer-motion";

const NotFound = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  const homePath = user ? "/dashboard" : "/";

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
          <Search className="text-primary" size={36} />
        </div>

        <h1 className="text-6xl font-display font-bold text-foreground mb-3">404</h1>
        <h2 className="text-xl font-display font-semibold text-foreground mb-2">
          Page Not Found
        </h2>
        <p className="text-muted-foreground mb-8">
          The page <code className="text-sm bg-secondary px-2 py-0.5 rounded">{location.pathname}</code> doesn't exist or may have been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={() => window.history.back()} className="gap-2">
            <ArrowLeft size={16} />
            Go Back
          </Button>
          <Button variant="hero" asChild className="gap-2">
            <Link to={homePath}>
              <Home size={16} />
              {user ? "Back to Dashboard" : "Back to Home"}
            </Link>
          </Button>
        </div>
      </motion.div>
    </div>
  );
};

export default NotFound;