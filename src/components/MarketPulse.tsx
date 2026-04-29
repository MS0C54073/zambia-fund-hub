/**
 * MarketPulse — a subtle, looped SVG illustration that visually represents
 * capital being raised and invested:
 *
 *   - Rising bars (capital being raised)
 *   - A growth line cutting across (compounding returns)
 *   - "Coins" flowing from investor → business
 *   - A soft pulse ring on the destination node (active deal)
 *
 * Implementation notes:
 *   - 100% CSS animations (transform / opacity only) — no JS frame loops.
 *   - All colours derive from semantic tokens (`text-primary`, `text-accent`,
 *     `text-muted-foreground`) so it adapts to light + dark automatically.
 *   - `prefers-reduced-motion` is honoured globally in index.css.
 *   - `aria-hidden` because it is decorative.
 *   - No layout-affecting properties animate, so it does not trigger reflow.
 */
export function MarketPulse({ className = "" }: { className?: string }) {
  // Bar heights (px from baseline 110). Variation gives an organic feel.
  const bars = [
    { x: 20,  h: 30, delay: 0 },
    { x: 50,  h: 55, delay: 0.4 },
    { x: 80,  h: 45, delay: 0.8 },
    { x: 110, h: 75, delay: 1.2 },
    { x: 140, h: 60, delay: 1.6 },
    { x: 170, h: 90, delay: 2.0 },
  ];

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none select-none ${className}`}
    >
      <svg
        viewBox="0 0 320 180"
        width="100%"
        height="100%"
        xmlns="http://www.w3.org/2000/svg"
        role="presentation"
      >
        {/* Baseline grid — muted, very low contrast */}
        <g className="text-muted-foreground" stroke="currentColor" strokeWidth="0.5" opacity="0.25">
          <line x1="10" y1="40"  x2="310" y2="40"  />
          <line x1="10" y1="80"  x2="310" y2="80"  />
          <line x1="10" y1="120" x2="310" y2="120" />
        </g>

        {/* Rising bars — primary colour */}
        <g className="text-primary" fill="currentColor">
          {bars.map((b) => (
            <rect
              key={b.x}
              x={b.x}
              y={120 - b.h}
              width="14"
              height={b.h}
              rx="2"
              className="mp-bar"
              style={{ animationDelay: `${b.delay}s`, opacity: 0.85 }}
            />
          ))}
        </g>

        {/* Growth line — accent colour, draws then retreats in a loop */}
        <path
          d="M 10 110 Q 60 95, 95 80 T 175 55 T 290 25"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          className="mp-line text-accent"
        />

        {/* Investor node (left) */}
        <g transform="translate(20, 150)">
          <circle r="6" className="text-primary" fill="currentColor" />
          <circle r="6" className="text-primary mp-ring" fill="none" stroke="currentColor" strokeWidth="1.2" />
        </g>

        {/* Business node (right) */}
        <g transform="translate(290, 60)">
          <circle r="6" className="text-accent" fill="currentColor" />
          <circle r="6" className="text-accent mp-ring" fill="none" stroke="currentColor" strokeWidth="1.2" style={{ animationDelay: "1.5s" }} />
        </g>

        {/* Capital flow — small "coins" travelling investor → business */}
        <g className="text-primary" fill="currentColor">
          {[0, 1.2, 2.4, 3.6].map((delay, i) => (
            <circle
              key={i}
              cx="20"
              cy="150"
              r="3"
              className="mp-coin"
              style={{ animationDelay: `${delay}s`, opacity: 0.9 }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
