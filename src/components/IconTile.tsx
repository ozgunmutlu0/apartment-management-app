import { SymbolView, type AndroidSymbol, type SFSymbol } from 'expo-symbols';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { ICONS, type IconName } from '@/components/Icon';
import { useColors } from '@/theme/colors';
import { radius } from '@/theme/tokens';

export type Tone = 'tint' | 'green' | 'orange' | 'red' | 'blue' | 'neutral';

/** Soft fill and same-hue foreground for a tone. Shared by IconTile and Badge. */
export function useToneColors(tone: Tone): { fill: ColorValue; fg: ColorValue } {
  const c = useColors();
  switch (tone) {
    case 'green':
      return { fill: c.greenSoft, fg: c.green };
    case 'orange':
      return { fill: c.orangeSoft, fg: c.orange };
    case 'red':
      return { fill: c.redSoft, fg: c.red };
    case 'blue':
      return { fill: c.blueSoft, fg: c.blue };
    case 'neutral':
      return { fill: c.secondarySystemBackground, fg: c.secondaryLabel };
    default:
      return { fill: c.tintSoft, fg: c.tint };
  }
}

export type IconTileProps = {
  /** Named icon from ICONS. Ignored when `symbol` is given. */
  name?: IconName;
  /** Custom SF Symbol / Material Symbol pair. */
  symbol?: { ios: SFSymbol; android: AndroidSymbol };
  /** 36 / 44 / 56. Default 44. */
  size?: 36 | 44 | 56;
  /** Default 'tint'. Categories must all share one tone; do not rainbow them. */
  tone?: Tone;
};

/** Rounded square with a soft tinted fill and a centered glyph. */
export function IconTile({ name, symbol, size = 44, tone = 'tint' }: IconTileProps) {
  const { fill, fg } = useToneColors(tone);
  const glyph = symbol ?? (name ? ICONS[name] : undefined);
  return (
    <View style={[styles.tile, { width: size, height: size, backgroundColor: fill }]}>
      {glyph ? <SymbolView name={glyph} size={Math.round(size * 0.5)} tintColor={fg} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    borderRadius: radius.tile,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
