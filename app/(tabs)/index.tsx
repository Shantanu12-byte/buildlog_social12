import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  TouchableOpacity, 
  ActivityIndicator,
  Alert,
  Modal,
  Pressable
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { getThemeColors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { getRelativeTime } from '@/lib/utils';
import { AvatarBlock } from '@/components/AvatarBlock';

export default function GlobalProjectFeed() {
  const router = useRouter();
  const [projects, setProjects] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { userProfile, isEnderMode } = useUserStore();
  const colors = getThemeColors(isEnderMode);
  const currentUserId = userProfile?.id || null;

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // No longer need local session tracking here as it's handled by RootLayout -> UserStore

  const fetchQuests = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('projects')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          ),
          project_comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const handleCollab = async (projectId: string, projectTitle: string, creatorId: string) => {
    if (!currentUserId) {
      Alert.alert('ERROR', 'PLEASE_LOGIN_TO_JOIN_PROJECTS');
      return;
    }

    try {
      const { error } = await supabase
        .from('discussions')
        .insert({ 
          project_id: projectId, 
          user_id: currentUserId, 
          message: `Hey! I'd love to collaborate on ${projectTitle}. Let's team up!` 
        });

      if (error) throw error;
      
      await handleCollabNotification(projectId, projectTitle, creatorId); 
      
      Alert.alert("PROJECT ACCEPTED!", "Your collab request has been sent to the creator.");
    } catch (error: any) {
      console.error('Collab error:', error);
      Alert.alert("QUEST_FAILED", error.message || "COULD_NOT_SEND_REQUEST");
    }
  };

  const handleHype = async (item: any) => {
    if (!currentUserId) {
      Alert.alert('ERROR', 'PLEASE_LOGIN_TP_HYPE_PROJECTS');
      return;
    }

    try {
      console.log('⚡ HYPING_QUEST:', item.title);
      
      // 1. Check if already hyped (this is a simplified check for now)
      // In a real app, you'd check a project_hypes table.
      // For this demo, we'll just send the notification to the creator.
      
      const creatorId = item.user_id;
      if (creatorId === currentUserId) return; // Don't hype yourself

      // 2. Insert into notifications table
      const { error: notifError } = await supabase
        .from('notifications')
        .insert({
          user_id: creatorId,
          type: 'hype',
          sender_id: currentUserId,
          project_id: item.id,
          content: `NEW_TRANSMISSION: @${userProfile?.username || 'SYSTEM'} just HYPED your Project: ${item.title}!`
        });

      if (notifError) throw notifError;

      // 3. Send Push Notification
      const { data: creatorProfile } = await supabase
        .from('profiles')
        .select('expo_push_token')
        .eq('id', creatorId)
        .single();

      if (creatorProfile?.expo_push_token) {
        const { sendPushNotification } = require('@/lib/utils');
        await sendPushNotification(
          creatorProfile.expo_push_token,
          '[ SYSTEM_ALERT ]',
          `NEW_TRANSMISSION: @${userProfile?.username || 'builder'} just HYPED your Quest!`
        );
      }
+
      Alert.alert("PROJECT HYPED!", "Your enthusiasm has been transmitted to the builder.");
    } catch (error: any) {
      console.error('Hype error:', error);
      Alert.alert("HYPER_SPACE_FAILURE", error.message || "COULD_NOT_PROCESS_HYPE");
    }
  };

  const handleCollabNotification = async (projectId: string, projectTitle: string, creatorId: string) => {
     try {
       // 1. Notify creator in DB
       await supabase.from('notifications').insert({
         user_id: creatorId,
         type: 'join_request',
         sender_id: currentUserId,
         project_id: projectId,
         content: `NEW_TRANSMISSION: @${userProfile?.username || 'SYSTEM'} wants to JOIN your Quest: ${projectTitle}!`
       });

       // 2. Push Notification
       const { data: creatorProfile } = await supabase
         .from('profiles')
         .select('expo_push_token')
         .eq('id', creatorId)
         .single();

       if (creatorProfile?.expo_push_token) {
         const { sendPushNotification } = require('@/lib/utils');
         await sendPushNotification(
           creatorProfile.expo_push_token,
           '[ SYSTEM_ALERT ]',
           `NEW_TRANSMISSION: @${userProfile?.username || 'builder'} wants to JOIN your Project!`
         );
       }
     } catch (e) {
       console.error('Notification error:', e);
     }
  };

  const hasFetched = useRef(false);
  useEffect(() => {
    if (!hasFetched.current) {
      fetchQuests();
      hasFetched.current = true;
    }
  }, [fetchQuests]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchQuests();
  };

  const renderProjectCard = ({ item }: { item: any }) => {
    const creator = item.profiles;
    const progress = item.progress || 0;
    const relativeTime = getRelativeTime(item.created_at);
    
    // Mock LVL badge logic
    const lvl = Math.floor((item.id.charCodeAt(0) % 20) + 1);

    return (
      <View 
        style={[
          styles.projectCard, 
          { 
            backgroundColor: '#1A1A1A', // Fixed dark gray for projects
          }
        ]}
      >
        {/* Top Right: Timestamp Badge */}
        <View style={styles.timestampBadge}>
          <Text style={styles.timestampText}>[ {relativeTime} ]</Text>
        </View>

        {/* 1. The Gamer Tag Header */}
        <Pressable 
          style={styles.gamerTagRow}
          onPress={() => router.push({ pathname: '/user/[id]', params: { id: item.user_id } })}
        >
          <AvatarBlock 
            url={creator?.avatar_url && !creator.avatar_url.startsWith('blob:') ? `${creator.avatar_url}?cb=${new Date().getTime()}` : null} 
            username={creator?.username} 
            size={40}
            tier={item.profiles?.level || 'Default'}
          />
          <View>
            <Text style={[styles.usernameText, { color: colors.accentGold }]}>
              {creator?.username?.toUpperCase() || 'UNKNOWN_BUILDER'}
            </Text>
            <View style={styles.lvlBadge}>
               <Text style={styles.lvlText}>LVL {lvl} ARCHITECT</Text>
            </View>
          </View>
        </Pressable>

        {/* 2. The Project Details */}
        <TouchableOpacity 
          activeOpacity={0.8}
          onPress={() => router.push(`/project/${item.id}`)}
          style={styles.projectBody}
        >
          <Text style={[styles.projectBranding, { color: '#FFFFFF' }]}>
            [ PROJECT: {item.title?.toUpperCase()} ]
          </Text>

          {/* Project Image Capture Slot */}
          <View style={styles.projectImageFrame}>
            {item.image_url && !item.image_url.startsWith('blob:') ? (
              <>
                <Image source={{ uri: `${item.image_url}?cb=${new Date().getTime()}` }} style={styles.projectImage} />
                <View style={styles.feedCrtOverlay}>
                   {Array.from({ length: 20 }).map((_, i) => (
                      <View key={i} style={styles.feedScanline} />
                    ))}
                </View>
                <TouchableOpacity 
                  style={styles.fullScreenBadge}
                  onPress={() => setPreviewImage(item.image_url)}
                >
                  <Text style={styles.fullScreenText}>[ FULL_SCREEN ]</Text>
                </TouchableOpacity>
              </>
            ) : (
              <View style={styles.imagePlaceholder}>
                 <Feather name="camera" size={32} color="#333" />
                 <Text style={styles.placeholderLabel}>NO_SCAN_DATA</Text>
              </View>
            )}
          </View>

          <Text style={styles.descriptionText} numberOfLines={3}>
            {item.description || 'NO_DETAILS_PROVIDED_BY_BUILDER...'}
          </Text>

          {/* Loot Box Tags */}
          {item.needed_skills && item.needed_skills.length > 0 && (
            <View style={styles.lootBoxContainer}>
              {item.needed_skills.map((skill: string, index: number) => (
                <View key={index} style={styles.lootBox}>
                  <Text style={styles.lootText}>{skill.toUpperCase()}</Text>
                </View>
              ))}
            </View>
          )}
        </TouchableOpacity>

        {/* 3. The Health Bar (Progress) */}
        <View style={styles.progressSection}>
          <View style={styles.progressLabels}>
             <Text style={styles.progressLabelText}>PROGRESS</Text>
             <Text style={styles.progressLabelText}>{progress}%</Text>
          </View>
          <View style={styles.healthBarTrack}>
             <View style={[styles.healthBarFill, { width: `${progress}%`, backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* 4. The Action Buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.actionBtn, styles.hypeBtn, { borderColor: colors.surface }]}
            onPress={() => handleHype(item)}
          >
            <Text style={styles.actionBtnText}>⚡ HYPE</Text>
          </TouchableOpacity>

          <View style={styles.commentCountBadge}>
             <Feather name="message-square" size={12} color="#888" />
             <Text style={styles.commentCountText}>
               {item.project_comments?.[0]?.count || 0} COMMENTS
             </Text>
          </View>

          {item.looking_for_collabs !== false && (
            <TouchableOpacity 
              style={[styles.actionBtn, styles.joinBtn, { backgroundColor: colors.accentEmerald, borderColor: colors.primary }]}
              onPress={() => handleCollab(item.id, item.title, item.user_id)}
            >
              <Text style={[styles.actionBtnText, { color: colors.background }]}>⚔️ JOIN PROJECT</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.surface, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image 
            source={require('../../assets/developer_emblem.png')}
            style={{ width: 16, height: 16, marginRight: 8 }}
          />
          <View>
            <Text style={[styles.screenTitle, { color: colors.primary }]}>GLOBAL_PROJECTS</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>WORLD_DISCOVERY_FEED</Text>
          </View>
        </View>
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/inbox')}
          style={styles.headerActionBtn}
        >
          <Feather name="message-circle" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && !isRefreshing ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>SCANNING_REALM...</Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProjectCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="package" size={48} color="#333333" />
              <Text style={styles.emptyText}>NO_PROJECTS_FOUND</Text>
            </View>
          }
        />
      )}

      {/* Retro Image Preview Modal */}
      <Modal
        visible={!!previewImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setPreviewImage(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>[ HI_RES_CAPTURE_DATA ]</Text>
              <TouchableOpacity onPress={() => setPreviewImage(null)} style={styles.closeBtn}>
                <Text style={styles.closeBtnText}>[ X ]</Text>
              </TouchableOpacity>
            </View>
            <Image 
              source={{ uri: previewImage || undefined }} 
              style={styles.modalImage}
              resizeMode="contain"
            />
            <TouchableOpacity 
              style={styles.footerClose} 
              onPress={() => setPreviewImage(null)}
            >
              <Text style={styles.footerCloseText}>CLOSE_TERMINAL</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    borderBottomWidth: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerActionBtn: {
    padding: 10,
    backgroundColor: '#111',
    borderWidth: 3,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  screenTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing['5xl'],
  },
  projectCard: {
    padding: 20,
    borderWidth: 4,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    marginBottom: 24,
    position: 'relative',
  },
  timestampBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  timestampText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#888',
  },
  gamerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },

  usernameText: {
    fontFamily: 'monospace',
    fontWeight: 'bold',
    fontSize: 14,
  },
  lvlBadge: {
    marginTop: 2,
  },
  lvlText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#888',
  },
  projectBody: {
    marginBottom: 20,
  },
  projectBranding: {
    fontFamily: 'monospace',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#BBBBBB',
    lineHeight: 20,
    marginTop: 12,
  },
  projectImageFrame: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#0A0A0A',
    borderWidth: 4,
    borderTopColor: '#333',
    borderLeftColor: '#333',
    borderBottomColor: '#555',
    borderRightColor: '#555',
    marginVertical: 12,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectImage: {
    width: '100%',
    height: '100%',
  },
  feedCrtOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.03)',
  },
  feedScanline: {
    height: 1,
    width: '100%',
    backgroundColor: '#000',
    opacity: 0.1,
    marginBottom: 8,
  },
  imagePlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  placeholderLabel: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#333',
    letterSpacing: 1,
  },
  lootBoxContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  lootBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#000',
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#222',
    borderRightColor: '#222',
  },
  lootText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#00FFFF',
  },
  progressSection: {
    marginBottom: 20,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  healthBarTrack: {
    height: 12,
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#333',
  },
  healthBarFill: {
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  hypeBtn: {
    backgroundColor: '#000',
  },
  joinBtn: {
    // Colors applied dynamically
  },
  actionBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  commentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  commentCountText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#888',
    fontWeight: 'bold',
  },
  loadingCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
  },
  emptyState: {
    alignItems: 'center',
    marginTop: 100,
    gap: 16,
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#333333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  fullScreenBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FFF',
  },
  fullScreenText: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#FFF',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderWidth: 6,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#FFF',
    borderRightColor: '#FFF',
    padding: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#333',
    paddingBottom: 8,
  },
  modalTitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  closeBtn: {
    padding: 4,
  },
  closeBtnText: {
    fontFamily: 'monospace',
    color: '#FF5555',
    fontWeight: 'bold',
  },
  modalImage: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  footerClose: {
    marginTop: 15,
    backgroundColor: '#333',
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 4,
    borderTopColor: '#555',
    borderLeftColor: '#555',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  footerCloseText: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
