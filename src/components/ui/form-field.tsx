import React from 'react';
import { View } from 'react-native';
import { Label } from './label';
import { Input } from './input';
import { ThemedText } from '@/components/themed-text';
import { cn } from '@/src/lib/utils';

interface FormFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: TextInput['props']['keyboardType'];
  error?: string;
  className?: string;
  inputClassName?: string;
}

export function FormField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  error,
  className,
  inputClassName,
}: FormFieldProps) {
  return (
    <View className={cn('space-y-2', className)}>
      <Label>{label}</Label>
      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        className={inputClassName}
      />
      {error && <ThemedText className="text-red-500 text-sm">{error}</ThemedText>}
    </View>
  );
}