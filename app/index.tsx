import { Redirect } from 'expo-router';
import { useAuthStore } from '../stores/authStore';

// Redirect based on auth state
export default function Index() {
  const { isAuthenticated } = useAuthStore();
  
  // If authenticated, go to tabs; otherwise go to login
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }
  
  return <Redirect href="/(auth)/login" />;
}
