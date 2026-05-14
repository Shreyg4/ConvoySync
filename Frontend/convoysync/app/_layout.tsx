import { Stack } from "expo-router";
import MapButton from "../components/mapButton";
import { View } from "react-native";

export default function RootLayout() {
  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
        <Stack.Screen name="index"/>
        <Stack.Screen name="(tabs)"/>
        <Stack.Screen name="createTrip"/>
      </Stack>
      
      <MapButton />
    </View>
)}; 