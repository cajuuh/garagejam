import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import MapPin from '../../components/MapPin';
import { useSession } from '../../hooks/useSession';
import { supabase } from '../../lib/supabase';

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
                Alert.alert('Permission to access location was denied');
                setLoading(false);
                return;
            }

            // 2. Get Current Location
            let currentLocation = await Location.getCurrentPositionAsync({});
            console.log('Current Location:', currentLocation);
            setLocation(currentLocation);

            // 3. Update User's Location in DB
            if (session?.user) {
                // Fuzz location for privacy (approx +/- 500m) to avoid legal issues with precise tracking
                const fuzzedLatitude = currentLocation.coords.latitude + (Math.random() - 0.5) * 0.01;
                const fuzzedLongitude = currentLocation.coords.longitude + (Math.random() - 0.5) * 0.01;

                const { error } = await supabase.from('profiles').update({
                    latitude: fuzzedLatitude,
                    longitude: fuzzedLongitude,
                }).eq('id', session.user.id);

                if (error) console.error('Error updating location:', error);
                else console.log('Location updated in DB');
            }

            // 4. Fetch Nearby Profiles
            fetchProfiles();
        })();
    }, []);

    const fetchProfiles = async () => {
        try {
            // In a real app, you might use PostGIS for "nearby" queries.
            // For now, we fetch all users with coordinates.
            const { data, error } = await supabase
                .from('profiles')
                .select('id, username, full_name, avatar_url, skills, latitude, longitude')
                .not('latitude', 'is', null)
                .not('longitude', 'is', null);

            if (error) throw error;
            console.log('Fetched profiles:', data?.length);
            setProfiles(data || []);
        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Error fetching jams', error.message);
            }
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
            <MapView
                style={StyleSheet.absoluteFill}
                provider={PROVIDER_DEFAULT}
                showsUserLocation
                showsMyLocationButton
                initialRegion={{
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                userInterfaceStyle={colorScheme === 'dark' ? 'dark' : 'light'}
            >
                {profiles.map((profile) => (
                    <Marker
                        key={profile.id}
                        coordinate={{
                            latitude: profile.latitude,
                            longitude: profile.longitude,
                        }}
                    >
                        <MapPin avatarUrl={profile.avatar_url} isCurrentUser={profile.id === session?.user.id} />

                        <Callout tooltip onPress={() => router.push({ pathname: '/user/[id]' as any, params: { id: profile.id } })}>
                            <View className="bg-white dark:bg-neutral-900 p-3 rounded-xl border border-gray-200 dark:border-neutral-700 w-48 items-center mb-2">
                                <Text className="font-bold text-gray-900 dark:text-white text-base mb-1">
                                    {profile.full_name || profile.username}
                                </Text>
                                <Text className="text-gray-500 dark:text-gray-400 text-xs mb-2">
                                    {profile.skills || 'Musician'}
                                </Text>
                                <View className="bg-black dark:bg-white px-3 py-1 rounded-full">
                                    <Text className="text-white dark:text-black text-xs font-bold">View Profile</Text>
                                </View>
                            </View>
                        </Callout>
                    </Marker>
                ))}
            </MapView>
        </View>
    );
}