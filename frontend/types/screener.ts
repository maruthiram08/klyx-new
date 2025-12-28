
export interface Filter {
    field: string;
    operator: 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'ne' | 'between' | 'in' | 'contains';
    value: any;
}

export interface ScreenerField {
    field: string;
    db_field: string;
    category: string;
    stats?: {
        min?: number;
        max?: number;
        mean?: number;
        count?: number;
    };
}

export interface ScreenerPreset {
    id: string;
    name: string;
    description: string;
}

export interface ScreenerResult {
    results: any[]; // Dynamic rows
    metadata: {
        total_matches: number;
        total_stocks: number;
        match_rate: string;
        filters_applied: number;
        error?: string;
    };
}
