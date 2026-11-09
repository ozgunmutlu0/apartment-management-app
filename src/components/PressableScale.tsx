import type { Ref } from 'react';
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type View,
  type ViewStyle,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { press } from '@/theme/tokens';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export type PressableScaleProps = Omit<PressableProps, 'style' | 'ref'> & {
  /** Plain style only (no function form), so it also works under `<Link asChild>`. */
  style?: StyleProp<ViewStyle>;
  ref?: Ref<View>;
};

/**
 * Pressable that springs to `press.scale` while held and dims slightly. Respects reduced motion
 * (opacity only). Forwards every Pressable prop and the ref, so it works as the child of
 * `<Link asChild>` (Link injects onPress/href/ref; style is merged as given).
 */
export function PressableScale({
  style,
  onPressIn,
  onPressOut,
  ref,
  ...rest
}: PressableScaleProps) {
  const reduced = useReducedMotion();
  const progress = useSharedValue(0);

  const animated = useAnimatedStyle(() => ({
    opacity: 1 - progress.value * 0.15,
    transform: [{ scale: reduced ? 1 : 1 - progress.value * (1 - press.scale) }],
  }));

  return (
    <AnimatedPressable
      ref={ref as never}
      onPressIn={(e: GestureResponderEvent) => {
        progress.value = withSpring(1, press.spring);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        progress.value = withSpring(0, press.spring);
        onPressOut?.(e);
      }}
      style={[style, animated]}
      {...rest}
    />
  );
}
