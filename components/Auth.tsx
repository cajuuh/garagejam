import { ArrowRight, Lock, Mail, Music2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { ActivityIndicator, Alert, AppState, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

// Tells Supabase Auth to continuously refresh the session automatically if
// the app is in the foreground. When this is added, you will continue to receive
// `onAuthStateChange` events with the `TOKEN_REFRESHED` event planner when
// the user's session is refreshed.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const {
      data: { session },
      error,
    } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) Alert.alert(error.message);
    if (!session) Alert.alert('Please check your inbox for email verification!');
    setLoading(false);
  }

  return (
    <View className="flex-1 bg-white justify-center px-8">
      {/* Header Section */}
      <View className="items-center mb-12">
        <View className="w-20 h-20 bg-black rounded-3xl items-center justify-center mb-6 shadow-xl shadow-gray-300 rotate-3">
          <Music2 size={40} color="white" />
        </View>
        <Text className="text-4xl font-extrabold text-gray-900 tracking-tight">GarageJam</Text>
        <Text className="text-gray-500 mt-3 text-center text-base">
          Connect, jam, and create music with local artists.
        </Text>
      </View>

      {/* Form Section */}
      <View className="space-y-5">
        <View>
          <Text className="text-gray-700 font-semibold mb-2 ml-1">Email</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 focus:border-black focus:bg-white transition-all">
            <Mail size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base font-medium"
              onChangeText={(text) => setEmail(text)}
              value={email}
              placeholder="hello@example.com"
              placeholderTextColor="#9ca3af"
              autoCapitalize={'none'}
            />
          </View>
        </View>

        <View>
          <Text className="text-gray-700 font-semibold mb-2 ml-1">Password</Text>
          <View className="flex-row items-center bg-gray-50 border border-gray-200 rounded-2xl px-4 h-14 focus:border-black focus:bg-white transition-all">
            <Lock size={20} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-gray-900 text-base font-medium"
              onChangeText={(text) => setPassword(text)}
              value={password}
              secureTextEntry={true}
              placeholder="••••••••"
              placeholderTextColor="#9ca3af"
              autoCapitalize={'none'}
            />
          </View>
        </View>
      </View>

      {/* Actions */}
      <View className="mt-10 space-y-4">
        <TouchableOpacity
          className="bg-black h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gray-400 active:scale-95 transition-transform"
          onPress={() => signInWithEmail()}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text className="text-white font-bold text-lg mr-2">Sign In</Text>
              <ArrowRight size={20} color="white" />
            </>
          )}
        </TouchableOpacity>

        <View className="flex-row justify-center items-center mt-2">
          <Text className="text-gray-500 text-base">New here? </Text>
          <TouchableOpacity onPress={() => signUpWithEmail()}>
            <Text className="text-black font-bold text-base underline">Create an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
