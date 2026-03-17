/**
 * Buildlog Design System - Monochrome Minimalist
 *
 * - Background: Premium soft dark grey (#0A0A0A)
 * - Borders: Clean single-color borders (GitHub blue #2F81F7 or white)
 * - Accents: GitHub Blue (#2F81F7), minimal and professional
 * - Typography: High-contrast white and soft grey (text-gray-400)
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#0A0A0A',
  surface: '#1A1A1A',
  primary: '#FFFFFF', // Refined for 8-bit aesthetic
  primaryDark: '#8B8B8B',
  accentEmerald: '#55FF55',
  accentGold: '#FFD700',
  border: '#FFFFFF',
  borderSubtle: '#8B8B8B',
  textPrimary: '#FFFFFF',
  textSecondary: '#AAAAAA',
};

export const EnderColors = {
  background: '#0F0014', // Deep Obsidian
  surface: '#1A0026',
  primary: '#D155FF', // Bright Purple
  primaryDark: '#8F00FF',
  accentEmerald: '#FF00FF', // Magenta
  accentGold: '#55FF55', // Ender Green
  border: '#D155FF',
  borderSubtle: '#8F00FF',
  textPrimary: '#FFFFFF',
  textSecondary: '#D155FF',
};

export const getThemeColors = (isEnderMode: boolean) => {
  return isEnderMode ? EnderColors : Colors;
};

export const BorderRadius = {
  sm: 0,
  md: 0,
  lg: 0,
  xl: 0,
  '2xl': 0,
  '3xl': 0,
  full: 0,
};

export const NeubrutalismShadow = {
  shadowColor: '#000000',
  shadowOffset: { width: 4, height: 4 },
  shadowOpacity: 1,
  shadowRadius: 0,
  elevation: 0,
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "Inter, Montserrat, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});

export const FontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
  '5xl': 48,
};
