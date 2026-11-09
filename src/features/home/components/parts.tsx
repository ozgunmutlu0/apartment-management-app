import { Link, type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, useColorScheme, type ColorValue } from 'react-native';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

import { Avatar } from '@/components/Avatar';
import { GlassCard } from '@/components/GlassCard';
import { Icon, type IconName } from '@/components/Icon';
import { IconTile, type Tone } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { StatTile } from '@/components/StatTile';
import { useColors } from '@/theme/colors';
import { elevation, fonts, radius, space, type } from '@/theme/tokens';

/** Staggered fade-in for a main block (40ms per step); off under reduced motion. */
export function Reveal({ index, children }: { index: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View
      entering={reduced ? undefined : FadeInDown.delay(Math.min(index, 8) * 40).duration(320)}
    >
      {children}
    </Animated.View>
  );
}

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

/** In-content header: avatar, greeting + first name, notification bell; building line below. */
export function TopBlock({
  fullName,
  greeting,
  displayName,
  context,
  unread,
  bellLabel,
  onBellPress,
}: {
  fullName: string | null | undefined;
  greeting: string;
  displayName: string;
  context: string | null;
  unread: number;
  bellLabel: string;
  onBellPress: () => void;
}) {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  return (
    <View style={styles.top}>
      <View style={styles.topRow}>
        <Avatar name={fullName} size={56} />
        <View style={styles.topText}>
          <Text style={[styles.greeting, { color: colors.secondaryLabel }]} numberOfLines={1}>
            {greeting}
          </Text>
          <Text
            style={[styles.name, { color: colors.label }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            accessibilityRole="header"
          >
            {displayName}
          </Text>
        </View>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={bellLabel}
          onPress={onBellPress}
          style={[
            styles.bell,
            { backgroundColor: colors.secondarySystemGroupedBackground },
            dark
              ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
              : elevation.card,
          ]}
        >
          <Icon name="bell" size={22} color={colors.label} />
          {unread > 0 ? (
            <View style={[styles.badge, { backgroundColor: colors.red }]}>
              <Text style={[styles.badgeText, { color: colors.onTint }]}>
                {unread > 9 ? '9+' : unread}
              </Text>
            </View>
          ) : null}
        </PressableScale>
      </View>
      {context ? (
        <View style={styles.contextRow}>
          <SymbolView
            name={{ ios: 'building.2.fill', android: 'apartment' }}
            size={16}
            tintColor={colors.tertiaryLabel}
          />
          <Text style={[styles.context, { color: colors.secondaryLabel }]} numberOfLines={1}>
            {context}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Translucent on-accent chip for a HeroCard: glyph, value, label. Optionally a link. */
export function HeroChip({
  icon,
  value,
  label,
  href,
}: {
  icon: IconName;
  value: number | string;
  label: string;
  href?: Href;
}) {
  const colors = useColors();
  const body = (
    <>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.onHero, opacity: 0.16 }]} />
      <Icon name={icon} size={18} color={colors.onHero} />
      <Text style={[styles.chipValue, { color: colors.onHero }]}>{value}</Text>
      <Text style={[styles.chipLabel, { color: colors.onHero }]} numberOfLines={1}>
        {label}
      </Text>
    </>
  );
  if (!href) {
    return (
      <View accessible accessibilityLabel={`${value} ${label}`} style={styles.chip}>
        {body}
      </View>
    );
  }
  return (
    <Link href={href} asChild>
      <PressableScale
        accessibilityRole="link"
        accessibilityLabel={`${value} ${label}`}
        style={styles.chip}
      >
        {body}
      </PressableScale>
    </Link>
  );
}

/** Placeholder lines for a loading HeroCard. */
export function HeroSkeleton() {
  const colors = useColors();
  return (
    <View style={styles.heroSkeleton}>
      <Skeleton width="40%" height={14} color={colors.onHero} />
      <Skeleton width="60%" height={44} color={colors.onHero} />
      <Skeleton width="45%" height={14} color={colors.onHero} />
    </View>
  );
}

/** Slim stacked bar, one rounded segment per status, proportional to its count. */
export function DistributionBar({
  segments,
  label,
}: {
  segments: { key: string; count: number; color: ColorValue }[];
  label: string;
}) {
  const visible = segments.filter((s) => s.count > 0);
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={label} style={styles.bar}>
      {visible.map((s) => (
        <View key={s.key} style={{ flex: s.count, backgroundColor: s.color }} />
      ))}
    </View>
  );
}

export type Tile = {
  key: string;
  label: string;
  value: number;
  tone: Tone;
  icon: IconName;
  href?: Href;
};

/**
 * Two-column grid of StatTiles in equal-height rows.
 */
export function StatGrid({ tiles }: { tiles: Tile[] }) {
  const rows: Tile[][] = [];
  for (let i = 0; i < tiles.length; i += 2) rows.push(tiles.slice(i, i + 2));
  return (
    <View style={styles.grid}>
      {rows.map((row) => (
        <View key={row[0]?.key} style={styles.gridRow}>
          {row.map((tile) => (
            <StatTile
              key={tile.key}
              value={tile.value}
              label={tile.label}
              tone={tile.tone}
              icon={tile.icon}
              href={tile.href}
            />
          ))}
          {row.length === 1 ? <View style={styles.gridSpacer} /> : null}
        </View>
      ))}
    </View>
  );
}

export function StatGridSkeleton({ count = 4 }: { count?: number }) {
  const rows = Math.ceil(count / 2);
  return (
    <View style={styles.grid}>
      {Array.from({ length: rows }, (_, r) => (
        <View key={r} style={styles.gridRow}>
          {[0, 1].map((c) => (
            <GlassCard key={c} padding={space.lg} style={styles.skeletonTile}>
              <Skeleton width={36} height={36} />
              <Skeleton width={48} height={30} />
              <Skeleton width="60%" height={14} />
            </GlassCard>
          ))}
        </View>
      ))}
    </View>
  );
}

/** Placeholder shaped like a list of cards. */
export function ListSkeleton({ rows = 2 }: { rows?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: rows }, (_, i) => (
        <GlassCard key={i} padding={space.lg} style={styles.listSkeletonCard}>
          <Skeleton width={44} height={44} />
          <View style={styles.listSkeletonText}>
            <Skeleton width="70%" height={16} />
            <Skeleton width="45%" height={14} />
          </View>
        </GlassCard>
      ))}
    </View>
  );
}

