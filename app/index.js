import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { storage } from './utils/storage';
import { useAuthStore } from './utils/auth';
import { View, Text } from 'react-native';

export default function StartScreen() {
  const router = useRouter();
  const { user, initialized } = useAuthStore();
  const [error, setError] = useState(null);
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    let mounted = true;
    let navigationTimeout;

    async function checkInitialRoute() {
      if (!mounted) return;
      
      try {
        console.log('Checking initial route. Auth initialized:', initialized);
        
        // Wait for auth to be initialized
        if (!initialized) {
          console.log('Auth not yet initialized, waiting...');
          return;
        }

        // Prevent multiple navigation attempts
        if (isNavigating) {
          console.log('Navigation already in progress...');
          return;
        }

        setIsNavigating(true);

        let onboardingComplete = false;
        try {
          const status = await storage.getItem('onboardingComplete');
          onboardingComplete = status === 'true';
          console.log('Onboarding status:', { status, onboardingComplete });
        } catch (storageError) {
          console.warn('Error reading onboarding status:', storageError);
          // Continue with default false value
        }
        
        const targetRoute = onboardingComplete ? '/tabs/today' : '/onboarding1';
        console.log('Navigating to:', targetRoute);
        
        try {
          await router.replace(targetRoute);
        } catch (navigationError) {
          console.error('Navigation failed:', navigationError);
          
          if (mounted) {
            // If navigation fails, try one more time after a short delay
            navigationTimeout = setTimeout(async () => {
              try {
                await router.replace(targetRoute);
              } catch (retryError) {
                console.error('Retry navigation failed:', retryError);
                setError('Unable to navigate to the initial screen. Please restart the app.');
              }
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Fatal error in checkInitialRoute:', error);
        if (mounted) {
          // In case of a fatal error, try to reset to onboarding
          try {
            await storage.setItem('onboardingComplete', 'false');
            await router.replace('/onboarding1');
          } catch (fallbackError) {
            console.error('Even fallback navigation failed:', fallbackError);
            setError('A critical error occurred. Please restart the app.');
          }
        }
      } finally {
        if (mounted) {
          setIsNavigating(false);
        }
      }
    }

    checkInitialRoute();

    return () => {
      mounted = false;
      if (navigationTimeout) {
        clearTimeout(navigationTimeout);
      }
    };
  }, [user, initialized, router, isNavigating]);

  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20
      }}>
        <Text style={{ 
          fontSize: 18,
          color: '#000000',
          textAlign: 'center',
          marginBottom: 10
        }}>
          {error}
        </Text>
      </View>
    );
  }

  // Show a loading state
  return (
    <View style={{ 
      flex: 1, 
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center'
    }}>
      <Text style={{ 
        fontSize: 18,
        color: '#000000'
      }}>
        Loading...
      </Text>
    </View>
  );
}