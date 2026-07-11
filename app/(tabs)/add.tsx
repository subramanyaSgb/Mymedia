import { Redirect } from 'expo-router';

// The Add tab press is intercepted in _layout to open /manual directly.
// This route only renders if reached programmatically — redirect to the form.
export default function AddScreen() {
  return <Redirect href="/manual" />;
}
