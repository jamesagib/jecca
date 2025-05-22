import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue,
  withRepeat,
  withSequence,
  cancelAnimation
} from 'react-native-reanimated';

export default function WaveformVisualizer({ isRecording, amplitude }) {
  const barHeight = useSharedValue(0);

  useEffect(() => {
    if (isRecording) {
      // Animate based on amplitude (0-1)
      const targetHeight = 20 + (amplitude * 30); // Scale amplitude to reasonable height
      barHeight.value = withSpring(targetHeight, {
        damping: 10,
        stiffness: 100
      });
    } else {
      barHeight.value = withSpring(0);
    }

    return () => {
      cancelAnimation(barHeight);
    };
  }, [isRecording, amplitude]);

  const animatedStyle = useAnimatedStyle(() => ({
    height: barHeight.value,
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    marginBottom: 10,
  },
  bar: {
    width: 4,
    backgroundColor: '#000000',
    borderRadius: 2,
  },
}); 