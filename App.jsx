import React from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/context/SettingsContext';
import Amplify from 'aws-amplify';
import config from './src/aws-exports';

Amplify.configure(config);

export default function App() {
  return (
    <SettingsProvider>
      <AppNavigator />
    </SettingsProvider>
  );
}
