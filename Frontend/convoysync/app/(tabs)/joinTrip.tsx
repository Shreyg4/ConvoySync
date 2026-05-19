import { Text } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';

const joinTrip = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>Join Trip</Text>
        </SafeAreaView>
    )
}

export default joinTrip;