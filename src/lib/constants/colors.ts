export const THEME_COLORS = {
  START: "#f55c7a",    // Pink - Starting word color
  END: "#f6bc66",      // Yellow - Target word color
  GRADIENT: {
    START: "#f55c7a",  // Pink - Top of gradient
    MID1: "#f57c73",   // Gradient step 1
    MID2: "#f68c70",   // Gradient step 2
    MID3: "#f6ac69",   // Gradient step 3
    END: "#f6bc66",    // Yellow - Bottom of gradient
  },
  BACKGROUND: "#fff5eb", // Main background color
  TEXT: {
    PRIMARY: "#333333",
    SECONDARY: "#666666",
  },
  BORDER: {
    LIGHT: "#f6bc66",  // Light border color
    DARK: "#f6bc66"    // Dark border color
  }
} as const;

export const PROGRESS_COLORS = {
  LOW: `bg-[${THEME_COLORS.START}]/70 hover:bg-[${THEME_COLORS.START}]/80 text-[${THEME_COLORS.TEXT.PRIMARY}]`,
  MEDIUM: `bg-[${THEME_COLORS.GRADIENT.MID2}]/70 hover:bg-[${THEME_COLORS.GRADIENT.MID2}]/80 text-[${THEME_COLORS.TEXT.PRIMARY}]`,
  HIGH: `bg-[${THEME_COLORS.GRADIENT.MID3}]/70 hover:bg-[${THEME_COLORS.GRADIENT.MID3}]/80 text-[${THEME_COLORS.TEXT.PRIMARY}]`,
  COMPLETE: `bg-[${THEME_COLORS.END}]/70 hover:bg-[${THEME_COLORS.END}]/80 text-[${THEME_COLORS.TEXT.PRIMARY}]`,
} as const;