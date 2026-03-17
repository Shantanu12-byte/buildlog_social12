import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  ActivityIndicator,
  Alert 
} from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, getValidSession } from '@/lib/supabase';
import { Colors, FontSizes, Spacing } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';

export default function SearchScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const getInitData = async () => {
      const session = await getValidSession();
      if (session) {
        setCurrentUserId(session.user.id);
        fetchFollowing(session.user.id);
      } else {
        router.replace('/login');
      }
    };
    getInitData();
  }, []);

  const fetchFollowing = async (uid: string) => {
    const { data } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', uid);
    
    if (data) {
      const map: Record<string, boolean> = {};
      data.forEach(f => map[f.following_id] = true);
      setFollowingMap(map);
    }
  };

  const handleSearch = async (text: string) => {
    setSearchQuery(text);
    if (text.length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, bio')
      .ilike('username', `%${text}%`)
      .limit(20);

    if (!error && data) {
      // Filter out self
      setSearchResults(data.filter(u => u.id !== currentUserId));
    }
    setLoading(false);
  };

  const handleFollow = async (targetUserId: string) => {
    const session = await getValidSession();
    if (!session) {
      router.replace('/login');
      return;
    }

    if (followingMap[targetUserId]) {
      return;
    }

    const { error } = await supabase
      .from('follows')
      .upsert(
        { follower_id: session.user.id, following_id: targetUserId },
        { onConflict: 'follower_id,following_id' }
      );

    if (!error) {
      setFollowingMap(prev => ({ ...prev, [targetUserId]: true }));
    } else {
      console.error("Follow error:", error);
      Alert.alert('ERROR', 'COULD_NOT_FOLLOW_USER');
    }
  };

  const renderUser = ({ item }: { item: any }) => {
    const isFollowing = followingMap[item.id];
    
    return (
      <TouchableOpacity 
        style={styles.resultCard}
        onPress={() => router.push(`/user/${item.id}` as any)}
      >
        <View style={styles.avatarFrame}>
          {item.avatar_url ? (
            <Image source={{ uri: item.avatar_url }} style={styles.avatarImage} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Feather name="user" size={24} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.userInfo}>
          <Text style={styles.usernameText}>{item.username.toUpperCase()}</Text>
          <Text style={styles.bioText} numberOfLines={1}>{item.bio || 'NO_BIO'}</Text>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity 
            style={[styles.msgButton, { borderColor: Colors.accentEmerald }]}
            onPress={(e) => {
              e.stopPropagation();
              router.push(`/(stack)/chat/${item.id}`);
            }}
          >
            <Feather name="mail" size={16} color={Colors.accentEmerald} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={(e) => {
              e.stopPropagation(); // Prevent card navigation
              handleFollow(item.id);
            }}
            disabled={isFollowing}
          >
            <Text style={styles.followButtonText}>{isFollowing ? 'FOLLOWING' : 'FOLLOW'}</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.headerTitle}>SEARCH_USERS</Text>
        
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="TYPE_USERNAME..."
            placeholderTextColor="#555"
            autoCapitalize="none"
          />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              searchQuery.length >= 2 ? (
                <Text style={styles.emptyText}>NO_BUILDERS_FOUND</Text>
              ) : null
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  headerTitle: {
    fontFamily: 'monospace',
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
    letterSpacing: 2,
  },
  searchContainer: {
    marginBottom: 24,
  },
  searchInput: {
    height: 56,
    backgroundColor: '#1A1A1A',
    borderWidth: 4,
    borderTopColor: '#555555',
    borderLeftColor: '#555555',
    borderBottomColor: '#FFFFFF',
    borderRightColor: '#FFFFFF',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 12,
    marginBottom: 16,
    borderWidth: 4,
    borderTopColor: '#333333',
    borderLeftColor: '#333333',
    borderBottomColor: '#000000',
    borderRightColor: '#000000',
  },
  avatarFrame: {
    width: 56,
    height: 56,
    backgroundColor: '#333',
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#555555',
    borderRightColor: '#555555',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 50,
    height: 50,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  usernameText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  bioText: {
    fontFamily: 'monospace',
    color: '#888888',
    fontSize: 10,
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#1B5E20',
    borderRightColor: '#1B5E20',
  },
  followingButton: {
    backgroundColor: '#555555',
    borderTopColor: '#888888',
    borderLeftColor: '#888888',
    borderBottomColor: '#222222',
    borderRightColor: '#222222',
  },
  followButtonText: {
    fontFamily: 'monospace',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  emptyText: {
    fontFamily: 'monospace',
    color: '#666666',
    textAlign: 'center',
    marginTop: 40,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  msgButton: {
    padding: 8,
    borderWidth: 3,
    backgroundColor: '#000',
    borderTopColor: '#FFFFFF',
    borderLeftColor: '#FFFFFF',
    borderBottomColor: '#222',
    borderRightColor: '#222',
  },
});
