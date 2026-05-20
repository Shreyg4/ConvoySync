import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import GooglePlacesTextInput, { type GooglePlacesTextInputRef } from 'react-native-google-places-textinput';
import { useLocalSearchParams, useRouter } from 'expo-router';
import BackHeader from '@/components/BackHeader';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { setSelectedMapPlace } from '@/app/maps/mapSearchSelectionStore';
import { Ionicons } from '@expo/vector-icons';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const getPlaceLabel = (place: any) => {
    const displayNameText =
        typeof place?.details?.displayName === 'object'
            ? place?.details?.displayName?.text
            : place?.details?.displayName;

    const mainText = place?.structuredFormat?.mainText?.text;
    const secondaryText = place?.structuredFormat?.secondaryText?.text;
    const combinedStructuredText =
        typeof mainText === 'string' && mainText.trim().length > 0
            ? `${mainText}${secondaryText ? `, ${secondaryText}` : ''}`
            : undefined;

    const candidates = [
        combinedStructuredText,
        mainText,
        secondaryText,
        place?.name,
        place?.displayName,
        displayNameText,
        place?.formattedAddress,
        place?.address,
        place?.description,
        place?.details?.name,
        displayNameText,
        place?.details?.formattedAddress,
        place?.details?.address,
        place?.details?.description,
    ];

    const label = candidates.find((value) => typeof value === 'string' && value.trim().length > 0);
    return label?.trim();
};

const MapSearchScreen = () => {
    const router = useRouter();
    const params = useLocalSearchParams<{ placeholder?: string; currentText?: string | string[] }>();
    const searchRef = useRef<GooglePlacesTextInputRef>(null);
    const initialText = Array.isArray(params.currentText) ? params.currentText[0] || '' : params.currentText || '';

    useEffect(() => {
        const focusTimeout = setTimeout(() => {
            searchRef.current?.focus();
        }, 120);

        return () => clearTimeout(focusTimeout);
    }, []);

    return (
        <View style={{ flex: 1, backgroundColor: THEME.COLOR.black }}>
            <SafeAreaView style={[mapStyles.searchContainer, { bottom: 0, backgroundColor: THEME.COLOR.black }]} pointerEvents='box-none'>
                <View style={mapStyles.backButtonContainer}>
                    <BackHeader
                        title=""
                        icon='chevron-back'
                        color={THEME.COLOR.mint}
                        onPress={() => router.back()}
                    />
                </View>

                <GooglePlacesTextInput
                    ref={searchRef}
                    apiKey={GOOGLE_API_KEY}
                    value={initialText}
                    placeHolderText={params.placeholder || 'Search for a destination...'}
                    fetchDetails={true}
                    showClearButton={true}
                    autoFocus
                    detailsFields={['location']}
                    clearElement={
                        <Ionicons name="close-circle" size={20} color={THEME.COLOR.neutral500} />
                    }
                    onPlaceSelect={(place: any) => {
                        if (place.details && place.details.location) {
                            setSelectedMapPlace({
                                latitude: place.details.location.latitude,
                                longitude: place.details.location.longitude,
                                description: getPlaceLabel(place),
                            });
                            router.back();
                        }
                    }}
                    onError={(error: any) => console.error('Google Places Error:', error)}
                    style={{
                        container: mapStyles.searchContainer2Focused,
                        inputContainer: mapStyles.textInputContainer,
                        input: [mapStyles.textInput, mapStyles.searchScreenTextInset],
                        suggestionsContainer: mapStyles.listViewFocused,
                        placeholder: { color: THEME.COLOR.neutral400 },
                        suggestionText: {
                            main: { color: THEME.COLOR.white },
                            secondary: { color: THEME.COLOR.neutral400 },
                        },
                    }}
                />
            </SafeAreaView>
        </View>
    );
};

export default MapSearchScreen;
