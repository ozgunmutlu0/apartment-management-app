import { useEffect } from 'react';
import type { ColorValue, DimensionValue } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { useColors } from '@/theme/colors';
import { radius as radii } from '@/theme/tokens';

export type SkeletonProps = {
  width?: DimensionValue;
  height?: number;
  radius?: number;
  /** Fill override (default: neutral surface). */
  color?: ColorValue;
};

/** Pulsing placeholder block (static with reduced motion). */
export function Skeleton({
  width = '100%',
  height = 16,
  radius = radii.tile,
  color,
}: SkeletonProps) {
  const colors = useColors();
  const reduced = useReducedMotion();
  const pulse = useSharedValue(0);

  useEffect(() => {
    if (reduced) return;
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [reduced, pulse]);

  const animated = useAnimatedStyle(() => ({ opacity: reduced ? 1 : 1 - pulse.value * 0.5 }));

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: color ?? colors.secondarySystemBackground },
        animated,
      ]}
    />
  );
}
