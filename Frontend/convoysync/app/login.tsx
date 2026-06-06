import { useState } from 'react';
import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView, View, ActivityIndicator, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, ApiError } from '../lib/api';
import { signInWithProvider, OAuthProvider } from '../lib/oauth';

const Login = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const router = useRouter();
    const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
    const [submitting, setSubmitting] = useState(false);

    const onSubmit = async (data: any) => {
        if (submitting) return;
        setSubmitting(true);
        try {
            const result = await apiFetch('/auth/login', {
                method: 'POST',
                body: data,
                auth: false,
            });

            // Persist the JWT so authenticated requests (trips, etc.) work.
            if (result.token) {
                await AsyncStorage.setItem("token", result.token);
            }
            await AsyncStorage.setItem("userId", String(result.user?.id ?? result.id));

            router.push('/home');
        } catch (error) {
            const message =
                error instanceof ApiError
                    ? error.message
                    : 'Could not reach the server. Please try again.';
            Alert.alert('Login failed', message);
        } finally {
            setSubmitting(false);
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
                        rules={{ required: 'E-mail is required' }}
                        render={({ field: { onChange, value }, fieldState: { error } }) => (
                            <TextInput
                                style={[globalStyles.input, { marginBottom: 20 }, error && { borderColor: 'red', borderWidth: 1 }]}
                                placeholder="Enter E-mail"
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
                    <HapticPressable onPress={handleSubmit(onSubmit)} style={globalStyles.SubmitButton} hapticStyle="light" showVisualFeedback disabled={submitting}>
                        {submitting
                            ? <ActivityIndicator color="#fff" />
                            : <Text style={globalStyles.SubmitButtonText}>Login</Text>}
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

                    <Link href="/register" asChild>
                        <HapticPressable hapticStyle="light" showVisualFeedback>
                            <Text style={[globalStyles.SubmitButtonText, { color: 'white', marginTop: 40, textAlign: 'center' }]}>{"Don't have an account? Register"}</Text>
                        </HapticPressable>
                    </Link>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Login;
