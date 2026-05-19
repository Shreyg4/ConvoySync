import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';

const archivedTrips = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>Saved Trips</Text>
        </SafeAreaView>
    )
}

export default archivedTrips;