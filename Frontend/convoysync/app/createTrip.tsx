import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import BackHeader from '../components/BackHeader';

const createTrip = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <BackHeader title="Create Trip" />
        </SafeAreaView>
    )
}

export default createTrip;