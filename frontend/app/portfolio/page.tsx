"use client";

import React, { useState, useEffect } from 'react';
import DashboardGrid from '@/components/DashboardGrid';
import StockDetails from '@/components/StockDetails';
import Header from '@/components/Header';
import { api } from '@/api';
import { Stock } from '@/types';

import VerificationModal, { InvalidItem } from '@/components/VerificationModal';

export default function Home() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Verification State
  const [showVerification, setShowVerification] = useState(false);
  const [invalidSymbols, setInvalidSymbols] = useState<InvalidItem[]>([]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Fetch top 50 stocks from DB by market cap (default sort)
      const res = await api.getStocks({ limit: 50, min_quality: 0 });
      if (res && res.status === 'success') {
        setStocks(res.data);
      } else {
        setStocks([]);
      }
    } catch (e) {
      console.error(e);
      setStocks([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

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
      if (res.status === 'success') {
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
      if (verifyRes.status === 'success' && verifyRes.invalid && verifyRes.invalid.length > 0) {
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

  const handleCorrectionConfirm = async (corrections: Record<string, string>) => {
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

  const handleClearData = async () => {
    if (confirm("Are you sure you want to clear all data?")) {
      await api.clearData();
      setStocks([]);
      setSelectedStock(null);
    }
  };

  return (
    <div className="flex flex-col bg-[#F8FAFB] min-h-screen font-sans text-slate-900">
      <Header
        stockCount={stocks.length}
        onUpload={handleUpload}
        onRunAnalysis={handleRunAnalysis}
        onClearData={handleClearData}
        isProcessing={isProcessing}
      />

      {/* Main Content Wrapper - No left margin needed now */}
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
          onCancel={() => { setShowVerification(false); executeAnalysis(); }}
        />
      )}
    </div>
  );
}
