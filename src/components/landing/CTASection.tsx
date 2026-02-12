import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

const CTASection = () => {
  return (
    <section className="py-24">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center bg-gradient-card rounded-3xl border border-primary/20 p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
          <div className="relative z-10">
            <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">
              Ready to Build Zambia's Future?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Join hundreds of founders and investors already growing together on ZamFund.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button variant="hero" size="lg" asChild>
                <Link to="/auth?tab=signup">
                  Create Free Account <ArrowRight className="ml-1" size={18} />
                </Link>
              </Button>
              <Button variant="hero-outline" size="lg" asChild>
                <Link to="/browse">Browse Businesses</Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CTASection;
