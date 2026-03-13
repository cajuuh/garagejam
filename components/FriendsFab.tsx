import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { ActivityIndicator, Avatar, FAB, IconButton, List, Modal, Portal, Searchbar, Text, useTheme } from 'react-native-paper';
import { supabase } from '../lib/supabase';

type Profile = {
    id: string;
    username: string;
    avatar_url: string | null;
    has_chat?: boolean;
};

export default function FriendsFab() {
    const [visible, setVisible] = useState(false);
    const [friends, setFriends] = useState<Profile[]>([]);
    const [searchResults, setSearchResults] = useState<Profile[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const theme = useTheme();

    const showModal = () => {
        setVisible(true);
        fetchFriends();
        setSearchQuery('');
        setSearchResults([]);
    };

    const hideModal = () => setVisible(false);

    // Create a Set of friend IDs for easy lookup during search
    const friendIdsSet = useMemo(() => new Set(friends.map(f => f.id)), [friends]);

    const fetchFriends = async () => {
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Fetching friends for user:', user.id);

        // 1. Fetch Friends using RPC (Clean & Robust)
        const { data: friendsData, error: friendsError } = await supabase.rpc('get_friends');

        if (friendsError) {
            console.error("Error fetching friends via RPC:", friendsError);
            setLoading(false);
            return;
        }

        // 2. Check for active chats (Safe check - won't crash if table/column missing)
        const chattedWith = new Set<string>();
        try {
            const { data: chatData, error: chatError } = await supabase
                .from('messages')
                .select('user_id, receiver_id')
                .or(`user_id.eq.${user.id},receiver_id.eq.${user.id}`);

            if (chatError) {
                console.warn('Chat history check failed (ignoring):', chatError.message);
            } else {
                chatData?.forEach(msg => {
                    if (msg.user_id === user.id && msg.receiver_id) chattedWith.add(msg.receiver_id);
                    if (msg.receiver_id === user.id) chattedWith.add(msg.user_id);
                });
            }
        } catch (e) {
            console.warn('Error checking chat history:', e);
        }

        if (friendsData) {
            console.log('Loaded profiles:', friendsData.length);
            setFriends(friendsData.map((p: any) => ({
                ...p,
                has_chat: chattedWith.has(p.id)
            })));
        }
        setLoading(false);
    };

    const onSearch = async (query: string) => {
        setSearchQuery(query);
        if (query.length === 0) {
            setSearchResults([]);
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('id, username, avatar_url')
            .ilike('username', `%${query}%`)
            .limit(10);

        if (data) setSearchResults(data);
    };

    const onAddFriend = async (friendId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('friendships').insert({
            user_id: user.id,
            friend_id: friendId
        });

        if (!error) {
            // Refresh friends list to show the new connection
            fetchFriends();
            setSearchQuery(''); // Clear search to go back to list
        }
    };

    const onSelectFriend = (friend: Profile) => {
        hideModal();
        // Navigate to chat with params
        router.push({
            pathname: '/chat',
            params: { friendId: friend.id, friendName: friend.username }
        });
    };

    return (
        <>
            <FAB
                icon="chatbubbles"
                label="New Chat"
                style={styles.fab}
                onPress={showModal}
            />
            <Portal>
                <Modal visible={visible} onDismiss={hideModal} contentContainerStyle={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
                    <Text variant="headlineSmall" style={styles.title}>Select a Musician</Text>

                    <Searchbar
                        placeholder="Search users..."
                        onChangeText={onSearch}
                        value={searchQuery}
                        style={{ marginBottom: 15, backgroundColor: theme.colors.surfaceVariant }}
                    />

                    {loading ? (
                        <ActivityIndicator animating={true} size="large" style={{ margin: 20 }} />
                    ) : (
                        <FlatList
                            data={searchQuery ? searchResults : friends}
                            ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 20, opacity: 0.5 }}>{searchQuery ? 'No users found.' : 'No friends added yet.'}</Text>}
                            keyExtractor={(item) => item.id}
                            keyboardShouldPersistTaps="handled"
                            renderItem={({ item }) => (
                                <List.Item
                                    title={item.username}
                                    left={(props) => (
                                        item.avatar_url
                                            ? <Avatar.Image {...props} size={40} source={{ uri: item.avatar_url }} />
                                            : <Avatar.Text {...props} size={40} label={item.username ? item.username.substring(0, 2).toUpperCase() : '??'} />
                                    )}
                                    // Only allow clicking to chat if they are already a friend
                                    onPress={() => friendIdsSet.has(item.id) ? onSelectFriend(item) : null}
                                    right={(props) => (
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            {friendIdsSet.has(item.id) ? (
                                                <>
                                                    <List.Icon {...props} icon="chatbox-ellipses" color={item.has_chat ? theme.colors.primary : '#9ca3af'} />
                                                    <List.Icon {...props} icon="chevron-forward" />
                                                </>
                                            ) : (
                                                <IconButton icon="person-add" iconColor={theme.colors.primary} onPress={() => onAddFriend(item.id)} />
                                            )}
                                        </View>
                                    )}
                                />
                            )}
                        />
                    )}
                </Modal>
            </Portal>
        </>
    );
}

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        margin: 16,
        right: 0,
        bottom: 80,
    },
    modalContainer: {
        padding: 20,
        margin: 20,
        borderRadius: 12,
        maxHeight: '80%',
    },
    title: {
        marginBottom: 16,
        textAlign: 'center',
        fontWeight: 'bold',
    }
});