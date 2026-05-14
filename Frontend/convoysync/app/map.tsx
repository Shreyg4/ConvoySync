import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../styles';
import BackHeader from '@/components/BackHeader';

const home = () => {
    return (
        <SafeAreaView style={globalStyles.container}>
            <BackHeader title="" icon="close" />
        </SafeAreaView>
    )
}

export default home;