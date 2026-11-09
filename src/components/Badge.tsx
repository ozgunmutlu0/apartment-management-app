import { StyleSheet, Text, View } from 'react-native';

import { useToneColors, type Tone } from '@/components/IconTile';
import { radius, type } from '@/theme/tokens';

export type BadgeProps = {
  label: string;
  /** Default 'neutral'. */
  tone?: Tone;
  /** Leading colored dot. */
  dot?: boolean;
};

/** Soft pill: tinted fill, same-hue text, optional dot. */
export function Badge({ label, tone = 'neutral', dot }: BadgeProps) {
  const { fill, fg } = useToneColors(tone);
  return (
    <View style={[styles.badge, { backgroundColor: fill }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: fg }]} /> : null}
      <Text style={[styles.label, { color: fg }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    height: 24,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  label: { ...type.label },
});
