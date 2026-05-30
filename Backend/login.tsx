import { Text, TextInput, Image, KeyboardAvoidingView, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import { Link, useRouter } from 'expo-router';
import HapticPressable from '../components/pressableCustomization';
import { Controller, useForm } from 'react-hook-form';

const Login = () => {
    const { control, handleSubmit, formState: { errors }, } = useForm({
        defaultValues: {
            email: '',
            password: '',
        },
    });
    const router = useRouter();

    const onSubmit = async (data: any) => {
        // proceed to home only when form is valid
        try {
            // when testing locally, MAKE SURE TO USE TO MATCH YOUR IP, localhost will not work.
            const response = await fetch('http://192.168.1.129:8080/auth/login', {
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

            router.push('/home');

        } catch (error) {
            console.error('Network error:', error);
        }
    };
    return (
        <SafeAreaView style={[globalStyles.container, { justifyContent: 'center' }]}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <ScrollView keyboardShouldPersistTaps="handled">
                    <Image source={require('../assets/images/convoysyncLogo.png')} style={{ width: 150, height: 150, alignSelf: 'center', marginBottom: 20 }} />
                    <Text style={[globalStyles.title, { textAlign: 'center', marginBottom: 20 }]}>Login</Text>
                    {errors.email && (<Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{errors.email?.message}</Text>)}
                    {errors.password && (<Text style={{ color: 'red', textAlign: 'center', marginBottom: 20 }}>{errors.password?.message}</Text>)}
                    <Controller
                        control={control}
                        name="email"
                        rules={{ required: 'Email is required',
                                pattern: {
                                        value: /\S+@\S+\.\S+/,
                                        message: 'Invalid email format',
                                }
                         }}
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
                        name="password"
                        rules={{ required: 'Password is required',
                                minLength: {
                                    value: 8,
                                    message: 'Password is too short',
                                }
                         }}
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
                    <Link href="/register" asChild>
                        <HapticPressable hapticStyle="light" showVisualFeedback>
                            <Text style={[globalStyles.SubmitButtonText, { color: 'white', marginTop: 40, textAlign: 'center' }]}>Don't have an account? {' '} 
                                <Text style={{ color: 'yellow' }}>Register</Text>
                            </Text>
                        </HapticPressable>
                    </Link>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}

export default Login;

