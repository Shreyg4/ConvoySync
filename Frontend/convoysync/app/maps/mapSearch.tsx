import React, { useEffect, useRef, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, StyleSheet, Keyboard, Text, TouchableOpacity } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Marker } from 'react-native-maps';
import GooglePlacesTextInput from 'react-native-google-places-textinput';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import BackHeader from '@/components/BackHeader';
import { mapStyles } from '../../styles/mapStyles';
const GOOGLE_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

const MapSearch = () => {
    const router = useRouter();
    const mapRef = useRef<MapView>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [destination, setDestination] = useState<any>(null);
    const [locationGranted, setLocationGranted] = useState(false);

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
            </MapView>

            {/* Back button */}
            <SafeAreaView style={{ marginTop: 70, marginLeft: 15 }} pointerEvents="box-none">
                <BackHeader title="" icon="close-circle" color='black' />
            </SafeAreaView>

            {/* Search Bar */}
            <SafeAreaView style={mapStyles.searchContainer} pointerEvents='box-none'>
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
                        container: mapStyles.searchContainer2,
                        inputContainer: mapStyles.textInputContainer,
                        input: mapStyles.textInput,
                        suggestionsContainer: mapStyles.listView
                    }}
                />
            </SafeAreaView>

            {/* Directions Button */}
            {destination && (
                <TouchableOpacity
                    style={mapStyles.directionsButton}
                    onPress={() => router.push({ pathname: '/maps/mapDirections', params: { destLat: destination.latitude, destLng: destination.longitude } })}
                >
                    <Ionicons name="navigate-circle" size={24} color="black" />
                    <Text style={mapStyles.directionsButtonText}>Directions</Text>
                </TouchableOpacity>
            )}
        </View>
    )
}

export default MapSearch;