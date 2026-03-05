import { Stack, useRouter } from 'expo-router';
import { AlignLeft, ArrowLeft, Globe, Image as ImageIcon, Music, User } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';

export default function EditProfileScreen() {
    const router = useRouter();
    const { session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        full_name: '',
        website: '',
        avatar_url: '',
        skills: '',
        looking_for: '',
    });

    useEffect(() => {
        if (session) getProfile();
    }, [session]);

    async function getProfile() {
        try {
            setLoading(true);
            if (!session?.user) throw new Error('No user on the session!');

            const { data, error, status } = await supabase
                .from('profiles')
                .select(`username, full_name, website, avatar_url, skills, looking_for`)
                .eq('id', session?.user.id)
                .single();

            if (error && status !== 406) {
                throw error;
            }

            if (data) {
                setFormData({
                    username: data.username || '',
                    full_name: data.full_name || '',
                    website: data.website || '',
                    avatar_url: data.avatar_url || '',
                    skills: data.skills || '',
                    looking_for: data.looking_for || '',
                });
            }
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    }

    async function updateProfile() {
        try {
            setSaving(true);
            if (!session?.user) throw new Error('No user on the session!');

            const updates = {
                id: session?.user.id,
                ...formData,
                updated_at: new Date(),
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                throw error;
            }

            router.back();
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setSaving(false);
        }
    }

    const handleChange = (key: string, value: string) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white">
                <ActivityIndicator size="large" color="#000000" />
            </View>
        );
    }

    return (
        <View className="flex-1 bg-gray-50">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 pt-12 pb-4 bg-white border-b border-gray-100 flex-row items-center justify-between sticky top-0 z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 active:bg-gray-100"
                >
                    <ArrowLeft size={24} color="#000" />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900">Edit Profile</Text>
                <View className="w-10" />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-4 pt-6" showsVerticalScrollIndicator={false}>

                    <View className="space-y-5 pb-10">
                        {/* Basic Info Section */}
                        <View>
                            <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Basic Info</Text>

                            <View className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Full Name</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                                        <User size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            value={formData.full_name}
                                            onChangeText={(text) => handleChange('full_name', text)}
                                            placeholder="John Doe"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Username</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                                        <Text className="text-gray-500 font-bold text-lg">@</Text>
                                        <TextInput
                                            className="flex-1 ml-2 text-gray-900"
                                            value={formData.username}
                                            onChangeText={(text) => handleChange('username', text)}
                                            placeholder="johndoe"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Website</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                                        <Globe size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            value={formData.website}
                                            onChangeText={(text) => handleChange('website', text)}
                                            placeholder="https://yourband.com"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Avatar URL</Text>
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12">
                                        <ImageIcon size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            value={formData.avatar_url}
                                            onChangeText={(text) => handleChange('avatar_url', text)}
                                            placeholder="https://..."
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Music Profile Section */}
                        <View>
                            <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Music Profile</Text>

                            <View className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Skills & Instruments</Text>
                                    <View className="flex-row items-start bg-gray-50 border border-gray-200 rounded-xl px-3 py-3">
                                        <Music size={18} color="#6b7280" style={{ marginTop: 2 }} />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 leading-5"
                                            value={formData.skills}
                                            onChangeText={(text) => handleChange('skills', text)}
                                            placeholder="Guitar, Vocals, Songwriting..."
                                            multiline
                                        />
                                    </View>
                                    <Text className="text-xs text-gray-400 mt-1 ml-1">Comma separated</Text>
                                </View>

                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Looking For</Text>
                                    <View className="flex-row items-start bg-gray-50 border border-gray-200 rounded-xl px-3 py-3 h-24">
                                        <AlignLeft size={18} color="#6b7280" style={{ marginTop: 2 }} />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 leading-5"
                                            value={formData.looking_for}
                                            onChangeText={(text) => handleChange('looking_for', text)}
                                            placeholder="Describe what kind of band members or projects you are looking for..."
                                            multiline
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            className="bg-black h-14 rounded-xl flex-row items-center justify-center shadow-md active:scale-95 mb-10"
                            onPress={updateProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <Text className="text-white font-bold text-lg">Save Changes</Text>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
