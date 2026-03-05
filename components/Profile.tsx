import { Session } from '@supabase/supabase-js';
import { Stack, useRouter } from 'expo-router';
import { Briefcase, Edit3, LogOut, MapPin, MicVocal, Music } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ImageBackground, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

type MusicianProfile = {
  username: string;
  full_name: string;
  avatar_url: string;
  skills: string;
  looking_for: string;
  website: string;
};

export default function Profile({ session }: { session: Session }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<MusicianProfile | null>(null);

  useEffect(() => {
    if (session) getProfile();
  }, [session]);

  async function getProfile() {
    try {
      setLoading(true);
      if (!session?.user) throw new Error('No user on the session!');

      const { data, error, status } = await supabase
        .from('profiles')
        .select(`username, full_name, avatar_url, skills, looking_for, website`)
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-white">
        <ActivityIndicator size="large" color="#059669" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
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
              source={{ uri: profile?.avatar_url || 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?q=80&w=300&auto=format&fit=crop' }}
              className="w-32 h-32 rounded-full border-4 border-white bg-gray-200"
            />
            <View className="absolute bottom-2 right-2 bg-emerald-500 w-6 h-6 rounded-full border-2 border-white" />
          </View>
        </View>
      </View>

      {/* Profile Info */}
      <View className="mt-20 px-6 items-center">
        <Text className="text-2xl font-bold text-gray-900 text-center">
          {profile?.full_name || profile?.username || 'Musician'}
        </Text>
        <Text className="text-gray-500 text-sm mt-1 text-center">@{profile?.username || 'username'}</Text>

        {profile?.website && (
          <Text className="text-emerald-600 text-sm mt-2 font-medium">{profile.website}</Text>
        )}

        <View className="flex-row items-center mt-4 space-x-4">
          <View className="flex-row items-center bg-gray-100 px-3 py-1.5 rounded-full">
            <MapPin size={14} color="#6b7280" />
            <Text className="text-gray-600 text-xs ml-1.5">San Francisco, CA</Text>
          </View>
          <View className="flex-row items-center bg-emerald-50 px-3 py-1.5 rounded-full">
            <Music size={14} color="#059669" />
            <Text className="text-emerald-700 text-xs ml-1.5 font-medium">Pro Member</Text>
          </View>
        </View>
      </View>

      {/* Content Cards */}
      <View className="px-4 mt-8 pb-10 space-y-4">

        {/* Skills Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3 border-b border-gray-50 pb-3">
            <View className="bg-blue-50 p-2 rounded-lg">
              <Briefcase size={20} color="#2563eb" />
            </View>
            <Text className="text-lg font-bold text-gray-900 ml-3">Skills & Instruments</Text>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {profile?.skills ? (
              profile.skills.split(',').map((skill, index) => (
                <View key={index} className="bg-gray-50 px-3 py-1.5 rounded-md border border-gray-200">
                  <Text className="text-gray-700 font-medium">{skill.trim()}</Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 italic">No skills added yet.</Text>
            )}
          </View>
        </View>

        {/* Looking For Card */}
        <View className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
          <View className="flex-row items-center mb-3 border-b border-gray-50 pb-3">
            <View className="bg-purple-50 p-2 rounded-lg">
              <MicVocal size={20} color="#9333ea" />
            </View>
            <Text className="text-lg font-bold text-gray-900 ml-3">Looking For</Text>
          </View>
          <Text className="text-gray-600 leading-relaxed">
            {profile?.looking_for || 'Not specified. Edit your profile to let others know what you are looking for.'}
          </Text>
        </View>

        {/* Actions */}
        <View className="mt-4 space-y-3">
          <TouchableOpacity
            className="bg-gray-900 flex-row justify-center items-center py-4 rounded-xl shadow-md active:bg-gray-800"
            onPress={() => router.push('/edit-profile')}
          >
            <Edit3 size={20} color="white" />
            <Text className="text-white font-bold text-base ml-2">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-white flex-row justify-center items-center py-4 rounded-xl border border-gray-200 active:bg-gray-50"
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
