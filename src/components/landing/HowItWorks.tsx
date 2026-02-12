import { motion } from "framer-motion";
import { UserPlus, FileCheck, Wallet, TrendingUp } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "Create Account", description: "Sign up as a founder or investor in under 2 minutes." },
  { icon: FileCheck, title: "Get Verified", description: "Submit your business docs or investor profile for quick approval." },
  { icon: Wallet, title: "Fund or Raise", description: "Invest via Mobile Money or receive funds directly to your account." },
  { icon: TrendingUp, title: "Grow Together", description: "Track returns, manage your portfolio, and scale your impact." },
];

const HowItWorks = () => {
  return (
    <section id="how-it-works" className="py-24 bg-card/30">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3">
            Simple. Secure. <span className="text-gradient-gold">Zambian.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className="text-center relative"
            >
              {i < steps.length - 1 && (
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-px bg-gradient-to-r from-primary/30 to-transparent" />
              )}
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mx-auto mb-4 relative">
                <step.icon size={28} />
                <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-gradient-gold text-primary-foreground text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
