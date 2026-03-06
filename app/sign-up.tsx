import * as ImagePicker from 'expo-image-picker';
import { Stack, useRouter } from 'expo-router';
import { ArrowLeft, Camera, Lock, Mail, User } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function SignUpScreen() {
    const { colorScheme } = useColorScheme();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [image, setImage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        username: '',
        full_name: '',
    });

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.2,
        });

        if (!result.canceled) {
            setImage(result.assets[0].uri);
        }
    };

    const uploadAvatar = async (userId: string, uri: string) => {
        const response = await fetch(uri);
        const arrayBuffer = await response.arrayBuffer();
        const fileExt = uri.split('.').pop()?.toLowerCase() ?? 'jpg';
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, arrayBuffer, {
                contentType: `image/${fileExt}`,
                upsert: true,
            });

        if (uploadError) throw new Error(uploadError.message);

        const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
        return data.publicUrl;
    };

    const handleSignUp = async () => {
        if (!formData.email || !formData.password || !formData.username) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return;
        }

        try {
            setLoading(true);

            let avatarUrl: string | null = null;

            // 1. Sign up the user
            const { data: { session, user }, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (signUpError) throw signUpError;
            if (!user) throw new Error('User creation failed');
            if (image) {
                try {
                    avatarUrl = await uploadAvatar(user.id, image);
                } catch (uploadError) {
                    // If the upload fails, we log it and alert the user, but we still create the profile
                    // so the user isn't stuck in a "created auth but no profile" state.
                    console.error("Avatar upload failed:", uploadError);
                    if (uploadError instanceof Error) {
                        Alert.alert("Avatar Upload Failed", uploadError.message + "\n\nYour account will be created without a profile picture.");
                    }
                }
            }

            // 3. Create Profile
            const { error: profileError } = await supabase.from('profiles').upsert({
                id: user.id,
                username: formData.username,
                full_name: formData.full_name,
                avatar_url: avatarUrl, // If null, UI should fall back to default-avatar.png
                updated_at: new Date(),
            });

            if (profileError) throw profileError;

            Alert.alert('Success', 'Account created successfully! Please check your email to verify your account.');
            router.replace('/');

        } catch (error) {
            if (error instanceof Error) {
                Alert.alert('Sign Up Error', error.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <View className="flex-1 bg-white dark:bg-black">
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View className="px-4 pt-12 pb-4 flex-row items-center sticky top-0 z-10 bg-white dark:bg-black">
                <TouchableOpacity
                    onPress={() => router.back()}
                    className="w-10 h-10 items-center justify-center rounded-full bg-gray-50 dark:bg-neutral-900 active:bg-gray-100 dark:active:bg-neutral-800"
                >
                    <ArrowLeft size={24} color={colorScheme === 'dark' ? 'white' : 'black'} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-gray-900 dark:text-white ml-4">Create Account</Text>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                className="flex-1"
            >
                <ScrollView className="flex-1 px-6" showsVerticalScrollIndicator={false}>

                    {/* Avatar Picker */}
                    <View className="items-center mt-6 mb-8">
                        <TouchableOpacity onPress={pickImage} className="relative">
                            <View className="w-28 h-28 rounded-full bg-gray-100 dark:bg-neutral-900 items-center justify-center border-2 border-gray-200 dark:border-neutral-800 overflow-hidden">
                                {image ? (
                                    <Image source={{ uri: image }} className="w-full h-full" />
                                ) : (
                                    // Assuming default-avatar.png exists in assets/images/
                                    // If not, this will throw an error. You can replace with a Lucide icon if needed.
                                    <Image
                                        source={require('../assets/images/default-avatar.png')}
                                        className="w-full h-full opacity-50"
                                        resizeMode="cover"
                                    />
                                )}
                            </View>
                            <View className="absolute bottom-0 right-0 bg-black p-2 rounded-full border-2 border-white">
                                <Camera size={16} color="white" />
                            </View>
                        </TouchableOpacity>
                        <Text className="text-gray-500 dark:text-gray-400 text-sm mt-3">Upload Profile Photo</Text>
                    </View>

                    {/* Form Fields */}
                    <View className="space-y-4 mb-10">

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2 ml-1">Username</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 h-14">
                                <User size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                                    placeholder="johndoe"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.username}
                                    onChangeText={(t) => setFormData({ ...formData, username: t })}
                                    autoCapitalize="none"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2 ml-1">Full Name</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 h-14">
                                <User size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                                    placeholder="John Doe"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.full_name}
                                    onChangeText={(t) => setFormData({ ...formData, full_name: t })}
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2 ml-1">Email</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 h-14">
                                <Mail size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                                    placeholder="hello@example.com"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.email}
                                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                />
                            </View>
                        </View>

                        <View>
                            <Text className="text-gray-700 dark:text-gray-300 font-semibold mb-2 ml-1">Password</Text>
                            <View className="flex-row items-center bg-gray-50 dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 rounded-2xl px-4 h-14">
                                <Lock size={20} color="#6b7280" />
                                <TextInput
                                    className="flex-1 ml-3 text-gray-900 dark:text-white text-base"
                                    placeholder="••••••••"
                                    placeholderTextColor="#9ca3af"
                                    value={formData.password}
                                    onChangeText={(t) => setFormData({ ...formData, password: t })}
                                    secureTextEntry
                                />
                            </View>
                        </View>

                    </View>

                    {/* Submit Button */}
                    <TouchableOpacity
                        className="bg-black dark:bg-white h-16 rounded-2xl flex-row items-center justify-center shadow-lg shadow-gray-400 active:scale-95 mb-10"
                        onPress={handleSignUp}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={colorScheme === 'dark' ? 'black' : 'white'} />
                        ) : (
                            <Text className="text-white dark:text-black font-bold text-lg">Create Account</Text>
                        )}
                    </TouchableOpacity>

                </ScrollView>
            </KeyboardAvoidingView>
        </View>
    );
}
