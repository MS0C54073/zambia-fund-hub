import { motion } from "framer-motion";

const stats = [
  { value: "K50M+", label: "Capital Raised" },
  { value: "500+", label: "Businesses Listed" },
  { value: "2,000+", label: "Active Investors" },
  { value: "10", label: "Provinces Covered" },
];

const StatsSection = () => {
  return (
    <section id="stats" className="py-20">
      <div className="container px-4">
        <div className="bg-gradient-card rounded-3xl border border-border/50 p-8 md:p-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-display font-bold text-gradient-gold mb-1">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
