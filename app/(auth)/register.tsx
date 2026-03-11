import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { RegisterForm } from '@/app/components/auth/RegisterForm';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const onRegister = (email: string, password: string) => {
    console.log('Register attempt:', { email, password });
    // Simulate successful registration
    alert('Registration successful! Redirecting to login...');
    router.replace('/(auth)/login'); // Navigate back to login after registration
  };

  const backgroundColor = useThemeColor({}, 'background'); // Use existing background color

  return (
    <ThemedView className={`flex-1 justify-center items-center p-6 bg-[${backgroundColor}]`}>
      <ThemedText type="title" className="mb-8">Create Account</ThemedText>
      <RegisterForm onRegister={onRegister} />
    </ThemedView>
  );
}