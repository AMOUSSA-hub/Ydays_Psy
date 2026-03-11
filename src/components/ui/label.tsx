import React from 'react';
import { Text } from 'react-native';
import { cn } from '@/src/lib/utils';
import { useThemeColor } from '@/hooks/use-theme-color';

interface LabelProps {
  children: React.ReactNode;
  className?: string;
}

export function Label({ children, className }: LabelProps) {
  const textColor = useThemeColor({}, 'text');
  return (
    <Text className={cn(`text-sm font-medium leading-none text-[${textColor}]`, className)}>
      {children}
    </Text>
  );
}