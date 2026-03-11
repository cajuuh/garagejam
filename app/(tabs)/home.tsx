import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Platform, RefreshControl, Text, View, useColorScheme, useWindowDimensions } from 'react-native';
import MusicianCard, { MusicianProfile } from '../../components/MusicianCard';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { session } = useSession();
  const { width } = useWindowDimensions();
  const [profiles, setProfiles] = useState<MusicianProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      fetchProfiles();
    }
  }, [session]);

  const fetchProfiles = async () => {
    try {
      if (!refreshing) setLoading(true);

      // 1. Get friend IDs
      let friendIds: string[] = [];
      if (session?.user) {
        const { data: connections } = await supabase
          .from('connections')
          .select('requester_id, receiver_id')
          .eq('status', 'accepted')
          .or(`requester_id.eq.${session.user.id},receiver_id.eq.${session.user.id}`);

        if (connections) {
          friendIds = connections.map(c => c.requester_id === session.user.id ? c.receiver_id : c.requester_id);
        }
      }

      // 2. Get all profiles
      const { data: profilesData, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, skills, avatar_url, intro_audio_url, address, looking_for')
        .order('updated_at', { ascending: false });

      if (error) {
        throw error;
      }
      const profilesWithFriendStatus = profilesData.map(p => ({ ...p, is_friend: friendIds.includes(p.id) }));
      setProfiles(profilesWithFriendStatus || []);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert('Error', error.message);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchProfiles();
  };

  const renderItem = ({ item }: { item: MusicianProfile }) => (
    <MusicianCard profile={item} />
  );

  const getNumColumns = () => {
    if (Platform.OS !== 'web') return 1;
    if (width > 1200) return 4;
    if (width > 900) return 3;
    if (width > 600) return 2;
    return 1;
  };
  const numColumns = getNumColumns();

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View className="pt-14 pb-4 px-4 bg-white dark:bg-neutral-950 border-b border-gray-100 dark:border-neutral-900 mb-2">
        <Text className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Feed</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base">Recently active musicians</Text>
      </View>

      {loading && !refreshing ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color={colorScheme === 'dark' ? '#FFF' : '#000'} />
        </View>
      ) : (
        <FlatList
          key={numColumns.toString()}
          data={profiles}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 8, paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
          numColumns={numColumns}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colorScheme === 'dark' ? '#FFF' : '#000'} />
          }
          ListEmptyComponent={
            <View className="items-center mt-20 px-10">
              <Text className="text-gray-400 dark:text-gray-600 text-center text-lg">No musicians found yet.</Text>
              <Text className="text-gray-400 dark:text-gray-600 text-center text-sm mt-2">Be the first to update your profile!</Text>
            </View>
          }
        />
      )}
    </View>
  );
}
