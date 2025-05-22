import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import Animated, { useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useThemeStore } from '../utils/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 50;
const NUM_BARS = Math.floor(SCREEN_WIDTH * 0.8 / (BAR_WIDTH + BAR_GAP));

export default function WaveformVisualizer({ isRecording, amplitude = 0 }) {
  const [bars, setBars] = useState([]);
  const { colors } = useThemeStore();

  useEffect(() => {
    if (isRecording) {
      // Add new amplitude to bars array
      setBars(prev => {
        const newBars = [...prev, amplitude];
        // Keep only the last NUM_BARS amplitudes
        return newBars.slice(-NUM_BARS);
      });
    } else {
      // Reset bars when not recording
      setBars([]);
    }
  }, [isRecording, amplitude]);

  // Generate SVG path for waveform
  const generatePath = () => {
    if (bars.length === 0) return '';

    let path = '';
    const barWidth = BAR_WIDTH;
    const gap = BAR_GAP;

    bars.forEach((amp, index) => {
      // Normalize amplitude to max height
      const height = Math.min(Math.abs(amp * MAX_HEIGHT), MAX_HEIGHT);
      const x = index * (barWidth + gap);
      const y = MAX_HEIGHT - height;

      if (index === 0) {
        path += `M ${x} ${y} `;
      } else {
        path += `L ${x} ${y} `;
      }
    });

    return path;
  };

  const animatedStyle = useAnimatedStyle(() => ({
    height: withSpring(isRecording ? MAX_HEIGHT : 0),
    opacity: withSpring(isRecording ? 1 : 0),
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <Svg width={SCREEN_WIDTH * 0.8} height={MAX_HEIGHT}>
        <Path
          d={generatePath()}
          stroke={colors.primary}
          strokeWidth={BAR_WIDTH}
          fill="none"
        />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginVertical: 10,
  },
}); 