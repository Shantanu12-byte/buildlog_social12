export const Colors = {
  bg: {
    primary: '#090909',
    secondary: '#111111',
    tertiary: '#1A1A1A',
    input: '#1A1A1A',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#888888',
    tertiary: '#555555',
  },
  accent: {
    primary: '#2F81F7',
    muted: 'rgba(47, 129, 247, 0.15)',
    glow: '#3FB9EF',
    soft: 'rgba(63, 185, 239, 0.1)',
  },
  border: {
    default: '#333333',
    subtle: '#222222',
    accent: '#2F81F7',
    strong: '#444444',
  },
  pills: {
    tech: { bg: 'rgba(46,160,67,0.15)', border: 'rgba(46,160,67,0.3)', text: '#2EA043' },
    design: { bg: 'rgba(247,129,102,0.15)', border: 'rgba(247,129,102,0.3)', text: '#F78166' },
    other: { bg: 'rgba(139,148,158,0.15)', border: 'rgba(139,148,158,0.3)', text: '#8B949E' },
    campus: { bg: 'rgba(6,78,59,0.3)', border: 'rgba(6,95,70,0.5)', text: '#6EE7B7' },
    challenge: { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', text: '#A78BFA' },
    building: { bg: 'rgba(47,129,247,0.15)', border: 'rgba(47,129,247,0.3)', text: '#2F81F7' },
    collab: { bg: 'rgba(6,78,59,0.3)', border: 'rgba(6,95,70,0.5)', text: '#6EE7B7' },
  },
  success: '#238636',
  danger: '#DA3633',

  // Cyber-Noir Palette
  cyber: {
    bg: '#050505',
    card: '#0A0A0A',
    border: '#1A1A1A',
    accent: '#00FF41', // Classic Matrix/Cyber Green
    dim: 'rgba(0, 255, 65, 0.1)',
  },

  github: {
    green: '#2EA043',
    bg: '#0D1117',
    border: '#30363D',
  },

  // Flattened Aliases for backward compatibility
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  textTertiary: '#555555',
  borderDefault: '#333333',
  borderSubtle: '#222222',
};

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

import { Platform } from 'react-native';

export const Shadows = {
  soft: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  accent: {
    shadowColor: '#00FF41',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
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

// Compatibility helper
export const getThemeColors = (isEnderMode?: boolean) => ({
  primary: isEnderMode ? '#FFD700' : '#2F81F7',
  primaryDark: isEnderMode ? '#7A6700' : '#1A4D94',
  background: '#090909',
  surface: '#111111',
  textPrimary: '#FFFFFF',
  textSecondary: '#888888',
  borderSubtle: '#222222',
  accentEmerald: '#2EA043',
});

export const getInitials = (name: string) => name.split('_').map(n => n[0]).join('').toUpperCase().slice(0, 2);
export const getAvatarColor = (name: string) => {
  const bgColors = ['rgba(47,129,247,0.15)', 'rgba(46,160,67,0.15)', 'rgba(247,129,102,0.15)', 'rgba(139,148,158,0.15)', 'rgba(218,54,51,0.15)'];
  const textColors = ['#2F81F7', '#2EA043', '#F78166', '#8B949E', '#DA3633'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  const index = Math.abs(hash) % bgColors.length;
  return { bg: bgColors[index], text: textColors[index] };
};