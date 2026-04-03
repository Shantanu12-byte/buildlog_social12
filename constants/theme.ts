import { Platform } from 'react-native';

export const darkTheme = {
  // Backgrounds
  bg:           '#0a0a0a',
  bgCard:       '#111111',
  bgInput:      '#1a1a1a',
  bgModal:      '#111111',

  // Borders
  border:       '#1f2937',
  borderLight:  '#374151',

  // Brand
  purple:       '#7c3aed',
  purpleDim:    '#4c1d95',
  purpleGlow:   'rgba(124,58,237,0.3)',

  // Text
  textPrimary:  '#ffffff',
  textSecondary:'#9ca3af',
  textMuted:    '#4b5563',

  // Status
  green:        '#4ade80',
  red:          '#ef4444',
  orange:       '#f97316',
  amber:        '#f59e0b',

  // News categories
  aiColor:      '#7c3aed',
  webColor:     '#2563eb',
  osColor:      '#16a34a',
  devopsColor:  '#ea580c',
  langColor:    '#ca8a04',
};

export const lightTheme = {
  // Backgrounds
  bg:           '#f8fafc',
  bgCard:       '#ffffff',
  bgInput:      '#f1f5f9',
  bgModal:      '#ffffff',

  // Borders
  border:       '#e2e8f0',
  borderLight:  '#cbd5e1',

  // Brand
  purple:       '#7c3aed',
  purpleDim:    '#ede9fe',
  purpleGlow:   'rgba(124,58,237,0.15)',

  // Text
  textPrimary:  '#0f172a',
  textSecondary:'#475569',
  textMuted:    '#94a3b8',

  // Status
  green:        '#16a34a',
  red:          '#dc2626',
  orange:       '#ea580c',
  amber:        '#d97706',

  // News categories
  aiColor:      '#7c3aed',
  webColor:     '#1d4ed8',
  osColor:      '#15803d',
  devopsColor:  '#c2410c',
  langColor:    '#b45309',
};

export type Theme = typeof darkTheme;

export const Typography = { 
  sizes: { 
    xs: 12, sm: 14, base: 16, md: 18, lg: 20, xl: 24, 
    '2xl': 28, '3xl': 32, '4xl': 36, '5xl': 42,
    hero: 42 
  } 
};
export const FontSizes = Typography.sizes;
export const Spacing = { 
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, 
  xxl: 32, '2xl': 32, 
  xxxl: 48, '3xl': 48,
  '4xl': 64, '5xl': 80, '6xl': 96 
};
export const Radius = { sm: 4, md: 8, lg: 12, full: 9999 };

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 4px rgba(0,0,0,0.1)' } : {})
  },
  accent: {
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
    ...(Platform.OS === 'web' ? { boxShadow: '0 0 10px rgba(124, 58, 237, 0.5)' } : {})
  }
};

export const getShadow = (type: 'soft' | 'accent') => {
  const s = Shadows[type];
  if (Platform.OS === 'web') {
    return {
      boxShadow: type === 'soft' 
        ? '0 2px 4px rgba(0,0,0,0.1)' 
        : `0 0 10px ${s.shadowColor}80`
    };
  }
  return s;
};

// Legacy Compatibility helper (MAPPED TO THEME)
export const getThemeColors = (isEnderMode?: boolean) => ({
  primary: '#7c3aed',
  primaryDark: '#4c1d95',
  background: '#0a0a0a',
  surface: '#111111',
  textPrimary: '#FFFFFF',
  textSecondary: '#9ca3af',
  borderSubtle: '#1f2937',
  accentEmerald: '#4ade80',
});

export const getInitials = (name: string) => {
  if (!name) return '??';
  return name.split('_').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

export const getAvatarColor = (name: string, isDark: boolean = true) => {
  const bgColorsDark = ['rgba(124,58,237,0.15)', 'rgba(74,222,128,0.15)', 'rgba(249,115,22,0.15)', 'rgba(156,163,175,0.15)', 'rgba(239,68,68,0.15)'];
  const textColorsDark = ['#7c3aed', '#4ade80', '#f97316', '#9ca3af', '#ef4444'];
  
  const bgColorsLight = ['rgba(124,58,237,0.1)', 'rgba(22,163,74,0.1)', 'rgba(234,88,12,0.1)', 'rgba(71,85,105,0.1)', 'rgba(220,38,38,0.1)'];
  const textColorsLight = ['#7c3aed', '#16a34a', '#ea580c', '#475569', '#dc2626'];
  
  const bgs = isDark ? bgColorsDark : bgColorsLight;
  const txts = isDark ? textColorsDark : textColorsLight;
  
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % bgs.length;
  return { bg: bgs[index], text: txts[index] };
};