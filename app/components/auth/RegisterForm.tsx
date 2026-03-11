import React, { useState } from 'react';
import { View } from 'react-native';
import { FormField } from '@/app/components/ui/form-field';
import { Button } from '@/app/components/ui/button';
import { ThemedText } from '@/components/themed-text';
import { Link } from 'expo-router';

interface RegisterFormProps {
  onRegister: (email: string, password: string) => void;
  isLoading?: boolean;
}

export function RegisterForm({ onRegister, isLoading }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});

  const validate = () => {
    const newErrors: { email?: string; password?: string; confirmPassword?: string } = {};
    if (!email) newErrors.email = 'Email is required';
    if (!password) newErrors.password = 'Password is required';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validate()) {
      onRegister(email, password);
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
        placeholder="Create a password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        error={errors.password}
      />
      <FormField
        label="Confirm Password"
        placeholder="Confirm your password"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
        error={errors.confirmPassword}
      />
      <Button onPress={handleSubmit} isLoading={isLoading} className="w-full">
        Register
      </Button>
      <Link href="/login" className="text-center">
        <ThemedText type="link" className="text-center">Already have an account? Login</ThemedText>
      </Link>
    </View>
  );
}