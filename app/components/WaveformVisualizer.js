import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';

export default function WaveformVisualizer({ isRecording, amplitude = 0, width = 200, height = 60 }) {
  const [waveformData, setWaveformData] = useState([]);
  const maxDataPoints = 50;
  const minAmplitude = 0.1; // Minimum amplitude to show some movement

  useEffect(() => {
    if (isRecording) {
      setWaveformData(prevData => {
        // Ensure amplitude is never completely flat
        const normalizedAmplitude = Math.max(amplitude, minAmplitude);
        const newData = [...prevData, normalizedAmplitude];
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
    // Show a flat line when not recording
    return (
      <View style={[styles.container, { width, height }]}>
        <Svg width={width} height={height}>
          <Line
            x1="0"
            y1={height / 2}
            x2={width}
            y2={height / 2}
            stroke="#CFCFCF"
            strokeWidth="2"
          />
        </Svg>
      </View>
    );
  }

  // Calculate points for the waveform path
  const points = waveformData.map((amp, i) => {
    const x = (i / (maxDataPoints - 1)) * width;
    const normalizedAmp = Math.min(Math.max(amp, 0), 1); // Clamp between 0 and 1
    const yOffset = (normalizedAmp * height / 2);
    return {
      top: height / 2 - yOffset,
      bottom: height / 2 + yOffset,
      x
    };
  });

  // Create a continuous path that goes up and then down
  const pathData = points.reduce((path, point, i) => {
    if (i === 0) {
      return `M ${point.x} ${point.top}`;
    }
    return `${path} L ${point.x} ${point.top}`;
  }, '');

  // Add the bottom part of the waveform
  const bottomPath = points.reverse().reduce((path, point) => {
    return `${path} L ${point.x} ${point.bottom}`;
  }, pathData);

  // Close the path
  const finalPath = `${bottomPath} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Path
          d={finalPath}
          fill="#000000"
          fillOpacity="0.1"
          stroke="#000000"
          strokeWidth="2"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
  }
}); 