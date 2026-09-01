/**
 * Columbina's Color Theme — Dark & Ethereal
 *
 * Inspired by the Moon Goddess of Nod-Krai:
 * - Deep midnight backgrounds (her mysterious nature)
 * - Silver/moonlight accents (lunar divinity)
 * - Soft rose highlights (her hair accents, the Damselette)
 * - Ethereal gradients (moonlight in darkness)
 */

export const Colors = {
  // Core backgrounds
  background: "#0a0a1a", // Deep midnight
  surface: "#12122a", // Card/panel background
  surfaceElevated: "#1a1a3e", // Hover/active states
  surfaceBorder: "#2a2a4a", // Subtle borders

  // Primary — Lunar Indigo
  primary: "#6366f1", // Indigo-400 (moonlight glow)
  primaryLight: "#818cf8", // Indigo-300
  primaryDark: "#4338ca", // Indigo-700
  primaryMuted: "#312e81", // Indigo-900

  // Accent — Moonlight Silver
  silver: "#c0d0e0", // Moonlight
  silverLight: "#dfe8f0", // Bright moonlight
  silverDark: "#8898a8", // Dimmed silver

  // Accent — Damselette Rose
  rose: "#d4a0b0", // Soft pink
  roseLight: "#e8c0d0", // Light rose
  roseDark: "#b07080", // Deep rose

  // Text
  textPrimary: "#e8e8f0", // Light silver (headings)
  textSecondary: "#8888a0", // Muted (descriptions)
  textMuted: "#555570", // Very muted (hints)

  // Status / Semantic
  success: "#4ade80", // Green-400
  warning: "#fbbf24", // Amber-400
  error: "#f87171", // Red-400
  info: "#60a5fa", // Blue-400

  // Gradient stops
  gradientHeader: ["#1a1040", "#0d0d2b"], // Deep indigo to midnight
  gradientCard: ["#151530", "#0f0f25"], // Subtle card gradient
  gradientTabBar: ["#0f0f25", "#0a0a1a"], // Tab bar fade
  gradientAccent: ["#6366f1", "#d4a0b0"], // Indigo to rose (feature accents)
} as const;

export const Shadows = {
  card: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  elevated: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
  },
  glow: {
    shadowColor: "#818cf8",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const Gradient = {
  header: ["#1a1040", "#0d0d2b"] as const,
  card: ["#151530", "#0f0f25"] as const,
  tabBar: ["#0f0f25", "#0a0a1a"] as const,
  accent: ["#6366f1", "#d4a0b0"] as const,
  moonlight: ["#c0d0e0", "#818cf8"] as const,
} as const;
