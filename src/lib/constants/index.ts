// Game Settings
export const SIMILARITY_THRESHOLD = 0.3;

// Theme Colors
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
  BACKGROUND: "#f57c73", // Main background color
  TEXT: {
    PRIMARY: "#333333",
    SECONDARY: "#666666",
  },
  BORDER: {
    LIGHT: "#f6bc66",  // Light border color
    DARK: "#f6bc66"    // Dark border color
  }
} as const;

// Progress Colors for Word Chain
export const PROGRESS_COLORS = {
  LOW: "bg-blue-100/70 hover:bg-blue-200/70 text-blue-700",
  MEDIUM: "bg-violet-100/70 hover:bg-violet-200/70 text-violet-700",
  HIGH: "bg-rose-100/70 hover:bg-rose-200/70 text-rose-700",
  COMPLETE: "bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700",
} as const;