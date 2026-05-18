import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Keyboard, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BackHeader from '@/components/BackHeader';
import { globalStyles } from '../styles';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const Map = () => {
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [destination, setDestination] = useState<any>(null);
    const [locationGranted, setLocationGranted] = useState(false);
    const [distance, setDistance] = useState<number>(0);
    const [duration, setDuration] = useState<number>(0);
    const [isRoutingMode, setIsRoutingMode] = useState(false);
    const [customOrigin, setCustomOrigin] = useState<any>(null);

    const activeOrigin = customOrigin || origin;

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
                {isRoutingMode && activeOrigin && destination && (
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

            {/* Back button */}
            <SafeAreaView style={globalStyles.mapContainer} pointerEvents="box-none">
                <BackHeader title="" icon="close-circle" color='white' />
            </SafeAreaView>

            {/* Search Bar / Routing Panel */}
            {!isRoutingMode ? (
                // Explore Mode
                <SafeAreaView style={globalStyles.searchContainer} pointerEvents='box-none'>
                    <GooglePlacesTextInput
                        apiKey={GOOGLE_API_KEY}
                        placeHolderText='Search for a destination...'
                        fetchDetails={true}
                        onPlaceSelect={(place: any) => {
                            Keyboard.dismiss();
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
                            container: globalStyles.searchContainer2,
                            inputContainer: globalStyles.textInputContainer,
                            input: globalStyles.textInput,
                            suggestionsContainer: globalStyles.listView
                        }}
                    />
                </SafeAreaView>
            ) : (
                // Routing Mode Panel
                <SafeAreaView style={globalStyles.routingPanelContainer} pointerEvents='box-none'>
                    <TouchableOpacity 
                        style={globalStyles.routingCloseButton} 
                        onPress={() => {
                            setIsRoutingMode(false);
                            setDistance(0);
                            setDuration(0);
                            setCustomOrigin(null);
                        }}
                    >
                        <Ionicons name="close" size={24} color="black" />
                    </TouchableOpacity>

                    <GooglePlacesTextInput
                        apiKey={GOOGLE_API_KEY}
                        placeHolderText='Your Location (Origin)'
                        fetchDetails={true}
                        onPlaceSelect={(place: any) => {
                            if (place.details && place.details.location) {
                                setCustomOrigin({
                                    latitude: place.details.location.latitude,
                                    longitude: place.details.location.longitude,
                                });
                            }
                        }}
                        onError={(error: any) => console.error("Google Places Error:", error)}
                        detailsFields={['location']}
                        style={{
                            container: { ...globalStyles.searchContainer2, position: 'relative' },
                            inputContainer: globalStyles.routingInputContainer,
                            input: globalStyles.textInput,
                            suggestionsContainer: globalStyles.listView
                        }}
                    />

                    <GooglePlacesTextInput
                        apiKey={GOOGLE_API_KEY}
                        placeHolderText='Destination'
                        fetchDetails={true}
                        onPlaceSelect={(place: any) => {
                            if (place.details && place.details.location) {
                                setDestination({
                                    latitude: place.details.location.latitude,
                                    longitude: place.details.location.longitude,
                                });
                            }
                        }}
                        onError={(error: any) => console.error("Google Places Error:", error)}
                        detailsFields={['location']}
                        style={{
                            container: { ...globalStyles.searchContainer2, position: 'relative' },
                            inputContainer: globalStyles.routingInputContainer,
                            input: globalStyles.textInput,
                            suggestionsContainer: globalStyles.listView
                        }}
                    />
                </SafeAreaView>
            )}

            {/* Directions Button (Visible in Explore Mode when destination is set) */}
            {!isRoutingMode && destination && (
                <TouchableOpacity 
                    style={globalStyles.directionsButton}
                    onPress={() => setIsRoutingMode(true)}
                >
                    <Ionicons name="navigate-circle" size={24} color="black" />
                    <Text style={globalStyles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
            )}

            {/* Trip Information Card */}
            {isRoutingMode && distance > 0 && duration > 0 && (
                <View style={globalStyles.tripInfoCard}>
                    <Text style={globalStyles.timeText}>
                        {duration >= 60 ? `${Math.floor(duration / 60)} hr ${Math.ceil(duration % 60)} min` : `${Math.ceil(duration)} min`}
                    </Text>
                    <Text style={globalStyles.distanceText}>
                        {(distance * 0.621371).toFixed(1)} miles away
                    </Text>
                </View>
            )}
        </View>
    )
}

export default Map;