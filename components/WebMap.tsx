import type { Session } from '@supabase/supabase-js';
import type { LocationObject } from 'expo-location';
import { useRouter } from 'expo-router';
import L from 'leaflet';
import { useColorScheme } from 'nativewind';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';

type MapProfile = {
    id: string;
    username: string;
    full_name: string;
    avatar_url: string;
    skills: string;
    latitude: number;
    longitude: number;
};

interface WebMapProps {
    location: LocationObject;
    profiles: MapProfile[];
    session: Session | null;
}

export default function WebMap({ location, profiles, session }: WebMapProps) {
    const { colorScheme } = useColorScheme();
    const router = useRouter();

    const createCustomIcon = (avatarUrl: string) => {
        return L.divIcon({
            className: 'custom-icon',
            html: `<div style="background-color: ${colorScheme === 'dark' ? '#262626' : 'white'}; padding: 2px; border-radius: 50%; border: 2px solid #10b981; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">
                     <img src="${avatarUrl || 'https://via.placeholder.com/40'}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />
                   </div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 40],
            popupAnchor: [0, -40]
        });
    };

    return (
        <div style={{ height: '100%', width: '100%' }}>
            <MapContainer
                center={[location.coords.latitude, location.coords.longitude] as [number, number]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url={colorScheme === 'dark'
                        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"}
                />
                {profiles.map((profile) => (
                    <Marker
                        key={profile.id}
                        position={[profile.latitude, profile.longitude] as [number, number]}
                        icon={createCustomIcon(profile.avatar_url)}
                    >
                        <Popup>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '150px' }}>
                                <strong style={{ fontSize: '16px', marginBottom: '4px', color: '#333' }}>{profile.full_name || profile.username}</strong>
                                <span style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>{profile.skills || 'Musician'}</span>
                                <button
                                    style={{
                                        backgroundColor: 'black',
                                        color: 'white',
                                        border: 'none',
                                        padding: '6px 12px',
                                        borderRadius: '20px',
                                        cursor: 'pointer',
                                        fontWeight: 'bold',
                                        fontSize: '12px'
                                    }}
                                    onClick={() => router.push(`/user/${profile.id}`)}
                                >
                                    View Profile
                                </button>
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
}