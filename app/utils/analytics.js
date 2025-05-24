import { PostHog } from 'posthog-react-native';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Initialize PostHog
export const posthog = new PostHog(
  'phc_M90Q8h5ohWfWzhZovi5RzN5iAYuE4Wfh6XSENCYTsDj', // Replace with your actual PostHog API key
  {
    host: 'https://app.posthog.com',
    platform: Platform.OS,
    sendFeatureFlags: true,
  }
);

// Track app crashes
export const trackError = async (error, errorInfo = {}) => {
  try {
    await posthog.capture('app_error', {
      error_message: error?.message,
      error_stack: error?.stack,
      ...errorInfo,
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version,
      build_number: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
    });
  } catch (e) {
    console.error('Failed to track error:', e);
  }
};

// Track app initialization
export const trackAppInitialization = async () => {
  try {
    await posthog.capture('app_initialized', {
      platform: Platform.OS,
      app_version: Constants.expoConfig?.version,
      build_number: Constants.expoConfig?.ios?.buildNumber || Constants.expoConfig?.android?.versionCode,
    });
  } catch (e) {
    console.error('Failed to track app initialization:', e);
  }
};

// Track successful authentication
export const trackAuthentication = async (method) => {
  try {
    await posthog.capture('authentication_success', {
      method,
      platform: Platform.OS,
    });
  } catch (e) {
    console.error('Failed to track authentication:', e);
  }
};

// Track feature usage
export const trackFeatureUsage = async (featureName, properties = {}) => {
  try {
    await posthog.capture('feature_used', {
      feature: featureName,
      ...properties,
      platform: Platform.OS,
    });
  } catch (e) {
    console.error('Failed to track feature usage:', e);
  }
}; 