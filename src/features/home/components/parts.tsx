import { Link, type Href } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

import { GlassCard } from '@/components/GlassCard';
import type { IconName } from '@/components/Icon';
import { IconTile } from '@/components/IconTile';
import { PressableScale } from '@/components/PressableScale';
import { Skeleton } from '@/components/Skeleton';
import { useColors } from '@/theme/colors';
import { hitTarget, radius, space, type } from '@/theme/tokens';

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

/**
 * Hero summary card: small context line, one big figure, optional secondary line and progress.
 * Everything sits on the accent fill, so text uses `onTint` only.
 */
export function HeroCard({
  context,
  caption,
  figure,
  figureIsMessage,
  secondary,
  progress,
  loading,
}: {
  context?: string | null;
  caption?: string;
  figure?: string;
  /** Long text instead of a number: rendered smaller. */
  figureIsMessage?: boolean;
  secondary?: string | null;
  /** 0..1, renders a thin track under the figure. */
  progress?: number;
  loading?: boolean;
}) {
  const colors = useColors();
  return (
    <GlassCard variant="tint" padding={space.xl} style={styles.hero}>
      {context ? (
        <Text style={[styles.heroContext, { color: colors.onTint }]}>{context}</Text>
      ) : null}
      {loading ? (
        <View style={styles.heroSkeleton}>
          <Skeleton width="55%" height={44} color={colors.onTint} />
          <Skeleton width="40%" height={16} color={colors.onTint} />
        </View>
      ) : (
        <>
          <View style={styles.heroBody}>
            {caption ? (
              <Text style={[styles.heroCaption, { color: colors.onTint }]}>{caption}</Text>
            ) : null}
            {figure ? (
              <Text
                numberOfLines={figureIsMessage ? 2 : 1}
                adjustsFontSizeToFit={!figureIsMessage}
                style={[
                  figureIsMessage ? styles.heroMessage : styles.heroFigure,
                  { color: colors.onTint },
                ]}
              >
                {figure}
              </Text>
            ) : null}
          </View>
          {progress !== undefined ? (
            <View
              style={styles.track}
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}
            >
              <View style={[styles.trackBase, { backgroundColor: colors.onTint }]} />
              <View
                style={[
                  styles.trackFill,
                  {
                    backgroundColor: colors.onTint,
                    width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`,
                  },
                ]}
              />
            </View>
          ) : null}
          {secondary ? (
            <Text style={[styles.heroSecondary, { color: colors.onTint }]}>{secondary}</Text>
          ) : null}
        </>
      )}
    </GlassCard>
  );
}

export type Tile = {
  key: string;
  label: string;
  value: string | number;
  color: ColorValue;
  href?: Href;
};

/** Equal-height 2-column grid of stat tiles: the figure is ink, state shows as a dot by the label. */
export function StatTiles({ tiles }: { tiles: Tile[] }) {
  const colors = useColors();
  return (
    <View style={styles.tiles}>
      {tiles.map((tile) => {
        const body = (
          <GlassCard padding={space.lg} style={styles.tile}>
            <Text style={[styles.tileValue, { color: colors.label }]}>{tile.value}</Text>
            <View style={styles.tileLabelRow}>
              <View style={[styles.dot, { backgroundColor: tile.color }]} />
              <Text numberOfLines={2} style={[styles.tileLabel, { color: colors.secondaryLabel }]}>
                {tile.label}
              </Text>
            </View>
          </GlassCard>
        );
        return (
          <View key={tile.key} style={styles.tileCell}>
            {tile.href ? (
              <Link href={tile.href} asChild>
                <PressableScale accessibilityRole="button" style={styles.fill}>
                  {body}
                </PressableScale>
              </Link>
            ) : (
              body
            )}
          </View>
        );
      })}
    </View>
  );
}

/** Placeholder shaped like StatTiles. */
export function StatTilesSkeleton({ count = 4 }: { count?: number }) {
  return (
    <View style={styles.tiles}>
      {Array.from({ length: count }, (_, i) => (
        <View key={i} style={styles.tileCell}>
          <GlassCard padding={space.lg} style={styles.tile}>
            <Skeleton width={48} height={34} />
            <Skeleton width="70%" height={14} />
          </GlassCard>
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

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  const colors = useColors();
  return (
    <View style={styles.tiles}>
      {actions.map((action) => (
        <View key={action.key} style={styles.actionCell}>
          <Link href={action.href} asChild>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={action.label}
              style={styles.fill}
            >
              <GlassCard padding={space.lg} style={styles.action}>
                <IconTile name={action.icon} size={44} />
                <Text numberOfLines={2} style={[styles.actionLabel, { color: colors.label }]}>
                  {action.label}
                </Text>
              </GlassCard>
            </PressableScale>
          </Link>
        </View>
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
  hero: { gap: space.md },
  heroContext: { ...type.label, opacity: 0.8 },
  heroBody: { gap: space.xs },
  heroCaption: { ...type.small, opacity: 0.8 },
  heroFigure: { ...type.hero, fontVariant: ['tabular-nums'] },
  heroMessage: { ...type.display },
  heroSecondary: { ...type.small, opacity: 0.8 },
  heroSkeleton: { gap: space.md, opacity: 0.35 },
  track: { height: 6, borderRadius: radius.pill, overflow: 'hidden' },
  trackBase: { ...StyleSheet.absoluteFill, opacity: 0.25 },
  trackFill: { height: 6, borderRadius: radius.pill },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: space.md },
  tileCell: { flexGrow: 1, flexBasis: '45%' },
  actionCell: { flexGrow: 1, flexBasis: '28%' },
  fill: { flex: 1 },
  tile: { flex: 1, gap: space.xs },
  tileValue: { ...type.stat, fontVariant: ['tabular-nums'] },
  tileLabelRow: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tileLabel: { ...type.label, flexShrink: 1 },
  action: { flex: 1, gap: space.md, minHeight: hitTarget },
  actionLabel: { ...type.headline },
  list: { gap: space.md },
  listSkeletonCard: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  listSkeletonText: { flex: 1, gap: space.sm },
  muted: { ...type.body },
});
