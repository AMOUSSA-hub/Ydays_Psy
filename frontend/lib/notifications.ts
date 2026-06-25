/**
 * Rappels locaux (mobile). Sur web : pas de notifications natives ; utiliser les rappels in-app (liste agenda).
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function ensureNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === 'granted') return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === 'granted';
}

/** Programme une notification à l'heure exacte indiquée (trigger calendaire). */
export async function scheduleReminderNotification(
  title: string,
  body: string | undefined,
  triggerDate: Date
): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  const ok = await ensureNotificationPermissions();
  if (!ok) return null;

  // Déclenchement à l'heure pile (pas de plancher de 60 s). Si la date est
  // déjà passée, on déclenche quasi immédiatement plutôt que de la décaler.
  const when =
    triggerDate.getTime() > Date.now() ? triggerDate : new Date(Date.now() + 2000);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body: body ?? '',
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: when,
    },
  });
  return id;
}

export async function cancelScheduledNotification(notificationId: string | null | undefined) {
  if (!notificationId || Platform.OS === 'web') return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    /* ignore */
  }
}
