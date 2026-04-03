import os
import re

def fix_username():
    path = r"c:\Productive Social Media\buildlog\app\(stack)\[username].tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Imports
    content = content.replace("import { Colors, Typography, Spacing, Radius, getAvatarColor, getInitials } from '@/constants/theme';", 
                              "import { Typography, Spacing, Radius, getAvatarColor, getInitials } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';")
    
    # Remove top level constants
    content = re.sub(r'// ─── Constants & Colors[^\n]*\nconst PROFILE_BG[^\n]*\nconst CARD_BG[^\n]*\nconst ACCENT_PURPLE[^\n]*\n', '', content)
    
    # Inject useTheme and vars:
    hook_str = """
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const PROFILE_BG = theme.bg;
  const CARD_BG = theme.bgCard;
  const ACCENT_PURPLE = theme.purple;
"""
    content = content.replace('export default function PublicProfileScreen() {\n  const router = useRouter();', 
                              'export default function PublicProfileScreen() {\n  const router = useRouter();' + hook_str)
    
    content = content.replace('function StatItem({ label, value }: { label: string; value: number }) {',
                              'function StatItem({ label, value }: { label: string; value: number }) {\n  const { theme, isDark } = useTheme();\n  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);')
    content = content.replace('function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {',
                              'function SocialBtn({ icon, onPress, label }: { icon: string; onPress: () => void; label?: string }) {\n  const { theme, isDark } = useTheme();\n  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);')

    # Now for getStyles:
    content = content.replace('const s = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  const PROFILE_BG = theme.bg;\n  const CARD_BG = theme.bgCard;\n  const ACCENT_PURPLE = theme.purple;\n  return StyleSheet.create({')
    
    # Replace hardcoded colors in styles
    content = content.replace('#FFF', 'theme.textPrimary')
    content = content.replace("'#AAA'", 'theme.textSecondary')
    content = content.replace("'#666'", "theme.textSecondary")
    content = content.replace("'#444'", 'theme.textSecondary')
    content = content.replace("'#888'", "theme.textMuted")
    content = content.replace("'#333'", 'theme.bgInput')
    content = content.replace("'#1A1A1A'", "theme.bgInput")
    
    # Handle the end of the file
    content = content.replace('});\n', '  });\n}\n')
    
    # Inline fixes
    content = content.replace('color="#FFF"', 'color={theme.textPrimary}')
    content = content.replace('color="rgba(255,255,255,0.1)"', 'color={theme.borderLight}')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_add_log():
    path = r"c:\Productive Social Media\buildlog\app\(stack)\add-log.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("import { Colors, FontSizes, Spacing } from '@/constants/theme';", 
                              "import { FontSizes, Spacing } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';")
    
    # Component
    content = content.replace("export default function AddLogScreen() {",
                              "export default function AddLogScreen() {\n  const { theme, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);")
    
    # Styles hook
    content = content.replace('const styles = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  return StyleSheet.create({')
    if '});\n}\n' not in content:
        content = content.replace('});\n', '  });\n}\n')
    
    content = content.replace("'#0A0A0A'", 'theme.bg')
    content = content.replace("'#111111'", 'theme.bgCard')
    content = content.replace("'#1A1A1A'", 'theme.bgInput')
    content = content.replace("'#333333'", "isDark ? '#333333' : theme.textMuted")
    content = content.replace("'#555555'", "isDark ? '#555555' : theme.textSecondary")
    content = content.replace("'#888888'", "theme.textSecondary")
    content = content.replace("'#FFFFFF'", 'theme.textPrimary')
    
    content = content.replace('color="#FFFFFF"', 'color={theme.textPrimary}')
    content = content.replace('color="#888888"', 'color={theme.textSecondary}')
    content = content.replace('color="#555555"', 'color={theme.textMuted}')
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

def fix_id_tsx():
    path = r"c:\Productive Social Media\buildlog\app\project\[id].tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Imports
    content = content.replace("import { Colors, FontSizes, Spacing } from '@/constants/theme';", 
                              "import { FontSizes, Spacing } from '@/constants/theme';\nimport { useTheme } from '@/context/ThemeContext';")
    
    # Component
    content = content.replace("export default function ProjectDetailScreen() {",
                              "export default function ProjectDetailScreen() {\n  const { theme, isDark } = useTheme();\n  const styles = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);")
    
    # Inline Colors
    content = content.replace('color="#FFFFFF"', 'color={theme.textPrimary}')
    content = content.replace('color="#FFF"', 'color={theme.textPrimary}')
    content = content.replace('color="#333"', 'color={theme.bgInput}')
    
    content = content.replace('const styles = StyleSheet.create({', 'function getStyles(theme: any, isDark: boolean) {\n  return StyleSheet.create({')
    # Because of how `[id].tsx` is formatted, wait, replacing `});\n` globally would ruin `Alert.alert` closures?
    # Better to find the last `});\n` or do reversing.
    if '});\n}\n' not in content:
        # replace the last `});`
        idx = content.rfind('});')
        if idx != -1:
            content = content[:idx] + '  });\n}\n' + content[idx+3:]

    # Basic Neo Brutalism overrides using theme
    content = content.replace("'#000000'", 'theme.bg')
    content = content.replace("'#111111'", 'theme.bgCard')
    content = content.replace("'#222222'", 'theme.border')
    content = content.replace("'#333333'", "isDark ? '#333333' : theme.textMuted")
    content = content.replace("'#555555'", "isDark ? '#555555' : theme.textSecondary")
    content = content.replace("'#666666'", 'theme.textSecondary')
    content = content.replace("'#FFFFFF'", 'theme.textPrimary')
    content = content.replace("'#FFF'", 'theme.textPrimary')
    content = content.replace("'#050505'", 'theme.bg')
    content = content.replace("'#111'", "theme.bgCard")
    content = content.replace("'#222'", "theme.border")
    content = content.replace("'#333'", "isDark ? '#333' : theme.textMuted")
    content = content.replace("'#444'", "isDark ? '#444' : theme.borderLight")
    content = content.replace("'#555'", "isDark ? '#555' : theme.textSecondary")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

try:
    fix_username()
    fix_add_log()
    fix_id_tsx()
    print("DONE_FIXING_THEMES")
except Exception as e:
    print(f"ERROR: {e}")
