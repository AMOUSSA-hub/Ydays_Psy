import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/src/lib/utils';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  textClassName?: string;
}

export function Button({
  children,
  onPress,
  variant = 'primary',
  isLoading = false,
  disabled = false,
  className,
  textClassName,
}: ButtonProps) {
  const primaryBg = useThemeColor({}, 'primary');
  const secondaryBg = useThemeColor({}, 'secondary');
  const text = useThemeColor({}, 'text');

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return `bg-[${primaryBg}] active:opacity-80`;
      case 'secondary':
        return `bg-[${secondaryBg}] active:opacity-80`;
      case 'ghost':
        return 'bg-transparent active:opacity-80';
      default:
        return `bg-[${primaryBg}] active:opacity-80`;
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white';
      case 'ghost':
        return `text-[${text}]`;
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={cn(
        'flex-row items-center justify-center rounded-md px-4 py-3',
        getVariantClasses(),
        (disabled || isLoading) && 'opacity-50',
        className
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? text : 'white'} />
      ) : (
        <Text className={cn('font-semibold text-base', getTextColor(), textClassName)}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}