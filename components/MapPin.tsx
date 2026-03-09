import { Image, View } from 'react-native';

export default function MapPin({ avatarUrl, isCurrentUser }: { avatarUrl?: string; isCurrentUser?: boolean }) {
    return (
        <View className="items-center">
            <View className={`bg-white dark:bg-neutral-800 p-1 rounded-full border-2 ${isCurrentUser ? 'border-blue-500' : 'border-emerald-500'} shadow-sm`}>
                <Image
                    source={
                        avatarUrl
                            ? { uri: avatarUrl }
                            : require('../assets/images/default-avatar.png')
                    }
                    className="w-10 h-10 rounded-full bg-gray-200"
                    style={{ width: 40, height: 40 }}
                    resizeMode="cover"
                />
            </View>
            <View className={`${isCurrentUser ? 'bg-blue-500' : 'bg-emerald-500'} w-1 h-3 rounded-full mt-[-2px]`} />
        </View>
    );
}