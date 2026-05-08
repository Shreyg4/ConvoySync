import { Tabs } from 'expo-router';
import {Ionicons} from "@expo/vector-icons"
import { Text, View } from 'react-native'

const tabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: "#60ceb0",
            tabBarInactiveTintColor: "white",
            tabBarStyle: {
                backgroundColor: "#1F1E20",
                borderTopWidth: 1,
                borderTopColor: "#354B73",
                height: 90,
                paddingBottom: 30,
                paddingTop: 10,
            },
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