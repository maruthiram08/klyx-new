
import { Filter, ScreenerField, ScreenerPreset, ScreenerResult } from '../types/screener';

const API_BASE = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api`
    : 'http://127.0.0.1:5001/api';

/**
 * Get available fields for screening
 */
export async function getScreenerFields(): Promise<ScreenerField[]> {
    try {
        const response = await fetch(`${API_BASE}/screener/fields`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch screener fields:', error);
        return [];
    }
}

/**
 * Get available presets
 */
export async function getScreenerPresets(): Promise<ScreenerPreset[]> {
    try {
        const response = await fetch(`${API_BASE}/screener/presets`);
        const data = await response.json();
        return data.data || [];
    } catch (error) {
        console.error('Failed to fetch presets:', error);
        return [];
    }
}

/**
 * Apply custom filters
 */
export async function applyScreenerFilters(
    filters: Filter[],
    logic: 'AND' | 'OR' = 'AND',
    limit: number = 50
): Promise<ScreenerResult> {
    try {
        const response = await fetch(`${API_BASE}/screener/filter`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                filters,
                logic,
                limit,
            }),
        });

        const data = await response.json();

        if (data.status === 'error') {
            throw new Error(data.message);
        }

        return data.data;
    } catch (error) {
        console.error('Screener filter failed:', error);
        throw error;
    }
}
