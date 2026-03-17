import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform, Keyboard } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import { Colors, FontSizes, Spacing } from '@/constants/theme';

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  
  const { userProfile, isLoading: isStoreLoading } = useUserStore();
  const [project, setProject] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'logs' | 'discussions'>('logs');
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);

  // robust session retrieval
  useEffect(() => {
    const getInitialUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) setCurrentUserId(session.user.id);
    };
    getInitialUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) setCurrentUserId(session.user.id);
      else setCurrentUserId(null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProjectDetails = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      // 1. Fetch project metadata
      const { data: projectData, error: projectError } = await supabase
        .from('projects')
        .select('*')
        .eq('id', id)
        .single();
      
      if (projectError) throw projectError;
      setProject(projectData);

      // 2. Fetch linked logs (posts) for this project
      const { data: logsData, error: logsError } = await supabase
        .from('posts')
        .select('*')
        .eq('project_id', id)
        .order('created_at', { ascending: false });
      
      if (logsError) throw logsError;
      setLogs(logsData || []);
    } catch (error: any) {
      console.error('Error fetching project details:', error);
      Alert.alert('Error', 'Failed to load project details.');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchComments = useCallback(async () => {
    if (!id) return;
    setIsCommentsLoading(true);
    try {
      const { data, error } = await supabase
        .from('project_comments')
        .select(`
          *,
          profiles:user_id (
            username,
            avatar_url
          )
        `)
        .eq('project_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setIsCommentsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProjectDetails();
    if (id) {
      fetchComments();
      
      // Real-time subscription
      const channel = supabase
        .channel(`project_comments:${id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'project_comments',
            filter: `project_id=eq.${id}`,
          },
          async (payload) => {
            // Fetch profile for the new comment
            const { data: profileData } = await supabase
              .from('profiles')
              .select('username, avatar_url')
              .eq('id', payload.new.user_id)
              .single();
            
            const newCommentWithProfile = {
              ...payload.new,
              profiles: profileData
            };
            
            setComments((current) => [...current, newCommentWithProfile]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [id, fetchProjectDetails, fetchComments]);

  const handleSendComment = async () => {
    if (!newComment.trim() || !currentUserId || !id) return;

    setIsSending(true);
    try {
      const { error } = await supabase
        .from('project_comments')
        .insert({
          project_id: id,
          user_id: currentUserId,
          content: newComment.trim(),
        });

      if (error) throw error;
      
      // 📡 Trigger Notification for Creator
      if (currentUserId !== project.user_id) {
        try {
          await supabase.from('notifications').insert({
            user_id: project.user_id,
            type: 'comment',
            sender_id: currentUserId,
            project_id: id,
            content: `NEW_TRANSMISSION: @${userProfile?.username || 'SYSTEM'} commented on your Quest: ${project.title}!`
          });

          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('expo_push_token')
            .eq('id', project.user_id)
            .single();

          if (creatorProfile?.expo_push_token) {
            const { sendPushNotification } = require('@/lib/utils');
            await sendPushNotification(
              creatorProfile.expo_push_token,
              '[ SYSTEM_ALERT ]',
              `NEW_TRANSMISSION: @${userProfile?.username || 'builder'} commented on your Quest!`
            );
          }
        } catch (notifErr) {
          console.error('Comment notification failed:', notifErr);
        }
      }

      setNewComment('');
      Keyboard.dismiss();
    } catch (error: any) {
      Alert.alert('QUEST_FAILED', error.message || 'COULD_NOT_SEND_COMMENT');
    } finally {
      setIsSending(false);
    }
  };

  const handleDeleteProject = async () => {
    Alert.alert(
      'DELETE QUEST?',
      'Careful! This will permanently delete your project and all its logs. This action cannot be undone.',
      [
        { text: 'ABORT', style: 'cancel' },
        { 
          text: 'DELETE', 
          style: 'destructive',
      onPress: async () => {
        setIsDeleting(true);
        try {
          console.log('🗑️ DEEP_CLEAN: Starting termination of quest:', id);

          // 1. Get all post IDs for this project to clear likes
          const { data: projectPosts, error: fetchPostsError } = await supabase
            .from('posts')
            .select('id')
            .eq('project_id', id);
          
          if (fetchPostsError) throw fetchPostsError;

          if (projectPosts && projectPosts.length > 0) {
            const postIds = projectPosts.map(p => p.id);
            console.log('🧹 CLEARING_LIKES: Removing likes for posts:', postIds);
            
            // 2. Clear all likes for these posts
            const { error: likesError } = await supabase
              .from('likes')
              .delete()
              .in('post_id', postIds);
            
            if (likesError) {
              console.error('Non-critical: Failed to clear likes:', likesError);
            }

            // 3. Clear all posts for this project
            console.log('🧹 CLEARING_LOGS: Removing all logs for project');
            const { error: postsError } = await supabase
              .from('posts')
              .delete()
              .eq('project_id', id);
            
            if (postsError) throw postsError;
          }

          // 4. Delete the project itself
          const { error: projectError } = await supabase
            .from('projects')
            .delete()
            .eq('id', id);
          
          if (projectError) throw projectError;
          
          Alert.alert('Quest Terminated', 'Project and all its history have been permanently removed.');
          router.replace('/(tabs)/profile');
        } catch (error: any) {
          console.error('Critical Deletion Error:', error);
          Alert.alert(
            'Termination Failed', 
            error.message || 'Database rejected deletion. Check for external dependencies.'
          );
        } finally {
          setIsDeleting(false);
        }
      }
        }
      ]
    );
  };

  const renderLogItem = ({ item }: { item: any }) => (
    <View style={styles.logCard}>
      <Text style={styles.logDate}>
        {new Date(item.created_at).toLocaleDateString()} - LOG_ENTRY
      </Text>
      {item.image_url && (
        <View style={styles.logImageFrame}>
          <Image source={{ uri: item.image_url }} style={styles.logImage} />
        </View>
      )}
      <Text style={styles.logCaption}>{item.caption}</Text>
    </View>
  );

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <Text key={index} style={styles.mentionText}>
            {part}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  const renderCommentItem = ({ item }: { item: any }) => {
    const isCreator = item.user_id === project?.user_id;
    const isMe = item.user_id === currentUserId;

    return (
      <View style={[styles.commentBubble, isMe && styles.myComment]}>
        <View style={styles.commentHeader}>
          <Text style={[styles.commentUser, { color: isCreator ? '#FFD700' : '#00FFFF' }]}>
            {item.profiles?.username || 'UNKNOWN'}
          </Text>
          {isCreator && (
            <View style={styles.creatorBadge}>
              <Text style={styles.creatorBadgeText}>[ CREATOR ]</Text>
            </View>
          )}
          <Text style={styles.commentTime}>
            {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
        <Text style={styles.commentText}>
          {renderContentWithMentions(item.content)}
        </Text>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.headerContent}>
      <View style={styles.topRow}>
        <TouchableOpacity onPress={() => router.back()} style={styles.pixelButtonSmall}>
          <Feather name="arrow-left" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        
        {project?.user_id === currentUserId && (
          <TouchableOpacity 
            onPress={handleDeleteProject} 
            style={styles.deleteButton}
            disabled={isDeleting}
          >
            {isDeleting ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Feather name="trash-2" size={18} color="#FFFFFF" />}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.projectTitle}>{project?.title?.toUpperCase() || 'LOADING...'}</Text>
        {project?.is_challenge && (
          <View style={styles.challengeBadge}>
            <Text style={styles.challengeText}>CHALLENGE_MODE: ON</Text>
          </View>
        )}
      </View>

      <View style={styles.descriptionSection}>
        <Text style={styles.label}>PROJECT_DESCRIPTION</Text>
        <Text style={styles.descriptionText}>{project?.description || 'No description provided.'}</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{logs.length}</Text>
          <Text style={styles.statLabel}>LOGS</Text>
        </View>
        
        {project?.user_id === currentUserId && (
          <TouchableOpacity 
            style={styles.addLogButton}
            onPress={() => router.push({ pathname: '/(stack)/add-log', params: { projectId: id } })}
          >
            <Feather name="plus" size={18} color="#FFFFFF" />
            <Text style={styles.addLogText}>ADD_LOG</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'logs' && styles.activeTab]}
          onPress={() => setActiveTab('logs')}
        >
          <Text style={[styles.tabText, activeTab === 'logs' && styles.activeTabText]}>QUEST_LOGS</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'discussions' && styles.activeTab]}
          onPress={() => setActiveTab('discussions')}
        >
          <Text style={[styles.tabText, activeTab === 'discussions' && styles.activeTabText]}>DISCUSSIONS</Text>
          {comments.length > 0 && <View style={styles.notifDot} />}
        </TouchableOpacity>
      </View>

      {activeTab === 'logs' && (
        <View style={styles.timelineDivider}>
          <Text style={styles.timelineLabel}>QUEST_TIMELINE</Text>
          <View style={styles.dividerLine} />
        </View>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={activeTab === 'logs' ? logs : comments}
          renderItem={activeTab === 'logs' ? renderLogItem : renderCommentItem}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={10}
          maxToRenderPerBatch={5}
          windowSize={5}
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Feather name={activeTab === 'logs' ? "book-open" : "message-square"} size={48} color="#333" />
              <Text style={styles.emptyText}>
                {activeTab === 'logs' ? 'NO_ENTRIES_YET' : 'NO_DISCUSSIONS_FOUND'}
              </Text>
              {activeTab === 'logs' && project?.user_id === currentUserId && (
                <TouchableOpacity 
                  style={styles.pixelButtonGray} 
                  onPress={() => router.push({ pathname: '/(stack)/add-log', params: { projectId: id } })}
                >
                  <Text style={styles.pixelButtonText}>START_LOGGING</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        />

        {activeTab === 'discussions' && (
          <View style={styles.inputBar}>
            <TextInput
              style={styles.stickyInput}
              value={newComment}
              onChangeText={setNewComment}
              placeholder="ENTER_MESSAGE..."
              placeholderTextColor="#555"
              multiline={false}
            />
            <TouchableOpacity 
              style={[styles.sendButton, (!newComment.trim() || isSending) && styles.disabledSend]}
              onPress={handleSendComment}
              disabled={!newComment.trim() || isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.sendButtonText}>SEND</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: Spacing['5xl'],
  },
  headerContent: {
    padding: Spacing.xl,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  pixelButtonSmall: {
    backgroundColor: '#333333',
    padding: Spacing.sm,
    borderWidth: 3,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  deleteButton: {
    backgroundColor: '#F44336',
    padding: Spacing.sm,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#B71C1C',
    borderRightColor: '#B71C1C',
  },
  titleSection: {
    marginBottom: Spacing.xl,
  },
  projectTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes['2xl'],
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: Spacing.xs,
  },
  challengeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  challengeText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  descriptionSection: {
    marginBottom: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: '#111111',
    borderWidth: 2,
    borderColor: '#222222',
  },
  label: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666666',
    marginBottom: Spacing.xs,
  },
  descriptionText: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#CCCCCC',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  statBox: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  statValue: {
    fontFamily: 'monospace',
    fontSize: FontSizes.xl,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666666',
  },
  addLogButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2F81F7',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 4,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#1A4D94',
    borderRightColor: '#1A4D94',
    gap: 8,
  },
  addLogText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  timelineDivider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  timelineLabel: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  dividerLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#222222',
  },
  logCard: {
    marginHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
    padding: Spacing.lg,
    backgroundColor: '#111111',
    borderWidth: 4,
    borderTopColor: '#333333',
    borderLeftColor: '#333333',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
  },
  logDate: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#666666',
    marginBottom: Spacing.md,
  },
  logImageFrame: {
    width: '100%',
    aspectRatio: 1,
    marginBottom: Spacing.md,
    borderWidth: 2,
    borderColor: '#222222',
  },
  logImage: {
    width: '100%',
    height: '100%',
  },
  logCaption: {
    fontFamily: 'monospace',
    fontSize: 14,
    color: '#FFFFFF',
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 40,
    gap: Spacing.lg,
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#333333',
    fontSize: FontSizes.lg,
    fontWeight: 'bold',
  },
  pixelButtonGray: {
    backgroundColor: '#333333',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderWidth: 3,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#111111',
    borderRightColor: '#111111',
  },
  pixelButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.xl,
    paddingHorizontal: Spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#000',
    borderWidth: 3,
    borderTopColor: '#333',
    borderLeftColor: '#333',
    borderBottomColor: '#222',
    borderRightColor: '#222',
    alignItems: 'center',
    position: 'relative',
  },
  activeTab: {
    backgroundColor: '#222',
    borderTopColor: '#2F81F7',
    borderLeftColor: '#2F81F7',
    borderBottomColor: '#FFF',
    borderRightColor: '#FFF',
  },
  tabText: {
    fontFamily: 'monospace',
    fontSize: 10,
    color: '#888',
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#FFF',
  },
  notifDot: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 6,
    height: 6,
    backgroundColor: '#2F81F7',
  },
  commentBubble: {
    marginHorizontal: Spacing.xl,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#111',
    borderWidth: 3,
    borderTopColor: '#444',
    borderLeftColor: '#444',
    borderBottomColor: '#000',
    borderRightColor: '#000',
  },
  myComment: {
    borderLeftColor: '#2F81F7',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  commentUser: {
    fontFamily: 'monospace',
    fontSize: 11,
    fontWeight: 'bold',
  },
  creatorBadge: {
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#FFD700',
  },
  creatorBadgeText: {
    fontFamily: 'monospace',
    fontSize: 7,
    color: '#FFD700',
    fontWeight: 'bold',
  },
  commentTime: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#555',
  },
  commentText: {
    fontFamily: 'monospace',
    fontSize: 12,
    color: '#CCC',
    lineHeight: 18,
  },
  mentionText: {
    color: '#39FF14', // Neon Green
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#050505',
    borderTopWidth: 4,
    borderTopColor: '#222',
    gap: 8,
  },
  stickyInput: {
    flex: 1,
    height: 44,
    backgroundColor: '#111',
    borderWidth: 3,
    borderTopColor: '#333',
    borderLeftColor: '#333',
    borderBottomColor: '#FFF',
    borderRightColor: '#FFF',
    color: '#FFF',
    fontFamily: 'monospace',
    paddingHorizontal: 12,
    fontSize: 12,
  },
  sendButton: {
    width: 70,
    height: 44,
    backgroundColor: '#2F81F7',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderTopColor: '#FFF',
    borderLeftColor: '#FFF',
    borderBottomColor: '#1A4D94',
    borderRightColor: '#1A4D94',
  },
  disabledSend: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontFamily: 'monospace',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 12,
  },
});
