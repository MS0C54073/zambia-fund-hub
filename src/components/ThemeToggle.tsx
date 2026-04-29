import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

/**
 * Accessible theme toggle.
 * - Renders a stable placeholder until mounted (avoids SSR/CSR mismatch flicker).
 * - aria-label + aria-pressed for screen readers.
 * - Keyboard accessible by default via <Button>.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted ? resolvedTheme === "dark" : true;

  const toggle = () => setTheme(isDark ? "light" : "dark");

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={toggle}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={!isDark}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={className}
    >
      {/* Both icons render; we cross-fade with opacity for a smooth swap */}
      <span className="relative inline-flex h-5 w-5 items-center justify-center">
        <Sun
          size={18}
          aria-hidden="true"
          className={`absolute transition-all duration-300 ${
            isDark ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
          }`}
        />
        <Moon
          size={18}
          aria-hidden="true"
          className={`absolute transition-all duration-300 ${
            isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"
          }`}
        />
      </span>
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
