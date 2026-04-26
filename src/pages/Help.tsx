import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { motion } from "framer-motion";
import { Search, ShieldCheck, Wallet, TrendingUp, HelpCircle, Building2, Mail } from "lucide-react";

type Faq = { q: string; a: string };
type Section = { id: string; title: string; icon: typeof ShieldCheck; description: string; faqs: Faq[] };

const sections: Section[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    icon: HelpCircle,
    description: "Create an account, browse opportunities, and understand the platform.",
    faqs: [
      { q: "What is ZamFund?", a: "ZamFund is Zambia's investment marketplace connecting local and diaspora investors with vetted Zambian startups and SMEs across equity, revenue share, crowdfunding, and SME loans." },
      { q: "Who can sign up?", a: "Any Zambian resident or member of the diaspora aged 18+. Founders must register a business profile to launch a campaign." },
      { q: "Is there a fee to create an account?", a: "No. Creating an account, browsing, and saving businesses is completely free." },
    ],
  },
  {
    id: "kyc",
    title: "Verification & KYC",
    icon: ShieldCheck,
    description: "NRC, TPIN, PACRA — what we need and why.",
    faqs: [
      { q: "Why do I need to verify my identity?", a: "Zambian SEC regulations (Securities Act No. 41 of 2016) require all investors to be identity-verified before placing investments. This protects both you and the founders raising capital." },
      { q: "What documents do I need?", a: "For individuals: a clear photo of your NRC and a selfie. For businesses: your TPIN (10 digits) and your PACRA registration certificate." },
      { q: "How long does KYC review take?", a: "Most submissions are reviewed within 24 hours for individuals and 48 hours for businesses." },
      { q: "What happens if my KYC is rejected?", a: "You'll see the reviewer's note in your dashboard, and you can update the submission and resubmit at any time." },
      { q: "Is my data secure?", a: "Yes. KYC documents are stored encrypted in private storage and only accessible to ZamFund compliance reviewers and you." },
    ],
  },
  {
    id: "investing",
    title: "Investing",
    icon: TrendingUp,
    description: "How investment works, funding models, and payouts.",
    faqs: [
      { q: "What funding models does ZamFund support?", a: "Four: Equity (shares for capital), Revenue Share (% of revenue until cap), Reward Crowdfunding (perks instead of equity), and SME Loans (interest-bearing repayments)." },
      { q: "What is the minimum investment?", a: "There is no platform-wide minimum — each campaign sets its own minimum ticket. Many start as low as K100." },
      { q: "How do I receive returns?", a: "Returns (dividends, repayments, or revenue share) are credited directly to your in-app wallet by the admin / payout engine. You can withdraw to mobile money or your bank." },
      { q: "Are returns guaranteed?", a: "No. All investments carry risk. Use the Risk Score and Verification Badge on each business to inform your decisions and only invest what you can afford to lose." },
    ],
  },
  {
    id: "wallet",
    title: "Wallet & Payments",
    icon: Wallet,
    description: "Top up, withdraw, and mobile money.",
    faqs: [
      { q: "How do I top up my wallet?", a: "Click 'Top Up' on the Wallet tab. ZamFund supports MTN MoMo, Airtel Money, Zamtel Kwacha, and bank transfers." },
      { q: "Are there transaction fees?", a: "The standard ZRA Mobile Money Transaction Levy applies. Withholding tax (15% local / 20% foreign) is automatically deducted from returns where applicable." },
      { q: "How fast are withdrawals?", a: "Mobile money withdrawals are typically processed within minutes; bank transfers within 1 business day." },
    ],
  },
  {
    id: "founders",
    title: "For Founders",
    icon: Building2,
    description: "List your business and raise capital.",
    faqs: [
      { q: "How do I list my business?", a: "Go to Dashboard → My Businesses → Add Business. Submit your registration details and pitch deck. After admin approval you can launch a campaign." },
      { q: "What documents do I need to verify a business?", a: "Your PACRA registration certificate and ZRA TPIN. Both can be uploaded under Dashboard → Verification → Business Verification." },
      { q: "How long until my business is approved?", a: "Most listings are reviewed within 48 hours. You'll receive an email once approved." },
    ],
  },
];

export default function Help() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        faqs: s.faqs.filter(
          (f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)
        ),
      }))
      .filter((s) => s.faqs.length > 0);
  }, [query]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 pb-16">
        <section className="container px-4 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-10"
          >
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border border-primary/30 text-primary mb-4">
              <HelpCircle size={12} /> Help Center
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
              How can we help?
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Answers to common questions about investing, KYC, payouts, and listing your business on ZamFund.
            </p>
            <div className="relative max-w-xl mx-auto mt-6">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search FAQs…"
                className="pl-9 bg-secondary border-border h-12"
              />
            </div>
          </motion.div>

          <div className="space-y-6">
            {filtered.length === 0 && (
              <div className="bg-card rounded-xl border border-border/50 p-10 text-center text-muted-foreground">
                No results for "{query}". Try a different search.
              </div>
            )}
            {filtered.map((section) => {
              const Icon = section.icon;
              return (
                <div key={section.id} id={section.id} className="bg-card rounded-2xl border border-border/50 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Icon size={18} />
                    </div>
                    <div>
                      <h2 className="font-display font-semibold text-foreground">{section.title}</h2>
                      <p className="text-xs text-muted-foreground">{section.description}</p>
                    </div>
                  </div>
                  <Accordion type="single" collapsible className="w-full">
                    {section.faqs.map((f, i) => (
                      <AccordionItem key={i} value={`${section.id}-${i}`} className="border-border/50">
                        <AccordionTrigger className="text-left text-sm text-foreground hover:no-underline">
                          {f.q}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                          {f.a}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              );
            })}
          </div>

          <div className="mt-10 bg-card rounded-2xl border border-border/50 p-6 text-center">
            <Mail className="mx-auto text-primary mb-3" size={24} />
            <h3 className="font-display font-semibold text-foreground mb-1">Still need help?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Reach out to our team and we'll get back to you within one business day.
            </p>
            <a
              href="mailto:support@zamfund.com"
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              support@zamfund.com
            </a>
            <p className="text-xs text-muted-foreground mt-4">
              Founders can also <Link to="/dashboard" className="text-primary hover:underline">visit their dashboard</Link> for tailored guidance.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
