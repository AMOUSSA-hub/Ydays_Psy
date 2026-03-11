import React from 'react';
import { ThemedText } from '@/components/themed-text';
import { RegisterForm } from '@/src/components/auth/RegisterForm';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function RegisterScreen() {
  const onRegister = (email: string, password: string) => {
    console.log('Register attempt:', { email, password });
    // In a real app, you would handle registration here.
    // For now, we'll simulate a successful registration and redirect.
    alert('Registration successful! Redirecting to login...');
    // Replace with actual navigation to login or main app after successful auth
    // router.replace('/login');
  };

  const backgroundColor = useThemeColor({}, 'backgroundAuth');

  return (
    <ThemedView className={`flex-1 justify-center items-center p-6 bg-[${backgroundColor}]`}>
      <ThemedText type="title" className="mb-8">Create Account</ThemedText>
      <RegisterForm onRegister={onRegister} />
    </ThemedView>
  );
}