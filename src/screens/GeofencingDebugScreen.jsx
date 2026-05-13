/**
 * GeofencingDebugScreen.jsx
 *
 * Écran de debug / DÉMO LIVE géofencing QFind.
 * Affiche en temps réel :
 *   - État permissions + géofencing actif/inactif
 *   - Liste des zones actives (shop, lat, lng, radius)
 *   - Dernier event déclenché (uuid, storeId, timestamp, platform)
 *   - Feed live des 5 derniers logs géofencing
 *   - Bouton "Simuler Entrée" pour la démo
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Location from 'expo-location';
import {
  isGeofencingActive,
  startGeofencing,
  stopGeofencing,
  onEnterGeofence,
} from '../geofencing/GeofencingManager';
import {
  flushEventQueue,
  getLastGeofenceEventDebug,
} from '../services/GeofenceEventService';
import { getQueueSize, getQueueStats } from '../services/EventQueue';
import {
  exportLogsAsString,
  clearLogs,
  getLogs,
  loadLogs,
} from '../services/LoggingService';
import { buildGeofenceRegions } from '../geofencing/regions';
import { getDeviceUUID, clearDeviceUUID } from '../utils/deviceUUID';
import {
  getBleActivationState,
  deactivateBleEmission,
} from '../services/BleActivationService';

const POLL_INTERVAL_MS = 3000;

export function GeofencingDebugScreen() {
  const [geofencingActive, setGeofencingActive] = useState(null);
  const [permissions, setPermissions] = useState({ fg: '?', bg: '?' });
  const [activeRegions, setActiveRegions] = useState([]);
  const [lastEvent, setLastEvent] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [queueSize, setQueueSize] = useState(0);
  const [queueStats, setQueueStats] = useState(null);
  const [bleState, setBleState] = useState(null);
  const [deviceUUID, setDeviceUUID] = useState('');
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const pollRef = useRef(null);

  // ── helpers ──────────────────────────────────────────────────────────────

  const checkPermissions = useCallback(async () => {
    const fg = await Location.getForegroundPermissionsAsync();
    const bg = await Location.getBackgroundPermissionsAsync();
    setPermissions({ fg: fg.status, bg: bg.status });
  }, []);

  const refreshLiveFeed = useCallback(async () => {
    // Recharge depuis AsyncStorage pour capter les events background
    await loadLogs();
    const allLogs = getLogs({ module: 'GeofencingManager' });
    const enterLogs = allLogs
      .filter((l) => l.message === 'Geofence entered' || l.message === 'Event sent successfully')
      .slice(-5)
      .reverse();
    setRecentLogs(enterLogs);
  }, []);

  const refreshState = useCallback(async () => {
    setLoading(true);
    await checkPermissions();
    const [active, qSize, qStats, uuid, regions, lastDebugEvent, nextBleState] = await Promise.all([
      isGeofencingActive(),
      getQueueSize(),
      getQueueStats(),
      getDeviceUUID(),
      buildGeofenceRegions(),
      getLastGeofenceEventDebug(),
      getBleActivationState(),
    ]);
    setGeofencingActive(active);
    setQueueSize(qSize);
    setQueueStats(qStats);
    setDeviceUUID(uuid);
    setActiveRegions(regions);
    setLastEvent(lastDebugEvent);
    setBleState(nextBleState);
    await refreshLiveFeed();
    setLoading(false);
  }, [checkPermissions, refreshLiveFeed]);

  // ── mount + auto-poll ────────────────────────────────────────────────────

  useEffect(() => {
    refreshState();
    pollRef.current = setInterval(refreshLiveFeed, POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────

  async function handleToggleGeofencing() {
    try {
      if (geofencingActive) {
        await stopGeofencing();
      } else {
        await startGeofencing();
      }
      refreshState();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Erreur inconnue'
      );
    }
  }

  async function handleExportLogs() {
    try {
      const logs = exportLogsAsString();
      await Clipboard.setStringAsync(logs);
      Alert.alert('Logs Exportés', `Copiés dans le presse-papiers`);
    } catch (error) {
      Alert.alert('Erreur', error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }

  async function handleClearLogs() {
    Alert.alert('Confirmer', 'Vider les logs?', [
      { text: 'Annuler' },
      {
        text: 'Vider',
        onPress: async () => {
          await clearLogs();
          setRecentLogs([]);
          setLastEvent(null);
        },
      },
    ]);
  }

  async function handleClearUUID() {
    Alert.alert('Confirmer', "Supprimer l'UUID device?", [
      { text: 'Annuler' },
      {
        text: 'Supprimer',
        onPress: async () => {
          await clearDeviceUUID();
          Alert.alert("UUID supprimé. Redémarrer l'app.");
        },
      },
    ]);
  }

  // ── DÉMO : simuler une entrée dans la première zone ──────────────────────
  async function handleSimulateEnter() {
    if (activeRegions.length === 0) {
      Alert.alert('Aucune zone', 'Lance le géofencing d\'abord.');
      return;
    }
    setSimulating(true);
    try {
      const region = activeRegions[0];
      await onEnterGeofence(region.identifier, 'debug_manual');
      await refreshState();
    } catch (err) {
      Alert.alert('Erreur simulation', err instanceof Error ? err.message : String(err));
    } finally {
      setSimulating(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={{ padding: 24, fontSize: 16 }}>Chargement...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>

      {/* ── Header ── */}
      <View style={styles.section}>
        <Text style={styles.title}>🐛 Debug Géofencing QFind</Text>
        <Text style={styles.subtitle}>Auto-refresh toutes les {POLL_INTERVAL_MS / 1000}s</Text>
      </View>

      {/* ── Permissions ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🔐 Permissions</Text>
        <View style={styles.row}>
          <PermBadge label="Foreground" status={permissions.fg} />
          <PermBadge label="Background" status={permissions.bg} />
        </View>
      </View>

      {/* ── Géofencing on/off ── */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>📍 Géofencing</Text>
          <View style={[styles.badge, geofencingActive ? styles.badgeActive : styles.badgeInactive]}>
            <Text style={styles.badgeText}>{geofencingActive ? 'ACTIF' : 'INACTIF'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.button, geofencingActive ? styles.buttonDanger : styles.buttonSuccess]}
          onPress={handleToggleGeofencing}
        >
          <Text style={styles.buttonText}>{geofencingActive ? '⏹ Arrêter' : '▶️ Démarrer'}</Text>
        </TouchableOpacity>
      </View>

      {/* ── DÉMO : Simuler Entrée ── */}
      <TouchableOpacity
        style={[styles.buttonDemo, simulating && { opacity: 0.6 }]}
        onPress={handleSimulateEnter}
        disabled={simulating}
      >
        <Text style={styles.buttonDemoText}>
          {simulating ? '⏳ Simulation...' : '🚀 Simuler Entrée en zone'}
        </Text>
        {activeRegions.length > 0 && (
          <Text style={styles.buttonDemoSub}>→ {activeRegions[0].identifier}</Text>
        )}
      </TouchableOpacity>

      {/* ── Zones actives ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🗺️ Zones Actives ({activeRegions.length})</Text>
        {activeRegions.length === 0 ? (
          <Text style={styles.emptyText}>Aucune zone chargée — démarrer le géofencing</Text>
        ) : (
          activeRegions.map((r, i) => (
            <View key={r.identifier} style={styles.regionRow}>
              <Text style={styles.regionName}>#{i + 1} {r.identifier}</Text>
              <Text style={styles.regionDetail}>
                {r.latitude?.toFixed(5)}, {r.longitude?.toFixed(5)} · r={r.radius}m
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Dernier event déclenché ── */}
      <View style={[styles.card, lastEvent && styles.cardHighlight]}>
        <Text style={styles.cardTitle}>⚡ Dernier Event</Text>
        {!lastEvent ? (
          <Text style={styles.emptyText}>Aucun event encore — utilise "Simuler Entrée"</Text>
        ) : (
          <View style={styles.eventBox}>
            <EventRow label="storeId" value={lastEvent.shop_id} />
            <EventRow label="uuid" value={lastEvent.owner_uuid} mono />
            <EventRow label="timestamp" value={new Date(lastEvent.entered_at).toLocaleTimeString()} />
            <EventRow label="platform" value={lastEvent.platform} />
            <EventRow label="trigger" value={lastEvent.trigger} />
            <EventRow label="envoi" value={lastEvent.send_success ? 'OK' : 'QUEUED'} />
            <EventRow label="ble" value={lastEvent.ble_active ? 'ACTIF' : 'INACTIF'} />
            {lastEvent.error ? <EventRow label="error" value={lastEvent.error} /> : null}
          </View>
        )}
      </View>

      {/* ── BLE (stub démo) ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📶 BLE Emission</Text>
        <EventRow label="etat" value={bleState?.active ? 'ACTIF' : 'INACTIF'} />
        <EventRow label="mode" value={bleState?.mode ?? 'stub'} />
        <EventRow label="store" value={bleState?.sourceStoreId ?? '-'} />
        <EventRow
          label="active_at"
          value={bleState?.lastActivatedAt ? new Date(bleState.lastActivatedAt).toLocaleTimeString() : '-'}
        />
        <Text style={styles.emptyText}>{bleState?.note}</Text>
        <TouchableOpacity
          style={[styles.button, styles.buttonWarning, { marginTop: 8 }]}
          onPress={async () => {
            await deactivateBleEmission('debug_reset');
            await refreshState();
          }}
        >
          <Text style={styles.buttonText}>Reset BLE state</Text>
        </TouchableOpacity>
      </View>

      {/* ── Feed live logs géofencing ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📡 Feed Live (5 derniers)</Text>
        {recentLogs.length === 0 ? (
          <Text style={styles.emptyText}>Aucun log géofencing pour l'instant</Text>
        ) : (
          recentLogs.map((entry, i) => (
            <View key={i} style={styles.logRow}>
              <Text style={styles.logTime}>{new Date(entry.timestamp).toLocaleTimeString()}</Text>
              <Text style={styles.logMsg}>
                {entry.message}
                {entry.metadata?.shop_id ? ` · ${entry.metadata.shop_id}` : ''}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* ── Queue ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📤 Queue ({queueSize} events)</Text>
        {queueStats ? (
          <Text style={styles.infoValue}>
            retry_ready={queueStats.readyToRetry} · failed={queueStats.failedEvents} · avg_attempts={queueStats.avgAttempts}
          </Text>
        ) : null}
        <TouchableOpacity style={styles.buttonSuccess} onPress={async () => {
          const r = await flushEventQueue();
          Alert.alert('Flush', `✅ ${r.sent} envoyés · ❌ ${r.failed} échoués`);
          refreshState();
        }}>
          <Text style={styles.buttonText}>🔄 Flush Queue</Text>
        </TouchableOpacity>
      </View>

      {/* ── Device ── */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📱 Device UUID</Text>
        <Text style={styles.infoValue} selectable>{deviceUUID}</Text>
        <TouchableOpacity style={[styles.button, styles.buttonDanger, { marginTop: 8 }]} onPress={handleClearUUID}>
          <Text style={styles.buttonText}>🗑️ Reset UUID</Text>
        </TouchableOpacity>
      </View>

      {/* ── Boutons utilitaires ── */}
      <TouchableOpacity style={styles.buttonPrimary} onPress={refreshState}>
        <Text style={styles.buttonText}>🔄 Refresh manuel</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonWarning]} onPress={handleExportLogs}>
        <Text style={styles.buttonText}>📋 Copier tous les logs</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.buttonWarning]} onPress={handleClearLogs}>
        <Text style={styles.buttonText}>🗑️ Vider les logs</Text>
      </TouchableOpacity>

    </ScrollView>
  );
}

