import { Tabs } from 'expo-router';
import {Ionicons} from "@expo/vector-icons"
import { THEME } from '../../theme'

const tabsLayout = () => {
    return (
        <Tabs screenOptions={{
            tabBarActiveTintColor: THEME.COLOR.mint,
            tabBarInactiveTintColor: THEME.COLOR.white,
            tabBarStyle: {
                backgroundColor: THEME.COLOR.black,
                borderTopWidth: 1,
                borderTopColor: THEME.COLOR.black,
                height: 90,
                paddingBottom: 30,
                paddingTop: 10,

            },
            tabBarLabelStyle: {
                fontSize: THEME.FONT_SIZE.xs,
                fontWeight: THEME.FONT_WEIGHT.bold,
                shadowColor: THEME.COLOR.mint,
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
            <Tabs.Screen 
                name='joinTrip' 
                options= {{
                    title: "Join Trip", 
                    tabBarIcon: ({color, size}) => (
                        <Ionicons name='people' size={size} color={color}/>
                    )
                }} 
            />
        </Tabs>
    )
}

export default tabsLayout;