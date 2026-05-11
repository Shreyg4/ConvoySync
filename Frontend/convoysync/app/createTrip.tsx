import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import BackHeader from '../components/BackHeader';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Text } from 'react-native';

const createTrip = () => {
    const { control, handleSubmit } = useForm({
        defaultValues: {
            tripName: '',
            tripDate: '',
            tripTime: '',
        },
    });
    return (
        <SafeAreaView style={globalStyles.container}>
            <BackHeader title="Create Trip" />
            <Controller
                control={control}
                name="tripName"
                render={({ field: {onChange, value}}) => (
                    <TextInput
                        style={globalStyles.input}
                        placeholder="Trip Name"
                        placeholderTextColor={globalStyles.input.color}
                        onChangeText={onChange}
                        value={value}
                    />
                )}
            />
        </SafeAreaView>
    )
}

export default createTrip;