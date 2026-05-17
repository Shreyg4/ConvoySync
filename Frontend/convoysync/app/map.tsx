import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Keyboard, Text } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
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

                {/* Route line connecting user to destination */}
                {origin && destination && (
                    <MapViewDirections
                        origin={origin}
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

            {/* Search Bar */}
            <SafeAreaView style={globalStyles.searchContainer} pointerEvents='box-none'>
                <GooglePlacesAutocomplete
                    placeholder='Search for a destination...'
                    fetchDetails={true}
                    onPress={(data, details = null) => {
                        Keyboard.dismiss();
                        if (details) {
                            setDestination({
                                latitude: details.geometry.location.lat,
                                longitude: details.geometry.location.lng,
                            });
                        }
                    }}
                    onFail={(error) => console.error("Google Places Error:", error)}
                    keyboardShouldPersistTaps="handled"
                    query={{
                        key: GOOGLE_API_KEY,
                        language: 'en',
                    }}
                    styles={{
                        container: globalStyles.searchContainer2,
                        textInputContainer: globalStyles.textInputContainer,
                        textInput: globalStyles.textInput,
                        listView: globalStyles.listView
                    }}
                />
            </SafeAreaView>
            {/* Trip Information Card */}
            {distance > 0 && duration > 0 && (
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