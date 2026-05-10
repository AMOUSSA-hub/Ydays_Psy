import React, { useState } from 'react';
import { TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';

interface RegisterFormProps {
  onRegister: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

export function RegisterForm({ onRegister, isLoading }: RegisterFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const canSubmit = email && password && password === confirmPassword;

  return (
    <View className="gap-5">
      <View className="gap-2">
        <ThemedText className="text-xs font-black uppercase tracking-[2px] opacity-40 ml-4">
          Email
        </ThemedText>
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="votre@email.com"
          autoCapitalize="none"
          keyboardType="email-address"
          className="bg-white px-6 py-4 rounded-[24px] text-lg text-[#4B3F72] shadow-sm border border-neutral-100"
          placeholderTextColor="#A0A0C0"
        />
      </View>

      <View className="gap-2">
        <ThemedText className="text-xs font-black uppercase tracking-[2px] opacity-40 ml-4">
          Mot de passe
        </ThemedText>
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          secureTextEntry
          className="bg-white px-6 py-4 rounded-[24px] text-lg text-[#4B3F72] shadow-sm border border-neutral-100"
          placeholderTextColor="#A0A0C0"
        />
      </View>

      <View className="gap-2">
        <ThemedText className="text-xs font-black uppercase tracking-[2px] opacity-40 ml-4">
          Confirmer
        </ThemedText>
        <TextInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          className="bg-white px-6 py-4 rounded-[24px] text-lg text-[#4B3F72] shadow-sm border border-neutral-100"
          placeholderTextColor="#A0A0C0"
        />
      </View>

      <TouchableOpacity
        onPress={() => onRegister(email, password)}
        disabled={isLoading || !canSubmit}
        activeOpacity={0.8}
        className={`mt-6 py-5 rounded-full shadow-lg ${
          isLoading || !canSubmit ? 'bg-[#D0D0E0]' : 'bg-[#4B3F72]'
        }`}
      >
        {isLoading ? (
          <ActivityIndicator color="white" />
        ) : (
          <ThemedText className="text-center text-white font-black uppercase tracking-[2px]">
            Créer mon compte
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}
