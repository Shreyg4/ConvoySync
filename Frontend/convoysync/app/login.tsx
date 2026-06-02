import { useState } from 'react';
import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView, View, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';
import { signInWithProvider, OAuthProvider } from '../lib/oauth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Login = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const router = useRouter();
    const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

    const onSubmit = async (data: any) => {
        // proceed to home only when form is valid
        try {
            // when testing locally, MAKE SURE TO USE TO MATCH YOUR IP, localhost will not work.
            const response = await fetch('http://192.168.1.136:8080/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const text = await response.json();

            if (!response.ok) {
                // handle
                console.log('status:', response.status);
                console.log('body:', text);
                return;
            }

            // Avoid doing this in actual production code.
            await AsyncStorage.setItem("userId", String(text.id));

            router.push('/home');

        } catch (error) {
            console.error('Network error:', error);
        }
    };

    const handleOAuth = async (provider: OAuthProvider) => {
        if (oauthLoading) return;
        setOauthLoading(provider);
        try {
            const result = await signInWithProvider(provider);
            if (result.ok) {
                router.push('/home');
            } else if (result.reason === 'error') {
                Alert.alert('Sign-in failed', result.message || 'Please try again');
            }
        } finally {
            setOauthLoading(null);
        }
    };

    return (
        <SafeAreaView style={[globalStyles.container, { justifyContent: 'center' }]}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Login</Text>
                    <Controller
                        control={control}
                        name="email"
                        rules={{ required: 'Username is required' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <TextInput
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Enter username"
                                placeholderTextColor={globalStyles.input.color}
                                onChangeText={onChange}
                                value={value}
                            />
                        )} />
                    <Controller
                        control={control}
                        name="password"
                        rules={{ required: 'Password is required' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <TextInput
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Enter password"
                                placeholderTextColor={globalStyles.input.color}
                                onChangeText={onChange}
                                value={value}
                                secureTextEntry
                            />
                        )} />
                    <HapticPressable onPress={handleSubmit(onSubmit)} style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Login</Text>
                    </HapticPressable>

                    <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 24 }}>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
                        <Text style={{ marginHorizontal: 12, color: '#888' }}>or</Text>
                        <View style={{ flex: 1, height: 1, backgroundColor: '#ccc' }} />
                    </View>

                    <HapticPressable
                        onPress={() => handleOAuth('google')}
                        style={[globalStyles.SubmitButton, { backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd', marginBottom: 12 }]}
                        hapticStyle="light"
                        showVisualFeedback
                        disabled={oauthLoading !== null}
                    >
                        {oauthLoading === 'google'
                            ? <ActivityIndicator color="#444" />
                            : <Text style={[globalStyles.SubmitButtonText, { color: '#444' }]}>Continue with Google</Text>}
                    </HapticPressable>

                    <HapticPressable
                        onPress=