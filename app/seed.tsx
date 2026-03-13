import { Stack } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

const TEST_PASSWORD = 'senha123';
const USERS = [
    { email: 'test_user_1@test.com', name: 'Alice Rocker', username: 'alicerocks' },
    { email: 'test_user_2@test.com', name: 'Bob Drummer', username: 'bobbyd' },
    { email: 'test_user_3@test.com', name: 'Charlie Jazz', username: 'charlie_j' },
];

export default function SeedDatabase() {
    const [logs, setLogs] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const addLog = (msg: string) => setLogs(prev => [...prev, msg]);

    const runSeed = async () => {
        setLoading(true);
        setLogs(['Starting seed process...']);

        try {
            // 1. Sign Up Users
            const userIds: Record<string, string> = {};

            for (const u of USERS) {
                addLog(`Creating user: ${u.email}...`);

                // Sign out first to ensure clean state
                await supabase.auth.signOut();

                const { data, error } = await supabase.auth.signUp({
                    email: u.email,
                    password: TEST_PASSWORD,
                    options: {
                        data: { full_name: u.name, username: u.username }
                    }
                });

                if (error) throw new Error(`Failed to create ${u.email}: ${error.message}`);
                if (!data.user) throw new Error(`No user data returned for ${u.email}`);

                userIds[u.email] = data.user.id;

                // Update profile specifically to ensure custom data is set
                await supabase.from('profiles').upsert({
                    id: data.user.id,
                    username: u.username,
                    full_name: u.name,
                    avatar_url: `https://api.dicebear.com/7.x/micah/png?seed=${u.username}`
                });

                addLog(`✅ Created ${u.username} (${data.user.id})`);
            }

            const id1 = userIds['test_user_1@test.com'];
            const id2 = userIds['test_user_2@test.com'];
            const id3 = userIds['test_user_3@test.com'];

            // 2. Create Friendships & Connections (Alice <-> Bob)
            // We need to be logged in as one of them to pass RLS, or use service role.
            // Since we are currently logged in as the last user (Charlie), let's re-login as Alice.

            addLog('Logging in as Alice to set up relationships...');
            await supabase.auth.signInWithPassword({ email: 'test_user_1@test.com', password: TEST_PASSWORD });

            addLog('Alice and Bob are becoming connected...');
            const { error: friendError } = await supabase.from('friendships').insert({
                user_id: id1,
                friend_id: id2
            });
            if (friendError) throw friendError;

            // Also insert into 'connections' so the Profile "Connect" button recognizes it
            const { error: acceptedConnError } = await supabase.from('connections').insert({
                requester_id: id1,
                receiver_id: id2,
                status: 'accepted'
            });
            if (acceptedConnError) throw acceptedConnError;
            addLog('✅ Friendship & Connection created: Alice <-> Bob');

            // 3. Create Chat Messages (Alice -> Bob)
            addLog('Alice is sending a message to Bob...');
            const { error: msgError } = await supabase.from('messages').insert({
                text: 'Hey Bob! Ready to jam this weekend?',
                user_id: id1,
                receiver_id: id2
            });
            if (msgError) throw msgError;
            addLog('✅ Message sent.');

            // 4. Create Connection Request (Alice -> Charlie)
            // This simulates the "Request" flow appearing in Profile
            addLog('Alice is sending a Connection Request to Charlie...');
            const { error: connError } = await supabase.from('connections').insert({
                requester_id: id1,
                receiver_id: id3,
                status: 'pending'
            });
            if (connError) {
                // Ignore duplicate error if re-running
                addLog(`⚠️ Connection warning: ${connError.message}`);
            } else {
                addLog('✅ Connection request sent to Charlie.');
            }

            addLog('🎉 SEED COMPLETE! You can now restart the app and login.');
            Alert.alert('Success', 'Database seeded successfully.');

        } catch (e: any) {
            addLog(`❌ ERROR: ${e.message}`);
            Alert.alert('Error', e.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={{ flex: 1, backgroundColor: '#f5f5f5', padding: 20, paddingTop: 60 }}>
            <Stack.Screen options={{ headerShown: false }} />
            <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Database Seeder</Text>

            <TouchableOpacity
                onPress={runSeed}
                disabled={loading}
                style={{
                    backgroundColor: '#007AFF',
                    padding: 15,
                    borderRadius: 10,
                    alignItems: 'center',
                    opacity: loading ? 0.7 : 1
                }}
            >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>RUN SEED & RESET</Text>}
            </TouchableOpacity>

            <ScrollView style={{ marginTop: 20, flex: 1, backgroundColor: '#fff', padding: 10, borderRadius: 10 }}>
                {logs.map((log, i) => (
                    <Text key={i} style={{ marginBottom: 5, fontFamily: 'monospace', fontSize: 12 }}>{log}</Text>
                ))}
            </ScrollView>
        </View>
    );
}