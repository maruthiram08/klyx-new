"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../api";
import { Stock } from "../../types";
import Header from "../../components/Header";
import { Container } from "../../components/ui/Container";
import { Typography } from "../../components/ui/Typography";
import { Button } from "../../components/ui/Button";
import {
  ArrowLeft,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Eye,
  Plus,
  Minus,
} from "lucide-react";

export default function StockListPage() {
  const router = useRouter();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [portfolio, setPortfolio] = useState<Set<string>>(new Set());
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
    has_more: false,
  });

  // Load portfolio from database API
  useEffect(() => {
    const loadPortfolio = async () => {
      try {
        const res = await api.getPortfolio();
        if (res.status === "success" && res.data.stock_names) {
          setPortfolio(new Set(res.data.stock_names));
        }
      } catch (e) {
        console.error("Error loading portfolio:", e);
        // User might not be logged in, that's okay
      }
    };
    loadPortfolio();
  }, []);

  const fetchStocks = async (offset = 0) => {
    setLoading(true);
    try {
      const res = await api.getStocks({
        limit: pagination.limit,
        offset: offset,
        min_quality: 0, // Show all valid stocks
      });

      if (res.status === "success") {
        setStocks(res.data);
        setPagination(res.pagination);
      }
    } catch (error) {
      console.error("Failed to fetch stocks:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

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
    if (val === undefined || val === null) return "-";
    return val.toLocaleString("en-IN", { style: "currency", currency: "INR" });
  };

  const formatPercent = (val: number | undefined) => {
    if (val === undefined || val === null) return "-";
    return `${val > 0 ? "+" : ""}${val.toFixed(2)}%`;
  };

  const togglePortfolio = async (stockName: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click

    try {
      if (portfolio.has(stockName)) {
        // Remove from portfolio
        await api.removeFromPortfolio(stockName);
        const newPortfolio = new Set(portfolio);
        newPortfolio.delete(stockName);
        setPortfolio(newPortfolio);
      } else {
        // Add to portfolio
        await api.addToPortfolio(stockName);
        const newPortfolio = new Set(portfolio);
        newPortfolio.add(stockName);
        setPortfolio(newPortfolio);
      }
    } catch (e) {
      console.error("Failed to update portfolio:", e);
      alert("Failed to update portfolio. Please make sure you're logged in.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F8FAFB]">
      <Header />
      <div className="flex-1 py-12">
        <Container>
          <div className="flex justify-between items-end mb-8">
            <div>
              <Typography variant="h1" className="text-3xl font-bold mb-2">
                Market Stocks
              </Typography>
              <Typography variant="body" className="text-neutral-500">
                Browse all available stocks in the database.
              </Typography>
            </div>
            <div className="text-sm text-neutral-500 font-medium">
              Showing {pagination.offset + 1}-
              {Math.min(pagination.offset + pagination.limit, pagination.total)}{" "}
              of {pagination.total}
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-[2rem] p-12 text-center shadow-sm border border-neutral-100">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-neutral-200 border-t-[#ccf32f] mb-4"></div>
              <Typography variant="body" className="text-neutral-500">
                Loading stocks...
              </Typography>
            </div>
          ) : (
            <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-neutral-50 border-b border-neutral-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Stock
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Sector
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Price
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Change
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Market Cap
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        P/E
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        ROE
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Quality
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {stocks.map((stock) => (
                      <tr
                        key={stock["NSE Code"]}
                        className="hover:bg-neutral-50/50 transition-colors cursor-pointer group"
                        onClick={() =>
                          router.push(`/stock/${stock["NSE Code"]}`)
                        }
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-neutral-900">
                              {stock["Stock Name"]}
                            </span>
                            <span className="text-xs text-neutral-400">
                              {stock["NSE Code"]}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-600">
                            {stock.sector_name || "N/A"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right font-mono font-medium">
                          {formatCurrency(stock["Current Price"])}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div
                            className={`inline-flex items-center gap-1 font-medium ${Number(stock["Day change %"]) >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                          >
                            {Number(stock["Day change %"]) >= 0 ? (
                              <TrendingUp size={14} />
                            ) : (
                              <TrendingDown size={14} />
                            )}
                            {formatPercent(stock["Day change %"])}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                          {stock["Market Capitalization"]
                            ? `₹${(Number(stock["Market Capitalization"]) / 10000000).toFixed(0)}Cr`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                          {stock["PE TTM Price to Earnings"]
                            ? Number(stock["PE TTM Price to Earnings"]).toFixed(
                                2,
                              )
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                          {stock["ROE Annual %"]
                            ? `${Number(stock["ROE Annual %"]).toFixed(1)}%`
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          {stock["Data Quality Score"] && (
                            <div className="inline-flex items-center gap-1">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  Number(stock["Data Quality Score"]) >= 80
                                    ? "bg-emerald-500"
                                    : Number(stock["Data Quality Score"]) >= 50
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                }`}
                              ></div>
                              <span className="text-xs font-medium">
                                {stock["Data Quality Score"]}%
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full w-8 h-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/stock/${stock["NSE Code"]}`);
                              }}
                            >
                              <Eye
                                size={16}
                                className="text-neutral-400 group-hover:text-black"
                              />
                            </Button>
                            <Button
                              variant={
                                portfolio.has(stock["Stock Name"])
                                  ? "default"
                                  : "outline"
                              }
                              size="sm"
                              className="text-xs"
                              onClick={(e) =>
                                togglePortfolio(stock["Stock Name"], e)
                              }
                            >
                              {portfolio.has(stock["Stock Name"]) ? (
                                <>
                                  <Minus size={14} className="mr-1" />
                                  Remove
                                </>
                              ) : (
                                <>
                                  <Plus size={14} className="mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
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
