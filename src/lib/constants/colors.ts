export const THEME_COLORS = {
  START: "#FF8B8B",    // Pink from image
  END: "#FFD93D",      // Yellow from image
  TEXT: {
    PRIMARY: "#333333",
    SECONDARY: "#666666",
    LIGHT: "#FFFFFF"
  },
  BORDER: {
    LIGHT: "#E5E5E5",
    DARK: "#333333"
  }
} as const;

// Update progress colors to match new theme
export const PROGRESS_COLORS = {
  LOW: "bg-[#FF8B8B]/70 hover:bg-[#FF8B8B]/80 text-[#333333]",
  MEDIUM: "bg-[#FFA78B]/70 hover:bg-[#FFA78B]/80 text-[#333333]",
  HIGH: "bg-[#FFC38B]/70 hover:bg-[#FFC38B]/80 text-[#333333]",
  COMPLETE: "bg-[#FFD93D]/70 hover:bg-[#FFD93D]/80 text-[#333333]",
} as const;