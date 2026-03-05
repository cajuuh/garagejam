import { Stack } from 'expo-router';
import { ArrowRight, Search as SearchIcon } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .ilike('skills', `%${searchQuery}%`);
      if (error) {
        throw error;
      }
      setProfiles(data || []);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity className="bg-white p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 flex-row items-center active:bg-gray-50">
      <Image
        source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop' }}
        className="w-14 h-14 rounded-full bg-gray-200"
      />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-900">{item.full_name || item.username}</Text>
        <Text className="text-gray-500 text-sm font-medium" numberOfLines={1}>
          {item.skills || 'No skills listed'}
        </Text>
      </View>
      <View className="bg-gray-50 p-2 rounded-full">
        <ArrowRight size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 pt-4 px-4">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="mt-12 mb-6">
        <Text className="text-3xl font-bold text-gray-900 tracking-tight">Discover</Text>
        <Text className="text-gray-500 text-base mt-1">Find musicians by skill or instrument</Text>
      </View>

      <View className="flex-row items-center gap-3 mb-6">
        <View className="flex-1 flex-row items-center bg-white border border-gray-200 rounded-2xl px-4 h-14 shadow-sm focus:border-black transition-colors">
          <SearchIcon size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 text-base font-medium"
            placeholder="Guitar, Drums, Vocals..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          className="bg-black h-14 w-14 rounded-2xl items-center justify-center shadow-md active:scale-95"
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color="white" /> : <ArrowRight size={24} color="white" />}
        </TouchableOpacity>
      </View>

      <FlatList
        data={profiles}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !loading && searchQuery && profiles.length === 0 ? (
            <View className="items-center mt-10">
              <Text className="text-gray-400 text-center">No musicians found matching "{searchQuery}"</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
}
