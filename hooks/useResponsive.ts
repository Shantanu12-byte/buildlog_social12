import { useWindowDimensions } from 'react-native';

export function useResponsive() {
  const { width, height } = useWindowDimensions();
  
  return {
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024,
    isWide: width >= 1280,
    width,
    height,
    // Content max width (accounting for sidebar)
    contentWidth: Math.min(width - 260, 1200),
    // Sidebar visible? (Tablet & Desktop)
    showSidebar: width >= 768,
  };
}
