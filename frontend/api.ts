const API_BASE = "http://127.0.0.1:5001/api";

// Helper to map DB response to Frontend Stock type
const mapDatabaseToFrontend = (item: any): any => {
  return {
    "Stock Name": item.stock_name,
    "NSE Code": item.nse_code,
    sector_name: item.sector_name,
    "Current Price": item.current_price,
    "Day change %": item.day_change_pct,
    "Market Capitalization": item.market_cap,
    "PE TTM Price to Earnings": item.pe_ttm,
    "ROE Annual %": item.roe_annual_pct,
    "Data Quality Score": item.data_quality_score,
    "Trendlyne Momentum Score": item.momentum_score,
    "Last Updated": item.last_updated,
    // Map other fields as needed for details page
    ...item, // Spread original items as fallback for unmapped fields (like 'id')
  };
};

export const api = {
  // ... previous methods ...
  uploadFiles: async (files: FileList) => {
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files[]", files[i]);
    }
    const res = await fetch(`${API_BASE}/upload`, {
      method: "POST",
      body: formData,
    });
    return res.json();
  },

  runAnalysis: async () => {
    const res = await fetch(`${API_BASE}/process`, {
      method: "POST",
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
      method: "POST",
    });
    return res.json();
  },

  useSampleData: async () => {
    const res = await fetch(`${API_BASE}/use_sample`, {
      method: "POST",
    });
    return res.json();
  },

  verifySymbols: async () => {
    const res = await fetch(`${API_BASE}/verify_symbols`);
    return res.json();
  },

  submitCorrections: async (corrections: Record<string, string>) => {
    const res = await fetch(`${API_BASE}/submit_corrections`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corrections),
    });
    return res.json();
  },

  getStocks: async (params?: {
    limit?: number;
    offset?: number;
    sector?: string;
    min_quality?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.limit) queryParams.append("limit", params.limit.toString());
    if (params?.offset) queryParams.append("offset", params.offset.toString());
    if (params?.sector) queryParams.append("sector", params.sector);
    if (params?.min_quality !== undefined)
      queryParams.append("min_quality", params.min_quality.toString());
    if (params?.search) queryParams.append("search", params.search);

    const res = await fetch(
      `${API_BASE}/database/stocks?${queryParams.toString()}`,
    );
    if (!res.ok) throw new Error("Failed to fetch stocks");
    const data = await res.json();
    if (data.status === "success") {
      data.data = data.data.map(mapDatabaseToFrontend);
    }
    return data;
  },

  getStockDetails: async (code: string) => {
    const res = await fetch(`${API_BASE}/database/stocks/${code}`);
    if (!res.ok) throw new Error("Failed to fetch stock details");
    const data = await res.json();
    if (data.status === "success" && data.data) {
      data.data = mapDatabaseToFrontend(data.data);
    }
    return data;
  },

  // Portfolio API methods
  getPortfolio: async () => {
    const token = localStorage.getItem("klyx_access_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE}/portfolio`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to fetch portfolio");
    return res.json();
  },

  addToPortfolio: async (stockName: string) => {
    const token = localStorage.getItem("klyx_access_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE}/portfolio/add`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock_name: stockName }),
    });
    if (!res.ok) throw new Error("Failed to add to portfolio");
    return res.json();
  },

  removeFromPortfolio: async (stockName: string) => {
    const token = localStorage.getItem("klyx_access_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE}/portfolio/remove`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stock_name: stockName }),
    });
    if (!res.ok) throw new Error("Failed to remove from portfolio");
    return res.json();
  },

  clearPortfolio: async () => {
    const token = localStorage.getItem("klyx_access_token");
    if (!token) throw new Error("Not authenticated");

    const res = await fetch(`${API_BASE}/portfolio/clear`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Failed to clear portfolio");
    return res.json();
  },
};
