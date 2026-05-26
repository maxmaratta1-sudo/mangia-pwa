/**
 * MA'N'GIA — Brand Color System
 * Use these in non-Tailwind contexts (Canvas, SVG, inline styles, etc.)
 * For Tailwind usage, use the class names defined in tailwind.config.ts
 */

export const COLORS = {
  terracotta: {
    50:  "#fdf4f0",
    100: "#fae4d8",
    200: "#f5c5ac",
    300: "#ed9d78",
    400: "#e37045",
    500: "#c8522a",
    600: "#a8401f",
    700: "#86311a",
    800: "#65241a",
    900: "#4a1a13",
  },
  olive: {
    50:  "#f4f6ef",
    100: "#e5ebd8",
    200: "#cad6b2",
    300: "#a8bc84",
    400: "#85a05a",
    500: "#647d3e",
    600: "#4f6330",
    700: "#3d4d26",
    800: "#2e3a1e",
    900: "#202918",
  },
  cream: {
    50:  "#fffdf7",
    100: "#fef9ea",
    200: "#fdf0cc",
    300: "#fbe4a3",
    400: "#f8d270",
    500: "#f0b429",
  },
  graphite: {
    50:  "#f5f5f4",
    100: "#e8e7e5",
    200: "#d1cfcb",
    300: "#b0ada7",
    400: "#8b8780",
    500: "#6e6a63",
    600: "#57534d",
    700: "#44403c",
    800: "#292524",
    900: "#1c1917",
  },
} as const;

export const BRAND = {
  primary:   COLORS.terracotta[500],  // #c8522a
  secondary: COLORS.olive[500],       // #647d3e
  bg:        COLORS.cream[100],       // #fef9ea
  bgLight:   COLORS.cream[50],        // #fffdf7
  dark:      COLORS.graphite[800],    // #292524
  darkDeep:  COLORS.graphite[900],    // #1c1917
  muted:     COLORS.graphite[500],    // #6e6a63
  border:    COLORS.graphite[200],    // #d1cfcb
} as const;

/** CSS custom properties — injected in globals.css */
export const CSS_VARS = `
  --color-primary:   ${BRAND.primary};
  --color-secondary: ${BRAND.secondary};
  --color-bg:        ${BRAND.bg};
  --color-bg-light:  ${BRAND.bgLight};
  --color-dark:      ${BRAND.dark};
  --color-muted:     ${BRAND.muted};
  --color-border:    ${BRAND.border};
`;

/** Tag color mapping for product badges */
export const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  popular:   { bg: COLORS.terracotta[100], text: COLORS.terracotta[700] },
  signature: { bg: COLORS.olive[100],      text: COLORS.olive[700]      },
  "novità":  { bg: COLORS.cream[200],      text: COLORS.graphite[700]   },
  promo:     { bg: COLORS.graphite[100],   text: COLORS.graphite[700]   },
};
