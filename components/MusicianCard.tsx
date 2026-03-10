import { useAudioPlayer } from 'expo-audio';
import { MapPin, Play, Square } from 'lucide-react-native';
import { Image, Text, TouchableOpacity, View } from 'react-native';

export interface MusicianProfile {
    id: string;
    full_name?: string;
    username?: string;
    skills?: string;
    avatar_url?: string;
    intro_audio_url?: string;
    address?: string;
    looking_for?: string;
}

export default function MusicianCard({ profile }: { profile: MusicianProfile }) {
    const player = useAudioPlayer(profile.intro_audio_url || '');

    const playSound = () => {
        if (!profile.intro_audio_url) return;
        if (player.playing) {
            player.pause();
        } else {
            player.play();
        }
    };

    return (
        <View className="flex-1 bg-white p-3 rounded-2xl m-1 shadow-sm border border-gray-100 items-center justify-between aspect-[0.8]" style={{ maxWidth: '25%' }}>
            <View className="items-center w-full">
                <Image
                    source={
                        profile.avatar_url
                            ? { uri: profile.avatar_url }
                            : require('../assets/images/default-avatar.png')
                    }
                    className="w-16 h-16 rounded-full bg-gray-200 border-2 border-gray-50 mb-2"
                    style={{ width: 64, height: 64 }}
                    resizeMode="cover"
                />

                {/* Play Button Overlay */}
                {profile.intro_audio_url && (
                    <TouchableOpacity
                        onPress={playSound}
                        className="absolute top-10 right-0 bg-black rounded-full p-1.5 border-2 border-white shadow-sm"
                    >
                        {player.playing ? <Square size={10} color="white" fill="white" /> : <Play size={10} color="white" fill="white" />}
                    </TouchableOpacity>
                )}

                <Text className="text-sm font-bold text-gray-900 text-center leading-tight" numberOfLines={1}>
                    {profile.full_name || profile.username || 'Musician'}
                </Text>
                <Text className="text-gray-400 text-[10px] text-center mb-1">@{profile.username || 'unknown'}</Text>

                {profile.address ? (
                    <View className="flex-row items-center mb-1">
                        <MapPin size={10} color="#9ca3af" />
                        <Text className="text-gray-400 text-[10px] ml-1" numberOfLines={1}>{profile.address}</Text>
                    </View>
                ) : <View className="h-3 mb-1" />}
            </View>

            {/* Skills */}
            <View className="flex-row flex-wrap justify-center gap-1 w-full">
                {profile.skills ? (
                    <>
                        {profile.skills.split(',').slice(0, 2).map((skill, index) => (
                            <View key={index} className="bg-gray-50 px-1.5 py-0.5 rounded-md border border-gray-100">
                                <Text className="text-gray-600 text-[9px] font-medium" numberOfLines={1}>{skill.trim()}</Text>
                            </View>
                        ))}
                        {profile.skills.split(',').length > 2 && (
                            <View className="bg-gray-100 px-1.5 py-0.5 rounded-md">
                                <Text className="text-gray-500 text-[9px] font-medium">+{profile.skills.split(',').length - 2}</Text>
                            </View>
                        )}
                    </>
                ) : (
                    <Text className="text-gray-300 text-[10px] italic">No skills</Text>
                )}
            </View>
        </View>
    );
}