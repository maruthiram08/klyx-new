import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/api";

interface UseStocksOptions {
    limit?: number;
    offset?: number;
    sector?: string;
    search?: string;
}

export function useStocks(options: UseStocksOptions = {}) {
    const { limit = 50, offset = 0, sector, search } = options;
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ["stocks", { limit, offset, sector, search }],
        queryFn: () => api.getStocks({ limit, offset, sector, search }),
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Prefetch next page for instant pagination
    const prefetchNextPage = () => {
        queryClient.prefetchQuery({
            queryKey: ["stocks", { limit, offset: offset + limit, sector, search }],
            queryFn: () => api.getStocks({ limit, offset: offset + limit, sector, search }),
        });
    };

    return {
        stocks: query.data?.data || [],
        total: query.data?.total || 0,
        isLoading: query.isLoading,
        isError: query.isError,
        error: query.error,
        refetch: query.refetch,
        prefetchNextPage,
    };
}

// Hook for fetching single stock details
export function useStockDetails(nseCode: string | null) {
    return useQuery({
        queryKey: ["stock", nseCode],
        queryFn: () => api.getStockDetails(nseCode!),
        enabled: !!nseCode,
        staleTime: 10 * 60 * 1000, // 10 minutes for individual stock
    });
}

// Hook for portfolio with optimistic updates support
export function usePortfolio() {
    return useQuery({
        queryKey: ["portfolio"],
        queryFn: api.getPortfolio,
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}
