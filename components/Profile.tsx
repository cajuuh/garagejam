import { Session } from '@supabase/supabase-js';
import { Stack, useRouter } from 'expo-router';
import { Briefcase, Check, Edit3, LogOut, MapPin, MicVocal, Moon, Music, Sun, UserPlus, Users, X } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type MusicianProfile = {
  username: string;
  full_name: string;
  avatar_url: string;
  skills: string;
  looking_for: string;
  address: string;
  website: string;
};

type ConnectionRequest = {
  id: string;
  requester: {
    id: string;
    full_name: string;
    username: string;
    avatar_url: string;
  };
};

type FriendProfile = {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
};

export default function Profile({ session }: { session: Session }) {
  const { colorScheme, toggleColorScheme, setColorScheme } = useColorScheme();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MusicianProfile | null>(null);
  const [requests, setRequests] = useState<ConnectionRequest[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);

  useEffect(() => {
    if (session) {
      getProfile();
      fetchRequests();
      fetchFriends();
    }
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url, skills, looking_for, address, website`)
        .eq('id', session?.user.id)
        .single();
      if (error && status !== 406) {
        throw error;
      }

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      if (error instanceof Error) {
        Alert.alert(error.message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchRequests() {
    if (!session?.user) return;
    const { data, error } = await supabase
      .from('connections')
      .select('id, requester:profiles!requester_id(id, full_name, username, avatar_url)')
      .eq('receiver_id', session.user.id)
      .eq('status', 'pending');

    if (!error && data) {
      // @ts-ignore - Supabase types for joined tables can be tricky, casting for simplicity
      setRequests(data);
    }
  }

  async function handleRequest(id: string, status: 'accepted' | 'rejected') {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status })
        .eq('id', id);

      if (error) throw error;

      // Remove from list
      setRequests(prev => prev.filter(req => req.id !== id));

      if (status === 'accepted') Alert.alert('Connected!', 'You are now connected.');
    } catch (error) {
      if (error instanceof Error) Alert.alert('Error', error.message);
    }
  }

  async function fetchFriends() {
    if (!session?.user) return;
    const { data, error } = await supabase.rpc('get_friends');

    if (error) {
      // This might fail if the RPC function hasn't been created yet.
      console.error("Could not fetch friends, maybe RPC 'get_friends' is missing?", error);
    } else if (data) {
      setFriends(data);
    }
  }

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-black" showsVerticalScrollIndicator={false}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header / Cover */}
      <View className="relative">
        <ImageBackground
          source={{ uri: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=1000&auto=format&fit=crop' }}
          className="h-48 w-full"
          resizeMode="cover"
        >
          <View className="absolute inset-0 bg-black/30" />
        </ImageBackground>

        <View className="absolute -bottom-16 left-0 right-0 items-center">
          <View className="relative">
            <Image
              source={
                profile?.avatar_url
                  ? { uri: profile.avatar_url }
                  : require('../assets/images/default-avatar.png')
              }
              className="w-32 h-32 rounded-full border-4 border-white dark:border-black bg-gray-200 dark:bg-neutral-800"
              style={{ width: 128, height: 128 }}
              resizeMode="cover"
            />
            <View className="absolute bottom-2 right-2 bg-emerald-500 w-6 h-6 rounded-full border-2 border-white" />
          </View>
        </View>
      </View>

      {/* Profile Info */}
      <View className="mt-20 px-6 items-center pb-6">
        <Text className="text-2xl font-bold text-gray-900 dark:text-white text-center">
          {profile?.full_name || profile?.username || 'Musician'}
        </Text>
        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-1 text-center">@{profile?.username || 'username'}</Text>

        {!!profile?.website && (
          <Text className="text-emerald-600 text-sm mt-2 font-medium">{profile.website}</Text>
        )}

        <View className="flex-row items-center mt-4 space-x-4">
          <View className="flex-row items-center bg-gray-100 dark:bg-neutral-800 px-3 py-1.5 rounded-full">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-gray-600 dark:text-neutral-300 text-xs ml-1.5">{profile?.address || 'Location not set'}</Text>
          </View>
          <View className="flex-row items-center bg-emerald-50 dark:bg-emerald-950 px-3 py-1.5 rounded-full">
            <Music size={14} color="#059669" />
            <Text className="text-emerald-700 dark:text-emerald-400 text-xs ml-1.5 font-medium">Pro Member</Text>
          </View>
        </View>
      </View>

      {/* Content Cards */}
      <View className="px-4 pb-10 space-y-4">

        {/* Connection Requests */}
        {requests.length > 0 && (
          <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
            <View className="flex-row items-center mb-3 border-b border-gray-50 dark:border-neutral-800 pb-3">
              <View className="bg-orange-50 dark:bg-orange-950 p-2 rounded-lg">
                <UserPlus size={20} color="#f97316" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Connection Requests</Text>
            </View>

            {requests.map((req) => (
              <View key={req.id} className="flex-row items-center justify-between mb-3 last:mb-0">
                <TouchableOpacity
                  className="flex-row items-center flex-1"
                  onPress={() => router.push(`/user/${req.requester.id}`)}
                >
                  <Image
                    source={req.requester.avatar_url ? { uri: req.requester.avatar_url } : require('../assets/images/default-avatar.png')}
                    className="w-10 h-10 rounded-full bg-gray-200"
                  />
                  <View className="ml-3">
                    <Text className="font-bold text-gray-900 dark:text-white">{req.requester.full_name || req.requester.username}</Text>
                    <Text className="text-xs text-gray-500">@{req.requester.username}</Text>
                  </View>
                </TouchableOpacity>
                <View className="flex-row gap-2">
                  <TouchableOpacity onPress={() => handleRequest(req.id, 'accepted')} className="bg-black dark:bg-white p-2 rounded-full">
                    <Check size={16} color={colorScheme === 'dark' ? 'black' : 'white'} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleRequest(req.id, 'rejected')} className="bg-gray-100 dark:bg-neutral-800 p-2 rounded-full">
                    <X size={16} color={colorScheme === 'dark' ? 'white' : 'black'} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Friends List */}
        {friends.length > 0 && (
          <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
            <View className="flex-row items-center mb-3 border-b border-gray-50 dark:border-neutral-800 pb-3">
              <View className="bg-green-50 dark:bg-green-950 p-2 rounded-lg">
                <Users size={20} color="#22c55e" />
              </View>
              <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Jam Bros ({friends.length})</Text>
            </View>

            <View className="flex-row flex-wrap -mx-2">
              {friends.map((friend) => (
                <TouchableOpacity
                  key={friend.id}
                  className="items-center w-1/4 p-2"
                  onPress={() => router.push(`/user/${friend.id}`)}
                >
                  <Image
                    source={friend.avatar_url ? { uri: friend.avatar_url } : require('../assets/images/default-avatar.png')}
                    className="w-16 h-16 rounded-full bg-gray-200"
                  />
                  <Text className="text-xs font-bold text-gray-900 dark:text-white mt-1 text-center" numberOfLines={1}>
                    {friend.full_name || friend.username}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Skills Card */}
        <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <View className="flex-row items-center mb-3 border-b border-gray-50 pb-3">
            <View className="bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <Briefcase size={20} color="#2563eb" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Skills & Instruments</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {profile?.skills ? (
              profile.skills.split(',').map((skill, index) => (
                <View key={index} className="bg-gray-50 dark:bg-neutral-800 px-3 py-1.5 rounded-md border border-gray-200 dark:border-neutral-700">
                  <Text className="text-gray-700 dark:text-neutral-300 font-medium">{skill.trim()}</Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 dark:text-neutral-500 italic">No skills added yet.</Text>
            )}
          </View>
        </View>

        {/* Looking For Card */}
        <View className="bg-white dark:bg-neutral-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-neutral-800">
          <View className="flex-row items-center mb-3 border-b border-gray-50 pb-3">
            <View className="bg-purple-50 dark:bg-purple-950 p-2 rounded-lg">
              <MicVocal size={20} color="#9333ea" />
            </View>
            <Text className="text-lg font-bold text-gray-900 dark:text-white ml-3">Looking For</Text>
          </View>
          <Text className="text-gray-600 dark:text-neutral-300 leading-relaxed">
            {profile?.looking_for || 'Not specified. Edit your profile to let others know what you are looking for.'}
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-4 space-y-3">
          <TouchableOpacity
            className="bg-white dark:bg-neutral-900 flex-row justify-center items-center py-4 rounded-xl border border-gray-200 dark:border-neutral-800 active:bg-gray-50 dark:active:bg-neutral-800"
            onPress={() => {
              try {
                toggleColorScheme();
              } catch (e) {
                Alert.alert("Configuration Error", "Please set darkMode: 'class' in tailwind.config.js to enable manual theme toggling.");
              }
            }}
            onLongPress={() => {
              try {
                setColorScheme('system');
              } catch (e) { }
            }}
          >
            {colorScheme === 'dark' ? <Moon size={20} color="white" /> : <Sun size={20} color="black" />}
            <Text className="text-gray-900 dark:text-white font-bold text-base ml-2">Theme: {colorScheme === 'dark' ? 'Dark' : 'Light'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-gray-900 dark:bg-gray-200 flex-row justify-center items-center py-4 rounded-xl shadow-md active:bg-gray-800 dark:active:bg-gray-300"
            onPress={() => router.push('/edit-profile')}
          >
            <Edit3 size={20} color={colorScheme === 'dark' ? 'black' : 'white'} />
            <Text className="text-white dark:text-black font-bold text-base ml-2">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white dark:bg-neutral-900 flex-row justify-center items-center py-4 rounded-xl border border-gray-200 dark:border-neutral-800 active:bg-gray-50 dark:active:bg-neutral-800"
            onPress={() => supabase.auth.signOut()}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-bold text-base ml-2">Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
