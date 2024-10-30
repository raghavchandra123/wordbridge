export const THEME_COLORS = {
  START: "#f55c7a",    // Pink
  END: "#f6bc66",      // Yellow
  GRADIENT: {
    START: "#f55c7a",
    MID1: "#f57c73",
    MID2: "#f68c70",
    MID3: "#f6ac69",
    END: "#f6bc66",
  },
  TEXT: {
    PRIMARY: "#333333",
    SECONDARY: "#666666",
  },
  BORDER: {
    LIGHT: "#f6bc66",
    DARK: "#f6bc66"
  }
} as const;

export const PROGRESS_COLORS = {
  LOW: "bg-[#f55c7a]/70 hover:bg-[#f55c7a]/80 text-[#333333]",
  MEDIUM: "bg-[#f68c70]/70 hover:bg-[#f68c70]/80 text-[#333333]",
  HIGH: "bg-[#f6ac69]/70 hover:bg-[#f6ac69]/80 text-[#333333]",
  COMPLETE: "bg-[#f6bc66]/70 hover:bg-[#f6bc66]/80 text-[#333333]",
} as const;

export const SIMILARITY_THRESHOLD = 0.3;