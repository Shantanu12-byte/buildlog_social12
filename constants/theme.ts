/**
 * Buildlog Design System - "Crafted" Vibe (Neubrutalism)
 *
 * Palette:
 * - Background: Deep Obsidian (#121212)
 * - Cards/Surfaces: Stone Gray (#2A2A2A)
 * - Accents: Diamond Cyan (#00F0FF), Emerald Green (#00FF85), Gold Yellow (#FFD700)
 * - Borders/Shadows: Stark Black (#000000)
 * - All corners: 0px (perfectly square)
 */

import { Platform } from 'react-native';

export const Colors = {
  background: '#121212',
  surface: '#2A2A2A',
  primary: '#00F0FF',
  primaryDark: '#00C4CC',
  accentEmerald: '#00FF85',
  accentGold: '#FFD700',
  border: '#000000',
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',

  light: {
    text: '#FFFFFF',
    background: '#121212',
    tint: '#00F0FF',
    icon: '#A0A0A0',
    tabIconDefault: '#A0A0A0',
    tabIconSelected: '#00F0FF',
    surface: '#2A2A2A',
  },
  dark: {
    text: '#FFFFFF',
    background: '#121212',
    tint: '#00F0FF',
    icon: '#A0A0A0',
    tabIconDefault: '#A0A0A0',
    tabIconSelected: '#00F0FF',
    surface: '#2A2A2A',
  },
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
