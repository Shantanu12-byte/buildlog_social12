import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { useEncryption } from '@/hooks/useEncryption';
import { getThemeColors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function SecretScrollInbox() {
  const router = useRouter();
  const { userProfile, isEnderMode } = useUserStore();
  const colors = getThemeColors(isEnderMode);
  
  const { inbox, fetchInbox, subscribeToMessages, isLoading } = useChatStore();
  const { isInitializing: isCryptoLoading } = useEncryption();

  useFocusEffect(
    useCallback(() => {
      if (userProfile?.id) {
        fetchInbox(userProfile.id);
      }
    }, [userProfile?.id])
  );

  // Real-time Inbox Subscription
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = subscribeToMessages(userProfile.id, (newMsg) => {
      // Refresh inbox when any new message arrives for this user
      fetchInbox(userProfile.id);
    });
    return unsubscribe;
  }, [userProfile?.id]);

  const onRefresh = () => {
    if (userProfile?.id) fetchInbox(userProfile.id);
  };

  const renderInboxItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
      style={[styles.inboxCard, { backgroundColor: colors.surface, borderTopColor: colors.primary, borderLeftColor: colors.primary, borderBottomColor: colors.primaryDark, borderRightColor: colors.primaryDark }]}
      onPress={() => router.push(`/(stack)/chat/${item.id}`)}
    >
      <View style={[styles.avatarFrame, { borderColor: colors.primary }]}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Feather name="user" size={16} color={colors.textSecondary} />
          </View>
        )}
      </View>
      <View style={styles.contentContainer}>
        <View style={styles.titleRow}>
          <Text style={[styles.username, { color: colors.primary }]}>{item.username?.toUpperCase() || 'UNKNOWN_USER'}</Text>
          <Feather name="lock" size={12} color={colors.accentEmerald} />
        </View>
        <Text style={[styles.preview, { color: colors.textSecondary }]}>
          🔒 {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'SECURE_TRANSCEIVER'}
        </Text>
      </View>
      <View style={styles.rightInfo}>
         <Text style={[styles.timeText, { color: colors.textSecondary }]}>
           {item.timestamp ? new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
         </Text>
         <Feather name="chevron-right" size={20} color={colors.primaryDark} />
      </View>
    </TouchableOpacity>
  );

  if (isCryptoLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>INITIALIZING_CRYPTO_LAYERS...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.primary }]}>SECRET_SCROLL</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>SECURE_VOICE_INBOX</Text>
        <View style={[styles.divider, { backgroundColor: colors.surface }]} />
      </View>

      <FlatList
        data={inbox}
        renderItem={renderInboxItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="mail" size={48} color={colors.surface} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>NO_WHISPERS_YET...</Text>
            <TouchableOpacity 
               style={[styles.newBtn, { backgroundColor: colors.primaryDark, borderColor: colors.primary }]}
               onPress={() => router.push('/(tabs)/search')}
            >
              <Text style={[styles.newBtnText, { color: colors.background }]}>START_A_SYNC</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: FontSizes['3xl'],
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  subtitle: {
    fontFamily: 'monospace',
    fontSize: 10,
    marginTop: 4,
  },
  divider: {
    height: 4,
    width: '100%',
    marginTop: Spacing.md,
  },
  listContent: {
    padding: Spacing.xl,
    paddingBottom: 100,
  },
  inboxCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderWidth: 4,
    marginBottom: Spacing.md,
  },
  avatarFrame: {
    width: 48,
    height: 48,
    borderWidth: 2,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  rightInfo: {
    alignItems: 'flex-end',
    gap: 4,
  },
  timeText: {
    fontFamily: 'monospace',
    fontSize: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  username: {
    fontFamily: 'monospace',
    fontSize: 14,
    fontWeight: 'bold',
  },
  preview: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  loadingText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 14,
    marginVertical: 20,
  },
  newBtn: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderWidth: 2,
  },
  newBtnText: {
    fontFamily: 'monospace',
    fontSize: 12,
    fontWeight: 'bold',
  }
});