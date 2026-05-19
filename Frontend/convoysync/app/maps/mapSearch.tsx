import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Keyboard, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import GooglePlacesTextInput, { type GooglePlacesTextInputRef } from 'react-native-google-places-textinput';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';

const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MapSearch = () => {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const searchRef = useRef<GooglePlacesTextInputRef>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [destination, setDestination] = useState<any>(null);
    const [locationGranted, setLocationGranted] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [searchText, setSearchText] = useState('');

    const cancelSearch = () => {
        searchRef.current?.clear();
        searchRef.current?.blur();
        Keyboard.dismiss();
        setSearchText('');
        setIsSearching(false);
    };

    const clearSearch = () => {
        searchRef.current?.clear();
        setSearchText('');
        setDestination(null);
        if (origin) {
            mapRef.current?.animateToRegion({
                ...origin,
                latitudeDelta: 0.09,
                longitudeDelta: 0.04,
            }, 800);
        }
    };

    //Request permission and show current location
    useEffect(() => {
        (async () => {
            let { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }
            setLocationGranted(true);

            let location = await Location.getCurrentPositionAsync({});

            const currentLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            }
            setOrigin(currentLoc);

            mapRef.current?.animateToRegion({
                ...currentLoc,
                latitudeDelta: 0.09,
                longitudeDelta: 0.04,
            }, 1000);
        })();
    }, []);

    return (
        <View style={{ flex: 1 }}>
            <MapView
                //Background Map
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={StyleSheet.absoluteFillObject}
                showsUserLocation={locationGranted}
                showsMyLocationButton={false}
                followsUserLocation={true}
            >
                {/* Marker for searched destination */}
                {destination && (
                    <Marker
                        coordinate={destination}
                        title="Destination"
                        pinColor="red"
                    />
                )}
            </MapView>

            {/* Return to current location button */}
            {locationGranted && (
                <HapticPressable
                    style={mapStyles.locationButton}
                    hapticStyle="light"
                    onPress={() => {
                        if (origin) {
                            mapRef.current?.animateToRegion({
                                ...origin,
                                latitudeDelta: 0.09,
                                longitudeDelta: 0.04,
                            }, 800);
                        }
                    }}
                >
                    <Ionicons name="locate" size={22} color={THEME.COLOR.mint} />
                </HapticPressable>
            )}

            {/* Search Bar */}
            <SafeAreaView
                style={[
                    mapStyles.searchContainer,
                    isSearching && { bottom: 0, backgroundColor: THEME.COLOR.black }
                ]}
                pointerEvents='box-none'
            >
                {/* Back / Cancel / Clear button */}
                <View style={mapStyles.backButtonContainer}>
                    <BackHeader
                        title=""
                        icon={(isSearching || !!destination) ? 'close' : 'chevron-back'}
                        color={THEME.COLOR.mint}
                        onPress={
                            isSearching ? cancelSearch :
                                destination ? clearSearch :
                                    () => router.back()
                        }
                    />
                </View>

                <GooglePlacesTextInput
                    ref={searchRef}
                    apiKey={GOOGLE_API_KEY}
                    placeHolderText='Search for a destination...'
                    fetchDetails={true}
                    showClearButton={false}
                    onFocus={() => setIsSearching(true)}
                    onTextChange={(text) => setSearchText(text)}
                    onPlaceSelect={(place: any) => {
                        Keyboard.dismiss();
                        setIsSearching(false);
                        if (place.details && place.details.location) {
                            setDestination({
                                latitude: place.details.location.latitude,
                                longitude: place.details.location.longitude,
                            });
                            mapRef.current?.animateToRegion({
                                latitude: place.details.location.latitude,
                                longitude: place.details.location.longitude,
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }, 1000);
                        }
                    }}
                    onError={(error: any) => console.error("Google Places Error:", error)}
                    detailsFields={['location']}
                    style={{
                        container: isSearching ? mapStyles.searchContainer2Focused : mapStyles.searchContainer2,
                        inputContainer: mapStyles.textInputContainer,
                        input: mapStyles.textInput,
                        suggestionsContainer: isSearching ? mapStyles.listViewFocused : mapStyles.listView,
                        placeholder: { color: THEME.COLOR.neutral400 },
                        suggestionText: {
                            main: { color: THEME.COLOR.white },
                            secondary: { color: THEME.COLOR.neutral400 },
                        }
                    }}
                />
            </SafeAreaView>

            {/* Directions Button — always visible */}
            <HapticPressable
                style={mapStyles.directionsButton}
                hapticStyle="medium"
                onPress={() => {
                    if (destination) {
                        router.push({ pathname: '/maps/mapDirections', params: { destLat: destination.latitude, destLng: destination.longitude } });
                    } else {
                        router.push({ pathname: '/maps/mapDirections' });
                    }
                }}
            >
                <Ionicons name="navigate-circle" size={28} color={THEME.COLOR.black} />
            </HapticPressable>
        </View>
    )
}

export default MapSearch;