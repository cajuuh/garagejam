import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import { Stack, useRouter } from 'expo-router';
import { AlignLeft, ArrowLeft, Camera, Globe, Locate, MapPin, Mic, Music, Plus, Trash2, User, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
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
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const { session } = useSession();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [image, setImage] = useState<string | null>(null);
    const [audioUri, setAudioUri] = useState<string | null>(null);
    const [customSkill, setCustomSkill] = useState('');

    const [formData, setFormData] = useState<{
        username: string;
        full_name: string;
        website: string;
        address: string;
        intro_audio_url: string;
        avatar_url: string;
        skills: string;
        looking_for: string;
        latitude?: number | null;
        longitude?: number | null;
    }>({
        username: '',
        full_name: '',
        website: '',
        address: '',
        intro_audio_url: '',
        avatar_url: '',
        skills: '',
        looking_for: '',
        latitude: null,
        longitude: null,
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
                .select(`username, full_name, website, address, avatar_url, intro_audio_url, skills, looking_for, latitude, longitude`)
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
                    address: data.address || '',
                    avatar_url: data.avatar_url || '',
                    intro_audio_url: data.intro_audio_url || '',
                    skills: data.skills || '',
                    looking_for: data.looking_for || '',
                    latitude: data.latitude || null,
                    longitude: data.longitude || null,
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

    const pickAudio = async () => {
        const result = await DocumentPicker.getDocumentAsync({
            type: 'audio/*',
            copyToCacheDirectory: true,
        });

        if (!result.canceled) {
            setAudioUri(result.assets[0].uri);
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

    const uploadAudio = async (userId: string, uri: string) => {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'mp3';
        const fileName = `${userId}/${Date.now()}_intro.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('intros')
            .upload(filePath, arrayBuffer, {
                contentType: `audio/${fileExt}`,
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from('intros').getPublicUrl(filePath);
        return data.publicUrl;
    };

    async function updateProfile() {
        try {
            setSaving(true);
            if (!session?.user) throw new Error('No user on the session!');

            let avatarUrl = formData.avatar_url;
            let introAudioUrl = formData.intro_audio_url;
            let latitude = formData.latitude;
            let longitude = formData.longitude;

            // If address text is present but coords are missing (e.g. manual entry), try to geocode
            if (formData.address && (latitude === null || longitude === null)) {
                try {
                    const geocoded = await Location.geocodeAsync(formData.address);
                    if (geocoded.length > 0) {
                        // Fuzz the geocoded result as well
                        latitude = geocoded[0].latitude + (Math.random() - 0.5) * 0.01;
                        longitude = geocoded[0].longitude + (Math.random() - 0.5) * 0.01;
                    }
                } catch (e) {
                    console.error("Geocoding failed:", e);
                }
            }

            if (image) {
                avatarUrl = await uploadAvatar(session.user.id, image);
            }

            if (audioUri) {
                introAudioUrl = await uploadAudio(session.user.id, audioUri);
            }

            const updates = {
                id: session?.user.id,
                ...formData,
                avatar_url: avatarUrl,
                intro_audio_url: introAudioUrl,
                latitude,
                longitude,
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
        setFormData(prev => {
            const updates: any = { [key]: value };
            if (key === 'address') {
                updates.latitude = null;
                updates.longitude = null;
            }
            return { ...prev, ...updates };
        });
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

    const handleGetCurrentLocation = async () => {
        try {
            setGettingLocation(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                Alert.alert('Permission denied', 'Permission to access location was denied');
                return;
            }

            const location = await Location.getCurrentPositionAsync({});

            // Fuzz immediately for privacy
            const fuzzedLat = location.coords.latitude + (Math.random() - 0.5) * 0.01;
            const fuzzedLong = location.coords.longitude + (Math.random() - 0.5) * 0.01;

            let locationString = formData.address;

            try {
                const reverseGeocode = await Location.reverseGeocodeAsync({
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude
                });

                if (reverseGeocode.length > 0) {
                    const address = reverseGeocode[0];
                    const parts = [address.city, address.region || address.country].filter(Boolean);
                    locationString = parts.join(', ');
                }
            } catch (e) {
                console.error("Reverse geocoding failed (using coords only):", e);
            }

            setFormData(prev => ({
                ...prev,
                address: locationString,
                latitude: fuzzedLat,
                longitude: fuzzedLong,
            }));
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
        } finally {
            setGettingLocation(false);
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
        <View className="flex-1 bg-gray-50 dark:bg-black">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 pt-12 pb-4 bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 flex-row items-center justify-between sticky top-0 z-10">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-800 active:bg-gray-100 dark:active:bg-neutral-700"
                >
                    <ArrowLeft size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-lg font-bold text-gray-900 dark:text-white">Edit Profile</Text>
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
                                    <View className="w-28 h-28 rounded-full bg-gray-100 dark:bg-neutral-800 items-center justify-center border-2 border-gray-200 dark:border-neutral-700 overflow-hidden">
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
                                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3">Change Profile Photo</Text>
                            </View>

                            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">Basic Info</Text>

                            <View className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-4 shadow-sm">
                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Full Name</Text>
                                    <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12">
                                        <User size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 dark:text-white"
                                            value={formData.full_name}
                                            onChangeText={(text) => handleChange('full_name', text)}
                                            placeholder="John Doe"
                                            placeholderTextColor="#9ca3af"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Username</Text>
                                    <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12">
                                        <Text className="text-gray-500 font-bold text-lg">@</Text>
                                        <TextInput
                                            className="flex-1 ml-2 text-gray-900 dark:text-white"
                                            value={formData.username}
                                            onChangeText={(text) => handleChange('username', text)}
                                            placeholder="johndoe"
                                            placeholderTextColor="#9ca3af"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Website</Text>
                                    <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12">
                                        <Globe size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 dark:text-white"
                                            value={formData.website}
                                            onChangeText={(text) => handleChange('website', text)}
                                            placeholder="https://yourband.com"
                                            placeholderTextColor="#9ca3af"
                                            autoCapitalize="none"
                                        />
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Location</Text>
                                    <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12">
                                        <MapPin size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 dark:text-white"
                                            value={formData.address}
                                            onChangeText={(text) => handleChange('address', text)}
                                            placeholder="San Francisco, CA"
                                            placeholderTextColor="#9ca3af"
                                        />
                                        <TouchableOpacity onPress={handleGetCurrentLocation} disabled={gettingLocation}>
                                            {gettingLocation ?
                                                <ActivityIndicator size="small" color={colorScheme === 'dark' ? 'white' : 'black'} /> :
                                                <Locate size={20} color={colorScheme === 'dark' ? 'white' : '#6b7280'} />}
                                        </TouchableOpacity>
                                    </View>
                                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">
                                        {formData.latitude !== null && formData.latitude !== undefined && formData.longitude !== null && formData.longitude !== undefined ? `Lat: ${formData.latitude.toFixed(5)}, Long: ${formData.longitude.toFixed(5)}` : ''}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Music Profile Section */}
                        <View>
                            <Text className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 ml-1">Music Profile</Text>

                            <View className="bg-white dark:bg-neutral-900 p-4 rounded-2xl border border-gray-100 dark:border-neutral-800 space-y-4 shadow-sm">
                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Skills & Instruments</Text>

                                    {/* Selected Skills */}
                                    <View className="flex-row flex-wrap gap-2 mb-3">
                                        {currentSkills.map((skill, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => removeSkill(skill)}
                                                className="bg-black dark:bg-white flex-row items-center px-3 py-2 rounded-full"
                                            >
                                                <Text className="text-white dark:text-black font-medium mr-1">{skill}</Text>
                                                <X size={14} color={colorScheme === 'dark' ? 'black' : 'white'} />
                                            </TouchableOpacity>
                                        ))}
                                    </View>

                                    {/* Add Custom Skill */}
                                    <View className="flex-row items-center bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 h-12 mb-3">
                                        <Music size={18} color="#6b7280" />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 dark:text-white"
                                            value={customSkill}
                                            onChangeText={setCustomSkill}
                                            placeholder="Add a custom skill..."
                                            placeholderTextColor="#9ca3af"
                                            onSubmitEditing={handleAddCustomSkill}
                                        />
                                        <TouchableOpacity onPress={handleAddCustomSkill}>
                                            <Plus size={20} color={colorScheme === 'dark' ? 'white' : 'black'} />
                                        </TouchableOpacity>
                                    </View>

                                    {/* Suggested Skills */}
                                    <Text className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-medium">Suggested:</Text>
                                    <View className="flex-row flex-wrap gap-2">
                                        {PREDEFINED_SKILLS.filter(s => !currentSkills.includes(`${s.emoji} ${s.name}`)).map((skill, index) => (
                                            <TouchableOpacity
                                                key={index}
                                                onPress={() => addSkill(`${skill.emoji} ${skill.name}`)}
                                                className="bg-gray-100 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 px-3 py-2 rounded-full active:bg-gray-200 dark:active:bg-neutral-700"
                                            >
                                                <Text className="text-gray-700 dark:text-gray-300 font-medium">{skill.emoji} {skill.name}</Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Audio Intro (30s)</Text>
                                    <View className="bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl p-3">
                                        {audioUri || formData.intro_audio_url ? (
                                            <View className="flex-row items-center justify-between">
                                                <View className="flex-row items-center">
                                                    <View className="w-8 h-8 bg-emerald-100 dark:bg-emerald-900 rounded-full items-center justify-center mr-2">
                                                        <Mic size={16} color="#059669" />
                                                    </View>
                                                    <Text className="text-gray-700 dark:text-gray-300 text-sm font-medium">Intro Audio Selected</Text>
                                                </View>
                                                <TouchableOpacity onPress={() => { setAudioUri(null); handleChange('intro_audio_url', ''); }}>
                                                    <Trash2 size={18} color="#ef4444" />
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <TouchableOpacity onPress={pickAudio} className="flex-row items-center justify-center py-2">
                                                <Mic size={18} color="#6b7280" />
                                                <Text className="text-gray-600 dark:text-gray-400 font-medium ml-2">Upload Audio File</Text>
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                    <Text className="text-xs text-gray-400 dark:text-gray-500 mt-1 ml-1">Upload a short clip showcasing your skills.</Text>
                                </View>

                                <View>
                                    <Text className="text-gray-700 dark:text-gray-300 font-medium mb-1.5 text-sm">Looking For</Text>
                                    <View className="flex-row items-start bg-gray-50 dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700 rounded-xl px-3 py-3 h-24">
                                        <AlignLeft size={18} color="#6b7280" style={{ marginTop: 2 }} />
                                        <TextInput
                                            className="flex-1 ml-3 text-gray-900 dark:text-white leading-5"
                                            value={formData.looking_for}
                                            onChangeText={(text) => handleChange('looking_for', text)}
                                            placeholder="Describe what kind of band members or projects you are looking for..."
                                            placeholderTextColor="#9ca3af"
                                            multiline
                                            textAlignVertical="top"
                                        />
                                    </View>
                                </View>
                            </View>
                        </View>

                        {/* Save Button */}
                        <TouchableOpacity
                            className="bg-black dark:bg-white h-14 rounded-xl flex-row items-center justify-center shadow-md mb-10"
                            onPress={updateProfile}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={colorScheme === 'dark' ? 'black' : 'white'} />
                            ) : (
                                <Text className="text-white dark:text-black font-bold text-lg">Save Changes</Text>
                            )}
                        </TouchableOpacity>

                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
