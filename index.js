import 'expo-dev-client';
import { registerRootComponent } from 'expo';

// ⚠️ Obligatoire : enregistre la tâche background TaskManager au démarrage de l'app
// Doit être importé au niveau racine, avant registerRootComponent
import './src/geofencing/GeofencingManager';

import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
