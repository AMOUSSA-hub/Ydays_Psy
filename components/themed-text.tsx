import { Text, type TextProps } from 'react-native';
import { cn } from '@/src/lib/utils'; // Adjust path as needed

import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  className, // Use className for Tailwind
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');

  return (
    <Text
      className={cn(
        `text-[${color}]`, // Apply color dynamically
        type === 'default' && 'text-base leading-6',
        type === 'title' && 'text-3xl font-bold leading-8',
        type === 'defaultSemiBold' && 'text-base leading-6 font-semibold',
        type === 'subtitle' && 'text-xl font-bold',
        type === 'link' && 'text-base leading-[30px] text-[#0a7ea4]',
        className // Merge with any additional classes
      )}
      {...rest}
    />
  );
}