import { motion } from "framer-motion";
import { PieChart, Repeat, Gift, Landmark } from "lucide-react";

const categories = [
  {
    icon: PieChart,
    title: "Equity Investment",
    description: "Own a share of promising Zambian startups. Get matched with founders raising their first rounds.",
    tag: "For Growth-Stage",
  },
  {
    icon: Repeat,
    title: "Revenue Share",
    description: "Earn returns as a percentage of business revenue. Lower risk, steady returns from established SMEs.",
    tag: "Steady Returns",
  },
  {
    icon: Gift,
    title: "Reward Crowdfunding",
    description: "Back innovative products and receive early access, rewards, or exclusive perks from creators.",
    tag: "Community-Driven",
  },
  {
    icon: Landmark,
    title: "SME Loan Funding",
    description: "Provide growth capital to verified small businesses at competitive interest rates.",
    tag: "Fixed Returns",
  },
];

const FundingCategories = () => {
  return (
    <section id="categories" className="py-24 relative">
      <div className="container px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="text-primary text-sm font-medium uppercase tracking-wider">Funding Types</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold mt-3 mb-4">
            Four Ways to <span className="text-gradient-gold">Invest & Grow</span>
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Whether you're a startup founder or an investor, find the perfect funding model for your goals.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat, i) => (
            <motion.div
              key={cat.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group bg-gradient-card rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all duration-300 hover:glow-gold"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:bg-primary/20 transition-colors">
                <cat.icon size={24} />
              </div>
              <span className="inline-block text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-3">
                {cat.tag}
              </span>
              <h3 className="text-lg font-display font-semibold mb-2 text-foreground">{cat.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{cat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FundingCategories;
