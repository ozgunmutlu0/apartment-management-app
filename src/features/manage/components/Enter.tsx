import type { ReactNode } from 'react';
import Animated, { FadeInDown, useReducedMotion } from 'react-native-reanimated';

/** Short staggered entrance for top-level screen blocks (static under reduced motion). */
export function Enter({ index, children }: { index: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  return (
    <Animated.View entering={reduced ? undefined : FadeInDown.delay(index * 40).duration(280)}>
      {children}
    </Animated.View>
  );
}
