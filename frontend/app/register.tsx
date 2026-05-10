import React, { useState } from 'react'; 
import { Alert, KeyboardAvoidingView, Platform, ScrollView, View, TouchableOpacity, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { ThemedText } from '@/components/themed-text';
import { useAuth } from '@/contexts/auth-context';
import { WebContainer } from '@/components/ui/web-container';

export default function RegisterScreen() {
  const { signUpWithPassword } = useAuth();
  const [loading, setLoading] = useState(false);

  return (
    <View className="flex-1 bg-[#9896D4]">
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
        >
          <WebContainer maxWidth={500} className="flex-1 px-6 pt-10">
            <TouchableOpacity onPress={() => router.back()} className="mb-6">
              <ThemedText className="text-white font-bold">← Retour</ThemedText>
            </TouchableOpacity>

            <View 
              className="bg-[#F2F2F7] rounded-[40px] p-8 shadow-xl"
              style={{ minHeight: 450 }}
            >
              <View className="mb-10">
                <ThemedText type="title" className="text-center" lightColor="#4B3F72">
                  Créer un compte
                </ThemedText>
                <ThemedText className="mt-2 text-center opacity-70" lightColor="#4B3F72">
                  Rejoignez la communauté Ochitsu
                </ThemedText>
              </View>

              <RegisterForm
                isLoading={loading}
                onRegister={async (email, password) => {
                  setLoading(true);
                  const { error } = await signUpWithPassword(email, password);
                  setLoading(false);
                  if (error) {
                    Alert.alert('Inscription', error.message);
                    return;
                  }
                  Alert.alert(
                    'Inscription',
                    'Compte créé avec succès !',
                    [{ text: 'OK', onPress: () => router.replace('/(tabs)/home') }]
                  );
                }}
              />
            </View>
          </WebContainer>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
