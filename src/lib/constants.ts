export const SIMILARITY_THRESHOLDS = {
  MIN: 0.05,  // Minimum similarity required between consecutive words
  TARGET: 0.3, // Similarity required to reach target word
} as const;

export const PROGRESS_COLORS = {
  LOW: "bg-blue-100/70 hover:bg-blue-200/70 text-blue-700",
  MEDIUM: "bg-violet-100/70 hover:bg-violet-200/70 text-violet-700",
  HIGH: "bg-rose-100/70 hover:bg-rose-200/70 text-rose-700",
  COMPLETE: "bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-700",
} as const;