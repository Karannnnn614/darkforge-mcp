/**
 * The complete Darkforge AMOLED token system, mirrored from the plugin's
 * references/00-dark-tokens.md. Tools inject this into generated stylesheets
 * and reference these var names in component output.
 */
export const DF_TOKENS_CSS = `:root {
  /* Background scale (AMOLED-first) */
  --df-bg-base:       #000000;
  --df-bg-surface:    #080808;
  --df-bg-elevated:   #111111;
  --df-bg-overlay:    #1a1a1a;
  --df-bg-muted:      #222222;

  /* Accent — ember + neons */
  --df-ember:         #f97316;
  --df-neon-violet:   #a78bfa;
  --df-neon-cyan:     #22d3ee;
  --df-neon-pink:     #f472b6;
  --df-neon-green:    #4ade80;
  --df-neon-amber:    #fbbf24;

  /* Glow shadows */
  --df-glow-ember:    0 0 20px rgba(249, 115, 22, 0.35);
  --df-glow-violet:   0 0 20px rgba(167, 139, 250, 0.35);
  --df-glow-cyan:     0 0 20px rgba(34, 211, 238, 0.35);

  /* Glass surfaces */
  --df-glass-bg:      rgba(255, 255, 255, 0.04);
  --df-glass-border:  rgba(255, 255, 255, 0.08);

  /* Text */
  --df-text-primary:   #ffffff;
  --df-text-secondary: #a1a1aa;
  --df-text-muted:     #52525b;

  /* Borders */
  --df-border-subtle:  rgba(255, 255, 255, 0.05);
  --df-border-default: rgba(255, 255, 255, 0.09);
  --df-border-strong:  rgba(255, 255, 255, 0.16);
  --df-border-focus:   rgba(249, 115, 22, 0.5);

  /* Radius */
  --df-radius-sm:  6px;
  --df-radius-md:  10px;
  --df-radius-lg:  16px;
  --df-radius-xl:  24px;

  /* Motion */
  --df-ease-out:    cubic-bezier(0.16, 1, 0.3, 1);
  --df-ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
  --df-dur-fast:    150ms;
  --df-dur-base:    250ms;
  --df-dur-slow:    400ms;

  /* Skeletons */
  --df-skeleton-base:  #111111;
  --df-skeleton-shine: #1e1e1e;

  /* Smooth scroll defaults (added in v1.2) */
  scroll-behavior: smooth;
  scroll-padding-top: var(--df-nav-h, 0px);
}

@media (prefers-reduced-motion: reduce) {
  :root { scroll-behavior: auto; }
}
`;

/**
 * The set of token names tools can reference. Used by `tokensRequired`
 * output fields and by forge_dark to know what's allowed.
 */
export const DF_TOKEN_NAMES = [
  "--df-bg-base",
  "--df-bg-surface",
  "--df-bg-elevated",
  "--df-bg-overlay",
  "--df-bg-muted",
  "--df-ember",
  "--df-neon-violet",
  "--df-neon-cyan",
  "--df-neon-pink",
  "--df-neon-green",
  "--df-neon-amber",
  "--df-glow-ember",
  "--df-glow-violet",
  "--df-glow-cyan",
  "--df-glass-bg",
  "--df-glass-border",
  "--df-text-primary",
  "--df-text-secondary",
  "--df-text-muted",
  "--df-border-subtle",
  "--df-border-default",
  "--df-border-strong",
  "--df-border-focus",
  "--df-radius-sm",
  "--df-radius-md",
  "--df-radius-lg",
  "--df-radius-xl",
  "--df-ease-out",
  "--df-ease-smooth",
  "--df-dur-fast",
  "--df-dur-base",
  "--df-dur-slow",
  "--df-skeleton-base",
  "--df-skeleton-shine",
] as const;

export type DfTokenName = (typeof DF_TOKEN_NAMES)[number];
