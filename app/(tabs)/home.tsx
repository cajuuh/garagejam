import { useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../../lib/supabase';

interface Profile {
  id: string;
  full_name?: string;
  username?: string;
  skills?: string;
}

export default function HomeScreen() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      setRefreshing(true);
      const { data, error } = await supabase.from('profiles').select('*');
      if (error) {
        throw error;
      }
      setProfiles(data || []);
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    fetchProfiles();
  };

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.profileItem}>
      <Text style={styles.profileName}>{item.full_name || item.username}</Text>
      <Text>{item.skills}</Text>
    </View>
  );

  return (
    <FlatList
      data={profiles}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  profileItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
