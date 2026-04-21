import React from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from '@/app/lib/utils';
import { useThemeColor } from '@/hooks/use-theme-color';

interface InputProps extends TextInputProps {
  className?: string;
}

export function Input({ className, ...props }: InputProps) {
  const textColor = useThemeColor({}, 'text');
  const borderColor = useThemeColor({ light: '#D1D5DB', dark: '#4B5563' }, 'background'); // Using a neutral border color
  const backgroundColor = useThemeColor({}, 'background');

  return (
    <TextInput
      className={cn(
        `flex h-10 w-full rounded-md border border-[${borderColor}] bg-[${backgroundColor}] px-3 py-2 text-base text-[${textColor}] placeholder:text-gray-400 focus:border-blue-500`,
        className
      )}
      placeholderTextColor={useThemeColor({ light: '#9CA3AF', dark: '#6B7280' }, 'text')}
      {...props}
    />
  );
}