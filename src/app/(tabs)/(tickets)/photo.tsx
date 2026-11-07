import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useTicket } from '@/features/tickets/api';

/** Full-screen photo viewer (native full screen modal). Params: ticket `id` and photo `index`. */
export default function TicketPhotoScreen() {
  const { t } = useTranslation('tickets');
  const router = useRouter();
  const { id, index } = useLocalSearchParams<{ id: string; index?: string }>();
  const ticket = useTicket(id);
  const uri = ticket.data?.photos[Number(index ?? 0)]?.url ?? undefined;

  return (
    <View style={styles.container}>
      <Image
        source={uri ? { uri } : undefined}
        contentFit="contain"
        style={StyleSheet.absoluteFill}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('detail.close')}
        hitSlop={12}
        onPress={() => router.back()}
        style={styles.close}
      >
        <SymbolView
          name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
          size={32}
          tintColor="#FFFFFF"
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  close: { position: 'absolute', top: 56, right: 20 },
});
