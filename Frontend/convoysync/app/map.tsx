import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import BackHeader from '@/components/BackHeader';
import { globalStyles } from '../styles';

const Map = () => {
    return (
        <>
            <SafeAreaView pointerEvents="box-none" style={globalStyles.mapContainer}>
                <BackHeader title="" icon="close-circle" color='black' />
            </SafeAreaView>
            <MapView
                provider={PROVIDER_GOOGLE}
                mapType="satellite"
                style={{ flex: 1 }}
                initialRegion={{
                    latitude: 47.758614083202346,
                    longitude: -122.19083971360043,
                    latitudeDelta: 0.0922,
                    longitudeDelta: 0.0421,
                }}
            />
        </>
    )
}

export default Map;