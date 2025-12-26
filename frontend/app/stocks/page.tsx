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
import { ArrowLeft, ArrowRight, TrendingUp, TrendingDown, Eye, Plus, Check, Loader2, Trash2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export default function StockListPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolioStocks, setPortfolioStocks] = useState<Set<string>>(new Set());
  const [loadingPortfolio, setLoadingPortfolio] = useState<string | null>(null); // stockName being processed
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    has_more: false
  });

  const fetchStocks = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await api.getStocks({
        limit: pagination.limit,
        offset: offset,
        min_quality: 0 // Show all valid stocks
      });

      if (res.status === 'success') {
        setStocks(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch stocks:', error);
    } finally {
      setLoading(false);
    }
  };

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
    fetchStocks();
  }, []);

  useEffect(() => {
    fetchPortfolio();
  }, [user]);

  // Error Modal State
  const [errorModal, setErrorModal] = useState<{ isOpen: boolean; message: string }>({
    isOpen: false,
    message: ''
  });

  const togglePortfolio = async (e: React.MouseEvent, stockName: string) => {
    e.stopPropagation(); // Prevent row click
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
    if (pagination.has_more) {
      fetchStocks(pagination.offset + pagination.limit);
      window.scrollTo(0, 0);
    }
  };

  const handlePrevPage = () => {
    if (pagination.offset > 0) {
      fetchStocks(Math.max(0, pagination.offset - pagination.limit));
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
    <div className="min-h-screen bg-[#F8FAFB]">
      <Header />
      <div className="py-12">
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
            <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Stock</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">Sector</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Price</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Change</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Market Cap</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">P/E</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">ROE</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Quality</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stocks.map((stock) => {
                      const stockName = stock['Stock Name'];
                      const isInPortfolio = portfolioStocks.has(stockName);
                      const isProcessing = loadingPortfolio === stockName;

                      return (
                        <tr
                          key={stock['NSE Code']}
                          className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
                          onClick={() => router.push(`/stock/${stock['NSE Code']}`)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="font-bold text-neutral-900">{stockName}</span>
                              <span className="text-xs text-neutral-400">{stock['NSE Code']}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-600">
                              {stock.sector_name || 'N/A'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-medium">
                            {formatCurrency(stock['Current Price'])}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className={`inline-flex items-center gap-1 font-medium ${Number(stock['Day change %']) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {Number(stock['Day change %']) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              {formatPercent(stock['Day change %'])}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                            {stock['Market Capitalization'] ? `₹${(Number(stock['Market Capitalization']) / 10000000).toFixed(0)}Cr` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                            {stock['PE TTM Price to Earnings'] ? Number(stock['PE TTM Price to Earnings']).toFixed(2) : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                            {stock['ROE Annual %'] ? `${Number(stock['ROE Annual %']).toFixed(1)}%` : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            {stock['Data Quality Score'] && (
                              <div className="inline-flex items-center gap-1">
                                <div className={`w-2 h-2 rounded-full ${Number(stock['Data Quality Score']) >= 80 ? 'bg-emerald-500' :
                                  Number(stock['Data Quality Score']) >= 50 ? 'bg-amber-500' : 'bg-rose-500'
                                  }`}></div>
                                <span className="text-xs font-medium">{stock['Data Quality Score']}%</span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* Portfolio Action Button */}
                              <button
                                disabled={isProcessing}
                                onClick={(e) => togglePortfolio(e, stockName)}
                                className={`
                                  flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                                  ${isInPortfolio
                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-rose-100 hover:text-rose-600'
                                    : 'bg-neutral-100 text-neutral-400 hover:bg-[#ccf32f] hover:text-black hover:scale-110'
                                  }
                                  ${isProcessing ? 'cursor-wait opacity-70' : ''}
                                `}
                                title={isInPortfolio ? "Remove from Portfolio" : "Add to Portfolio"}
                              >
                                {isProcessing ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : isInPortfolio ? (
                                  <>
                                    <Check size={14} className="block hover:hidden" />
                                    <Trash2 size={14} className="hidden hover:block" />
                                  </>
                                ) : (
                                  <Plus size={16} />
                                )}
                              </button>

                              <Button variant="ghost" size="sm" className="rounded-full w-8 h-8 p-0">
                                <Eye size={16} className="text-neutral-400 group-hover:text-black" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50/30">
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
                  disabled={!pagination.has_more || loading}
                  className="flex items-center gap-2"
                >
                  Next <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}
        </Container>
      </div>
    </div>
  );
}
