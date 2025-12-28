// API-based Storage Management for Debt Optimizer
// Location: frontend/utils/debtStorageAPI.ts
// Replaces localStorage with database API calls

import { Debt, DebtScenario } from '../types/debt';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
  ? `${process.env.NEXT_PUBLIC_API_URL}/api`
  : 'http://127.0.0.1:5001/api';

/**
 * Get auth token from localStorage
 */
function getAuthToken(): string | null {
  return localStorage.getItem('klyx_access_token');
}

/**
 * Make authenticated API request
 */
async function apiRequest(
  endpoint: string,
  method: string = 'GET',
  body?: any
): Promise<any> {
  const token = getAuthToken();

  if (!token) {
    throw new Error('Not authenticated. Please login first.');
  }

  const headers: Record<string, string> = {
    'Authorization': `Bearer ${token}`,
  };

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
}

/**
 * Save current scenario (auto-save)
 */
export async function saveCurrentScenario(
  debts: Debt[],
  monthlyBudget: number
): Promise<void> {
  try {
    await apiRequest('/debt-optimizer/current', 'PUT', {
      debts,
      monthlyBudget,
    });
  } catch (e) {
    console.error('Failed to save current scenario:', e);
    throw e;
  }
}

/**
 * Load current scenario
 */
export async function loadCurrentScenario(): Promise<DebtScenario | null> {
  try {
    const response = await apiRequest('/debt-optimizer/current', 'GET');
    return response.data || null;
  } catch (e) {
    console.error('Failed to load current scenario:', e);
    return null;
  }
}

/**
 * Clear current scenario
 */
export async function clearCurrentScenario(): Promise<void> {
  try {
    // Get current scenario and delete it
    const current = await loadCurrentScenario();
    if (current && current.id) {
      await apiRequest(`/debt-optimizer/scenarios/${current.id}`, 'DELETE');
    }
  } catch (e) {
    console.error('Failed to clear current scenario:', e);
    throw e;
  }
}

/**
 * Get all saved scenarios
 */
export async function getSavedScenarios(): Promise<DebtScenario[]> {
  try {
    const response = await apiRequest('/debt-optimizer/scenarios', 'GET');
    return response.data.scenarios || [];
  } catch (e) {
    console.error('Failed to load scenarios:', e);
    return [];
  }
}

/**
 * Save a named scenario
 */
export async function saveScenario(scenario: DebtScenario): Promise<void> {
  try {
    if (scenario.id) {
      // Update existing
      await apiRequest(`/debt-optimizer/scenarios/${scenario.id}`, 'PUT', {
        name: scenario.name,
        debts: scenario.debts,
        monthlyBudget: scenario.monthlyBudget,
        isCurrent: false,
      });
    } else {
      // Create new
      await apiRequest('/debt-optimizer/scenarios', 'POST', {
        name: scenario.name,
        debts: scenario.debts,
        monthlyBudget: scenario.monthlyBudget,
        isCurrent: false,
      });
    }
  } catch (e) {
    console.error('Failed to save scenario:', e);
    throw e;
  }
}

/**
 * Update a scenario
 */
export async function updateScenario(
  scenarioId: number,
  updates: Partial<DebtScenario>
): Promise<void> {
  try {
    await apiRequest(`/debt-optimizer/scenarios/${scenarioId}`, 'PUT', updates);
  } catch (e) {
    console.error('Failed to update scenario:', e);
    throw e;
  }
}

/**
 * Delete a scenario
 */
export async function deleteScenario(scenarioId: number): Promise<void> {
  try {
    await apiRequest(`/debt-optimizer/scenarios/${scenarioId}`, 'DELETE');
  } catch (e) {
    console.error('Failed to delete scenario:', e);
    throw e;
  }
}

/**
 * Migrate data from localStorage to database
 */
export async function migrateFromLocalStorage(): Promise<number> {
  try {
    // Get data from localStorage
    const currentData = localStorage.getItem('klyx_debt_optimizer_current');
    const savedData = localStorage.getItem('klyx_debt_optimizer_scenarios');

    const currentScenario = currentData ? JSON.parse(currentData) : null;
    const savedScenarios = savedData ? JSON.parse(savedData) : [];

    // Send to migration endpoint
    const response = await apiRequest('/debt-optimizer/migrate', 'POST', {
      currentScenario,
      savedScenarios,
    });

    // Clear localStorage after successful migration
    if (response.status === 'success') {
      localStorage.removeItem('klyx_debt_optimizer_current');
      localStorage.removeItem('klyx_debt_optimizer_scenarios');
    }

    return response.data.migrated_count || 0;
  } catch (e) {
    console.error('Failed to migrate from localStorage:', e);
    throw e;
  }
}

/**
 * Check if user has data in localStorage that needs migration
 */
export function hasLocalStorageData(): boolean {
  const currentData = localStorage.getItem('klyx_debt_optimizer_current');
  const savedData = localStorage.getItem('klyx_debt_optimizer_scenarios');

  return !!(currentData || savedData);
}

/**
 * Get storage usage statistics
 */
export async function getStorageStats(): Promise<{
  scenarioCount: number;
  hasCurrentScenario: boolean;
}> {
  try {
    const scenarios = await getSavedScenarios();
    const current = await loadCurrentScenario();

    return {
      scenarioCount: scenarios.length,
      hasCurrentScenario: !!current,
    };
  } catch (e) {
    return {
      scenarioCount: 0,
      hasCurrentScenario: false,
    };
  }
}
