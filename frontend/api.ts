
// Use relative path for API calls - this works with Vercel rewrites and Next.js proxy
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';
const AI_API_BASE = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000/api/ai';

// Helper to map DB response to Frontend Stock type
const mapDatabaseToFrontend = (item: any): any => {
  return {
    "Stock Name": item.stock_name,
    "NSE Code": item.nse_code,
    "sector_name": item.sector_name,
    "Current Price": item.current_price ? Number(item.current_price) : null,
    "Day change %": item.day_change_pct ? Number(item.day_change_pct) : null,
    "Market Capitalization": item.market_cap ? Number(item.market_cap) : null,
    "PE TTM Price to Earnings": item.pe_ttm ? Number(item.pe_ttm) : null,
    "ROE Annual %": item.roe_annual_pct ? Number(item.roe_annual_pct) : null,
    "Data Quality Score": item.data_quality_score ? Number(item.data_quality_score) : 0,
    "Last Updated": item.last_updated,
    // Map other fields as needed for details page
    ...item // Spread original items as fallback for unmapped fields (like 'id')
  };
};

export const api = {
  // ... previous methods ...
  uploadFiles: async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i]);
    }
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    return res.json();
  },

  runAnalysis: async () => {
    const res = await fetch(`${API_BASE}/process`, {
      method: 'POST',
    });
    return res.json();
  },

  getResults: async () => {
    const res = await fetch(`${API_BASE}/results`);
    if (res.status === 404) return null;
    return res.json();
  },

  clearData: async () => {
    const res = await fetch(`${API_BASE}/clear`, {
      method: 'POST',
    });
    return res.json();
  },

  useSampleData: async () => {
    const res = await fetch(`${API_BASE}/use_sample`, {
      method: 'POST'
    });
    return res.json();
  },

  verifySymbols: async () => {
    const res = await fetch(`${API_BASE}/verify_symbols`);
    return res.json();
  },

  submitCorrections: async (corrections: Record<string, string>) => {
    const res = await fetch(`${API_BASE}/submit_corrections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corrections)
    });
    return res.json();
  },

  getStocks: async (params?: { limit?: number; offset?: number; sector?: string; min_quality?: number; search?: string }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.offset) queryParams.append('offset', params.offset.toString());
    if (params?.sector) queryParams.append('sector', params.sector);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.min_quality) queryParams.append('min_quality', params.min_quality.toString());

    const res = await fetch(`${API_BASE}/database/stocks?${queryParams.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch stocks');
    const data = await res.json();
    if (data.status === 'success') {
      data.data = data.data.map(mapDatabaseToFrontend);
    }
    return data;
  },

  getStockDetails: async (code: string) => {
    const res = await fetch(`${API_BASE}/database/stocks/${code}`);
    if (!res.ok) throw new Error('Failed to fetch stock details');
    const data = await res.json();
    if (data.status === 'success' && data.data) {
      data.data = mapDatabaseToFrontend(data.data);
    }
    return data;
  },

  getPortfolio: async () => {
    const res = await fetch(`${API_BASE}/portfolio/list`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
      }
    });
    // Handle 401/403 gracefully if needed, but for now strict check
    if (res.status === 401) return { status: 'error', message: 'Unauthorized' };
    return res.json();
  },

  addToPortfolio: async (stockName: string) => {
    const res = await fetch(`${API_BASE}/portfolio/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
      },
      body: JSON.stringify({ stock_name: stockName })
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}) at ${res.url}: ${text.slice(0, 100)}`);
    }

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || `Failed to add to portfolio (${res.status}) at ${res.url}`);
    }
    return data;
  },

  removeFromPortfolio: async (stockName: string) => {
    const res = await fetch(`${API_BASE}/portfolio/remove`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
      },
      body: JSON.stringify({ stock_name: stockName })
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}) at ${res.url}: ${text.slice(0, 100)}`);
    }

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || `Failed to remove from portfolio (${res.status}) at ${res.url}`);
    }
    return data;
  },

  clearPortfolio: async () => {
    const res = await fetch(`${API_BASE}/portfolio/clear`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
      }
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}`);
    }

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || `Failed to clear portfolio (${res.status})`);
    }
    return data;
  },

  migratePortfolio: async () => {
    // This is in db_routes, so it stays at /database
    const res = await fetch(`${API_BASE}/database/migrate_portfolio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('klyx_access_token')}`
      }
    });

    let data;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error(`Server Error (${res.status}): ${text.slice(0, 100)}`);
    }

    if (!res.ok || data.status === 'error') {
      throw new Error(data.message || `Failed to migrate portfolio (${res.status})`);
    }
    return data;
  },

  chatWithAI: async (message: string, threadId: string, onToken: (token: string) => void) => {
    const response = await fetch(`${AI_API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: { role: 'user', content: message },
        threadId: threadId
      })
    });

    if (!response.ok) throw new Error('AI Chat failed');

    const reader = response.body?.getReader();
    if (!reader) return;

    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '');
          if (dataStr === '[DONE]') break;
          try {
            const data = JSON.parse(dataStr);
            if (data.content) onToken(data.content);
          } catch (e) {
            // Some lines might be tool statuses or incomplete JSON
          }
        }
      }
    }
  }
};
