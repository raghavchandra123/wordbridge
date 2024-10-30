// Game Settings
export const PAIR_SIMILARITY_THRESHOLD = 0.05;  // Maximum similarity for initial word pairs
export const PROGRESS_MIN_SIMILARITY = -0.2;    // Minimum similarity for progress calculation
export const PROGRESS_MAX_SIMILARITY = 0.3;     // Maximum similarity for progress calculation
export const CHAIN_SIMILARITY_THRESHOLD = 0.3;  // Minimum similarity between consecutive words

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
