import { Stack, useRouter } from 'expo-router';
import { ArrowRight, Filter, Plus, Search as SearchIcon, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, Modal, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

export default function SearchScreen() {
  const { colorScheme } = useColorScheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [tempSkill, setTempSkill] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = async () => {
    performSearch(searchQuery, activeFilters);
  };

  const performSearch = async (queryText: string, filters: string[]) => {
    try {
      setLoading(true);
      let query = supabase
        .from('profiles')
        .select('*');

      if (queryText) {
        query = query.or(`full_name.ilike.%${queryText}%,username.ilike.%${queryText}%,skills.ilike.%${queryText}%,looking_for.ilike.%${queryText}%`);
      }

      filters.forEach(skill => {
        query = query.ilike('skills', `%${skill}%`);
      });

      const { data, error } = await query;

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

  const addFilter = () => {
    if (tempSkill.trim() && !activeFilters.includes(tempSkill.trim())) {
      setActiveFilters([...activeFilters, tempSkill.trim()]);
      setTempSkill('');
    }
  };

  const removeFilter = (skill: string) => {
    const newFilters = activeFilters.filter(s => s !== skill);
    setActiveFilters(newFilters);
    // Optional: Trigger search immediately when removing a filter from the main screen
    performSearch(searchQuery, newFilters);
  };

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      className="bg-white dark:bg-neutral-900 p-4 rounded-2xl mb-3 shadow-sm border border-gray-100 dark:border-neutral-800 flex-row items-center active:bg-gray-50 dark:active:bg-neutral-800"
      onPress={() => router.push({
        pathname: '/user/[id]' as any,
        params: { id: item.id },
      })}
    >
      <Image
        source={{ uri: item.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop' }}
        className="w-14 h-14 rounded-full bg-gray-200 dark:bg-neutral-800"
      />
      <View className="ml-4 flex-1">
        <Text className="text-lg font-bold text-gray-900 dark:text-white">{item.full_name || item.username}</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm font-medium" numberOfLines={1}>
          {item.skills || 'No skills listed'}
        </Text>
      </View>
      <View className="bg-gray-50 dark:bg-neutral-800 p-2 rounded-full">
        <ArrowRight size={16} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50 dark:bg-black pt-4 px-4">
      <Stack.Screen options={{ headerShown: false }} />

      <View className="mt-12 mb-6">
        <Text className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Discover</Text>
        <Text className="text-gray-500 dark:text-gray-400 text-base mt-1">Find musicians by skill or instrument</Text>
      </View>

      <View className="flex-row items-center gap-3 mb-6">
        <View className="flex-1 flex-row items-center bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 h-14 shadow-sm focus:border-black dark:focus:border-neutral-700 transition-colors">
          <SearchIcon size={20} color="#9ca3af" />
          <TextInput
            className="flex-1 ml-3 text-gray-900 dark:text-white text-base font-medium"
            placeholder="Search skills, name, or keywords..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          className="bg-black dark:bg-white h-14 w-14 rounded-2xl items-center justify-center shadow-md active:scale-95"
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? <ActivityIndicator color={colorScheme === 'dark' ? 'black' : 'white'} /> : <ArrowRight size={24} color={colorScheme === 'dark' ? 'black' : 'white'} />}
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-gray-100 dark:bg-neutral-800 h-14 w-14 rounded-2xl items-center justify-center shadow-sm active:scale-95"
          onPress={() => setIsFilterVisible(true)}
        >
          <Filter size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
        </TouchableOpacity>
      </View>

      {/* Active Filters Chips */}
      {activeFilters.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mb-4">
          {activeFilters.map((skill, index) => (
            <TouchableOpacity key={index} onPress={() => removeFilter(skill)} className="bg-black dark:bg-white px-3 py-1.5 rounded-full flex-row items-center">
              <Text className="text-white dark:text-black text-xs font-medium mr-1">{skill}</Text>
              <X size={12} color={colorScheme === 'dark' ? 'black' : 'white'} />
            </TouchableOpacity>
          ))}
        </View>
      )}

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

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isFilterVisible}
        onRequestClose={() => setIsFilterVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white dark:bg-neutral-900 rounded-t-3xl p-6 h-3/4">
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-gray-900 dark:text-white">Filter by Skills</Text>
              <TouchableOpacity onPress={() => setIsFilterVisible(false)}>
                <X size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12 mb-4">
              <TextInput
                className="flex-1 text-gray-900 dark:text-white"
                placeholder="Add instrument (e.g. Bass)"
                placeholderTextColor="#9ca3af"
                value={tempSkill}
                onChangeText={setTempSkill}
                onSubmitEditing={addFilter}
              />
              <TouchableOpacity onPress={addFilter}>
                <Plus size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
              </TouchableOpacity>
            </View>

            <View className="flex-row flex-wrap gap-2 mb-6">
              {activeFilters.map((skill, index) => (
                <TouchableOpacity key={index} onPress={() => removeFilter(skill)} className="bg-gray-100 dark:bg-neutral-800 px-3 py-2 rounded-full flex-row items-center">
                  <Text className="text-gray-900 dark:text-white font-medium mr-2">{skill}</Text>
                  <X size={14} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              className="bg-black dark:bg-white h-14 rounded-xl items-center justify-center mt-auto mb-4"
              onPress={() => {
                setIsFilterVisible(false);
                handleSearch();
              }}
            >
              <Text className="text-white dark:text-black font-bold text-lg">Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
