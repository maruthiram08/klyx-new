'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../../api';
import { Stock } from '../../types';
import Header from '../../components/Header';
import ConfirmationModal from '../../components/ConfirmationModal';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useStocks } from '../../hooks/useStocks';
import { VirtualStockTable } from '../../components/VirtualStockTable';

export default function StockListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [offset, setOffset] = useState(0);
  const limit = 50;

  // Use TanStack Query for cached, prefetched data
  const { stocks, total, isLoading: loading, prefetchNextPage } = useStocks({ limit, offset });

  const [portfolioStocks, setPortfolioStocks] = useState<Set<string>>(new Set());
  const [loadingPortfolio, setLoadingPortfolio] = useState<string | null>(null);

  // Pagination helpers
  const hasMore = offset + limit < total;
  const pagination = { limit, offset, total, has_more: hasMore };

  const fetchPortfolio = async () => {
    if (!user) return;
    try {
      const res = await api.getPortfolio();
      if (res && res.status === 'success' && res.data && res.data.stock_names) {
        setPortfolioStocks(new Set(res.data.stock_names));
      }
    } catch (error) {
      console.error('Failed to fetch portfolio:', error);
    }
  };

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  // Error Modal State
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });

  const togglePortfolio = async (e: React.MouseEvent, stockName: string) => {
    e.stopPropagation();
    if (!user) {
      console.warn("User not logged in, cannot toggle portfolio");
      router.push('/login');
      return;
    }

    setLoadingPortfolio(stockName);
    try {
      if (portfolioStocks.has(stockName)) {
        await api.removeFromPortfolio(stockName);
        setPortfolioStocks(prev => {
          const next = new Set(prev);
          next.delete(stockName);
          return next;
        });
      } else {
        await api.addToPortfolio(stockName);
        setPortfolioStocks(prev => new Set(prev).add(stockName));
      }
    } catch (error: any) {
      console.error('Failed to update portfolio:', error);
      setErrorModal({ isOpen: true, message: error.message });
    } finally {
      setLoadingPortfolio(null);
    }
  };

  const handleNextPage = () => {
    if (hasMore) {
      setOffset(offset + limit);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (offset > 0) {
      setOffset(Math.max(0, offset - limit));
      window.scrollTo(0, 0);
    }
  };

  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || val === null) return '-';
    // Use Number() to ensure we have a number, avoiding crashing on strings
    return Number(val).toLocaleString('en-IN', { style: 'currency', currency: 'INR' });
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return '-';
    const num = Number(val);
    return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      <ConfirmationModal
        isOpen={errorModal.isOpen}
        title="Error"
        message={errorModal.message}
        confirmLabel="OK"
        onConfirm={() => setErrorModal({ ...errorModal, isOpen: false })}
        onCancel={() => setErrorModal({ ...errorModal, isOpen: false })}
      />

      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Container>
          <div className="flex justify-between items-end mb-8">
            <div>
              <Typography variant="h1" className="text-3xl font-bold mb-2">Market Stocks</Typography>
              <Typography variant="body" className="text-neutral-500">
                Browse all available stocks in the database.
              </Typography>
            </div>
            <div className="text-sm text-neutral-500 font-medium">
              Showing {pagination.offset + 1}-{Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-neutral-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-[#ccf32f] mb-4"></div>
              <Typography variant="body" className="text-neutral-500">Loading stocks...</Typography>
            </div>
          ) : (
            <>
              <VirtualStockTable
                stocks={stocks}
                portfolioStocks={portfolioStocks}
                loadingPortfolio={loadingPortfolio}
                onTogglePortfolio={togglePortfolio}
              />

              {/* Pagination Controls */}
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  onClick={handlePrevPage}
                  disabled={pagination.offset === 0 || loading}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft size={16} /> Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={handleNextPage}
                  onMouseEnter={prefetchNextPage}
                  disabled={!pagination.has_more || loading}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </>
          )}
        </Container>
      </div>
    </div>
  );
}
