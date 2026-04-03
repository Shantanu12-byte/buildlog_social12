/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { useTheme } from '@/context/ThemeContext';

export function useThemeColor(
  props: { light?: string; dark?: string },
  colorName: string
) {
  const { theme, isDark } = useTheme();
  const themeName = isDark ? 'dark' : 'light';
  const colorFromProps = props[themeName];

  if (colorFromProps) {
    return colorFromProps;
  } else {
    if (colorName === 'text') return theme.textPrimary;
    if (colorName === 'background') return theme.bg;
    if (colorName === 'tint') return theme.purple;
    if (colorName === 'icon') return theme.textSecondary;
    if (colorName === 'tabIconDefault') return theme.textMuted;
    if (colorName === 'tabIconSelected') return theme.purple;
    return theme.textPrimary;
  }
}
