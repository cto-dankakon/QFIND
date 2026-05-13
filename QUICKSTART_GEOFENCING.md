# Quickstart — Géofencing Android QFind (5 min)

## Démarrer en 5 étapes

### 1 Vérifier que tout est en place

```bash
# Le code existant + améliorations devraient être là:
src/
├── services/
│   ├── EventQueue.ts                
│   ├── GeofenceEventService.ts       
│   └── LoggingService.ts             
├── geofencing/
│   ├── GeofencingManager.ts           (modifié)
│   └── regions.ts                     (modifié)
├── hooks/
│   └── useGeofencing.ts               (modifié)
└── types/
    └── validation.ts                 
```

### 2 Optionnel: Activer le Debug Screen

Ajouter route dans `AppNavigator.jsx`:

```jsx
import { GeofencingDebugScreen } from '../screens/GeofencingDebugScreen';

// Dans Stack.Navigator:
<Stack.Screen 
  name="GeofencingDebug" 
  component={GeofencingDebugScreen}
  options={{ title: '🐛 Debug Géofencing' }}
/>

// Ajouter un bouton dans Settings pour y accéder:
<Button 
  title="🐛 Debug Géofencing" 
  onPress={() => navigation.navigate('GeofencingDebug')} 
/>
```

### 3 Tester en local (Émulateur)

```bash
# Build + run sur émulateur Android
npm run android

# Ou:
expo run:android

# Puis ouvrir Extended Controls > Location > Define location:
# Lat: 48.8566 (Paris comme exemple)
# Lng: 2.3522
# Simuler entrée/sortie magasin
```

### 4 Tester sur Device Réel

```bash
# Build APK
npm run build android
# Ou:
eas build --platform android

# Installer sur device:
adb install -r app-release.apk

# Vérifier logs:
adb logcat | grep -i "qfind\|geofence"

# Marcher vers magasin = event devrait arriver
```

### 5 Vérifier dans Supabase

```sql
-- Query les événements geofence reçus:
SELECT 
  owner_uuid,
  shop_id,
  entered_at,
  platform
FROM shop_visits
WHERE platform = 'android'
ORDER BY created_at DESC
LIMIT 10;

-- Doit afficher:
-- owner_uuid: UUID du device
-- shop_id: UUID du magasin
-- entered_at: ISO 8601 timestamp
-- platform: "android"
```

---

## Debugging Rapide

| Problème | Solution |
|----------|----------|
| **Géofence pas déclenche** | Vérifier Settings > Location = "Always". Shops ont GPS? |
| **Événement pas envoyé** | Ouvrir Debug Screen → taper "Flush Queue" |
| **Offline event perdu?** | Dans Debug Screen → voir Queue size > 0? |
| **UUID différent chaque fois?** | Problème AsyncStorage. Vérifier permissions. |
| **Logs pleins?** | Debug Screen → "Vider Logs" |

---

##  Checklist Avant Tests

- [ ] App.jsx importe `useGeofencing`  (déjà fait)
- [ ] app.json a permissions Android  (déjà fait)
- [ ] `sendGeofenceEvent()` utilise `GeofenceEventService`  (déjà fait)
- [ ] 2-3 magasins existent avec GPS en Supabase
- [ ] APK buildée et installée sur device

---

## Checklist Tests (30 min)

```
[ ] Test 1: App lance → "ACTIF" en logs
[ ] Test 2: Marcher vers magasin → Supabase reçoit event
[ ] Test 3: App fermée → geofence trigger quand même
[ ] Test 4: WiFi off → event en queue → WiFi on → flush
[ ] Test 5: UUID persiste après reboot
```

---

## Help

- **Doc complète?** → Lire `GEOFENCING_IMPLEMENTATION.md`
- **Quoi implémenter?** → Voir `GEOFENCING_TODO.md`
- **Code overview?** → Voir `GEOFENCING_SUMMARY.md`
- **Questions?** → Vérifier TROUBLESHOOTING section dans docs

---

## Succès = Quand...

```
 App démarre → permission dialog
 Accepter permissions → "ACTIF" en logs
 Marcher vers magasin → event dans Supabase
 App fermée → geofence trigger en background
 Format JSON correct: owner_uuid, shop_id, entered_at, platform
```

**Tu peux commencer les tests maintenant!**

