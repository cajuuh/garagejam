import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { AlignLeft, ArrowLeft, Camera, Globe, Music, Plus, User, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSession } from '../hooks/useSession';
import { supabase } from '../lib/supabase';

const PREDEFINED_SKILLS = [
    { name: 'Guitar', emoji: '🎸' },
    { name: 'Vocals', emoji: '🎤' },
    { name: 'Drums', emoji: '🥁' },
    { name: 'Keys', emoji: '🎹' },
    { name: 'Bass', emoji: '🎸' },
    { name: 'Production', emoji: '🎧' },
    { name: 'Songwriting', emoji: '✍️' },
    { name: 'DJ', emoji: '🎛️' },
    { name: 'Saxophone', emoji: '🎷' },
    { name: 'Violin', emoji: '🎻' },
];

export default function EditProfileScreen() {
    const router = useRouter();
    const { session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [customSkill, setCustomSkill] = useState('');

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

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.2,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (userId: string, uri: string) => {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    };

    async function updateProfile() {
        try {
            setSaving(true);
            if (!session?.user) throw new Error('No user on the session!');

            let avatarUrl = formData.avatar_url;

            if (image) {
                avatarUrl = await uploadAvatar(session.user.id, image);
            }

            const updates = {
                id: session?.user.id,
                ...formData,
                avatar_url: avatarUrl,
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

    const currentSkills = formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : [];

    const addSkill = (skill: string) => {
        if (currentSkills.includes(skill)) return;
        const newSkills = [...currentSkills, skill].join(', ');
        handleChange('skills', newSkills);
    };

    const removeSkill = (skill: string) => {
        const newSkills = currentSkills.filter(s => s !== skill).join(', ');
        handleChange('skills', newSkills);
    };

    const handleAddCustomSkill = () => {
        if (customSkill.trim()) {
            addSkill(customSkill.trim());
            setCustomSkill('');
        }
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
                            <View className="items-center mb-6">
                                <TouchableOpacity onPress={pickImage} className="relative">
                                    <View className="w-28 h-28 rounded-full bg-gray-100 items-center justify-center border-2 border-gray-200 overflow-hidden">
                                        {image || formData.avatar_url ? (
                                            <Image source={{ uri: image || formData.avatar_url }} className="w-full h-full" />
                                        ) : (
                                            <Image
                                                source={require('../assets/images/default-avatar.png')}
                                                className="w-full h-full opacity-50"
                                                resizeMode="cover"
                                            />
                                        )}
                                    </View>
                                    <View className="absolute bottom-0 right-0 bg-black p-2 rounded-full border-2 border-white">
                                        <Camera size={16} color="white" />
                                    </View>
                                </TouchableOpacity>
                                <Text className="text-gray-500 text-sm mt-3">Change Profile Photo</Text>
                            </View>

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
                            </View>
                        </View>

                        {/* Music Profile Section */}
                        <View>
                            <Text className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Music Profile</Text>

                            <View className="bg-white p-4 rounded-2xl border border-gray-100 space-y-4 shadow-sm">
                                <View>
                                    <Text className="text-gray-700 font-medium mb-1.5 text-sm">Skills & Instruments</Text>

                                    {/* Selected Skills */}
                                    <View className="flex-row flex-wrap gap-2 mb-3">
                                        {currentSkills.map((skill, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => removeSkill(skill)}
                                                className="bg-black flex-row items-center px-3 py-2 rounded-full"
                                            >
                                                <Text className="text-white font-medium mr-1">{skill}</Text>
                                                <X size={14} color="white" />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Add Custom Skill */}
                                    <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-xl px-3 h-12 mb-3">
                                        <Music size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900"
                                            value={customSkill}
                                            onChangeText={setCustomSkill}
                                            placeholder="Add a custom skill..."
                                            onSubmitEditing={handleAddCustomSkill}
                                        />
                                        <TouchableOpacity onPress={handleAddCustomSkill}>
                                            <Plus size={20} color="#000" />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Suggested Skills */}
                                    <Text className="text-xs text-gray-500 mb-2 font-medium">Suggested:</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {PREDEFINED_SKILLS.filter(s => !currentSkills.includes(`${s.emoji} ${s.name}`)).map((skill, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => addSkill(`${skill.emoji} ${skill.name}`)}
                                                className="bg-gray-100 border border-gray-200 px-3 py-2 rounded-full active:bg-gray-200"
                                            >
                                                <Text className="text-gray-700 font-medium">{skill.emoji} {skill.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
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
