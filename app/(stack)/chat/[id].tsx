import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/store/userStore';
import { useChatStore } from '@/store/chatStore';
import { useEncryption } from '@/hooks/useEncryption';
import { getThemeColors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';

export default function ChatScreen() {
  const { id: receiverId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { userProfile, isEnderMode } = useUserStore();
  const colors = getThemeColors(isEnderMode);

  const { messages, fetchMessages, sendMessage, addOptimisticMessage, subscribeToMessages } = useChatStore();
  const { keys, encrypt, decrypt, isInitializing: isCryptoLoading } = useEncryption();

  const [inputText, setInputText] = useState('');
  const [receiverProfile, setReceiverProfile] = useState<any>(null);
  const [decryptedMessages, setDecryptedMessages] = useState<Record<string, string>>({});
  const flatListRef = useRef<FlatList>(null);

  // 1. Fetch Receiver Profile (for public key)
  useEffect(() => {
    async function getReceiver() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', receiverId)
        .single();
      if (data) setReceiverProfile(data);
    }
    getReceiver();
  }, [receiverId]);

  // 2. Fetch Initial Messages
  useEffect(() => {
    if (receiverId) fetchMessages(receiverId);
  }, [receiverId]);

  // 3. Real-time Subscription
  useEffect(() => {
    if (!userProfile?.id) return;
    const unsubscribe = subscribeToMessages(userProfile.id, (newMsg) => {
      // Add to messages if it's from current chat partner
      if (newMsg.sender_id === receiverId) {
        addOptimisticMessage(newMsg);
      }
    });
    return unsubscribe;
  }, [userProfile?.id, receiverId]);

  // 4. Decrypt Messages (Incremental)
  useEffect(() => {
    async function decryptNew() {
      if (!keys?.privateKey) return;
      
      let hasChanges = false;
      const newDecrypted = { ...decryptedMessages };

      for (const msg of messages) {
        // Skip if already decrypted OR if it's an optimistic stub (already handled in handleSend)
        if (newDecrypted[msg.id]) continue;
        
        const senderPub = msg.sender_id === userProfile?.id ? keys.publicKey : (receiverProfile?.public_key || '');
        const recipientPriv = keys.privateKey;
        
        try {
          const plain = await decrypt(msg.encrypted_content, senderPub, recipientPriv);
          newDecrypted[msg.id] = plain;
          hasChanges = true;
        } catch (e) {
          console.error("DECRYPT_ITEM_FAILED:", e);
        }
      }

      if (hasChanges) {
        setDecryptedMessages(newDecrypted);
      }
    }
    decryptNew();
  }, [messages, keys, receiverProfile]);

  const handleSend = async () => {
    if (!inputText.trim() || !userProfile || !receiverProfile?.public_key || !keys) return;

    const textToEncrypt = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    setInputText('');

    // OPTIMISTIC UPDATE: Add to UI immediately
    const optimisticMsg = {
      id: tempId,
      sender_id: userProfile.id,
      receiver_id: receiverId,
      encrypted_content: 'ENCRYPTED_LOCALLY', // We'll show the plaintext from local state
      created_at: new Date().toISOString(),
    };
    
    // Store plaintext locally for instant display
    setDecryptedMessages(prev => ({ ...prev, [tempId]: textToEncrypt }));
    addOptimisticMessage(optimisticMsg);

    try {
      const ciphertext = await encrypt(textToEncrypt, receiverProfile.public_key, keys.privateKey);
      await sendMessage(userProfile.id, receiverId, ciphertext);
      // No need to fetchMessages immediately, sendMessage handles the update
    } catch (e) {
      console.error("SEND_FAILED:", e);
      // Remove optimistic message on actual failure
      // (Optional: mark as failed instead)
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.sender_id === userProfile?.id;
    const plaintext = decryptedMessages[item.id] || 'Decrypting...';

    return (
      <View style={[styles.messageBubbleContainer, isMe ? styles.myMsgContainer : styles.theirMsgContainer]}>
        <View 
          style={[
            styles.bubble, 
            isMe ? styles.myBubble : styles.theirBubble,
            { 
              backgroundColor: isMe ? colors.primary : colors.surface,
              borderColor: isMe ? colors.primaryDark : colors.borderSubtle,
              borderTopColor: isMe ? '#FFFFFF' : colors.primaryDark,
              borderLeftColor: isMe ? '#FFFFFF' : colors.primaryDark,
            }
          ]}
        >
          <Text style={[styles.messageText, { color: isMe ? colors.background : colors.textPrimary }]}>
            {plaintext}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  if (isCryptoLoading || !receiverProfile) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.primary }]}>PREPARING_ENCRYPTED_CHANNEL...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={[styles.headerTitle, { color: colors.primary }]}>SECRET_SCROLL</Text>
          <Text style={[styles.headerTarget, { color: colors.accentEmerald }]}>BY: {receiverProfile.username?.toUpperCase()}</Text>
        </View>
        <Feather name="lock" size={20} color={colors.accentEmerald} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
               <Text style={[styles.emptyText, { color: colors.textSecondary }]}>NO_WHISPERS_YET...</Text>
               <View style={[styles.encryptBadge, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.encryptText, { color: colors.accentEmerald }]}>🔒 END_TO_END_ENCRYPTED</Text>
               </View>
            </View>
          }
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.background, borderTopColor: colors.surface }]}>
          <TextInput
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surface, borderColor: colors.primaryDark }]}
            placeholder="TYPE_A_WHISPER..."
            placeholderTextColor={colors.textSecondary}
            value={inputText}
            onChangeText={setInputText}
            multiline
          />
          <TouchableOpacity 
             style={[styles.sendBtn, { backgroundColor: colors.primary, borderColor: colors.primaryDark }]} 
             onPress={handleSend}
          >
            <Feather name="send" size={20} color={colors.background} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'monospace',
    marginTop: 16,
    fontSize: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    borderBottomWidth: 4,
  },
  backBtn: {
    marginRight: Spacing.md,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 16,
    fontWeight: 'bold',
  },
  headerTarget: {
    fontFamily: 'monospace',
    fontSize: 10,
  },
  keyboardView: {
    flex: 1,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  messageBubbleContainer: {
    marginBottom: Spacing.md,
    maxWidth: '85%',
  },
  myMsgContainer: {
    alignSelf: 'flex-end',
  },
  theirMsgContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: Spacing.md,
    borderWidth: 4,
  },
  myBubble: {
    // Custom bevel for MY messages
  },
  theirBubble: {
    // Custom bevel for THEIR messages
  },
  messageText: {
    fontFamily: 'monospace',
    fontSize: 14,
  },
  timestamp: {
    fontFamily: 'monospace',
    fontSize: 8,
    color: '#666',
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  inputBar: {
    flexDirection: 'row',
    padding: Spacing.md,
    alignItems: 'flex-end',
    borderTopWidth: 4,
  },
  input: {
    flex: 1,
    fontFamily: 'monospace',
    borderWidth: 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    marginLeft: Spacing.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 100,
  },
  emptyText: {
    fontFamily: 'monospace',
    fontSize: 12,
    marginBottom: 10,
  },
  encryptBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#333',
  },
  encryptText: {
     fontFamily: 'monospace',
     fontSize: 8,
  }
});
