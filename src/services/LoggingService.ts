/**
 * Service de logging persistant pour le géofencing.
 * Stocke les logs localement dans AsyncStorage (pour POC).
 * En production, utiliser Sentry/Firebase Analytics.
 * 
 * Permet de déboguer les problèmes sur devices utilisateurs.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  timestamp: string;      // ISO 8601
  level: LogLevel;
  module: string;         // ex: 'GeofencingManager', 'EventQueue'
  message: string;
  metadata?: Record<string, unknown>;
}

const LOGS_KEY = '@qfind/logs';
const MAX_LOG_ENTRIES = 500;  // Garder seulement les 500 derniers logs

let inMemoryLogs: LogEntry[] = [];  // Cache en mémoire pour rapidité

/**
 * Log une entrée.
 * Écrit dans la mémoire et AsyncStorage (async).
 */
export function log(
  level: LogLevel,
  module: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    module,
    message,
    metadata,
  };

  // En mémoire
  inMemoryLogs.push(entry);
  if (inMemoryLogs.length > MAX_LOG_ENTRIES) {
    inMemoryLogs = inMemoryLogs.slice(-MAX_LOG_ENTRIES);
  }

  // Console aussi
  const prefix = `[${module}]`;
  const msg = metadata ? `${message} ${JSON.stringify(metadata)}` : message;
  switch (level) {
    case 'DEBUG':
      console.log(prefix, msg);
      break;
    case 'INFO':
      console.log(prefix, msg);
      break;
    case 'WARN':
      console.warn(prefix, msg);
      break;
    case 'ERROR':
      console.error(prefix, msg);
      break;
  }

  // Persister en AsyncStorage (non-blocking)
  persistLogsAsync();
}

// Debounce la sauvegarde en AsyncStorage (éviter trop d'I/O)
let persistTimer: NodeJS.Timeout | null = null;
async function persistLogsAsync(): Promise<void> {
  if (persistTimer) clearTimeout(persistTimer);
  persistTimer = setTimeout(async () => {
    try {
      await AsyncStorage.setItem(LOGS_KEY, JSON.stringify(inMemoryLogs));
    } catch (error) {
      console.error('[LoggingService] Erreur persistence logs:', error);
    }
  }, 2000);  // 2 secondes de debounce
}

/**
 * Charge les logs depuis AsyncStorage (au startup).
 */
export async function loadLogs(): Promise<LogEntry[]> {
  try {
    const data = await AsyncStorage.getItem(LOGS_KEY);
    if (data) {
      inMemoryLogs = JSON.parse(data);
      console.log(`[LoggingService] Logs chargés: ${inMemoryLogs.length} entries`);
    }
    return inMemoryLogs;
  } catch (error) {
    console.error('[LoggingService] Erreur chargement logs:', error);
    return [];
  }
}

/**
 * Récupère les logs en mémoire (rapide).
 */
export function getLogs(
  filter?: {
    module?: string;
    level?: LogLevel;
    since?: Date;
  }
): LogEntry[] {
  let logs = [...inMemoryLogs];

  if (filter?.module) {
    logs = logs.filter((l) => l.module === filter.module);
  }

  if (filter?.level) {
    logs = logs.filter((l) => l.level === filter.level);
  }

  if (filter?.since) {
    const timestamp = filter.since.toISOString();
    logs = logs.filter((l) => l.timestamp >= timestamp);
  }

  return logs;
}

/**
 * Exporte les logs comme string (pour copy-paste dans bug report).
 */
export function exportLogsAsString(): string {
  return inMemoryLogs
    .map((log) => {
      const meta = log.metadata ? ` ${JSON.stringify(log.metadata)}` : '';
      return `${log.timestamp} [${log.level}] ${log.module}: ${log.message}${meta}`;
    })
    .join('\n');
}

/**
 * Exporte les logs comme JSON (pour envoi à backend).
 */
export function exportLogsAsJSON(): LogEntry[] {
  return inMemoryLogs;
}

/**
 * Vide les logs.
 */
export async function clearLogs(): Promise<void> {
  inMemoryLogs = [];
  await AsyncStorage.removeItem(LOGS_KEY);
  console.log('[LoggingService] Logs cleared');
}

/**
 * Retourne des stats sur les logs.
 */
export function getLogStats(): {
  total: number;
  byLevel: Record<LogLevel, number>;
  byModule: Record<string, number>;
} {
  const stats = {
    total: inMemoryLogs.length,
    byLevel: { DEBUG: 0, INFO: 0, WARN: 0, ERROR: 0 },
    byModule: {} as Record<string, number>,
  };

  for (const log of inMemoryLogs) {
    stats.byLevel[log.level] += 1;
    stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
  }

  return stats;
}

// ────────────────────────────────────────────────────────────────
// Helpers simplifiants (optional)
// ────────────────────────────────────────────────────────────────

export const LogService = {
  debug: (module: string, msg: string, meta?: Record<string, unknown>) =>
    log('DEBUG', module, msg, meta),
  info: (module: string, msg: string, meta?: Record<string, unknown>) =>
    log('INFO', module, msg, meta),
  warn: (module: string, msg: string, meta?: Record<string, unknown>) =>
    log('WARN', module, msg, meta),
  error: (module: string, msg: string, meta?: Record<string, unknown>) =>
    log('ERROR', module, msg, meta),
};
