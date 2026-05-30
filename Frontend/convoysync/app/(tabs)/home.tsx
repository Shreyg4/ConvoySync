import { Text } from 'react-native'
import { useEffect, useState } from 'react'
import { SafeAreaView } from 'react-native-safe-area-context';
import { globalStyles } from '../../styles/globalStyles';
import { Link } from 'expo-router';
import HapticPressable from '../../components/pressableCustomization';

const home = () => {
    // temp
    type Party = {
        id: number;
        ownerId: number;
        name: string;
        inviteCode: string;
        createdAt: Date;
    }

    const [parties, setParties] = useState<Party[]>([]);
    const userId = 1;

    useEffect(() => {
        const getTrips = async () => {
            try {
                const response = await fetch(`http://192.168.1.129:8080/users/${userId}/parties`);

                const data = await response.json();

                if (!response.ok) {
                    console.log('status:', response.status);
                    console.log('body:', data);
                    return;
                }

                console.log(data);
                setParties(data);

            } catch (error) {
                console.error('Network error:', error);
            }
        }

        getTrips();
    }, []);

    return (
        <SafeAreaView style={globalStyles.container}>
            <Text style={globalStyles.title}>My Journeys</Text>
            <Link href="/createTrip" asChild>
                <HapticPressable style={globalStyles.AddButton} hapticStyle="light" showVisualFeedback>
                    <Text style={globalStyles.AddButtonText}>+ Plan New Adventure</Text>
                </HapticPressable>
            </Link>
            {parties.length !== 0 ? parties.map((party) => (
                <>
                    <Text style={{ color: 'white' }} key={party.id}>{party.name}</Text>
                    <Text style={{ color: 'red' }}>{party.inviteCode}</Text>
                </>
            )) : <Text style={globalStyles.title}>No parties found.</Text>}
        </SafeAreaView>
    )
}

export default home;