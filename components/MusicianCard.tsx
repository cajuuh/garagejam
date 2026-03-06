import { Audio } from 'expo-av';
import { Pause, Play } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export interface MusicianProfile {
    id: string;
    full_name?: string;
    username?: string;
    skills?: string;
    avatar_url?: string;
    intro_audio_url?: string;
}

export default function MusicianCard({ profile }: { profile: MusicianProfile }) {
    const [sound, setSound] = useState<Audio.Sound>();
    const [isPlaying, setIsPlaying] = useState(false);

    async function playSound() {
        if (!profile.intro_audio_url) return;
        if (isPlaying) {
            await sound?.pauseAsync();
            setIsPlaying(false);
            return;
        }
        if (sound) {
            await sound.playAsync();
            setIsPlaying(true);
            return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: profile.intro_audio_url },
            { shouldPlay: true }
        );
        setSound(newSound);
        setIsPlaying(true);

        newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) setIsPlaying(false);
        });
    }

    useEffect(() => {
        return () => { sound?.unloadAsync(); };
    }, [sound]);

    return (
        <View className="bg-white p-4 rounded-[32px] border border-neutral-200 items-center w-full max-w-[280px] shadow-sm m-2">

            {/* 1. Profile Image (O Círculo do topo) */}
            <View className="mb-6 shadow-md rounded-full">
                <Image
                    source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/images/default-avatar.png')}
                    className="w-24 h-24 rounded-full bg-neutral-100 border-2 border-white"
                    style={{ width: 96, height: 96 }}
                    resizeMode="cover"
                />
            </View>

            {/* Nome e Usuário (Opcional, mas bom para contexto) */}
            <Text className="text-lg font-bold text-neutral-800 mb-1">
                {profile.full_name || "Músico"}
            </Text>

            {/* 2. Audio Section (O bloco central do desenho) */}
            {profile.intro_audio_url && (
                <TouchableOpacity
                    onPress={playSound}
                    activeOpacity={0.7}
                    className={`w-full flex-row items-center justify-center py-4 rounded-2xl mb-6 ${isPlaying ? 'bg-emerald-500' : 'bg-neutral-900'}`}
                >
                    {isPlaying ? <Pause size={20} color="white" /> : <Play size={20} color="white" fill="white" />}
                    <Text className="text-white font-bold ml-2 tracking-widest uppercase text-xs">
                        {isPlaying ? 'Playing...' : 'Audio Intro'}
                    </Text>
                </TouchableOpacity>
            )}

            {/* 3. Skills Section (O bloco com tags no fundo) */}
            <View className="w-full bg-neutral-50 p-3 rounded-2xl border border-neutral-100">
                <Text className="text-[10px] uppercase font-black text-neutral-400 text-center mb-2 tracking-tighter">
                    Skills
                </Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                    {profile.skills ? (
                        profile.skills.split(',').slice(0, 3).map((skill, index) => (
                            <View key={index} className="bg-white px-3 py-1 rounded-full border border-neutral-200 shadow-sm">
                                <Text className="text-neutral-600 text-[10px] font-bold">{skill.trim()}</Text>
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