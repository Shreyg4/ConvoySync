import React, { useCallback, useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Text, ScrollView } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import BackHeader from '@/components/BackHeader';
import HapticPressable from '@/components/pressableCustomization';
import { mapStyles } from '../../styles/mapStyles';
import { THEME } from '../../theme';
import { consumeSelectedMapPlace } from './mapSearchSelectionStore';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

type RouteSelectionTarget =
    | { kind: 'origin' }
    | { kind: 'destination' }
    | { kind: 'stop'; stopIndex: number };

type RouteStop = {
    latitude: number;
    longitude: number;
    label: string;
};

const STOP_COLORS = ['#f59e0b', '#3b82f6', '#8b5cf6', '#10b981', '#ec4899'];

const MAX_STOPS = 5;

const getStopColor = (index: number) => STOP_COLORS[index % STOP_COLORS.length];

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
    const [destinationLabel, setDestinationLabel] = useState(
        typeof params.destLabel === 'string' && params.destLabel.trim().length > 0
            ? params.destLabel
            : 'Choose destination'
    );
    const [locationGranted, setLocationGranted] = useState(false);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [customOrigin, setCustomOrigin] = useState<any>(null);
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [selectionTarget, setSelectionTarget] = useState<RouteSelectionTarget | null>(null);

    const activeOrigin = customOrigin || origin;
    const activeStops = stops.filter((stop) => stop.latitude !== 0 || stop.longitude !== 0);
    const routePoints = destination
        ? [{ latitude: destination.latitude, longitude: destination.longitude }, ...activeStops]
        : activeStops;
    const routeDestination = routePoints.length > 0 ? routePoints[routePoints.length - 1] : null;
    const routeWaypoints = routePoints.slice(0, Math.max(routePoints.length - 1, 0)).map((point) => ({
        latitude: point.latitude,
        longitude: point.longitude,
    }));

    useFocusEffect(
        useCallback(() => {
        const selectedPlace = consumeSelectedMapPlace();
        if (!selectedPlace || !selectionTarget) {
                return;
        }

        const nextLabel = selectedPlace.description || '';

        if (selectionTarget.kind === 'origin') {
            setCustomOrigin({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            });
            setOriginLabel(nextLabel || 'Your Location');
        }

        if (selectionTarget.kind === 'destination') {
            setDestination({
                latitude: selectedPlace.latitude,
                longitude: selectedPlace.longitude,
            });
            setDestinationLabel(nextLabel || 'Destination');
        }

        if (selectionTarget.kind === 'stop') {
            setStops((currentStops) => {
                const nextStop = {
                    latitude: selectedPlace.latitude,
                    longitude: selectedPlace.longitude,
                    label: nextLabel || 'Stop',
                };

                if (selectionTarget.stopIndex >= currentStops.length) {
                    return [...currentStops, nextStop];
                }

                const updatedStops = [...currentStops];
                updatedStops[selectionTarget.stopIndex] = nextStop;
                return updatedStops;
            });
        }

        setSelectionTarget(null);
        }, [selectionTarget])
    );

    const openSearchScreen = useCallback((target: RouteSelectionTarget) => {
        setSelectionTarget(target);
            const paramsObj: any = {
                placeholder: target.kind === 'origin'
                    ? 'Your Location'
                    : target.kind === 'destination'
                        ? 'Choose destination'
                        : 'Add stop',
            };

            // Don't prefill the search input with the literal 'Your Location'
            if (target.kind === 'origin' && originLabel !== 'Your Location') paramsObj.currentText = originLabel;
            if (target.kind === 'destination' && destinationLabel !== 'Choose destination') paramsObj.currentText = destinationLabel;
            if (target.kind === 'stop' && stops[target.stopIndex]?.label) paramsObj.currentText = stops[target.stopIndex].label;

            router.push({
                pathname: '/maps/mapSearchScreen' as any,
                params: paramsObj,
            });
    }, [destinationLabel, originLabel, router, stops]);

    const addStop = useCallback(() => {
        if (stops.length >= MAX_STOPS) {
            return;
        }

        openSearchScreen({ kind: 'stop', stopIndex: stops.length });
    }, [openSearchScreen, stops.length]);

    const deleteStop = useCallback((stopIndex: number) => {
        setStops((currentStops) => currentStops.filter((_, index) => index !== stopIndex));
        setSelectionTarget((currentTarget) =>
            currentTarget?.kind === 'stop' && currentTarget.stopIndex === stopIndex ? null : currentTarget
        );
    }, []);

    const deleteDestination = useCallback(() => {
        setStops((currentStops) => {
            const [nextDestination, ...remainingStops] = currentStops;

            if (nextDestination) {
                setDestination({
                    latitude: nextDestination.latitude,
                    longitude: nextDestination.longitude,
                });
                setDestinationLabel(nextDestination.label);
                return remainingStops;
            }

            setDestination(null);
            setDestinationLabel('Choose destination');
            return currentStops;
        });
        setDistance(0);
        setDuration(0);
        setSelectionTarget((currentTarget) =>
            currentTarget?.kind === 'destination' ? null : currentTarget
        );
    }, []);

    const clearRoute = useCallback(() => {
        setDestination(null);
        setDestinationLabel('Choose destination');
        setStops([]);
        setDistance(0);
        setDuration(0);
        setSelectionTarget(null);
    }, []);

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

                {/* Marker for custom origin */}
                {customOrigin && (
                    <Marker
                        coordinate={customOrigin}
                        title="Origin"
                        pinColor="green"
                    />
                )}

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

                {activeStops.map((stop, index) => (
                    <Marker
                        key={`${stop.label}-${index}`}
                        coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
                        title={stop.label}
                        pinColor={getStopColor(index)}
                    />
                ))}

                {/* Route line connecting user to destination */}
                {activeOrigin && routeDestination && (
                    <MapViewDirections
                        origin={activeOrigin}
                        destination={routeDestination}
                        waypoints={routeWaypoints}
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
                <View style={mapStyles.backButtonContainer2}>
                    <BackHeader
                        title=""
                        icon={destination ? 'close' : 'chevron-back'}
                        color={THEME.COLOR.mint}
                        onPress={destination ? clearRoute : undefined}
                    />
                </View>
                <View style={mapStyles.routingPanelBody}>
                    <ScrollView
                        style={mapStyles.routingScrollArea}
                        contentContainerStyle={mapStyles.routingScrollContent}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginTop: 10 }}>
                            <View style={{ width: 50, height: 20}} />
                            <HapticPressable
                                hapticStyle="light"
                                onPress={() => openSearchScreen({ kind: 'origin' })}
                                style={{ flex: 1 }}
                            >
                                <View style={mapStyles.routingInputContainer}>
                                    <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, { color: THEME.COLOR.white }]}> 
                                        {originLabel}
                                    </Text>
                                </View>
                            </HapticPressable>
                        </View>

                        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginTop: 10 }}>
                            <View style={{ width: 50, height: 20 }}>
                                {activeStops.length > 0 ? (
                                    <HapticPressable
                                        hapticStyle="light"
                                        onPress={deleteDestination}
                                    >
                                        <View style={mapStyles.stopDeleteButton}>
                                            <Ionicons name="close" size={18} color={THEME.COLOR.neutral500} />
                                        </View>
                                    </HapticPressable>
                                ) : null}
                            </View>

                            <HapticPressable
                                hapticStyle="light"
                                onPress={() => openSearchScreen({ kind: 'destination' })}
                                style={{ flex: 1 }}
                            >
                                <View style={mapStyles.routingInputContainer}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        {activeStops.length > 0 && (
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#ef4444', marginRight: 10 }} />
                                        )}
                                        <Text
                                            numberOfLines={1}
                                            ellipsizeMode="tail"
                                            style={[
                                                mapStyles.textInput2,
                                                { color: destination ? THEME.COLOR.white : THEME.COLOR.neutral400, flex: 1 },
                                            ]}
                                        >
                                            {destinationLabel}
                                        </Text>
                                    </View>
                                </View>
                            </HapticPressable>
                        </View>

                        {stops.map((stop, index) => (
                            <View key={`${stop.label}-${index}`} style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: 15, marginTop: 10 }}>
                                <View style={{ width: 50, height: 20 }}>
                                    <HapticPressable
                                        hapticStyle="light"
                                        onPress={() => deleteStop(index)}
                                    >
                                        <View style={mapStyles.stopDeleteButton}>
                                            <Ionicons name="close" size={18} color={THEME.COLOR.neutral500} />
                                        </View>
                                    </HapticPressable>
                                </View>

                                <HapticPressable
                                    hapticStyle="light"
                                    onPress={() => openSearchScreen({ kind: 'stop', stopIndex: index })}
                                    style={{ flex: 1 }}
                                >
                                    <View style={mapStyles.routingInputContainer}>
                                        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                            <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: getStopColor(index), marginRight: 10 }} />
                                            <Text numberOfLines={1} ellipsizeMode="tail" style={[mapStyles.textInput2, { color: THEME.COLOR.white, flex: 1 }]}> 
                                                {stop.label}
                                            </Text>
                                        </View>
                                    </View>
                                </HapticPressable>
                            </View>
                        ))}
                    </ScrollView>

                    <HapticPressable
                        hapticStyle="light"
                        onPress={addStop}
                        disabled={stops.length >= MAX_STOPS}
                        style={{ marginHorizontal: 15, marginTop: 10, marginBottom: 10, opacity: stops.length >= MAX_STOPS ? 0.5 : 1 }}
                    >
                        <View style={mapStyles.addStopButton}>
                            <Text style={mapStyles.addStopButtonText}>
                                {stops.length >= MAX_STOPS ? 'Max 5 stops reached' : '+ Add stop'}
                            </Text>
                        </View>
                    </HapticPressable>
                </View>
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