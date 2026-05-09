import { Tabs } from 'expo-router';
import {Ionicons} from "@expo/vector-icons"
import { Text, View } from 'react-native'

const tabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: "#76E0BB",
            tabBarInactiveTintColor: "white",
            tabBarStyle: {
                backgroundColor: "black",
                borderTopWidth: 1,
                borderTopColor: "#354B73",
                height: 90,
                paddingBottom: 30,
                paddingTop: 10,
                shadowColor: "#60ceb0",
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.8,
                shadowRadius: 10, 
                elevation: 10,

            },
            tabBarLabelStyle: {
                fontSize: 12,
                fontWeight: 600,
            },
            headerShown: false,
        }}>
            <Tabs.Screen 
                name='index' 
                options= {{
                    title: "My Journeys", 
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='map' size={size} color={color}/>
                    ),
                }} 
            />,
            <Tabs.Screen 
                name='archivedTrips' 
                options= {{
                    title: "Saved Trips", 
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='archive' size={size} color={color}/>
                    )
                }} 
            />
        </Tabs>
    )
}

export default tabsLayout;