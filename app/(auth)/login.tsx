import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { LoginForm } from '@/app/components/auth/LoginForm';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';
import { router } from 'expo-router';

export default function LoginScreen() {
  const onLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    // Simulate successful login
    alert('Login successful! Redirecting to home...');
    router.replace('/(tabs)/home'); // Navigate to the main tabs
  };

  const backgroundColor = useThemeColor({}, 'background'); // Use existing background color

  return (
    <ThemedView className={`flex-1 justify-center items-center p-6 bg-[${backgroundColor}]`}>
      <ThemedText type="title" className="mb-8">Welcome Back!</ThemedText>
      <LoginForm onLogin={onLogin} />
    </ThemedView>
  );
}