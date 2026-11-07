import { MenuView } from '@expo/ui/community/menu';
import { SegmentedControl } from '@expo/ui/community/segmented-control';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { AuthField } from '@/components/AuthField';
import { PrimaryButton } from '@/components/PrimaryButton';
import { errorMessage, useCreateTicket } from '@/features/tickets/api';
import { CategoryIcon } from '@/features/tickets/components/CategoryIcon';
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

  const labelStyle = [styles.label, { color: colors.secondaryLabel }];

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      contentContainerStyle={styles.content}
    >
      <View style={styles.field}>
        <Text style={labelStyle}>{t('new.category')}</Text>
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
            <CategoryIcon category={category} size={22} />
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
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>{t('new.priority')}</Text>
        <SegmentedControl
          values={TICKET_PRIORITIES.map((p) => t(`priority.${p}`))}
          selectedIndex={priorityIndex}
          onChange={(event) => setPriorityIndex(event.nativeEvent.selectedSegmentIndex)}
        />
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>{t('new.title')}</Text>
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
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>{t('new.description')}</Text>
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
      </View>

      <View style={styles.field}>
        <Text style={labelStyle}>
          {t('new.photos')} ({photos.length}/{MAX_PHOTOS})
        </Text>
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
        {photos.length < MAX_PHOTOS ? (
          <PrimaryButton variant="plain" title={t('new.addPhoto')} onPress={onAddPhoto} />
        ) : null}
      </View>

      <PrimaryButton title={t('new.submit')} loading={create.isPending} onPress={onSubmit} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 20 },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase' },
  menuRow: {
    minHeight: 48,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderCurve: 'continuous',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  menuText: { flex: 1, fontSize: 17 },
  multiline: { minHeight: 110, paddingTop: 12 },
  error: { fontSize: 13 },
  remove: { position: 'absolute', top: 4, right: 4 },
});
