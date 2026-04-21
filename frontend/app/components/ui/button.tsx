import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { cn } from '@/app/lib/utils';
import { useThemeColor } from '@/hooks/use-theme-color';

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'white';
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
  const primaryBg = '#6A8EEB'; // Custom blue from image
  const ghostText = useThemeColor({}, 'text');

  const getVariantClasses = () => {
    switch (variant) {
      case 'primary':
        return 'bg-orchid active:opacity-80';
      case 'secondary':
        return 'bg-orchid-dark active:opacity-80';
      case 'ghost':
        return 'bg-transparent active:opacity-80';
      case 'white':
        return 'bg-white active:opacity-80';
      default:
        return 'bg-orchid active:opacity-80';
    }
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
      case 'secondary':
        return 'text-white';
      case 'ghost':
        return `text-[${ghostText}]`;
      case 'white':
        return 'text-black';
      default:
        return 'text-white';
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || isLoading}
      className={cn(
        'flex-row items-center justify-center rounded-full px-4 py-3',
        getVariantClasses(),
        (disabled || isLoading) && 'opacity-50',
        className
      )}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'ghost' ? ghostText : (variant === 'white' ? 'black' : 'white')} />
      ) : (
        <Text className={cn('font-semibold text-base', getTextColor(), textClassName)}>
          {children}
        </Text>
      )}
    </TouchableOpacity>
  );
}