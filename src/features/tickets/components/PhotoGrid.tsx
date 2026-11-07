import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useColors } from '@/theme/colors';

export type PhotoGridItem = { key: string; uri: string | null };

export type PhotoGridProps = {
  photos: PhotoGridItem[];
  onPress?: (index: number) => void;
  /** Renders an overlay control (e.g. remove button) on top of a thumbnail. */
  renderOverlay?: (index: number) => React.ReactNode;
  size?: number;
};

/** Horizontal strip of square thumbnails. */
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
          <Pressable
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
          </Pressable>
          {renderOverlay?.(index)}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 10, paddingVertical: 4 },
  image: { borderRadius: 12, borderCurve: 'continuous' },
});
