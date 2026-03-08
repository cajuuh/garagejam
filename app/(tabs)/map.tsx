import { useColorScheme } from 'nativewind';
import { Text, View } from 'react-native';

export default function MapScreen() {
    const { colorScheme } = useColorScheme();

    return (
        <View className="flex-1 justify-center items-center bg-white dark:bg-black p-4">
            <Text className="text-xl font-bold text-gray-900 dark:text-white text-center">
                Near Jams
            </Text>
            <Text className="text-gray-500 dark:text-gray-400 mt-2 text-center">
                The map view is currently optimized for mobile devices. Please open the app on iOS or Android to see nearby musicians.
            </Text>
        </View>
    );
}
