import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';

// Lazy load the WebMap component to avoid 'window is not defined' errors during SSR/static rendering
// because Leaflet requires the window object immediately upon import.
const WebMap = React.lazy(() => import('../../components/WebMap'));

type MapProfile = {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    skills: string;
    latitude: number;
    longitude: number;
};

export default function MapScreen() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const { session } = useSession();
    const [location, setLocation] = useState<Location.LocationObject | null>(null);
    const [profiles, setProfiles] = useState<MapProfile[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        (async () => {
            // 1. Request Permissions
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                setLoading(false);
                return;
            }

            // 2. Get Current Location
            let currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            // 3. Update User's Location in DB
            if (session?.user) {
                await supabase.from('profiles').update({
                    latitude: currentLocation.coords.latitude,
                    longitude: currentLocation.coords.longitude,
                }).eq('id', session.user.id);
            }

            // 4. Fetch Nearby Profiles
            fetchProfiles();
        })();
    }, []);

    const fetchProfiles = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, skills, latitude, longitude')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;
            setProfiles(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading || !location) {
        return (
            <View className="flex-1 justify-center items-center bg-white dark:bg-black">
                <ActivityIndicator size="large" color={colorScheme === 'dark' ? 'white' : 'black'} />
                <Text className="mt-4 text-gray-500 dark:text-gray-400">Finding nearby jams...</Text>
            </View>
        );
    }

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <Suspense fallback={<ActivityIndicator size="large" color={colorScheme === 'dark' ? 'white' : 'black'} />}>
                <WebMap location={location} profiles={profiles} session={session} />
            </Suspense>
        </View>
    );
}
