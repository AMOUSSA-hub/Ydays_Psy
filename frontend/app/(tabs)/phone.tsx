import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  Linking,
  Alert,
  StatusBar,
  Modal,
  Text,
  ActivityIndicator,
} from 'react-native';
import { WebContainer } from '@/components/ui/web-container';
import { router, useFocusEffect } from 'expo-router';
import { listHelpContacts, saveReminder } from '@/lib/repositories';
import type { HelpContactRow } from '@/types/database';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/auth-context';
import { scheduleReminderNotification } from '@/lib/notifications';
import * as Location from 'expo-location';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Therapist {
  id: string;
  name: string;
  role: string;
  tags: string[];
  phone: string;
  url: string;
  info: string;
  address: string;
  popularity: number;
  coords?: { lat: number; lng: number };
  distKm?: number;
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const BASE_THERAPISTS: Therapist[] = [
  {
    id: 'th-1', name: 'Dr. Marie Martin', role: 'Psychologue Clinicienne',
    tags: ['TCC', 'Anxiete', 'Burnout'], phone: '01 23 45 67 89',
    url: 'https://www.doctolib.fr',
    info: 'Specialisee dans les troubles anxieux. Conventionnee. Prise en charge rapide.',
    address: '12 rue de la Paix, Paris 2e', popularity: 5,
    coords: { lat: 48.870, lng: 2.331 },
  },
  {
    id: 'th-2', name: 'Marc Lefebvre', role: 'Psychiatre',
    tags: ['Depression', 'Medication'], phone: '01 98 76 54 32',
    url: 'https://www.doctolib.fr',
    info: 'Secteur 1. Suivi long terme. Specialiste de la depression severe.',
    address: '45 av. des Champs-Elysees, Paris 8e', popularity: 4,
    coords: { lat: 48.874, lng: 2.305 },
  },
  {
    id: 'th-3', name: 'Julie Durand', role: 'Therapeute TCA',
    tags: ['TCA', 'Anorexie', 'Boulimie'], phone: '01 44 55 66 77',
    url: 'https://www.doctolib.fr',
    info: 'Specialiste des troubles alimentaires. Approche bienveillante.',
    address: '8 rue Vavin, Paris 6e', popularity: 5,
    coords: { lat: 48.846, lng: 2.331 },
  },
  {
    id: 'th-4', name: 'Paul Lambert', role: 'Psychotherapeute',
    tags: ['EMDR', 'Trauma', 'PTSD'], phone: '01 22 33 44 55',
    url: 'https://www.doctolib.fr',
    info: 'Certifie EMDR. Prise en charge des traumatismes complexes.',
    address: '102 bd Raspail, Paris 6e', popularity: 4,
    coords: { lat: 48.848, lng: 2.326 },
  },
  {
    id: 'th-5', name: 'Dr. Sophie Chen', role: 'Pedopsychiatre',
    tags: ['Enfants', 'Ados', 'TDA-H'], phone: '01 55 66 77 88',
    url: 'https://www.doctolib.fr',
    info: 'Specialisee dans les troubles de l enfant et de l adolescent.',
    address: '33 rue du Temple, Paris 4e', popularity: 5,
    coords: { lat: 48.858, lng: 2.352 },
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function StarRating({ count }: { count: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Text key={i} style={{ fontSize: 10, color: i <= count ? '#FBBF24' : '#E5E7EB' }}>★</Text>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function PhoneScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === 'web';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [contacts, setContacts] = useState<HelpContactRow[]>([]);

  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [therapists, setTherapists] = useState<Therapist[]>(
    [...BASE_THERAPISTS].sort((a, b) => b.popularity - a.popularity)
  );

  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hour, setHour] = useState(10);
  const [minute, setMinute] = useState(0);
  const [dayOffset, setDayOffset] = useState(0);

  const [expandedId, setExpandedId] = useState<string | null>(null);

  const mainBg = isDark ? '#6B6588' : '#9896D4';

  const load = useCallback(async () => {
    setContacts(await listHelpContacts());
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  function applyCoords(lat: number, lng: number) {
    const coords = { lat, lng };
    setUserCoords(coords);
    const withDist = BASE_THERAPISTS.map(th => ({
      ...th,
      distKm: th.coords ? haversineKm(lat, lng, th.coords.lat, th.coords.lng) : 999,
    }));
    withDist.sort((a, b) => (a.distKm ?? 999) - (b.distKm ?? 999) || b.popularity - a.popularity);
    setTherapists(withDist);
  }

  async function requestLocation() {
    setLocationLoading(true);
    setLocationError(null);

    // ── Web: use browser Geolocation API ──────────────────────────────────
    if (Platform.OS === 'web') {
      if (!navigator?.geolocation) {
        setLocationError("Geolocalisation non supportee sur ce navigateur.");
        setLocationLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
          setLocationLoading(false);
        },
        (err) => {
          const msg =
            err.code === 1
              ? "Permission refusee. Autorisez la localisation dans votre navigateur."
              : "Impossible d obtenir la position. Affichage par popularite.";
          setLocationError(msg);
          setLocationLoading(false);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
      return;
    }

    // ── Mobile: use expo-location ─────────────────────────────────────────
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError("Localisation refusee. Affichage par popularite.");
        setLocationLoading(false);
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      applyCoords(pos.coords.latitude, pos.coords.longitude);
    } catch {
      setLocationError("Impossible d obtenir la position. Affichage par popularite.");
    } finally {
      setLocationLoading(false);
    }
  }

  useEffect(() => { void requestLocation(); }, []);

  function openPhone(tel: string) {
    Linking.openURL(`tel:${tel.replace(/\s/g, '')}`).catch(() =>
      Alert.alert("Appel", "Impossible de lancer l appel.")
    );
  }

  function openUrl(url: string | null) {
    if (!url) return;
    Linking.openURL(url).catch(() => Alert.alert("Lien", "Impossible d ouvrir."));
  }

  function openMap(query: string) {
    const url = Platform.select({
      ios: `maps:0,0?q=${encodeURIComponent(query)}`,
      android: `geo:0,0?q=${encodeURIComponent(query)}`,
      default: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`,
    });
    if (url) Linking.openURL(url);
  }

  async function scheduleCall() {
    if (!user || !selectedContact) return;
    const scheduled = new Date();
    scheduled.setDate(scheduled.getDate() + dayOffset);
    scheduled.setHours(hour, minute, 0, 0);
    try {
      const row = await saveReminder(user.id, {
        title: `Appel: ${selectedContact.title ?? selectedContact.name}`,
        body: `Rappel pour l appel avec ${selectedContact.title ?? selectedContact.name}.`,
        scheduled_at: scheduled.toISOString(),
        enabled: true,
      });
      const nid = await scheduleReminderNotification(row.title, row.body ?? undefined, scheduled);
      if (nid) await saveReminder(user.id, { ...row, notification_id: nid });
      setShowModal(false);
      Alert.alert("Rappel ajoute", "Il apparaitra dans votre agenda.");
    } catch {
      Alert.alert("Erreur", "Impossible de programmer.");
    }
  }

  const priority = contacts.filter(c => c.category === 'suicide' || c.category === 'tca');
  const other = contacts.filter(c => c.category !== 'suicide' && c.category !== 'tca');

  function renderContactCard(item: HelpContactRow) {
    return (
      <View key={item.id} style={{ marginBottom: 16, borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0' }}>
        <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', textTransform: 'uppercase', marginBottom: 16 }}>{item.title}</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {item.phone && (
            <TouchableOpacity onPress={() => openPhone(item.phone!)} style={{ flex: 1, backgroundColor: '#000', borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}>
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Appeler</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => { setSelectedContact(item); setShowModal(true); }} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 50, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#000' }}>
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Rappel</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  function renderTherapistCard(th: Therapist) {
    const isExpanded = expandedId === th.id;
    return (
      <View key={th.id} style={{ marginBottom: 16, borderRadius: 40, backgroundColor: '#F2F2F7', padding: 28, borderWidth: 1, borderColor: '#f0f0f0' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 18, fontWeight: '900', color: '#000', textTransform: 'uppercase' }}>{th.name}</Text>
            <Text style={{ fontSize: 10, fontWeight: '700', color: '#999', textTransform: 'uppercase', letterSpacing: 1, marginTop: 2 }}>{th.role}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <StarRating count={th.popularity} />
            {th.distKm !== undefined && th.distKm < 900 ? (
              <Text style={{ fontSize: 10, fontWeight: '900', color: '#9896D4', textTransform: 'uppercase' }}>
                {th.distKm.toFixed(1)} km
              </Text>
            ) : (
              <Text style={{ fontSize: 9, color: '#ccc', fontWeight: '700' }}>
                {userCoords ? 'N/A' : 'GPS off'}
              </Text>
            )}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {th.tags.map(t => (
            <View key={t} style={{ backgroundColor: '#fff', borderRadius: 50, paddingHorizontal: 12, paddingVertical: 4, borderWidth: 1, borderColor: '#f0f0f0' }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', opacity: 0.5, textTransform: 'uppercase' }}>{t}</Text>
            </View>
          ))}
        </View>

        {isExpanded && (
          <View style={{ backgroundColor: 'rgba(0,0,0,0.03)', borderRadius: 24, padding: 16, marginBottom: 16 }}>
            <Text style={{ color: '#555', lineHeight: 22, fontStyle: 'italic' }}>"{th.info}"</Text>
            <View style={{ marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderColor: 'rgba(0,0,0,0.05)' }}>
              <Text style={{ fontSize: 9, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', marginBottom: 4 }}>Adresse</Text>
              <Text style={{ fontWeight: '700', color: '#000', fontSize: 13 }}>{th.address}</Text>
            </View>
          </View>
        )}

        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
          <TouchableOpacity onPress={() => openPhone(th.phone)} style={{ flex: 1, backgroundColor: '#000', borderRadius: 50, paddingVertical: 14, alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Appeler</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setSelectedContact({ title: th.name, phone: th.phone }); setShowModal(true); }} style={{ flex: 1, backgroundColor: '#fff', borderRadius: 50, paddingVertical: 14, alignItems: 'center', borderWidth: 2, borderColor: '#000' }}>
            <Text style={{ color: '#000', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Rappel</Text>
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity onPress={() => setExpandedId(isExpanded ? null : th.id)} style={{ flex: 1, backgroundColor: '#EDEDF0', borderRadius: 20, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1 }}>{isExpanded ? 'Moins' : 'Infos'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openUrl(th.url)} style={{ flex: 1, backgroundColor: '#EDEDF0', borderRadius: 20, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1 }}>Site web</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => openMap(th.address)} style={{ flex: 1, backgroundColor: '#EDEDF0', borderRadius: 20, paddingVertical: 10, alignItems: 'center' }}>
            <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase', letterSpacing: 1 }}>Carte</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: mainBg, paddingLeft: isWeb ? 100 : 0 }}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: isWeb ? 24 : 48, paddingBottom: 16 }}>
        <View style={{ borderRadius: 999, backgroundColor: '#F2F2F7', paddingHorizontal: 40, paddingVertical: 8 }}>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#000' }}>Ochitsu</Text>
        </View>
      </View>

      {/* Reminder Modal */}
      <Modal visible={showModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 380, borderRadius: 40, backgroundColor: '#F2F2F7', padding: 32 }}>
            <Text style={{ fontSize: 22, fontWeight: '900', textAlign: 'center', marginBottom: 24, textTransform: 'uppercase' }}>Rappel</Text>

            <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Jour</Text>
            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
              {['Auj.', 'Dem.', '+2j', '+3j'].map((label, idx) => (
                <TouchableOpacity key={label} onPress={() => setDayOffset(idx)} style={{ flex: 1, paddingVertical: 12, borderRadius: 16, backgroundColor: dayOffset === idx ? '#000' : '#fff', borderWidth: dayOffset === idx ? 0 : 1, borderColor: '#eee', alignItems: 'center' }}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: dayOffset === idx ? '#fff' : '#000' }}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={{ fontSize: 10, fontWeight: '900', color: '#aaa', textTransform: 'uppercase', letterSpacing: 2, marginBottom: 10 }}>Heure</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, backgroundColor: '#fff', borderRadius: 24, padding: 16, marginBottom: 28 }}>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setHour(h => (h + 1) % 24)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▲</Text></TouchableOpacity>
                <Text style={{ fontSize: 40, fontWeight: '900', color: '#000' }}>{hour.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setHour(h => (h - 1 + 24) % 24)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▼</Text></TouchableOpacity>
              </View>
              <Text style={{ fontSize: 40, fontWeight: '900', color: '#000' }}>:</Text>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setMinute(m => (m + 5) % 60)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▲</Text></TouchableOpacity>
                <Text style={{ fontSize: 40, fontWeight: '900', color: '#000' }}>{minute.toString().padStart(2, '0')}</Text>
                <TouchableOpacity onPress={() => setMinute(m => (m - 5 + 60) % 60)}><Text style={{ fontWeight: '900', fontSize: 18 }}>▼</Text></TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity onPress={scheduleCall} style={{ backgroundColor: '#000', borderRadius: 50, paddingVertical: 18, marginBottom: 16 }}>
              <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '900', textTransform: 'uppercase', letterSpacing: 2 }}>Enregistrer</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowModal(false)}>
              <Text style={{ textAlign: 'center', color: '#aaa', fontWeight: '900', fontSize: 10, textTransform: 'uppercase', letterSpacing: 2 }}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: isWeb ? 48 : 120 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <WebContainer maxWidth={800} className="px-6">
          <View style={{ gap: 20 }}>

            {/* SOS */}
            <View style={{ borderRadius: 40, backgroundColor: '#DC2626', padding: 32 }}>
              <Text style={{ fontSize: 24, fontWeight: '900', color: '#fff', textTransform: 'uppercase', marginBottom: 8 }}>Urgence</Text>
              <Text style={{ color: 'rgba(255,255,255,0.8)', marginBottom: 20, fontSize: 15, lineHeight: 22 }}>
                Le 3114 est disponible 24h/24, gratuit et anonyme.
              </Text>
              <TouchableOpacity onPress={() => openPhone('3114')} style={{ backgroundColor: '#fff', borderRadius: 50, paddingVertical: 16 }}>
                <Text style={{ textAlign: 'center', fontSize: 20, fontWeight: '900', color: '#DC2626', textTransform: 'uppercase' }}>Appeler le 3114</Text>
              </TouchableOpacity>
            </View>

            {/* Services */}
            {priority.length > 0 && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', paddingHorizontal: 4 }}>Services</Text>
                {priority.map(renderContactCard)}
              </>
            )}

            {/* Therapists */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 }}>
              <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase' }}>Therapeutes</Text>
              {locationLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : userCoords ? (
                <View style={{ backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#9896D4', textTransform: 'uppercase' }}>Geolocalise</Text>
                </View>
              ) : (
                <TouchableOpacity onPress={requestLocation} style={{ backgroundColor: '#F2F2F7', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 }}>
                  <Text style={{ fontSize: 9, fontWeight: '900', color: '#000', textTransform: 'uppercase' }}>Activer GPS</Text>
                </TouchableOpacity>
              )}
            </View>

            {locationError && (
              <View style={{ borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.12)', padding: 16 }}>
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontSize: 12, textAlign: 'center', fontStyle: 'italic' }}>{locationError}</Text>
              </View>
            )}

            <View style={{ borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.08)', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Text style={{ fontSize: 16 }}>{userCoords ? '📍' : '⭐'}</Text>
              <Text style={{ color: 'rgba(255,255,255,0.5)', fontSize: 11, flex: 1 }}>
                {userCoords ? "Classes par distance depuis votre position." : "Classes par popularite. Activez la localisation pour voir les plus proches."}
              </Text>
            </View>

            {therapists.map(renderTherapistCard)}

            {/* Other */}
            {other.length > 0 && (
              <>
                <Text style={{ fontSize: 18, fontWeight: '900', color: '#fff', textTransform: 'uppercase', paddingHorizontal: 4 }}>Autres soutiens</Text>
                {other.map(renderContactCard)}
              </>
            )}

          </View>
        </WebContainer>
      </ScrollView>
    </View>
  );
}
