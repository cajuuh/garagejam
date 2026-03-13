import { Ionicons } from '@expo/vector-icons';
import { useAudioPlayer } from 'expo-audio';
import { useRouter } from 'expo-router';
import { Check, Pause, Play } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { Image, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';

export interface MusicianProfile {
    id: string;
    full_name?: string;
    username?: string;
    skills?: string;
    avatar_url?: string;
    intro_audio_url?: string;
    address?: string;
    looking_for?: string;
    is_friend?: boolean;
}

export default function MusicianCard({ profile }: { profile: MusicianProfile }) {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const player = useAudioPlayer(profile.intro_audio_url || '');

    const playSound = (e: any) => {
        // Prevent the card's navigation when clicking the play button
        e.stopPropagation();
        if (!profile.intro_audio_url) return;
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    const handleOpenChat = (e: any) => {
        e.stopPropagation();
        router.push({
            pathname: '/chat',
            params: {
                friendId: profile.id,
                friendName: profile.username || profile.full_name
            }
        });
    };

    return (
        <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({
                pathname: '/user/[id]' as any,
                params: { id: profile.id },
            })}
            className={`bg-white dark:bg-neutral-900 p-4 rounded-[32px] border border-neutral-200 dark:border-neutral-800 items-center shadow-sm m-2 ${Platform.OS === 'web' ? 'w-full max-w-[280px]' : 'flex-1'}`}>

            {/* 1. Profile Image (O Círculo do topo) */}
            <View className="mb-6 shadow-md rounded-full bg-white dark:bg-neutral-900">
                <Image
                    source={profile.avatar_url ? { uri: profile.avatar_url } : require('../assets/images/default-avatar.png')}
                    className="w-24 h-24 rounded-full bg-neutral-100 dark:bg-neutral-800 border-2 border-white dark:border-neutral-950"
                    style={{ width: 96, height: 96 }}
                    resizeMode="cover"
                />
                {profile.is_friend && (
                    <View className="absolute top-0 right-0 bg-emerald-500 p-1.5 rounded-full border-2 border-white dark:border-neutral-900">
                        <Check size={14} color="white" />
                    </View>
                )}
            </View>

            {/* Nome e Usuário (Opcional, mas bom para contexto) */}
            <Text className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-1">
                {profile.full_name || "Músico"}
            </Text>

            {/* Description / Looking For */}
            <View className="w-full mb-4 min-h-[100px] flex justify-center">
                {!!profile.looking_for && (
                    <>
                        <Text className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 text-center mb-1 tracking-tighter">
                            Looking For
                        </Text>
                        <ScrollView className="max-h-24 w-full" nestedScrollEnabled indicatorStyle={colorScheme === 'dark' ? 'white' : 'black'}>
                            <Text className="text-xs text-neutral-500 dark:text-neutral-400 text-center px-2 leading-4">
                                {profile.looking_for}
                            </Text>
                        </ScrollView>
                    </>
                )}
            </View>

            {/* 2. Audio Section (O bloco central do desenho) */}
            <View className="w-full mb-6 h-14">
                {!!profile.intro_audio_url && (
                    <TouchableOpacity
                        onPress={(e) => playSound(e)}
                        activeOpacity={0.7}
                        className={`w-full h-full flex-row items-center justify-center py-4 rounded-2xl ${player.playing ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-neutral-200'}`}
                    >
                        {player.playing ? <Pause size={20} color="white" /> : <Play size={20} color={colorScheme === 'dark' ? 'black' : 'white'} fill={colorScheme === 'dark' ? 'black' : 'white'} />}
                        <Text className={`font-bold ml-2 tracking-widest uppercase text-xs ${player.playing ? 'text-white' : 'text-white dark:text-black'}`}>
                            {player.playing ? 'Playing...' : 'Audio Intro'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* 3. Skills Section (O bloco com tags no fundo) */}
            <View className="w-full bg-neutral-50 dark:bg-neutral-950 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800">
                <Text className="text-[10px] uppercase font-black text-neutral-400 dark:text-neutral-500 text-center mb-2 tracking-tighter">
                    Skills
                </Text>
                <View className="flex-row flex-wrap justify-center gap-2">
                    {profile.skills ? (
                        <>
                            {profile.skills.split(',').slice(0, 3).map((skill, index) => (
                                <View key={index} className="bg-white dark:bg-neutral-800 px-3 py-1 rounded-full border border-neutral-200 dark:border-neutral-700 shadow-sm">
                                    <Text className="text-neutral-600 dark:text-neutral-300 text-[10px] font-bold">{skill.trim()}</Text>
                                </View>
                            ))}
                        </>
                    ) : (
                        <Text className="text-gray-300 text-[10px] italic">No skills</Text>
                    )}
                </View>
            </View>

            {/* 4. Chat Button */}
            {profile.is_friend && (
                <TouchableOpacity
                    onPress={handleOpenChat}
                    className="w-full flex-row items-center justify-center bg-[#007AFF] py-3 px-4 rounded-2xl mt-4"
                >
                    <Ionicons name="chatbubbles" size={18} color="white" />
                    <Text className="text-white font-bold ml-2 text-xs uppercase tracking-widest">Message</Text>
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
}