import { MenuView, type MenuAction } from '@expo/ui/community/menu';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { Announcement } from '../types';

export type AnnouncementActionsMenuProps = {
  announcement: Announcement;
  onEdit: () => void;
  onTogglePin: () => void;
  onDelete: () => void;
  /** Open on long-press (list cards) instead of tap (header button). */
  longPress?: boolean;
  children: ReactNode;
};

/** Native menu (SwiftUI ContextMenu / Compose DropdownMenu) with the manager actions. */
export function AnnouncementActionsMenu({
  announcement,
  onEdit,
  onTogglePin,
  onDelete,
  longPress,
  children,
}: AnnouncementActionsMenuProps) {
  const { t } = useTranslation('announcements');
  const { t: tc } = useTranslation('common');
  const actions: MenuAction[] = [
    { id: 'edit', title: tc('buttons.edit'), image: 'pencil' },
    {
      id: 'pin',
      title: announcement.pinned ? t('actions.unpin') : t('actions.pin'),
      image: announcement.pinned ? 'pin.slash' : 'pin',
    },
    {
      id: 'delete',
      title: tc('buttons.delete'),
      image: 'trash',
      attributes: { destructive: true },
    },
  ];
  return (
    <MenuView
      shouldOpenOnLongPress={longPress}
      actions={actions}
      onPressAction={({ nativeEvent }) => {
        if (nativeEvent.event === 'edit') onEdit();
        else if (nativeEvent.event === 'pin') onTogglePin();
        else if (nativeEvent.event === 'delete') onDelete();
      }}
    >
      {children}
    </MenuView>
  );
}
