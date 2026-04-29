import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/**
 * App-wide theme provider. Adds `class="light"` or `class="dark"` to <html>,
 * persists choice in localStorage, and respects the user's OS preference on
 * first visit. `disableTransitionOnChange` is intentionally OFF so our
 * tokenised colours animate via the global transition rules in index.css.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      storageKey="zamfund-theme"
    >
      {children}
    </NextThemesProvider>
  );
}
