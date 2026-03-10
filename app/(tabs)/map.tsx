import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { Locate } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { Suspense, useEffect, useState } from 'react';
import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
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

            let mapLocation: Location.LocationObject | null = null;

            // 2. Try to get stored location from DB first
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('latitude, longitude')
                    .eq('id', session.user.id)
                    .single();

                if (data?.latitude && data?.longitude) {
                    mapLocation = {
                        coords: { latitude: data.latitude, longitude: data.longitude, altitude: null, accuracy: null, altitudeAccuracy: null, heading: null, speed: null },
                        timestamp: Date.now(),
                    };
                }
            }

            // 3. If no stored location, get device location and update DB
            if (!mapLocation) {
                const currentLocation = await Location.getCurrentPositionAsync({});
                mapLocation = currentLocation;

                if (session?.user) {
                    const fuzzedLatitude = currentLocation.coords.latitude + (Math.random() - 0.5) * 0.01;
                    const fuzzedLongitude = currentLocation.coords.longitude + (Math.random() - 0.5) * 0.01;

                    await supabase.from('profiles').update({
                        latitude: fuzzedLatitude,
                        longitude: fuzzedLongitude,
                    }).eq('id', session.user.id);
                }
            }

            setLocation(mapLocation);

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

    const handleRefreshLocation = async () => {
        setLoading(true);
        try {
            const currentLocation = await Location.getCurrentPositionAsync({});
            setLocation(currentLocation);

            if (session?.user) {
                const fuzzedLatitude = currentLocation.coords.latitude + (Math.random() - 0.5) * 0.01;
                const fuzzedLongitude = currentLocation.coords.longitude + (Math.random() - 0.5) * 0.01;

                await supabase.from('profiles').update({
                    latitude: fuzzedLatitude,
                    longitude: fuzzedLongitude,
                }).eq('id', session.user.id);
            }
            fetchProfiles();
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

            <TouchableOpacity
                onPress={handleRefreshLocation}
                className="absolute bottom-6 right-6 bg-white dark:bg-neutral-800 p-4 rounded-full shadow-lg border border-gray-200 dark:border-neutral-700 z-50"
            >
                <Locate size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
            </TouchableOpacity>
        </View>
    );
}
