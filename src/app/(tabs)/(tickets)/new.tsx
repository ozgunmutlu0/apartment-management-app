import { MenuView } from '@expo/ui/community/menu';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthField } from '@/components/AuthField';
import { GlassCard } from '@/components/GlassCard';
import { IconTile } from '@/components/IconTile';
import { FilterChips } from '@/components/FilterChips';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SectionLabel } from '@/components/SectionLabel';
import { errorMessage, useCreateTicket } from '@/features/tickets/api';
import { CATEGORY_ICONS } from '@/features/tickets/components/CategoryIcon';
import { PhotoGrid } from '@/features/tickets/components/PhotoGrid';
import {
  DESCRIPTION_MAX,
  MAX_PHOTOS,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TITLE_MAX,
  TITLE_MIN,
  type TicketCategory,
} from '@/features/tickets/types';
import { useColors } from '@/theme/colors';
import { hitTarget, radius, space, type } from '@/theme/tokens';

const PICKER_OPTIONS = {
  mediaTypes: ['images'],
  quality: 0.6,
  exif: false,
} satisfies ImagePicker.ImagePickerOptions;

export default function NewTicketScreen() {
  const { t } = useTranslation('tickets');
  const { t: tc } = useTranslation('common');
  const router = useRouter();
  const colors = useColors();
  const create = useCreateTicket();

  const [category, setCategory] = useState<TicketCategory>('other');
  const [priorityIndex, setPriorityIndex] = useState(1);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const trimmedTitle = title.trim();
  const titleValid = trimmedTitle.length >= TITLE_MIN && trimmedTitle.length <= TITLE_MAX;
  const descriptionValid = description.length <= DESCRIPTION_MAX;

  const addPhotos = (uris: string[]) =>
    setPhotos((current) => [...current, ...uris].slice(0, MAX_PHOTOS));

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('new.cameraDenied'));
      return;
    }
    const result = await ImagePicker.launchCameraAsync(PICKER_OPTIONS);
    if (!result.canceled) addPhotos(result.assets.map((a) => a.uri));
  };

  const pickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(t('new.libraryDenied'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      ...PICKER_OPTIONS,
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
    });
    if (!result.canceled) addPhotos(result.assets.map((a) => a.uri));
  };

  const onAddPhoto = () => {
    if (photos.length >= MAX_PHOTOS) {
      Alert.alert(t('new.photoLimit', { count: MAX_PHOTOS }));
      return;
    }
    Alert.alert(t('new.addPhoto'), undefined, [
      { text: t('new.takePhoto'), onPress: () => void takePhoto() },
      { text: t('new.chooseFromLibrary'), onPress: () => void pickFromLibrary() },
      { text: tc('buttons.cancel'), style: 'cancel' },
    ]);
  };

  const onSubmit = () => {
    setSubmitted(true);
    if (!titleValid || !descriptionValid) return;
    create.mutate(
      {
        category,
        priority: TICKET_PRIORITIES[priorityIndex] ?? 'normal',
        title,
        description,
        photoUris: photos,
      },
      {
        onSuccess: ({ id, failedPhotos }) => {
          if (failedPhotos > 0) {
            Alert.alert(
              t('new.photosFailedTitle'),
              t('new.photosFailedMessage', { count: failedPhotos }),
            );
          }
          router.dismiss();
          router.push({ pathname: '/(tabs)/(tickets)/[id]', params: { id } });
        },
        onError: (error) =>
          Alert.alert(t('errors.title'), errorMessage(error) ?? t('errors.generic')),
      },
    );
  };

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={styles.content}
      style={{ backgroundColor: colors.systemGroupedBackground }}
    >
      <View>
        <SectionLabel>{t('new.category')}</SectionLabel>
        <GlassCard style={styles.group}>
          <MenuView
            title={t('new.category')}
            onPressAction={({ nativeEvent }) => setCategory(nativeEvent.event as TicketCategory)}
            actions={TICKET_CATEGORIES.map((c) => ({
              id: c,
              title: t(`category.${c}`),
              state: c === category ? 'on' : 'off',
            }))}
          >
            <View style={[styles.menuRow, { backgroundColor: colors.secondarySystemBackground }]}>
              <IconTile symbol={CATEGORY_ICONS[category]} size={36} />
              <Text style={[styles.menuText, { color: colors.label }]}>
                {t(`category.${category}`)}
              </Text>
              <SymbolView
                name={{ ios: 'chevron.up.chevron.down', android: 'unfold_more' }}
                size={14}
                tintColor={colors.secondaryLabel}
              />
            </View>
          </MenuView>
          <SectionLabel style={styles.inner}>{t('new.priority')}</SectionLabel>
          <FilterChips
            options={TICKET_PRIORITIES.map((p, i) => ({ key: String(i), label: t(`priority.${p}`) }))}
            value={String(priorityIndex)}
            onChange={(key) => setPriorityIndex(Number(key))}
            inset={16}
          />
        </GlassCard>
      </View>

      <View>
        <SectionLabel>{t('new.title')}</SectionLabel>
        <GlassCard style={styles.group}>
          <AuthField
            value={title}
            onChangeText={setTitle}
            placeholder={t('new.titlePlaceholder')}
            maxLength={TITLE_MAX}
            returnKeyType="next"
          />
          {submitted && !titleValid ? (
            <Text style={[styles.error, { color: colors.red }]}>{t('new.titleInvalid')}</Text>
          ) : null}
        </GlassCard>
      </View>

      <View>
        <SectionLabel>{t('new.description')}</SectionLabel>
        <GlassCard style={styles.group}>
          <AuthField
            value={description}
            onChangeText={setDescription}
            placeholder={t('new.descriptionPlaceholder')}
            multiline
            style={styles.multiline}
            textAlignVertical="top"
          />
          {!descriptionValid ? (
            <Text style={[styles.error, { color: colors.red }]}>{t('new.descriptionTooLong')}</Text>
          ) : null}
        </GlassCard>
      </View>

      <View>
        <SectionLabel>{`${t('new.photos')} (${photos.length}/${MAX_PHOTOS})`}</SectionLabel>
        <GlassCard style={styles.group}>
          {photos.length > 0 ? (
            <PhotoGrid
              photos={photos.map((uri) => ({ key: uri, uri }))}
              renderOverlay={(index) => (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('new.removePhoto')}
                  hitSlop={8}
                  onPress={() => setPhotos((current) => current.filter((_, i) => i !== index))}
                  style={styles.remove}
                >
                  <SymbolView
                    name={{ ios: 'xmark.circle.fill', android: 'cancel' }}
                    size={24}
                    tintColor="#FFFFFF"
                  />
                </Pressable>
              )}
            />
          ) : null}
          {photos.length < MAX_PHOTOS ? (
            <PrimaryButton
              variant="tonal"
              icon="add"
              title={t('new.addPhoto')}
              onPress={onAddPhoto}
            />
          ) : null}
        </GlassCard>
      </View>

      <PrimaryButton title={t('new.submit')} loading={create.isPending} onPress={onSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: space.lg, gap: space.xl },
  group: { gap: space.md },
  inner: { paddingTop: space.sm, paddingBottom: 0 },
  menuRow: {
    minHeight: hitTarget,
    paddingHorizontal: space.lg,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  menuText: { ...type.body, flex: 1 },
  multiline: { minHeight: 110, paddingTop: space.md },
  error: { ...type.caption },
  remove: { position: 'absolute', top: space.xs, right: space.xs },
});
