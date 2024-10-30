// Game Settings
export const WORD_PAIR_MIN_SIMILARITY = 0.05; // Minimum similarity for random word pair generation
export const PROGRESS_MIN_SIMILARITY = -0.2;  // Minimum similarity for progress calculation
export const ADJACENT_WORD_MIN_SIMILARITY = 0.2; // Minimum similarity required between consecutive words
export const TARGET_WORD_MIN_SIMILARITY = 0.25; // Minimum similarity required with target word to win
export const PROGRESS_MAX_SIMILARITY = 0.25;   // Maximum similarity for progress calculation (100%)

// Theme Colors
export const THEME_COLORS = {
  START: "#8C9EDE",    // Pastel Blue
  INTERMEDIATE_1: "#97BED9", // First intermediate - Pastel Blue-Green
  INTERMEDIATE_2: "#B5DABE", // Second intermediate - Pastel Light Green
  END: "#E8B7D4",      // Pastel Pink
  GRADIENT: {
    START: "#8C9EDE",  // Pastel Blue
    MID1: "#97BED9",   // Pastel Blue-Green
    MID2: "#B5DABE",   // Pastel Light Green
    END: "#E8B7D4",    // Pastel Pink
  },
  BACKGROUND: "#97BED9", // Pastel Blue-Green
  TEXT: {
    PRIMARY: "#4A5568",
    SECONDARY: "#718096",
  },
  BORDER: "#E8B7D4",  // Using END color for border
} as const;

// Progress Colors for Word Chain
export const PROGRESS_COLORS = {
  LOW: "bg-blue-100/70 hover:bg-blue-200/70 text-blue-700",
  MEDIUM: "bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700",
  HIGH: "bg-pink-100/70 hover:bg-pink-200/70 text-pink-700",
  COMPLETE: "bg-purple-100/70 hover:bg-purple-200/70 text-purple-700",
} as const;
