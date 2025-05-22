import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export default function WaveformVisualizer({ isRecording, amplitude, width = 200, height = 60 }) {
  const [waveformData, setWaveformData] = useState([]);
  const maxDataPoints = 50;

  useEffect(() => {
    if (isRecording) {
      setWaveformData(prevData => {
        const newData = [...prevData, amplitude];
        if (newData.length > maxDataPoints) {
          newData.shift(); // Remove oldest data point
        }
        return newData;
      });
    } else {
      setWaveformData([]); // Clear data when not recording
    }
  }, [amplitude, isRecording]);

  if (!isRecording || waveformData.length === 0) {
    return <View style={[styles.container, { width, height }]} />;
  }

  // Calculate points for the path
  const points = waveformData.map((amp, i) => {
    const x = (i / (maxDataPoints - 1)) * width;
    const y = height / 2 + (amp * height / 2);
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
    marginBottom: 20,
  },
}); 