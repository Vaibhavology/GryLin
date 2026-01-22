import { Stack } from 'expo-router';

export default function GmailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="connect" />
      <Stack.Screen name="accounts" />
    </Stack>
  );
}
