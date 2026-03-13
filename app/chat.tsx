// app/chat.tsx
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { Bubble, GiftedChat, IMessage, Send } from 'react-native-gifted-chat';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';

export default function ChatScreen() {
    const [messages, setMessages] = useState<IMessage[]>([]);
    const [user, setUser] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const params = useLocalSearchParams();
    const friendName = typeof params.friendName === 'string' ? params.friendName : null;
    const friendId = typeof params.friendId === 'string' ? params.friendId : null;

    const mapMessageFromSupabase = (dbMessage: any): IMessage => {
        return {
            _id: dbMessage.id,
            text: dbMessage.text,
            createdAt: new Date(dbMessage.created_at),
            user: {
                _id: dbMessage.user_id,
                name: dbMessage.profiles?.username || 'Unknown',
                avatar: dbMessage.profiles?.avatar_url || 'https://placeimg.com/140/140/any',
            },
        };
    };

    // 1. Get User & Load Messages
    useEffect(() => {
        const init = async () => {
            // Get current user
            const { data: { user: currentUser } } = await supabase.auth.getUser();
            setUser(currentUser);

            if (currentUser) {
                await loadMessages(currentUser.id);
                subscribeToMessages(currentUser.id, friendId);
            }
            setIsLoading(false);
        };
        init();

        return () => {
            supabase.removeAllChannels();
        };
    }, []);

    const loadMessages = async (currentUserId: string) => {
        if (!friendId) return;

        const { data, error } = await supabase
            .from('messages')
            // We must specify !messages_user_id_fkey because messages table now has 
            // TWO foreign keys to profiles (user_id and receiver_id)
            .select('*, profiles!messages_user_id_fkey(username, avatar_url)')
            .or(`and(user_id.eq.${currentUserId},receiver_id.eq.${friendId}),and(user_id.eq.${friendId},receiver_id.eq.${currentUserId})`)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) console.error('Error loading messages:', error);

        if (data) {
            const formattedMessages = data.map(mapMessageFromSupabase);
            setMessages(formattedMessages);
        }
    };

    const subscribeToMessages = (currentUserId: string, targetFriendId: string | null) => {
        supabase
            .channel('public:messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                async (payload) => {
                    // Only handle messages from *others* to avoid duplication 
                    // (since we append our own immediately)
                    // AND only if it belongs to THIS conversation
                    if (payload.new.user_id !== currentUserId && payload.new.user_id === targetFriendId) {
                        // Fetch the full message with profile data
                        const { data, error } = await supabase
                            .from('messages')
                            .select('*, profiles!messages_user_id_fkey(username, avatar_url)')
                            .eq('id', payload.new.id)
                            .single();

                        if (error) console.error('Error fetching new message:', error);

                        if (data) {
                            setMessages(previous => GiftedChat.append(previous, [mapMessageFromSupabase(data)]));
                        }
                    }
                }
            )
            .subscribe();
    };

    // 2. Handle sending messages
    const onSend = useCallback(async (newMessages: IMessage[] = []) => {
        if (!user) return;
        if (!friendId) return;

        // Optimistically update UI
        setMessages(previousMessages => GiftedChat.append(previousMessages, newMessages));

        const msg = newMessages[0];

        // Send to Supabase
        const { error } = await supabase.from('messages').insert({
            text: msg.text,
            user_id: user.id,
            receiver_id: friendId,
            // created_at is handled by default now() in DB usually, 
            // but we can pass it if we want exact client time
        });

        if (error) {
            console.error('Error sending message:', error);
            // Optionally revert the message in UI if error
        }
    }, [user]);

    // Custom UI: Render blue bubbles for the user
    const renderBubble = (props: any) => {
        return (
            <Bubble
                {...props}
                wrapperStyle={{
                    right: {
                        backgroundColor: '#007AFF', // GarageJam Blue
                    },
                    left: {
                        backgroundColor: '#F0F0F0',
                    },
                }}
                textStyle={{
                    right: {
                        color: '#fff',
                    },
                }}
            />
        );
    };

    // Custom UI: Send button
    const renderSend = (props: any) => {
        return (
            <Send {...props}>
                <View style={styles.sendContainer}>
                    <Ionicons name="send" size={24} color="#007AFF" />
                </View>
            </Send>
        );
    };


    return (
        <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
            {isLoading && (
                <View style={{ padding: 10, alignItems: 'center' }}>
                    <ActivityIndicator size="small" color="#007AFF" />
                </View>
            )}
            <GiftedChat
                messages={messages}
                onSend={messages => onSend(messages)}
                user={{
                    _id: user?.id,
                }}
                renderBubble={renderBubble}
                renderSend={renderSend}
                textInputProps={{ placeholder: friendName ? `Message ${friendName}...` : 'Type a message...' }}
                // Better keyboard handling for iOS/Android
                listProps={{ keyboardShouldPersistTaps: 'never' }}
            />
            {
                Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />
            }
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    sendContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        alignSelf: 'center',
        marginRight: 15,
    }
});
