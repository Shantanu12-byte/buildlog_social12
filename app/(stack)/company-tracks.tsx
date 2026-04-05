import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, 
  ScrollView, Image, FlatList, Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';

const COMPANIES = [
  { id: 'tcs', name: 'TCS NQT 2024', logo: '🏢', color: '#1a1a1a', description: 'Everything you need to crack the Tata Consultancy Services Ninja/Digital exam.' },
  { id: 'infosys', name: 'Infosys SP/DSE 2024', logo: '🏛️', color: '#007cc3', description: 'Prepare for Specialist Programmer and Digital Specialist Engineer roles.' },
  { id: 'wipro', name: 'Wipro Elite NLTH 2024', logo: '🏘️', color: '#6e2a91', description: 'Crack the National Level Talent Hunt for Wipro Elite candidates.' },
  { id: 'accenture', name: 'Accenture Prep 2024', logo: '🏙️', color: '#a100ff', description: 'Focus on Cognitive, Technical, and Coding assessments for Accenture.' },
];

export default function CompanyTracksScreen() {
  const { theme, isDark } = useTheme();
  const s = React.useMemo(() => getStyles(theme, isDark), [theme, isDark]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<any[]>([]);

  useEffect(() => {
    loadTracks();
  }, []);

  const loadTracks = async () => {
    try {
      const { data } = await supabase
        .from('company_tracks')
        .select('*');
      
      if (data && data.length > 0) {
        setTracks(data);
      } else {
        setTracks(COMPANIES); // Fallback to static if DB is empty
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.textPrimary} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>COMPANY TRACKS</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <View style={s.intro}>
          <Text style={s.introTitle}>Select Your Target</Text>
          <Text style={s.introSub}>Focused problem sets curated from previous year patterns and company specific difficulty curves.</Text>
        </View>

        {tracks.map((track) => (
          <TouchableOpacity 
            key={track.id} 
            style={s.trackCard} 
            activeOpacity={0.8}
            onPress={() => {
              // Navigation to specific track problem list (reuse challenges.tsx with filter or new screen)
              // For simplicity, we'll just alert for now or return with filter
              router.push({ pathname: '/(tabs)/challenges', params: { company: track.company || track.id } } as any);
            }}
          >
            <View style={s.trackHeader}>
              <View style={[s.logoContainer, { backgroundColor: track.color || theme.bgInput }]}>
                <Text style={s.logoText}>{track.logo || track.company?.[0]}</Text>
              </View>
              <View style={s.trackInfo}>
                <Text style={s.trackName}>{track.name}</Text>
                <Text style={s.trackCount}>{track.problem_ids?.length || (Math.floor(Math.random() * 20) + 15)} problems • {track.company || 'Tech'}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={theme.textMuted} />
            </View>
            
            <Text style={s.trackDesc} numberOfLines={2}>{track.description}</Text>
            
            <View style={s.statsRow}>
              <View style={s.stat}>
                <Text style={s.statLabel}>EASY</Text>
                <View style={s.statBar}>
                  <View style={[s.statFill, { width: '80%', backgroundColor: theme.green }]} />
                </View>
              </View>
              <View style={s.stat}>
                <Text style={s.statLabel}>MEDIUM</Text>
                <View style={s.statBar}>
                  <View style={[s.statFill, { width: '45%', backgroundColor: theme.amber }]} />
                </View>
              </View>
              <View style={s.stat}>
                <Text style={s.statLabel}>HARD</Text>
                <View style={s.statBar}>
                  <View style={[s.statFill, { width: '15%', backgroundColor: theme.red }]} />
                </View>
              </View>
            </View>

            <TouchableOpacity style={s.startBtn}>
              <Text style={s.startBtnText}>Resume Track</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}

        <View style={s.footer}>
          <Feather name="shield" size={16} color={theme.textMuted} />
          <Text style={s.footerText}>Updated Weekly with New Patterns</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (theme: any, isDark: boolean) => {
  const bg = isDark ? '#0a0a0a' : '#f0f2f5';
  const bgCard = isDark ? '#111111' : '#ffffff';
  const border = isDark ? '#1f2937' : '#e2e8f0';
  const textPrimary = isDark ? '#ffffff' : '#0f172a';
  const textSecondary = isDark ? '#9ca3af' : '#475569';
  const textMuted = isDark ? '#6b7280' : '#94a3b8';

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: bg },
    header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: border, backgroundColor: bgCard, paddingTop: 10 },
    backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)', marginRight: 12 },
    headerTitle: { color: textPrimary, fontSize: 16, fontWeight: '900', letterSpacing: 2 },
    
    content: { padding: 20, paddingBottom: 60 },
    intro: { marginBottom: 32 },
    introTitle: { color: textPrimary, fontSize: 26, fontWeight: '900', marginBottom: 8 },
    introSub: { color: textSecondary, fontSize: 14, lineHeight: 22 },
    
    trackCard: { 
      backgroundColor: bgCard, 
      borderRadius: 24, 
      padding: 24, 
      borderWidth: 1, 
      borderColor: border,
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 10,
      elevation: 4
    },
    trackHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 16 },
    logoContainer: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    logoText: { fontSize: 24 },
    trackInfo: { flex: 1 },
    trackName: { color: textPrimary, fontSize: 20, fontWeight: '800' },
    trackCount: { color: theme.purple, fontSize: 11, fontWeight: '800', marginTop: 4, letterSpacing: 0.5, textTransform: 'uppercase' },
    
    trackDesc: { color: textSecondary, fontSize: 14, lineHeight: 22, marginBottom: 24 },
    
    statsRow: { flexDirection: 'row', gap: 12, marginBottom: 28 },
    stat: { flex: 1 },
    statLabel: { color: textMuted, fontSize: 10, fontWeight: '900', marginBottom: 8 },
    statBar: { height: 5, backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f1f5f9', borderRadius: 3, overflow: 'hidden' },
    statFill: { height: '100%', borderRadius: 3 },
    
    startBtn: { 
      backgroundColor: isDark ? 'rgba(124, 58, 237, 0.1)' : '#f8fafc', 
      paddingVertical: 14, 
      borderRadius: 16, 
      alignItems: 'center', 
      borderWidth: 1, 
      borderColor: isDark ? 'rgba(124, 58, 237, 0.3)' : theme.purple 
    },
    startBtnText: { color: isDark ? theme.purple : theme.purple, fontSize: 15, fontWeight: '800' },
    
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 24, opacity: 0.5 },
    footerText: { color: textMuted, fontSize: 12, fontWeight: '700' }
  });
};
