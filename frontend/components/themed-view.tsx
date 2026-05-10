import { View, type ViewProps } from 'react-native';
import { cn } from '@/lib/utils'; // Import cn utility

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
  className?: string; // Add className prop
};

export function ThemedView({ className, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View className={cn(`bg-[${backgroundColor}]`, className)} {...otherProps} />;
}