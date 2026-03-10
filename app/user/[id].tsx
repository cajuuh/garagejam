import { useAudioPlayer } from 'expo-audio';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Briefcase, MapPin, MicVocal, Pause, Play } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../lib/supabase';

type MusicianProfile = {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    skills: string;
    looking_for: string;
    address: string;
    website: string;
    intro_audio_url: string;
};

export default function UserProfileScreen() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const { colorScheme } = useColorScheme();
    const [profile, setProfile] = useState<MusicianProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const player = useAudioPlayer(profile?.intro_audio_url || '');

    useEffect(() => {
        fetchProfile();
    }, [id]);

    async function fetchProfile() {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error', error.message);
            }
            router.back();
        } finally {
            setLoading(false);
        }
    }

    const playSound = () => {
        if (!profile?.intro_audio_url) return;
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    if (loading) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color={colorScheme === 'dark' ? 'white' : 'black'} />
            </View>
        );
    }

    if (!profile) return null;

    return (
        <ScrollView className="flex-1 bg-gray-50 dark:bg-black" showsVerticalScrollIndicator={false}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header / Cover */}
            <View className="relative">
                <ImageBackground
                    source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop' }}
                    className="h-48 w-full"
                    resizeMode="cover"
                >
                    <View className="absolute inset-0 bg-black/30" />
                    <TouchableOpacity
                        onPress={() => router.back()}
                        className="absolute top-12 left-4 w-10 h-10 bg-black/50 rounded-full items-center justify-center"
                    >
                        <ArrowLeft size={24} color="white" />
                    </TouchableOpacity>
                </ImageBackground>

                <View className="absolute -bottom-16 left-0 right-0 items-center">
                    <View className="relative">
                        <Image
                            source={profile.avatar_url ? { uri: profile.avatar_url } : require('../../assets/images/default-avatar.png')}
                            className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-neutral-800"
                            style={{ width: 128, height: 128 }}
                            resizeMode="cover"
                        />
                    </View>
                </View>
            </View>

            {/* Profile Info */}
            <View className="mt-20 px-6 items-center pb-6">
                <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
                    {profile.full_name || profile.username || 'Musician'}
                </Text>
                <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">@{profile.username || 'username'}</Text>

                {!!profile.website && (
                    <Text className="text-emerald-600 text-sm mt-2 font-medium">{profile.website}</Text>
                )}

                <View className="flex-row items-center mt-4 space-x-4">
                    <View className="flex-row items-center bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
                        <MapPin size={14} color="#6b7280" />
                        <Text className="text-gray-600 dark:text-neutral-300 text-xs ml-1.5">{profile.address || 'Location not set'}</Text>
                    </View>
                </View>
            </View>

            {/* Content Cards */}
            <View className="px-4 pb-10 space-y-4">

                {/* Audio Intro */}
                {!!profile.intro_audio_url && (
                    <TouchableOpacity
                        onPress={playSound}
                        className={`flex-row items-center justify-center py-4 rounded-2xl shadow-sm ${player.playing ? 'bg-emerald-500' : 'bg-black dark:bg-white'}`}
                    >
                        {player.playing ? <Pause size={20} color="white" /> : <Play size={20} color={colorScheme === 'dark' ? 'black' : 'white'} fill={colorScheme === 'dark' ? 'black' : 'white'} />}
                        <Text className={`font-bold ml-2 text-base ${player.playing ? 'text-white' : 'text-white dark:text-black'}`}>
                            {player.playing ? 'Playing Intro...' : 'Play Audio Intro'}
                        </Text>
                    </TouchableOpacity>
                )}

                {/* Looking For Card */}
                <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
                    <View className="flex-row items-center mb-3 border-b border-gray-50 dark:border-neutral-800 pb-3">
                        <View className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
                            <MicVocal size={20} color="#9333ea" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Looking For</Text>
                    </View>
                    <Text className="text-gray-600 dark:text-neutral-300 leading-relaxed">
                        {profile.looking_for || 'Not specified.'}
                    </Text>
                </View>

                {/* Skills Card */}
                <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
                    <View className="flex-row items-center mb-3 border-b border-gray-50 dark:border-neutral-800 pb-3">
                        <View className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
                            <Briefcase size={20} color="#2563eb" />
                        </View>
                        <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Skills & Instruments</Text>
                    </View>
                    <View className="flex-row flex-wrap gap-2">
                        {profile.skills ? (
                            profile.skills.split(',').map((skill, index) => (
                                <View key={index} className="bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-700">
                                    <Text className="text-gray-700 dark:text-neutral-300 font-medium">{skill.trim()}</Text>
                                </View>
                            ))
                        ) : (
                            <Text className="text-gray-400 dark:text-neutral-500 italic">No skills added.</Text>
                        )}
                    </View>
                </View>

            </View>
        </ScrollView>
    );
}