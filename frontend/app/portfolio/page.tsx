"use client";

import React, { useState, useEffect } from "react";
import DashboardGrid from "@/components/DashboardGrid";
import StockDetails from "@/components/StockDetails";
import Header from "@/components/Header";
import { Container } from "@/components/ui/Container";
import { api } from "@/api";
import { Stock } from "@/types";
import { useAuth } from "@/contexts/AuthContext";

import ConfirmationModal from "@/components/ConfirmationModal";
import VerificationModal, { InvalidItem } from "@/components/VerificationModal";
import { Button } from "@/components/ui/Button";
import { Trash2, UploadCloud, Play, Loader2 } from "lucide-react";

export default function Home() {
  const { user, loading: authLoading } = useAuth();
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [invalidSymbols, setInvalidSymbols] = useState<InvalidItem[]>([]);

  // Confirmation State
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const loadData = async () => {
    if (!user) {
      setStocks([]);
      return;
    }

    setIsLoading(true);
    try {
      // Fetch portfolio from database API
      const portfolioRes = await api.getPortfolio();

      console.log("Portfolio API Response:", portfolioRes); // Debug log

      if (portfolioRes.status !== "success" || !portfolioRes.data?.stock_names) {
        setStocks([]);
        setIsLoading(false);
        return;
      }

      const stockNames: string[] = portfolioRes.data.stock_names;
      console.log("Stock names in portfolio:", stockNames); // Debug log

      if (stockNames.length === 0) {
        setStocks([]);
        setIsLoading(false);
        return;
      }

      // Fetch stock details for each stock name from the database
      const stockPromises = stockNames.map(async (stockName) => {
        try {
          const res = await api.getStocks({ search: stockName, limit: 1 });
          if (res && res.status === "success" && res.data.length > 0) {
            return res.data[0];
          }
          return null;
        } catch (e) {
          console.error(`Failed to fetch ${stockName}:`, e);
          return null;
        }
      });

      const stocksData = await Promise.all(stockPromises);
      const validStocks = stocksData.filter((s): s is Stock => s !== null);
      setStocks(validStocks);
    } catch (e) {
      console.error("Failed to load portfolio:", e);
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Only load data when auth is ready and user is logged in
    if (!authLoading) {
      loadData();
    }
  }, [user, authLoading]);

  // Listen for portfolio updates from other tabs/pages
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "user_portfolio" || e.key === "klyx_access_token") {
        loadData();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [user]);

  const handleUpload = async (files: FileList) => {
    try {
      await api.uploadFiles(files);
      alert("Files uploaded successfully. Click 'Run Analysis' to process.");
    } catch (e) {
      alert("Upload failed.");
    }
  };

  const executeAnalysis = async () => {
    setIsProcessing(true);
    try {
      const res = await api.runAnalysis();
      if (res.status === "success") {
        await loadData();
        alert("Analysis completed successfully!");
      } else {
        alert(`Analysis failed: ${res.message}`);
      }
    } catch (e) {
      alert("Analysis failed to start.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRunAnalysis = async () => {
    // 1. Verify Symbols first
    try {
      const verifyRes = await api.verifySymbols();
      if (
        verifyRes.status === "success" &&
        verifyRes.invalid &&
        verifyRes.invalid.length > 0
      ) {
        setInvalidSymbols(verifyRes.invalid);
        setShowVerification(true);
        return;
      }
    } catch (e) {
      console.warn("Verification failed, skipping to analysis...", e);
    }

    // 2. Proceed if clean
    executeAnalysis();
  };

  const handleCorrectionConfirm = async (
    corrections: Record<string, string>,
  ) => {
    setShowVerification(false);
    if (Object.keys(corrections).length > 0) {
      try {
        await api.submitCorrections(corrections);
      } catch (e) {
        alert("Failed to save corrections, but proceeding...");
      }
    }
    executeAnalysis();
  };

  const requestClearData = () => {
    setShowClearConfirm(true);
  };

  const handleConfirmClear = async () => {
    setShowClearConfirm(false);

    try {
      // Clear portfolio from database
      await api.clearPortfolio();

      // Also clear any uploaded files from backend
      await api.clearData();

      setStocks([]);
      setSelectedStock(null);
    } catch (e) {
      console.error("Failed to clear portfolio:", e);
      alert("Failed to clear portfolio");
    }
  };

  /* State for Fix DB Modal */
  const [showFixDbConfirm, setShowFixDbConfirm] = useState(false);

  const handleFixDb = async () => {
    setShowFixDbConfirm(false);
    try {
      await api.migratePortfolio();
      // No alert, just reload to reflect changes
      window.location.reload();
    } catch (e) {
      console.error("Failed to repair database:", e);
    }
  };

  return (
    <div className="flex flex-col bg-[#F8FAFB] min-h-screen font-sans text-slate-900">
      <Header stockCount={stocks.length} />

      {/* Action Toolbar */}
      <div className="sticky top-[73px] z-40 bg-[#F8FAFB]/90 backdrop-blur-sm border-b border-neutral-200/50 py-4">
        <Container>
          <div className="flex justify-between items-center">
            {/* Left: Title */}
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight">
                Portfolio Analysis
              </h1>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-3">
              <input
                type="file"
                id="portfolio-upload"
                className="hidden"
                multiple
                accept=".xlsx,.xls,.csv"
                onChange={(e) => e.target.files && handleUpload(e.target.files)}
              />

              <button
                onClick={requestClearData}
                className="p-2.5 rounded-full text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                title="Clear Data"
              >
                <Trash2 size={20} />
              </button>

              <button
                onClick={() => setShowFixDbConfirm(true)}
                className="p-2.5 rounded-full text-neutral-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                title="Fix Database Schema"
              >
                <span className="text-xs font-bold">FIX DB</span>
              </button>

              <div className="h-6 w-px bg-neutral-300 mx-1"></div>

              <label
                htmlFor="portfolio-upload"
                className="cursor-pointer text-sm font-medium text-neutral-600 hover:text-black transition-colors flex items-center gap-2 px-4 py-2.5 rounded-full hover:bg-white hover:shadow-sm"
              >
                <UploadCloud size={18} />
                Upload
              </label>

              <Button
                variant="primary"
                size="md"
                onClick={handleRunAnalysis}
                disabled={isProcessing}
                className="rounded-full shadow-lg shadow-lime-400/20 font-bold px-6"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2 fill-current" />
                    Run Analysis
                  </>
                )}
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Main Content Wrapper */}
      <main className="flex-1 w-full pt-8 px-4 sm:px-6 lg:px-8 max-w-8xl mx-auto">
        {selectedStock ? (
          <StockDetails
            stock={selectedStock}
            onBack={() => setSelectedStock(null)}
          />
        ) : (
          <DashboardGrid
            stocks={stocks}
            onStockClick={setSelectedStock}
            isLoading={isLoading}
          />
        )}
      </main>

      {showVerification && (
        <VerificationModal
          invalidSymbols={invalidSymbols}
          onConfirm={handleCorrectionConfirm}
          onCancel={() => {
            setShowVerification(false);
            executeAnalysis();
          }}
        />
      )}

      <ConfirmationModal
        isOpen={showClearConfirm}
        title="Clear Portfolio Data"
        message="Are you sure you want to clear all uploaded portfolio data? This action cannot be undone."
        confirmLabel="Clear Data"
        isDestructive={true}
        onConfirm={handleConfirmClear}
        onCancel={() => setShowClearConfirm(false)}
      />

      <ConfirmationModal
        isOpen={showFixDbConfirm}
        title="Fix Database Schema"
        message="This will drop and recreate the portfolio database table. All your current portfolio data will be LOST. Use this only if you are experiencing issues adding stocks."
        confirmLabel="Fix Database"
        isDestructive={true}
        onConfirm={handleFixDb}
        onCancel={() => setShowFixDbConfirm(false)}
      />
    </div>
  );
}
