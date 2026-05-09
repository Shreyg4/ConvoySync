import { Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';

const archivedTrips = () => {
    return (
        <SafeAreaView style={{flex: 1}}>
            <Text>Past Trips</Text>
        </SafeAreaView>
    )
}

export default archivedTrips;