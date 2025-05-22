import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function WaveformVisualizer({ waveform, width = 200, height = 60 }) {
  if (!waveform || waveform.length === 0) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Normalize waveform data to fit within height
  const maxAmplitude = Math.max(...waveform);
  const normalizedWaveform = waveform.map(amp => (amp / maxAmplitude) * height);

  // Calculate points for the path
  const points = normalizedWaveform.map((amp, i) => {
    const x = (i / (waveform.length - 1)) * width;
    const y = (height - amp) / 2;
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={points}
          stroke="#000000"
          strokeWidth="2"
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 