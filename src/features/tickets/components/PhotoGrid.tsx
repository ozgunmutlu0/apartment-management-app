import { Image } from 'expo-image';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PressableScale } from '@/components/PressableScale';
import { useColors } from '@/theme/colors';
import { radius, space } from '@/theme/tokens';

export type PhotoGridItem = { key: string; uri: string | null };

export type PhotoGridProps = {
  photos: PhotoGridItem[];
  onPress?: (index: number) => void;
  /** Renders an overlay control (e.g. remove button) on top of a thumbnail. */
  renderOverlay?: (index: number) => React.ReactNode;
  size?: number;
};

/** Horizontal strip of rounded square thumbnails. */
export function PhotoGrid({ photos, onPress, renderOverlay, size = 96 }: PhotoGridProps) {
  const colors = useColors();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {photos.map((photo, index) => (
        <View key={photo.key}>
          <PressableScale
            accessibilityRole="imagebutton"
            disabled={!onPress || !photo.uri}
            onPress={() => onPress?.(index)}
          >
            <Image
              source={photo.uri ? { uri: photo.uri } : undefined}
              contentFit="cover"
              transition={150}
              style={[
                styles.image,
                { width: size, height: size, backgroundColor: colors.secondarySystemBackground },
              ]}
            />
          </PressableScale>
          {renderOverlay?.(index)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.md, paddingVertical: space.xs },
  image: { borderRadius: radius.control, borderCurve: 'continuous' },
});
