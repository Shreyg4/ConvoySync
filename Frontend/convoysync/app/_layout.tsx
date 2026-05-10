import { Stack } from "expo-router";
import { THEME } from "./theme";

export default function RootLayout() {
  return (
    <Stack screenOptions={{headerShown: false}}>
      <Stack.Screen name="(tabs)"/>
      <Stack.Screen name="createTrip"/>
    </Stack>
)};
