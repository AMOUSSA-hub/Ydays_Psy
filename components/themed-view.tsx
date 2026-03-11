import { View, type ViewProps } from 'react-native';
import { cn } from '@/app/lib/utils'; // Adjust path as needed

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ className, lightColor, darkColor, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  return <View className={cn(`bg-[${backgroundColor}]`, className)} {...otherProps} />;
}