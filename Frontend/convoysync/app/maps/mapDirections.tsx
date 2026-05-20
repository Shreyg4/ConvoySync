import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { consumeSelectedMapPlace } from './mapSearchSelectionStore';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MapDirections = () => {
    const params = useLocalSearchParams();
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [destination, setDestination] = useState<any>(
        params.destLat && params.destLng
            ? { latitude: Number(params.destLat), longitude: Number(params.destLng) }
            : null
    );
    const [originLabel, setOriginLabel] = useState('Your Location');
    const [destinationLabel, setDestinationLabel] = useState('Destination');
    const [locationGranted, setLocationGranted] = useState(false);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [customOrigin, setCustomOrigin] = useState<any>(null);
    const [selectionTarget, setSelectionTarget] = useState<'origin' | 'destination' | null>(null);

    const activeOrigin = customOrigin || origin;

    useFocusEffect(
        useCallback(() => {
        const selectedPlace = consumeSelectedMapPlace();
        if (!selectedPlace || !selectionTarget) {
                return;
        }

        const nextLabel = selectedPlace.description || '';

        if (selectionTarget === 'origin') {
            setCustomOrigin({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            });
            setOriginLabel(nextLabel || 'Your Location');
        }

        if (selectionTarget === 'destination') {
            setDestination({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            });
            setDestinationLabel(nextLabel || 'Destination');
        }

        setSelectionTarget(null);
        }, [selectionTarget])
    );

    const openSearchScreen = useCallback((target: 'origin' | 'destination') => {
        setSelectionTarget(target);
            const paramsObj: any = {
                placeholder: target === 'origin' ? 'Your Location (Origin)' : 'Destination',
            };

            // Only prefill currentText for origin; destination should show placeholder only
            if (target === 'origin') paramsObj.currentText = originLabel;

            router.push({
                pathname: '/maps/mapSearchScreen' as any,
                params: paramsObj,
            });
    }, [destinationLabel, originLabel, router]);

    //Requst permission and show current location
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
                showsMyLocationButton={true}
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

                {/* Marker for custom origin */}
                {customOrigin && (
                    <Marker
                        coordinate={customOrigin}
                        title="Origin"
                        pinColor="green"
                    />
                )}

                {/* Route line connecting user to destination */}
                {activeOrigin && destination && (
                    <MapViewDirections
                        origin={activeOrigin}
                        destination={destination}
                        apikey={GOOGLE_API_KEY}
                        strokeColor='blue'
                        strokeWidth={5}
                        onReady={(result) => {
                            setDistance(result.distance);
                            setDuration(result.duration);
                            //Adjusting map to fit the whole route
                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 150, right: 150, bottom: 50, left: 50 },
                                animated: true,
                            });
                        }}
                    />
                )}
            </MapView>

            {/* Routing Mode Panel */}
            <SafeAreaView style={mapStyles.routingPanelContainer} pointerEvents='box-none'>
                {/* Back button */}
                <View style={mapStyles.backButtonContainer}>
                    <BackHeader
                        title=""
                        icon={destination ? 'close' : 'chevron-back'}
                        color={THEME.COLOR.mint}
                    />
                </View>
                <HapticPressable
                    hapticStyle="light"
                    onPress={() => openSearchScreen('origin')}
                    style={{ marginHorizontal: 15, marginTop: 10 }}
                >
                    <View style={mapStyles.routingInputContainer}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, { color: THEME.COLOR.white }]}>
                            {originLabel}
                        </Text>
                    </View>
                </HapticPressable>

                <HapticPressable
                    hapticStyle="light"
                    onPress={() => openSearchScreen('destination')}
                    style={{ marginHorizontal: 15, marginTop: 10 }}
                >
                    <View style={mapStyles.routingInputContainer}>
                        <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2]}>
                            {destinationLabel}
                        </Text>
                    </View>
                </HapticPressable>
            </SafeAreaView>

            {/* Trip Information Card */}
            {distance > 0 && duration > 0 && (
                <View style={mapStyles.tripInfoCard}>
                    <Text style={mapStyles.timeText}>
                        {duration >= 60 ? `${Math.floor(duration / 60)} hr ${Math.ceil(duration % 60)} min` : `${Math.ceil(duration)} min`}
                    </Text>
                    <Text style={mapStyles.distanceText}>
                        {(distance * 0.621371).toFixed(1)} miles away
                    </Text>
                </View>
            )}
        </View>
    )
}

export default MapDirections;