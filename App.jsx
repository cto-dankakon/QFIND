import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { SettingsProvider } from './src/context/SettingsContext';
import { useGeofencing } from './src/hooks/useGeofencing';
import { ensureOwnerExists } from './src/utils/deviceUUID';

/**
 * Composant invisible — démarre les permissions et le géofencing au boot de l'app.
 * Séparé de App pour isoler la logique de géofencing du rendu principal.
 */
function GeofencingBootstrap() {
  const { requestPermissionsAndStart } = useGeofencing();

  useEffect(() => {
    // 1. Enregistrer l'owner en DB dès le lancement (sans bloquer)
    ensureOwnerExists();
    // 2. Démarrer le géofencing (permissions + tâche background)
    requestPermissionsAndStart();
  }, []);

  return null;
}

export default function App() {
  return (
    <SettingsProvider>
      <GeofencingBootstrap />
      <AppNavigator />
    </SettingsProvider>
  );
}
