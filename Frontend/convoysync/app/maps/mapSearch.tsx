import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { consumeSelectedMapPlace } from '@/app/maps/mapSearchSelectionStore';

const MapSearch = () => {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [destination, setDestination] = useState<any>(null);
    const [locationGranted, setLocationGranted] = useState(false);
    const [searchText, setSearchText] = useState('');

    const clearSearch = () => {
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

    useFocusEffect(
        useCallback(() => {
            const selectedPlace = consumeSelectedMapPlace();
            if (!selectedPlace) {
                return;
            }

            setSearchText(selectedPlace.description || '');
            setDestination({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            });
            mapRef.current?.animateToRegion({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }, [])
    );

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
                style={mapStyles.searchContainer}
                pointerEvents='box-none'
            >
                {/* Back / Cancel / Clear button */}
                <View style={mapStyles.backButtonContainer}>
                    <BackHeader
                        title=""
                        icon={destination ? 'close' : 'chevron-back'}
                        color={THEME.COLOR.mint}
                        onPress={
                            destination ? clearSearch :
                                () => router.back()
                        }
                    />
                </View>

                <HapticPressable
                    hapticStyle='light'
                    onPress={() => {
                        router.push({
                            pathname: '/maps/mapSearchScreen' as any,
                            params: {
                                placeholder: 'Search for a destination...',
                                currentText: searchText,
                            },
                        });
                    }}
                    style={mapStyles.searchContainer2}
                >
                    <View style={mapStyles.textInputContainer}>
                        <Text
                            numberOfLines={1}
                            ellipsizeMode='tail'
                            style={[
                                mapStyles.textInput,
                                mapStyles.searchTextInset,
                                {
                                    top: Platform.select({ ios: 16, android: 14 }),
                                    maxWidth: '88%',
                                    color: searchText ? THEME.COLOR.white : THEME.COLOR.neutral400,
                                },
                            ]}
                        >
                            {searchText || 'Search for a destination...'}
                        </Text>
                    </View>
                </HapticPressable>
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