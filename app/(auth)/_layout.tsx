import { Stack } from 'expo-router';
import { ThemedView } from '@/components/themed-view';
import { useThemeColor } from '@/hooks/use-theme-color';

export default function AuthLayout() {
  const backgroundColor = useThemeColor({}, 'backgroundAuth');

  return (
    <ThemedView className={`flex-1 justify-center items-center bg-[${backgroundColor}]`}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemedView>
  );
}