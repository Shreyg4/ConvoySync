import { Tabs } from 'expo-router';
import {Ionicons} from "@expo/vector-icons"
import { Text, View } from 'react-native'

const tabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: "red",
            tabBarInactiveTintColor: "green",
            tabBarStyle: {
                backgroundColor: "black",
                borderTopWidth: 1,
                borderTopColor: "yellow",
                height: 90,
                paddingBottom: 30,
                paddingTop: 10,
            },
        }}>
            <Tabs.Screen 
                name='home' 
                options= {{
                    title: "My Journeys", 
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='home' size={size} color={color}/>
                    ),
                }} 
            />
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