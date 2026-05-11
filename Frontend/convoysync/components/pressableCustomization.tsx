import React, { useState } from 'react';
import { Pressable, PressableProps } from 'react-native';
import * as Haptics from 'expo-haptics';

interface HapticPressableProps extends PressableProps {
  onPress?: () => void;
  hapticStyle?: 'light' | 'medium' | 'heavy';
  showVisualFeedback?: boolean;
  pressedOpacity?: number;
  children: React.ReactNode;
}

export default function HapticPressable({
  onPress,
  hapticStyle = 'light',
  showVisualFeedback = false,
  pressedOpacity = 0.7,
  style,
  children,
  ...props
}: HapticPressableProps) {
  const [isPressed, setIsPressed] = useState(false);

  const hapticMap = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  };

  const handlePress = async () => {
    await Haptics.impactAsync(hapticMap[hapticStyle]);
    onPress?.();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
      style={(state) => [
        typeof style === 'function' ? style(state) : style,
        showVisualFeedback && { opacity: isPressed ? pressedOpacity : 1 },
      ]}
      {...props}
    >
      {children}
    </Pressable>
  );
}
