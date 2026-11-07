import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

import { useDeleteAnnouncement, useTogglePin } from '../api';
import type { Announcement } from '../types';

/** Pin/unpin and confirmed delete shared by the list and detail screens. */
export function useAnnouncementActions() {
  const { t } = useTranslation('announcements');
  const { t: tc } = useTranslation('common');
  const { mutate: mutatePin } = useTogglePin();
  const { mutate: mutateDelete } = useDeleteAnnouncement();

  const showError = useCallback(() => Alert.alert(t('errors.generic')), [t]);

  const pin = useCallback(
    (a: Announcement) => mutatePin({ id: a.id, pinned: !a.pinned }, { onError: showError }),
    [mutatePin, showError],
  );

  const confirmDelete = useCallback(
    (a: Announcement, onDeleted?: () => void) =>
      Alert.alert(t('delete.title'), t('delete.message'), [
        { text: tc('buttons.cancel'), style: 'cancel' },
        {
          text: tc('buttons.delete'),
          style: 'destructive',
          onPress: () => mutateDelete(a.id, { onSuccess: onDeleted, onError: showError }),
        },
      ]),
    [t, tc, mutateDelete, showError],
  );

  return { pin, confirmDelete };
}
