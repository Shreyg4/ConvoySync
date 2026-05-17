import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import BackHeader from '@/components/BackHeader';
import { globalStyles } from '../styles';
import { useEffect, useRef } from 'react';

const Map = () => {
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        (async () => {
            let { status } = await
                Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                console.log('Permission to access location was denied');
                return;
            }

            let location = await Location.getCurrentPositionAsync({});

            mapRef.current?.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.09,
                longitudeDelta: 0.04,
            }, 1000);
        })();
    }, []);

    useEffect
    return (
        <View style={{ flex: 1 }}>
            <SafeAreaView style={globalStyles.mapContainer}>
                <BackHeader title="" icon="close-circle" color='black' />
            </SafeAreaView>
            <MapView
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={{ flex: 1, width: '100%', height: '100%', position: 'absolute' }}
                initialRegion={{
                    latitude: 47.758614083202346,
                    longitude: -122.19083971360043,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
                showsUserLocation={true}
                showsMyLocationButton={true}
                followsUserLocation={true}
            />
        </View>
    )
}

export default Map;