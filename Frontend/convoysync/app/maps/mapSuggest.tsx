import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { consumeSelectedMapPlace } from './mapSearchSelectionStore';
import {
    addSuggestion,
    getUserSuggestionCount,
    MAX_USER_SUGGESTIONS,
    CURRENT_USER,
} from './suggestionStore';

const MapSuggest = () => {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<{ latitude: number; longitude: number } | null>(null);
    const [locationGranted, setLocationGranted] = useState(false);
    const [selectedPlace, setSelectedPlace] = useState<{
        latitude: number;
        longitude: number;
        label: string;
    } | null>(null);
    const [userCount, setUserCount] = useState(getUserSuggestionCount(CURRENT_USER.id));
    const [cardHeight, setCardHeight] = useState(0);

    const atMax = userCount >= MAX_USER_SUGGESTIONS;

    useFocusEffect(
        useCallback(() => {
            setUserCount(getUserSuggestionCount(CURRENT_USER.id));

            const place = consumeSelectedMapPlace();
            if (!place) return;

            setSelectedPlace({
                latitude: place.latitude,
                longitude: place.longitude,
                label: place.description || 'Unnamed location',
            });
            mapRef.current?.animateToRegion({
                latitude: place.latitude,
                longitude: place.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            }, 1000);
        }, [])
    );

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') return;
            setLocationGranted(true);

            const location = await Location.getCurrentPositionAsync({});
            const currentLoc = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
            };
            setOrigin(currentLoc);
            mapRef.current?.animateToRegion(
                { ...currentLoc, latitudeDelta: 0.09, longitudeDelta: 0.04 },
                1000
            );
        })();
    }, []);

    const handleSuggest = useCallback(() => {
        if (!selectedPlace || atMax) return;
        addSuggestion({
            userId: CURRENT_USER.id,
            userName: CURRENT_USER.name,
            label: selectedPlace.label,
            latitude: selectedPlace.latitude,
            longitude: selectedPlace.longitude,
        });
        router.replace('/maps/plannerSuggest');
    }, [selectedPlace, atMax, router]);

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                mapType="standard"
                style={StyleSheet.absoluteFillObject}
                showsUserLocation={locationGranted}
                showsMyLocationButton={false}
            >
                {selectedPlace && (
                    <Marker coordinate={selectedPlace} title={selectedPlace.label}>
                        <Ionicons name="location" size={36} color={THEME.COLOR.mint} />
                    </Marker>
                )}
            </MapView>

            <HapticPressable
                hapticStyle="light"
                onPress={selectedPlace ? () => setSelectedPlace(null) : () => router.replace('/maps/plannerSuggest')}
                style={styles.closeButton}
            >
                <Ionicons name={selectedPlace ? 'close' : 'chevron-back'} size={28} color={THEME.COLOR.mint} />
            </HapticPressable>

            <HapticPressable
                hapticStyle="light"
                onPress={() =>
                    router.push({
                        pathname: '/maps/mapSearchScreen',
                        params: { placeholder: 'Search for a location to suggest...' },
                    })
                }
                style={mapStyles.searchContainer2}
            >
                <View style={[mapStyles.textInputContainer, styles.searchBar]}>
                    <Text
                        numberOfLines={1}
                        ellipsizeMode="tail"
                        style={[
                            mapStyles.textInput,
                            {
                                top: Platform.select({ ios: 16, android: 14 }),
                                color: selectedPlace ? THEME.COLOR.white : THEME.COLOR.neutral400,
                            },
                        ]}
                    >
                        {selectedPlace?.label || 'Search for a location to suggest...'}
                    </Text>
                </View>
            </HapticPressable>

            {locationGranted && (
                <HapticPressable
                    style={[mapStyles.locationButton, { bottom: cardHeight + 12 }]}
                    hapticStyle="light"
                    onPress={() => {
                        if (origin) {
                            mapRef.current?.animateToRegion(
                                { ...origin, latitudeDelta: 0.09, longitudeDelta: 0.04 },
                                800
                            );
                        }
                    }}
                >
                    <Ionicons name="locate" size={22} color={THEME.COLOR.mint} />
                </HapticPressable>
            )}

            {(selectedPlace || atMax) && (
                <View style={styles.bottomCard} onLayout={(e) => setCardHeight(e.nativeEvent.layout.height)}>
                    {selectedPlace && (
                        <View style={styles.placeRow}>
                            <Ionicons name="location" size={20} color={THEME.COLOR.mint} />
                            <Text style={styles.placeLabel} numberOfLines={2}>
                                {selectedPlace.label}
                            </Text>
                        </View>
                    )}

                    {atMax ? (
                        <View style={styles.maxRow}>
                            <Ionicons name="warning-outline" size={16} color={THEME.COLOR.neutral500} />
                            <Text style={styles.maxText}>
                                You've reached your {MAX_USER_SUGGESTIONS} suggestion limit
                            </Text>
                        </View>
                    ) : (
                        <HapticPressable
                            hapticStyle="medium"
                            onPress={handleSuggest}
                            style={styles.suggestButton}
                        >
                            <Text style={styles.suggestButtonText}>Suggest to group</Text>
                        </HapticPressable>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    closeButton: {
        position: 'absolute',
        top: Platform.select({ ios: 70, android: 55 }),
        left: Platform.select({ ios: 20, android: 20 }),
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 10,
        elevation: 10,
    },
    searchBar: {
        marginTop: 65,
    },
    bottomCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: THEME.COLOR.black,
        paddingTop: 16,
        paddingHorizontal: 20,
        paddingBottom: 44,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        borderWidth: 1,
        borderColor: 'rgba(118, 224, 187, 0.15)',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 15,
        gap: 14,
    },
    placeRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
    },
    placeLabel: {
        flex: 1,
        color: THEME.COLOR.white,
        fontSize: 15,
        fontWeight: '600',
        lineHeight: 22,
    },
    suggestButton: {
        backgroundColor: THEME.COLOR.mint,
        borderRadius: 25,
        paddingVertical: 14,
        alignItems: 'center',
    },
    suggestButtonText: {
        color: THEME.COLOR.black,
        fontSize: 16,
        fontWeight: '700',
    },
    maxRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    maxText: {
        color: THEME.COLOR.neutral500,
        fontSize: 13,
    },
});

export default MapSuggest;
