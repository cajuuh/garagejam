import { Audio } from 'expo-av';
import { Pause, Play } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface MusicianProfile {
    id: string;
    full_name?: string;
    username?: string;
    skills?: string;
    avatar_url?: string;
    intro_audio_url?: string;
    looking_for?: string;
}

export default function MusicianCard({ profile }: { profile: MusicianProfile }) {
    const { colorScheme } = useColorScheme();
    const [sound, setSound] = useState<Audio.Sound>();
    const [isPlaying, setIsPlaying] = useState(false);

    async function playSound() {
        if (!profile.intro_audio_url) return;
        if (isPlaying) {
            await sound?.stopAsync();
            setIsPlaying(false);
            return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: profile.intro_audio_url },
            { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
                setIsPlaying(false);
            }
        });
    }

    useEffect(() => {
        return () => { sound?.unloadAsync(); };
    }, [sound]);

    return (
        <View className="bg-white dark:bg-neutral-900 p-4 rounded-[32px] border border-neutral-200 dark:border-neutral-800 items-center w-full max-w-[280px] shadow-sm m-2">

            {/* 1. Profile Image (O Círculo do topo) */}
            <View className="mb-6 shadow-md rounded-full bg-white dark:bg-neutral-900">
                <Image
                    source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/images/default-avatar.png')}
                    className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-950"
                    style={{ width: 96, height: 96 }}
                    resizeMode="cover"
                />
            </View>

            {/* Nome e Usuário (Opcional, mas bom para contexto) */}
            <Text className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                {profile.full_name || "Músico"}
            </Text>

            {/* Description / Looking For */}
            {!!profile.looking_for && (
                <View className="w-full mb-4">
                    <Text className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 text-center mb-1 tracking-tighter">
                        Looking For
                    </Text>
                    <ScrollView className="max-h-24 w-full" nestedScrollEnabled indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
                        <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center px-2 leading-4">
                            {profile.looking_for}
                        </Text>
                    </ScrollView>
                </View>
            )}

            {/* 2. Audio Section (O bloco central do desenho) */}
            {!!profile.intro_audio_url && (
                <TouchableOpacity
                    onPress={playSound}
                    activeOpacity={0.7}
                    className={`w-full flex-row items-center justify-center py-4 rounded-2xl mb-6 ${isPlaying ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-neutral-200'}`}
                >
                    {isPlaying ? <Pause size={20} color="white" /> : <Play size={20} color={colorScheme === 'dark' ? 'black' : 'white'} fill={colorScheme === 'dark' ? 'black' : 'white'} />}
                    <Text className={`font-bold ml-2 tracking-widest uppercase text-xs ${isPlaying ? 'text-white' : 'text-white dark:text-black'}`}>
                        {isPlaying ? 'Playing...' : 'Audio Intro'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* 3. Skills Section (O bloco com tags no fundo) */}
            <View className="w-full bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <Text className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 text-center mb-2 tracking-tighter">
                    Skills
                </Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                    {profile.skills ? (
                        profile.skills.split(',').slice(0, 3).map((skill, index) => (
                            <View key={index} className="bg-white dark:bg-neutral-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                <Text className="text-neutral-600 dark:text-neutral-300 text-[10px] font-bold">{skill.trim()}</Text>
                            </View>
                        ))
                    ) : (
                        <Text className="text-neutral-300 text-[10px]">No skills listed</Text>
                    )}
                </View>
            </View>
        </View>
    );
}