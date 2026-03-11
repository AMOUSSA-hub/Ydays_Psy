import React, { useState } from 'react';
import { View } from 'react-native';
import { FormField } from '@/app/components/ui/form-field';
import { Button } from '@/app/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { Link } from 'expo-router';

interface LoginFormProps {
  onLogin: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function LoginForm({ onLogin, isLoading }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onLogin(email, password);
    }
  };

  return (
    <View className="w-full max-w-sm space-y-4">
      <FormField
        label="Email"
        placeholder="Enter your email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        error={errors.email}
      />
      <FormField
        label="Password"
        placeholder="Enter your password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      <Button onPress={handleSubmit} isLoading={isLoading} className="w-full">
        Login
      </Button>
      <Link href="/register" className="text-center">
        <ThemedText type="link" className="text-center">Don't have an account? Register</ThemedText>
      </Link>
    </View>
  );
}