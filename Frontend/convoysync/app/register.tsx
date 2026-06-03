import { useState } from 'react';
import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView, View, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiUrl } from '../lib/api';
import { signInWithProvider, OAuthProvider } from '../lib/oauth';

const Register = () => {
    const { control, handleSubmit, setError } = useForm({
        defaultValues: {
            email: '',
            username: '',
            password: '',
            confirmPassword: '',
        },
    });
    const router = useRouter();
    const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);

    const onSubmit = async (data: any) => {
        if (data.password !== data.confirmPassword) {
            setError('confirmPassword', { type: 'validate', message: 'Passwords do not match' });
            return;
        }

        try {
            const response = await fetch(apiUrl('/users'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: data.email,
                    name: data.username,
                    password: data.password,
                }),
            })

            const text = await response.json();

            if (!response.ok) {
                // handle
                console.log('status:', response.status);
                console.log('body:', text);
                return;
            }

            if (text.token) {
                await AsyncStorage.setItem("token", text.token);
            }
            await AsyncStorage.setItem("userId", String(text.user?.id ?? text.id));
        } catch (error) {
            console.error('Network error:', error);
            return;
        }

        // all good
        router.push('/home');
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
        <SafeAreaView style={globalStyles.container}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Create Account</Text>
                    <Controller
                        control={control}
                        name="email"
                        rules={{ required: 'Email is required' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <TextInput
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Enter email"
                                placeholderTextColor={globalStyles.input.color}
                                onChangeText={onChange}
                                value={value}
                            />
                        )} />
                    <Controller
                        control={control}
                        name="username"
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
                    <Controller
                        control={control}
                        name="confirmPassword"
                        rules={{ required: 'Please confirm your password' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <TextInput
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Confirm password"
                                placeholderTextColor={globalStyles.input.color}
                                onChangeText={onChange}
                                value={value}
                                secureTextEntry
                            />
                        )} />
                    <HapticPressable onPress={handleSubmit(onSubmit)} style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback>
                        <Text style={globalStyles.SubmitButtonText}>Create Account</Text>
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
                        onPress={() => handleOAuth('github')}
                        style={[globalStyles.SubmitButton, { backgroundColor: '#24292e' }]}
                        hapticStyle="light"
                        showVisualFeedback
                        disabled={oauthLoading !== null}
                    >
                        {oauthLoading === 'github'
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={[globalStyles.SubmitButtonText, { color: '#fff' }]}>Continue with GitHub</Text>}
                    </HapticPressable>

                    <Link href="/login" asChild>
                        <HapticPressable hapticStyle="light" showVisualFeedback>
                            <Text style={[globalStyles.SubmitButtonText, { color: 'white', marginTop: 40, textAlign: 'center' }]}>Already have an account? Login</Text>
                        </HapticPressable>
                    </Link>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Register;
