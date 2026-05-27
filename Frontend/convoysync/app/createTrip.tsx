import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles/globalStyles';
import BackHeader from '../components/BackHeader';
import { useForm, Controller } from 'react-hook-form';
import { TextInput, Text, Keyboard, TouchableWithoutFeedback } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import React, { useState } from 'react';
import HapticPressable from '../components/pressableCustomization';
import { THEME } from '@/theme';
import { useRouter } from 'expo-router';

const CreateTrip = () => {
    const router = useRouter();
    const { control, handleSubmit, setValue } = useForm({
        defaultValues: {
            tripName: '',
            tripDate: '',
            tripTime: '',
        },
    });

    const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
    const [isTimePickerVisible, setTimePickerVisibility] = useState(false);



    const showDatePicker = () => {
        setDatePickerVisibility(true);
    };

    const hideDatePicker = () => {
        setDatePickerVisibility(false);
    };

    const showTimePicker = () => {
        setTimePickerVisibility(true);
    };

    const hideTimePicker = () => {
        setTimePickerVisibility(false);
    };

    const handleDateConfirm = (date: Date) => {
        setValue('tripDate', date.toISOString());
        console.warn("A date has been picked: ", date);
        hideDatePicker();
    };

    const handleTimeConfirm = (time: Date) => {
        setValue('tripTime', time.toISOString());
        console.warn("A time has been picked: ", time);
        hideTimePicker();
    };
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <SafeAreaView style={globalStyles.container}>
                <BackHeader title="Create Trip" icon="arrow-back" color={THEME.COLOR.mint} />
                <Text style={globalStyles.inputTitle}>Trip Name</Text>
                <Controller
                    control={control}
                    name="tripName"
                    rules={{ required: 'Trip name is required' }}
                    render={({ field: { onChange, value }, fieldState: { error } }) => (
                        <TextInput
                            style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }]}
                            placeholder="Enter trip name"
                            placeholderTextColor={globalStyles.input.color}
                            onChangeText={onChange}
                            value={value}
                        />
                    )}
                />
                <Text style={globalStyles.inputTitle}>Trip Date</Text>
                <Controller
                    control={control}
                    name="tripDate"
                    rules={{ required: 'Trip date is required' }}
                    render={({ field: { value }, fieldState: { error } }) =>
                        <>
                            <HapticPressable onPress={showDatePicker}>
                                <Text style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }, !value && { color: globalStyles.input.color }]}>{value ? new Date(value).toLocaleDateString() : 'Choose date'}</Text>
                            </HapticPressable>
                            <DateTimePickerModal
                                isVisible={isDatePickerVisible}
                                mode="date"
                                display="inline"
                                date={value ? new Date(value) : new Date()}
                                onConfirm={handleDateConfirm}
                                onCancel={hideDatePicker}
                            />
                        </>
                    }
                />
                <Text style={globalStyles.inputTitle}>Trip Start Time</Text>
                <Controller
                    control={control}
                    name="tripTime"
                    rules={{ required: 'Trip time is required' }}
                    render={({ field: { value }, fieldState: { error } }) => (
                        <>
                            <HapticPressable onPress={showTimePicker}>
                                <Text style={[globalStyles.input, error && { borderColor: 'red', borderWidth: 1 }, !value && { color: globalStyles.input.color }]}>{value ? new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Choose time'}</Text>
                            </HapticPressable>
                            <DateTimePickerModal
                                isVisible={isTimePickerVisible}
                                mode="time"
                                display="spinner"
                                date={value ? new Date(value) : new Date()}
                                onConfirm={handleTimeConfirm}
                                onCancel={hideTimePicker}
                            />
                        </>
                    )}
                />
                <HapticPressable onPress={handleSubmit((data) => console.log(data))} style={globalStyles.SubmitButton} hapticStyle="medium" showVisualFeedback>
                    <Text style={globalStyles.SubmitButtonText}>Create Trip</Text>
                </HapticPressable>
                <HapticPressable
                    onPress={() => router.push('/tripInfoMember')}
                    style={globalStyles.logOutButton}
                    hapticStyle="light"
                    showVisualFeedback
                >
                    <Text style={[globalStyles.logOutButtonText, { color: THEME.COLOR.mint }]}>Open Trip Info Test Screen</Text>
                </HapticPressable>
            </SafeAreaView>
        </TouchableWithoutFeedback>
    )
}

export default CreateTrip;
