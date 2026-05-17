import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import BackHeader from '@/components/BackHeader';
import { globalStyles } from '../styles';

const Map = () => {
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
            />
        </View>
    )
}

export default Map;