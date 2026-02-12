import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="border-t border-border/50 py-12">
      <div className="container px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center font-display font-bold text-primary-foreground text-sm">
                ZF
              </div>
              <span className="font-display font-bold text-foreground">ZamFund</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Zambia's trusted digital marketplace for startup and SME investment.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/browse" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Browse Businesses</Link>
              <a href="#categories" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Funding Types</a>
              <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Legal</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Terms of Service</span>
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Investor Protection</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3 text-sm">Contact</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">hello@zamfund.co.zm</span>
              <span className="text-sm text-muted-foreground">+260 97 XXX XXXX</span>
              <span className="text-sm text-muted-foreground">Lusaka, Zambia</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border/50 pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            © 2026 ZamFund. All rights reserved. Regulated by SEC Zambia.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
