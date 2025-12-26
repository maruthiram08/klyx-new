// LocalStorage Management for Debt Optimizer
// Location: frontend/utils/debtStorage.ts

import { Debt, DebtScenario } from '../types/debt';

// Storage keys with Klyx prefix
export const STORAGE_KEYS = {
  CURRENT_SCENARIO: 'klyx_debt_optimizer_current',
  SAVED_SCENARIOS: 'klyx_debt_optimizer_scenarios',
  SETTINGS: 'klyx_debt_optimizer_settings'
} as const;

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Save current scenario (auto-save)
 */
export function saveCurrentScenario(debts: Debt[], monthlyBudget: number): void {
  if (!isLocalStorageAvailable()) return;

  const scenario: DebtScenario = {
    id: crypto.randomUUID(),
    name: 'Current Session',
    debts,
    monthlyBudget,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    localStorage.setItem(STORAGE_KEYS.CURRENT_SCENARIO, JSON.stringify(scenario));
  } catch (e) {
    console.error('Failed to save current scenario:', e);
  }
}

/**
 * Load current scenario
 */
export function loadCurrentScenario(): DebtScenario | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const data = localStorage.getItem(STORAGE_KEYS.CURRENT_SCENARIO);
    return data ? JSON.parse(data) : null;
  } catch (e) {
    console.error('Failed to load current scenario:', e);
    return null;
  }
}

/**
 * Clear current scenario
 */
export function clearCurrentScenario(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_SCENARIO);
  } catch (e) {
    console.error('Failed to clear current scenario:', e);
  }
}

/**
 * Get all saved scenarios
 */
export function getSavedScenarios(): DebtScenario[] {
  if (!isLocalStorageAvailable()) return [];

  try {
    const data = localStorage.getItem(STORAGE_KEYS.SAVED_SCENARIOS);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error('Failed to load saved scenarios:', e);
    return [];
  }
}

/**
 * Save a named scenario
 */
export function saveNamedScenario(name: string, debts: Debt[], monthlyBudget: number): DebtScenario {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  const scenario: DebtScenario = {
    id: crypto.randomUUID(),
    name,
    debts,
    monthlyBudget,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    const scenarios = getSavedScenarios();
    scenarios.push(scenario);
    localStorage.setItem(STORAGE_KEYS.SAVED_SCENARIOS, JSON.stringify(scenarios));
    return scenario;
  } catch (e) {
    console.error('Failed to save scenario:', e);
    throw new Error('Failed to save scenario. Storage may be full.');
  }
}

/**
 * Update an existing scenario
 */
export function updateScenario(id: string, name: string, debts: Debt[], monthlyBudget: number): void {
  if (!isLocalStorageAvailable()) {
    throw new Error('localStorage is not available');
  }

  try {
    const scenarios = getSavedScenarios();
    const index = scenarios.findIndex(s => s.id === id);

    if (index === -1) {
      throw new Error('Scenario not found');
    }

    scenarios[index] = {
      ...scenarios[index],
      name,
      debts,
      monthlyBudget,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(STORAGE_KEYS.SAVED_SCENARIOS, JSON.stringify(scenarios));
  } catch (e) {
    console.error('Failed to update scenario:', e);
    throw new Error('Failed to update scenario');
  }
}

/**
 * Delete a saved scenario
 */
export function deleteScenario(id: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const scenarios = getSavedScenarios();
    const filtered = scenarios.filter(s => s.id !== id);
    localStorage.setItem(STORAGE_KEYS.SAVED_SCENARIOS, JSON.stringify(filtered));
  } catch (e) {
    console.error('Failed to delete scenario:', e);
    throw new Error('Failed to delete scenario');
  }
}

/**
 * Load a specific scenario
 */
export function loadScenario(id: string): DebtScenario | null {
  const scenarios = getSavedScenarios();
  return scenarios.find(s => s.id === id) || null;
}

/**
 * Export scenario as JSON for backup
 */
export function exportScenario(scenario: DebtScenario): string {
  return JSON.stringify(scenario, null, 2);
}

/**
 * Import scenario from JSON
 */
export function importScenario(jsonString: string): DebtScenario {
  try {
    const scenario = JSON.parse(jsonString);

    // Validate basic structure
    if (!scenario.id || !scenario.name || !Array.isArray(scenario.debts)) {
      throw new Error('Invalid scenario format');
    }

    return scenario;
  } catch (e) {
    console.error('Failed to import scenario:', e);
    throw new Error('Failed to import scenario. Invalid format.');
  }
}

/**
 * Get storage usage estimate
 */
export function getStorageUsage(): { used: number; available: number } | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    let totalSize = 0;
    for (const key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length + key.length;
      }
    }

    // Most browsers limit localStorage to ~5-10MB
    const estimatedLimit = 5 * 1024 * 1024; // 5MB estimate

    return {
      used: totalSize,
      available: estimatedLimit - totalSize
    };
  } catch (e) {
    return null;
  }
}

/**
 * Clear all Klyx debt optimizer data
 */
export function clearAllData(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  } catch (e) {
    console.error('Failed to clear all data:', e);
  }
}
