import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import { Appearance, Platform, View } from 'react-native'; // Added Appearance
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import 'react-native-reanimated';
import 'react-native-url-polyfill/auto';
import '../global.css';

import { Session } from '@supabase/supabase-js';
import FriendsFab from '../components/FriendsFab';
import { supabase } from '../lib/supabase';

// CRITICAL FIX: Force the native appearance to a non-null value 
// before any other hooks run. This prevents the Kotlin NPE.
if (Platform.OS === 'android') {
  Appearance.setColorScheme('unspecified');
}

export {
  ErrorBoundary
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthLoaded, setIsAuthLoaded] = useState(false);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded && isAuthLoaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded, isAuthLoaded]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsAuthLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsAuthLoaded(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isAuthLoaded) return;
    // Allow access to auth and sign-up screens
    const inAuthGroup = segments[0] === 'auth' || segments[0] === 'sign-up';

    if (!session && !inAuthGroup) {
      router.replace('/auth');
    } else if (session && segments[0] === 'auth') {
      router.replace('/');
    }
  }, [session, segments, isAuthLoaded]);

  if (!loaded || !isAuthLoaded) {
    return null;
  }

  return <RootLayoutNav session={session} />;
}

// Extracted navigation logic to ensure clean Fast Refresh boundaries
function RootLayoutNav({ session }: { session: Session | null }) {
  const { colorScheme } = useColorScheme();
  const baseTheme = colorScheme === 'dark' ? MD3DarkTheme : MD3LightTheme;

  // Customize Paper theme to match GarageJam Blue (#007AFF)
  const paperTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: '#007AFF',
      onPrimary: '#FFFFFF',
      primaryContainer: '#007AFF', // FAB background
      onPrimaryContainer: '#FFFFFF', // FAB icon color
      secondaryContainer: '#007AFF',
      onSecondaryContainer: '#FFFFFF',
      background: colorScheme === 'dark' ? '#121212' : '#FFFFFF',
    },
  };
  const segments = useSegments();

  const showFab = session && segments[segments.length - 1] !== 'chat';

  return (
    <PaperProvider
      theme={paperTheme}
      settings={{
        // Switch all Paper icons to Ionicons
        icon: (props) => <Ionicons {...props} />,
      }}
    >
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
            <Stack.Screen name="sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="edit-profile" options={{ headerShown: false }} />
            <Stack.Screen name="user/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
          </Stack>
          {showFab && <FriendsFab />}
        </View>
      </ThemeProvider>
    </PaperProvider>
  );
}
