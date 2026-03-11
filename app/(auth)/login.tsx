import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { LoginForm } from '@/app/components/auth/LoginForm';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function LoginScreen() {
  const onLogin = (email: string, password: string) => {
    console.log('Login attempt:', { email, password });
    // In a real app, you would handle authentication here.
    // For now, we'll simulate a successful login and redirect.
    alert('Login successful! Redirecting to home...');
    // Replace with actual navigation to main app after successful auth
    // router.replace('/home');
  };

  const backgroundColor = useThemeColor({}, 'backgroundAuth');

  return (
    <ThemedView className={`flex-1 justify-center items-center p-6 bg-[${backgroundColor}]`}>
      <ThemedText type="title" className="mb-8">Welcome Back!</ThemedText>
      <LoginForm onLogin={onLogin} />
    </ThemedView>
  );
}