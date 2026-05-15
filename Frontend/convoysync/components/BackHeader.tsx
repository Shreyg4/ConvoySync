import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { globalStyles } from '../styles';
import { THEME } from '../theme';
import HapticPressable from './pressableCustomization';

interface BackHeaderProps {
  title: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  color: string;
}

export default function BackHeader({ title, icon, color }: BackHeaderProps) {
  const router = useRouter();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <HapticPressable onPress={() => router.back()} hapticStyle="light">
        <Ionicons name={icon} size={THEME.FONT_SIZE.xxxl} color={color} />
      </HapticPressable>
      <Text style={globalStyles.title}>{title}</Text>
    </View>
  );
}
