import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface ShimmerLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function ShimmerLoader({ 
  width = '100%', 
  height = 20, 
  borderRadius: radius = 12,
  style 
}: ShimmerLoaderProps) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.4, 0.7, 0.4],
  });

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: radius,
          backgroundColor: '#E8EAED',
          opacity,
        },
        style,
      ]}
    />
  );
}

// Card Shimmer for loading states
export function CardShimmer() {
  return (
    <View style={styles.cardShimmer}>
      {/* Icon placeholder */}
      <ShimmerLoader 
        width={48} 
        height={48} 
        borderRadius={14} 
        style={{ marginRight: 14 }}
      />
      
      {/* Content placeholders */}
      <View style={{ flex: 1 }}>
        <ShimmerLoader width="65%" height={16} borderRadius={8} style={{ marginBottom: 10 }} />
        <ShimmerLoader width="45%" height={12} borderRadius={6} />
      </View>
      
      {/* Amount placeholder */}
      <ShimmerLoader width={60} height={16} borderRadius={8} />
    </View>
  );
}

// List Shimmer for loading multiple items
export function ListShimmer({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.listContainer}>
      {Array.from({ length: count }).map((_, index) => (
        <View key={index} style={[styles.listItem, index === count - 1 && styles.listItemLast]}>
          <ShimmerLoader 
            width={48} 
            height={48} 
            borderRadius={12} 
            style={{ marginRight: 14 }}
          />
          <View style={{ flex: 1 }}>
            <ShimmerLoader width="70%" height={15} borderRadius={8} style={{ marginBottom: 8 }} />
            <ShimmerLoader width="40%" height={12} borderRadius={6} />
          </View>
        </View>
      ))}
    </View>
  );
}

// Stats Shimmer
export function StatsShimmer() {
  return (
    <View style={styles.statsContainer}>
      {[1, 2, 3].map((_, index) => (
        <View key={index} style={styles.statItem}>
          <ShimmerLoader width={40} height={40} borderRadius={12} style={{ marginBottom: 10 }} />
          <ShimmerLoader width={32} height={24} borderRadius={8} style={{ marginBottom: 4 }} />
          <ShimmerLoader width={56} height={12} borderRadius={6} />
        </View>
      ))}
    </View>
  );
}

// Brief Card Shimmer
export function BriefCardShimmer() {
  return (
    <View style={styles.briefCard}>
      <View style={styles.briefHeader}>
        <ShimmerLoader width={28} height={28} borderRadius={8} />
        <ShimmerLoader width={80} height={14} borderRadius={6} style={{ marginLeft: 10 }} />
      </View>
      <ShimmerLoader width="95%" height={14} borderRadius={6} style={{ marginBottom: 8 }} />
      <ShimmerLoader width="75%" height={14} borderRadius={6} />
    </View>
  );
}

// Full Screen Shimmer
export function ScreenShimmer() {
  return (
    <View style={styles.screenContainer}>
      {/* Header */}
      <View style={styles.screenHeader}>
        <View>
          <ShimmerLoader width={100} height={14} borderRadius={6} style={{ marginBottom: 6 }} />
          <ShimmerLoader width={140} height={26} borderRadius={8} />
        </View>
        <ShimmerLoader width={40} height={40} borderRadius={20} />
      </View>
      
      {/* Stats */}
      <StatsShimmer />
      
      {/* Section */}
      <View style={styles.sectionHeader}>
        <ShimmerLoader width={120} height={16} borderRadius={8} />
        <ShimmerLoader width={50} height={14} borderRadius={6} />
      </View>
      
      {/* List */}
      <ListShimmer count={4} />
    </View>
  );
}

const styles = StyleSheet.create({
  cardShimmer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  listContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  listItemLast: {
    borderBottomWidth: 0,
  },
  statsContainer: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  briefCard: {
    backgroundColor: '#F3E8FD',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  briefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  screenHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
});
