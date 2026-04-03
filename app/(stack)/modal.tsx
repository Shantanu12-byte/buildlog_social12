import { Link } from 'expo-router';
import { StyleSheet, View, Text } from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { Typography, Spacing, Radius } from '@/constants/theme';

export default function ModalScreen() {
  const { theme, isDark } = useTheme();
  const s = getStyles(theme, isDark);

  return (
    <View style={s.container}>
      <Text style={s.title}>This is a modal</Text>
      <Link href="/" dismissTo style={s.link}>
        <Text style={s.linkText}>Go to home screen</Text>
      </Link>
    </View>
  );
}

const getStyles = (theme: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: theme.bg,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.textPrimary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontSize: 16,
    color: theme.purple,
    fontWeight: '600',
  },
});
