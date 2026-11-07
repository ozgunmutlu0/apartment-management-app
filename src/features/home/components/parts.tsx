import { GlassContainer } from 'expo-glass-effect';
import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import { Icon, type IconName } from '@/components/Icon';
import { useColors } from '@/theme/colors';

/** Section title with an optional "see all" link. */
export function SectionHeader({
  title,
  href,
  linkLabel,
}: {
  title: string;
  href?: Href;
  linkLabel?: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.header}>
      <Text accessibilityRole="header" style={[styles.headerTitle, { color: colors.label }]}>
        {title}
      </Text>
      {href && linkLabel ? (
        <Link href={href} style={[styles.link, { color: colors.tint }]}>
          {linkLabel}
        </Link>
      ) : null}
    </View>
  );
}

export type Tile = {
  key: string;
  label: string;
  value: string | number;
  color: ColorValue;
  href?: Href;
};

/** Grid of stat tiles; GlassContainer lets the glass surfaces blend on iOS 26. */
export function StatTiles({ tiles }: { tiles: Tile[] }) {
  const colors = useColors();
  return (
    <GlassContainer spacing={10} style={styles.tiles}>
      {tiles.map((tile) => {
        const body = (
          <GlassCard padding={14} style={styles.tile}>
            <Text style={[styles.tileValue, { color: tile.color }]}>{tile.value}</Text>
            <Text style={[styles.tileLabel, { color: colors.secondaryLabel }]}>{tile.label}</Text>
          </GlassCard>
        );
        return (
          <View key={tile.key} style={styles.tileCell}>
            {tile.href ? (
              <Link href={tile.href} asChild>
                <Pressable
                  accessibilityRole="button"
                  style={({ pressed }) => pressed && styles.pressed}
                >
                  {body}
                </Pressable>
              </Link>
            ) : (
              body
            )}
          </View>
        );
      })}
    </GlassContainer>
  );
}

export type QuickAction = { key: string; label: string; icon: IconName; href: Href };

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const colors = useColors();
  return (
    <GlassContainer spacing={10} style={styles.tiles}>
      {actions.map((action) => (
        <View key={action.key} style={styles.tileCell}>
          <Link href={action.href} asChild>
            <Pressable
              accessibilityRole="button"
              style={({ pressed }) => pressed && styles.pressed}
            >
              <GlassCard padding={14} style={styles.action}>
                <Icon name={action.icon} size={24} />
                <Text style={[styles.actionLabel, { color: colors.label }]}>{action.label}</Text>
              </GlassCard>
            </Pressable>
          </Link>
        </View>
      ))}
    </GlassContainer>
  );
}

/** Wrapper for card content that may be empty / loading. */
export function Muted({ children }: { children: ReactNode }) {
  const colors = useColors();
  return <Text style={[styles.muted, { color: colors.secondaryLabel }]}>{children}</Text>;
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  link: { fontSize: 15 },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  tileCell: { flexGrow: 1, flexBasis: '45%' },
  tile: { gap: 2 },
  tileValue: { fontSize: 28, fontWeight: '700' },
  tileLabel: { fontSize: 13 },
  action: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  actionLabel: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  pressed: { opacity: 0.7 },
  muted: { fontSize: 15 },
});
