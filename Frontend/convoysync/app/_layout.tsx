import { Stack } from "expo-router";
import MapButton from "../components/mapButton";
import { View } from "react-native";

import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false, animation: 'none' }}>
          <Stack.Screen name="index"/>
          <Stack.Screen name="(tabs)"/>
          <Stack.Screen name="createTrip"/>
          <Stack.Screen name="tripInfo"/>
        </Stack>
        
        <MapButton />
      </View>
    </SafeAreaProvider>
)}; 