// ── Sous-composants légers ─────────────────────────────────────────────────

function PermBadge({ label, status }) {
  const ok = status === 'granted';
  return (
    <View style={[permStyles.badge, ok ? permStyles.ok : permStyles.ko]}>
      <Text style={permStyles.label}>{label}</Text>
      <Text style={permStyles.status}>{ok ? '✅ granted' : `❌ ${status}`}</Text>
    </View>
  );
}

function EventRow({ label, value, mono = false }) {
  return (
    <View style={evtStyles.row}>
      <Text style={evtStyles.label}>{label}</Text>
      <Text style={[evtStyles.value, mono && evtStyles.mono]} selectable>{value}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────

const permStyles = StyleSheet.create({
  badge: { flex: 1, borderRadius: 6, padding: 10, margin: 4, alignItems: 'center' },
  ok: { backgroundColor: '#E8F5E9' },
  ko: { backgroundColor: '#FFEBEE' },
  label: { fontSize: 11, color: '#555', marginBottom: 2 },
  status: { fontSize: 13, fontWeight: '600' },
});

const evtStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  label: { fontSize: 12, color: '#888', flex: 1 },
  value: { fontSize: 12, fontWeight: '600', color: '#222', flex: 2, textAlign: 'right' },
  mono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  content: { padding: 16, paddingBottom: 48 },
  section: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#222' },
  subtitle: { fontSize: 12, color: '#888', marginTop: 2 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHighlight: { borderWidth: 2, borderColor: '#4CAF50' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8 },
  badge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  badgeActive: { backgroundColor: '#4CAF50' },
  badgeInactive: { backgroundColor: '#f44336' },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  regionRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  regionName: { fontSize: 13, fontWeight: '600', color: '#333' },
  regionDetail: { fontSize: 11, color: '#888', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  eventBox: { marginTop: 4 },
  logRow: { flexDirection: 'row', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f5f5f5' },
  logTime: { fontSize: 11, color: '#999', marginRight: 8, width: 70 },
  logMsg: { fontSize: 12, color: '#333', flex: 1 },
  emptyText: { fontSize: 13, color: '#aaa', fontStyle: 'italic' },
  infoValue: { fontSize: 12, color: '#333', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
  button: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonPrimary: { backgroundColor: '#2196F3', paddingVertical: 14, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonSuccess: { backgroundColor: '#4CAF50', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonWarning: { backgroundColor: '#FF9800', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonDanger: { backgroundColor: '#f44336', paddingVertical: 12, borderRadius: 6, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  buttonDemo: {
    backgroundColor: '#7C3AED',
    paddingVertical: 18,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 6,
  },
  buttonDemoText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  buttonDemoSub: { color: '#DDD6FE', fontSize: 11, marginTop: 2 },
});

