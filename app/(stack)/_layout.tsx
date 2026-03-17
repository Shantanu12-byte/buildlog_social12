import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function StackLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="light" />
    </>
  );
}