export type QuickAction = { key: string; label: string; icon: IconName; href: Href };

/** Equal-width, equal-height shortcut tiles in one row. */
export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const colors = useColors();
  const dark = useColorScheme() === 'dark';
  return (
    <View style={styles.actions}>
      {actions.map((action) => (
        <Link key={action.key} href={action.href} asChild>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={action.label}
            style={StyleSheet.flatten([
              styles.action,
              { backgroundColor: colors.secondarySystemGroupedBackground },
              dark
                ? { borderWidth: StyleSheet.hairlineWidth, borderColor: colors.separator }
                : elevation.card,
            ])}
          >
            <IconTile name={action.icon} size={44} solid />
            <Text numberOfLines={2} style={[styles.actionLabel, { color: colors.label }]}>
              {action.label}
            </Text>
          </PressableScale>
        </Link>
      ))}
    </View>
  );
}

/** Quiet text for empty / error states inside a section: a compact `quiet` card. */
export function Muted({ children }: { children: ReactNode }) {
  const colors = useColors();
  return (
    <GlassCard variant="quiet" padding={space.lg}>
      <Text style={[styles.muted, { color: colors.secondaryLabel }]}>{children}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  headerTitle: { ...type.title },
  link: { ...type.label },
  top: { gap: space.md },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  topText: { flex: 1, justifyContent: 'center' },
  greeting: { ...type.small },
  name: { ...type.display },
  bell: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14 },
  contextRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  context: { ...type.small, flexShrink: 1 },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    paddingHorizontal: space.md,
    paddingVertical: space.md,
    borderRadius: radius.control,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  chipValue: { ...type.bodyStrong, fontVariant: ['tabular-nums'] },
  chipLabel: { ...type.label, flexShrink: 1, opacity: 0.9 },
  heroSkeleton: { gap: space.md, opacity: 0.35 },
  bar: {
    height: 8,
    flexDirection: 'row',
    gap: 2,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  grid: { gap: space.md },
  gridRow: { flexDirection: 'row', gap: space.md },
  gridSpacer: { flex: 1 },
  skeletonTile: { flex: 1, gap: space.sm },
  list: { gap: space.md },
  listSkeletonCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  listSkeletonText: { flex: 1, gap: space.sm },
  actions: { flexDirection: 'row', gap: space.md },
  action: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: space.md,
    minHeight: 112,
    paddingVertical: space.lg,
    paddingHorizontal: space.md,
    borderRadius: radius.card,
    borderCurve: 'continuous',
  },
  actionLabel: { ...type.label },
  muted: { ...type.body },
});
