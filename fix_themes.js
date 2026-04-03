const fs = require('fs');

function fixUsername() {
  const path = "c:\\Productive Social Media\\buildlog\\app\\(stack)\\[username].tsx";
  let content = fs.readFileSync(path, 'utf8');

  // Imports
  content = content.replace("import { Colors, Typography, Spacing, Radius, getAvatarColor, getInitials } from '@/constants/theme';", 
                            "import { Typography, Spacing, Radius, getAvatarColor, getInitials } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';");

  // Remove top level constants
  content = content.replace(/\/\/ ─── Constants & Colors[^\n]*\nconst PROFILE_BG[^\n]*\nconst CARD_BG[^\n]*\nconst ACCENT_PURPLE[^\n]*\n/g, '');

  const hookStr = `
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const PROFILE_BG = theme.bg;
  const CARD_BG = theme.bgCard;
  const ACCENT_PURPLE = theme.purple;
`;
  content = content.replace('export default function PublicProfileScreen() {\n  const router = useRouter();', 
                            'export default function PublicProfileScreen() {\n  const router = useRouter();' + hookStr);

  content = content.replace('function StatItem({ label, value }: { label: string; value: number }) {',
                            'function StatItem({ label, value }: { label: string; value: number }) {\n  const { theme, isDark } = useTheme();\n  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);');
  content = content.replace('function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {',
                            'function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {\n  const { theme, isDark } = useTheme();\n  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);');

  content = content.replace('const s = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  const PROFILE_BG = theme.bg;\n  const CARD_BG = theme.bgCard;\n  const ACCENT_PURPLE = theme.purple;\n  return StyleSheet.create({');

  content = content.replace(/#FFF/g, 'theme.textPrimary')
               .replace(/'#AAA'/g, 'theme.textSecondary')
               .replace(/'#666'/g, "theme.textSecondary")
               .replace(/'#444'/g, 'theme.textSecondary')
               .replace(/'#888'/g, "theme.textMuted")
               .replace(/'#333'/g, 'theme.bgInput')
               .replace(/'#1A1A1A'/g, "theme.bgInput");

  content = content.replace(/}\);\n$/, '  });\n}\n');

  content = content.replace(/color="theme\.textPrimary"/g, 'color={theme.textPrimary}');
  content = content.replace(/color="rgba\(255,255,255,0\.1\)"/g, 'color={theme.borderLight}');

  fs.writeFileSync(path, content, 'utf8');
}

function fixAddLog() {
  const path = "c:\\Productive Social Media\\buildlog\\app\\(stack)\\add-log.tsx";
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace("import { Colors, FontSizes, Spacing } from '@/constants/theme';", 
                            "import { FontSizes, Spacing } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';");

  content = content.replace("export default function AddLogScreen() {",
                            "export default function AddLogScreen() {\n  const { theme, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);");

  content = content.replace('const styles = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  return StyleSheet.create({');
  
  if (!content.includes('});\n}\n')) {
    content = content.replace(/}\);\n$/, '  });\n}\n');
  }
  
  content = content.replace(/'#0A0A0A'/g, 'theme.bg')
             .replace(/'#111111'/g, 'theme.bgCard')
             .replace(/'#1A1A1A'/g, 'theme.bgInput')
             .replace(/'#333333'/g, "isDark ? '#333333' : theme.textMuted")
             .replace(/'#555555'/g, "isDark ? '#555555' : theme.textSecondary")
             .replace(/'#888888'/g, "theme.textSecondary")
             .replace(/'#FFFFFF'/g, 'theme.textPrimary');

  content = content.replace(/color="#FFFFFF"/g, 'color={theme.textPrimary}')
             .replace(/color="#888888"/g, 'color={theme.textSecondary}')
             .replace(/color="#555555"/g, 'color={theme.textMuted}');
             
  fs.writeFileSync(path, content, 'utf8');
}

function fixIdTsx() {
  const path = "c:\\Productive Social Media\\buildlog\\app\\project\\[id].tsx";
  let content = fs.readFileSync(path, 'utf8');

  content = content.replace("import { Colors, FontSizes, Spacing } from '@/constants/theme';", 
                            "import { FontSizes, Spacing } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';");

  content = content.replace("export default function ProjectDetailScreen() {",
                            "export default function ProjectDetailScreen() {\n  const { theme, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);");

  content = content.replace(/color="#FFFFFF"/g, 'color={theme.textPrimary}')
             .replace(/color="#FFF"/g, 'color={theme.textPrimary}')
             .replace(/color="#333"/g, 'color={theme.bgInput}');

  content = content.replace('const styles = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  return StyleSheet.create({');

  if (!content.includes('});\n}\n')) {
    const idx = content.lastIndexOf('});');
    if (idx !== -1) {
      content = content.slice(0, idx) + '  });\n}\n' + content.slice(idx + 3);
    }
  }

  content = content.replace(/'#000000'/g, 'theme.bg')
             .replace(/'#111111'/g, 'theme.bgCard')
             .replace(/'#222222'/g, 'theme.border')
             .replace(/'#333333'/g, "isDark ? '#333333' : theme.textMuted")
             .replace(/'#555555'/g, "isDark ? '#555555' : theme.textSecondary")
             .replace(/'#666666'/g, 'theme.textSecondary')
             .replace(/'#FFFFFF'/g, 'theme.textPrimary')
             .replace(/'#FFF'/g, 'theme.textPrimary')
             .replace(/'#050505'/g, 'theme.bg')
             .replace(/'#111'/g, "theme.bgCard")
             .replace(/'#222'/g, "theme.border")
             .replace(/'#333'/g, "isDark ? '#333' : theme.textMuted")
             .replace(/'#444'/g, "isDark ? '#444' : theme.borderLight")
             .replace(/'#555'/g, "isDark ? '#555' : theme.textSecondary");

  fs.writeFileSync(path, content, 'utf8');
}

try {
  fixUsername();
  fixAddLog();
  fixIdTsx(); } catch (e) { }
