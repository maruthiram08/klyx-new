'use client';

import React, { useState, useEffect } from 'react';
import { Stock } from '../../types';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import StockCard from '../../components/StockCard';
import { Filter, TrendingUp, Download, RefreshCw, Sparkles } from 'lucide-react';

interface ScreenerPreset {
  id: string;
  name: string;
  description: string;
  filter_count: number;
}

interface ScreenerMetadata {
  total_matches: number;
  total_stocks: number;
  match_rate: string;
  preset_name?: string;
  description?: string;
}

export default function ScreenerPage() {
  const [presets, setPresets] = useState<ScreenerPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [results, setResults] = useState<Stock[]>([]);
  const [metadata, setMetadata] = useState<ScreenerMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const [showCustomFilter, setShowCustomFilter] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);

  // Fetch available presets on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  const fetchPresets = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/screener/presets');
      const data = await response.json();

      if (data.status === 'success') {
        setPresets(data.presets);
      }
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    }
  };

  const applyPreset = async (presetId: string) => {
    setLoading(true);
    setSelectedPreset(presetId);

    try {
      const response = await fetch(`http://localhost:5001/api/screener/preset/${presetId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setResults(data.results);
        setMetadata(data.metadata);
      } else {
        alert(data.message || 'Failed to apply preset');
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
      alert('Error applying preset');
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults([]);
    setMetadata(null);
    setSelectedPreset(null);
  };

  const exportResults = () => {
    if (results.length === 0) {
      alert('No results to export');
      return;
    }

    // Convert to CSV
    const headers = Object.keys(results[0]);
    const csv = [
      headers.join(','),
      ...results.map(row =>
        headers.map(header => {
          const value = row[header as keyof Stock];
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value;
        }).join(',')
      )
    ].join('\n');

    // Download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screener-results-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getPresetIcon = (presetId: string) => {
    const icons: Record<string, React.ReactNode> = {
      value: '💎',
      growth: '🚀',
      momentum: '📈',
      dividend: '💰',
      quality: '⭐',
      garp: '🎯',
      breakout: '⚡',
      low_volatility: '🛡️'
    };
    return icons[presetId] || '📊';
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200">
        <Container>
          <div className="py-12">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ccf32f] flex items-center justify-center">
                    <Filter size={24} className="text-black" />
                  </div>
                  <Typography variant="h1" className="text-4xl font-bold">
                    Stock Screener
                  </Typography>
                </div>
                <Typography variant="body" className="text-neutral-600 text-lg">
                  Filter and discover stocks using powerful preset strategies or custom criteria
                </Typography>
              </div>

              {results.length > 0 && (
                <div className="flex gap-3">
                  <Button
                    variant="secondary"
                    onClick={exportResults}
                    className="flex items-center gap-2"
                  >
                    <Download size={16} />
                    Export CSV
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={clearResults}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw size={16} />
                    Clear
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-12">
          {/* Preset Strategies */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Typography variant="h2" className="text-2xl font-bold mb-2">
                  Preset Strategies
                </Typography>
                <Typography variant="body" className="text-neutral-600">
                  Choose from professionally crafted screening strategies
                </Typography>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => applyPreset(preset.id)}
                  disabled={loading}
                  className={`
                    group relative bg-white rounded-2xl p-6 border-2 transition-all duration-300 text-left
                    ${selectedPreset === preset.id
                      ? 'border-[#ccf32f] bg-[#ccf32f]/5'
                      : 'border-neutral-200 hover:border-neutral-300'
                    }
                    ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                  `}
                >
                  <div className="text-3xl mb-3">{getPresetIcon(preset.id)}</div>
                  <Typography variant="h4" className="text-lg font-bold mb-2">
                    {preset.name}
                  </Typography>
                  <Typography variant="caption" className="text-neutral-600 text-sm mb-3 line-clamp-2">
                    {preset.description}
                  </Typography>
                  <Badge variant="neutral" className="text-xs">
                    {preset.filter_count} filters
                  </Badge>

                  {selectedPreset === preset.id && (
                    <div className="absolute top-4 right-4">
                      <Sparkles size={20} className="text-[#ccf32f]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Results Section */}
          {metadata && (
            <div className="mb-8">
              <div className="bg-white rounded-2xl p-6 border border-neutral-200">
                <div className="flex items-center justify-between">
                  <div>
                    <Typography variant="h3" className="text-xl font-bold mb-1">
                      {metadata.preset_name || 'Screening Results'}
                    </Typography>
                    <Typography variant="caption" className="text-neutral-600">
                      {metadata.description}
                    </Typography>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#ccf32f]">
                      {metadata.total_matches}
                    </div>
                    <Typography variant="caption" className="text-neutral-500">
                      stocks matched ({metadata.match_rate})
                    </Typography>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-neutral-200 border-t-[#ccf32f] mb-4"></div>
              <Typography variant="body" className="text-neutral-600">
                Screening stocks...
              </Typography>
            </div>
          )}

          {/* Results Grid */}
          {!loading && results.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h3" className="text-xl font-bold">
                  Matched Stocks
                </Typography>
                <Typography variant="caption" className="text-neutral-500">
                  {results.length} results
                </Typography>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {results.map((stock, idx) => (
                  <StockCard
                    key={idx}
                    stock={stock}
                    onClick={setSelectedStock}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !results.length && !metadata && (
            <div className="text-center py-16">
              <div className="w-24 h-24 rounded-full bg-neutral-100 flex items-center justify-center mx-auto mb-4">
                <Filter size={40} className="text-neutral-400" />
              </div>
              <Typography variant="h3" className="text-xl font-bold mb-2">
                Select a Preset Strategy
              </Typography>
              <Typography variant="body" className="text-neutral-600">
                Choose from the preset strategies above to start screening stocks
              </Typography>
            </div>
          )}

          {/* No Results */}
          {!loading && results.length === 0 && metadata && (
            <div className="text-center py-16">
              <Typography variant="h3" className="text-xl font-bold mb-2">
                No stocks matched the criteria
              </Typography>
              <Typography variant="body" className="text-neutral-600">
                Try selecting a different preset or adjusting your filters
              </Typography>
            </div>
          )}
        </div>
      </Container>

      {/* Stock Details Modal (if needed) */}
      {selectedStock && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedStock(null)}
        >
          <div
            className="bg-white rounded-3xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Stock details component here */}
            <Typography variant="h2" className="text-2xl font-bold mb-4">
              {selectedStock['Stock Name']}
            </Typography>
            {/* Add more stock details as needed */}
            <Button onClick={() => setSelectedStock(null)} className="mt-6">
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
