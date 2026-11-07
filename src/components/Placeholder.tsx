import { ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EmptyState } from '@/components/EmptyState';
import type { IconName } from '@/components/Icon';
import { useColors } from '@/theme/colors';

/** Temporary placeholder body used by feature screens until their work package lands. */
export function Placeholder({ icon }: { icon?: IconName }) {
  const { t } = useTranslation('common');
  const colors = useColors();
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}
      style={{ backgroundColor: colors.systemGroupedBackground }}
    >
      <EmptyState icon={icon} title={t('comingSoon')} message={t('comingSoonMessage')} />
    </ScrollView>
  );
}
