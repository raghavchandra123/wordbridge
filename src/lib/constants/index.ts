// Game Settings
export const SIMILARITY_THRESHOLD = 0.3;

// Theme Colors
export const THEME_COLORS = {
  START: "#FF8B8B",    // Soft coral pink - Starting word color
  END: "#FFB347",      // Warm orange - Target word color
  GRADIENT: {
    START: "#FF8B8B",  // Soft coral pink
    MID1: "#FF9E7D",   // Peach
    MID2: "#FFA76F",   // Light orange
    MID3: "#FFAF61",   // Golden orange
    END: "#FFB347",    // Warm orange
  },
  BACKGROUND: "#FFF5EB", // Very light peach background
  TEXT: {
    PRIMARY: "#4A4A4A",
    SECONDARY: "#6B6B6B",
  },
  BORDER: {
    LIGHT: "#FFB347",  // Warm orange
    DARK: "#FF8B8B"    // Soft coral pink
  }
} as const;

// Progress Colors for Word Chain
export const PROGRESS_COLORS = {
  LOW: "bg-pink-100 hover:bg-pink-200 text-pink-700",
  MEDIUM: "bg-orange-100 hover:bg-orange-200 text-orange-700",
  HIGH: "bg-amber-100 hover:bg-amber-200 text-amber-700",
  COMPLETE: "bg-green-100 hover:bg-green-200 text-green-700",
} as const;