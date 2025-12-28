'use client';

import React, { useState, useEffect } from 'react';
import Header from '../../components/Header';
import { Container } from '../../components/ui/Container';
import { Typography } from '../../components/ui/Typography';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Filter as FilterIcon, Download, RefreshCw, Sparkles, Sliders, List } from 'lucide-react';
import { Filter, ScreenerResult, ScreenerPreset } from '../../types/screener';
import { getScreenerPresets, applyScreenerFilters } from '../../utils/screenerAPI';
import { FilterBuilder } from '../../components/screener/FilterBuilder';
import { ResultsTable } from '../../components/screener/ResultsTable';

export default function ScreenerPage() {
  // Mode state
  const [mode, setMode] = useState<'presets' | 'custom'>('presets');

  // Preset State
  const [presets, setPresets] = useState<ScreenerPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Custom State
  const [customFilters, setCustomFilters] = useState<Filter[]>([]);

  // Shared Result State
  const [results, setResults] = useState<ScreenerResult | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch presets on mount
  useEffect(() => {
    async function load() {
      const data = await getScreenerPresets();
      setPresets(data);
    }
    load();
  }, []);

  const handleApplyPreset = async (presetId: string) => {
    setLoading(true);
    setSelectedPreset(presetId);
    setResults(null); // Clear previous

    try {
      // We use the regular Fetch API here for presets as they are special routes
      // But we could also add a method to screenerAPI if standardized
      const response = await fetch(`/api/screener/preset/${presetId}`);
      const data = await response.json();

      if (data.status === 'success') {
        setResults(data.data);
      }
    } catch (error) {
      console.error('Failed to apply preset:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSearch = async () => {
    setLoading(true);
    setResults(null);
    try {
      const data = await applyScreenerFilters(customFilters);
      setResults(data);
    } catch (error) {
      console.error('Custom search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setSelectedPreset(null);
    // keeping custom filters intact for better UX
  };

  const exportResults = () => {
    if (!results || !results.results.length) return;

    // Convert to CSV
    const rows = results.results;
    const headers = Object.keys(rows[0]);
    const csv = [
      headers.join(','),
      ...rows.map(row =>
        headers.map(header => {
          const value = row[header];
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
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Header />

      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800">
        <Container>
          <div className="py-12">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-[#ccf32f] flex items-center justify-center">
                    <FilterIcon size={24} className="text-black" />
                  </div>
                  <Typography variant="h1" className="text-4xl font-bold text-neutral-900 dark:text-white">
                    Stock Screener
                  </Typography>
                </div>
                <Typography variant="body" className="text-neutral-600 dark:text-neutral-400 text-lg">
                  Filter and discover stocks using powerful strategies
                </Typography>
              </div>

              {/* Mode Toggle */}
              <div className="bg-neutral-100 p-1 rounded-xl flex items-center">
                <button
                  onClick={() => { setMode('presets'); clearResults(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'presets' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  <List size={16} />
                  Presets
                </button>
                <button
                  onClick={() => { setMode('custom'); clearResults(); }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'custom' ? 'bg-white shadow-sm text-black' : 'text-neutral-500 hover:text-neutral-700'
                    }`}
                >
                  <Sliders size={16} />
                  Custom Builder
                </button>
              </div>
            </div>
          </div>
        </Container>
      </div>

      <Container>
        <div className="py-8">

          {/* PRESETS MODE */}
          {mode === 'presets' && (
            <div className="mb-12 animate-in fade-in duration-300">
              <div className="flex items-center justify-between mb-6">
                <Typography variant="h2" className="text-2xl font-bold mb-2 text-neutral-900 dark:text-white">
                  Start with a Strategy
                </Typography>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {presets.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => handleApplyPreset(preset.id)}
                    disabled={loading}
                    className={`
                      group relative bg-white dark:bg-neutral-900 rounded-2xl p-6 border-2 transition-all duration-300 text-left
                      ${selectedPreset === preset.id
                        ? 'border-[#ccf32f] bg-[#ccf32f]/5 dark:bg-[#ccf32f]/10'
                        : 'border-neutral-200 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                      }
                      ${loading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
                    `}
                  >
                    <div className="text-3xl mb-3">{getPresetIcon(preset.id)}</div>
                    <Typography variant="h4" className="text-lg font-bold mb-2 text-neutral-900 dark:text-white">
                      {preset.name}
                    </Typography>
                    <Typography variant="caption" className="text-neutral-600 dark:text-neutral-400 text-sm mb-3 line-clamp-2">
                      {preset.description}
                    </Typography>

                    {selectedPreset === preset.id && (
                      <div className="absolute top-4 right-4 animate-in zoom-in spin-in-90 duration-300">
                        <Sparkles size={20} className="text-[#ccf32f]" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* CUSTOM MODE */}
          {mode === 'custom' && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <FilterBuilder
                filters={customFilters}
                onChange={setCustomFilters}
                onSearch={handleCustomSearch}
                isLoading={loading}
              />
            </div>
          )}

          {/* SHARED RESULTS AREA */}
          {(results || loading) && (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">
              <div className="flex items-center justify-between mb-4">
                <Typography variant="h2" className="text-xl font-bold">
                  {loading ? 'Screening Stocks...' : 'Results'}
                </Typography>

                {results && results.results.length > 0 && (
                  <div className="flex gap-2">
                    <Button variant="secondary" onClick={exportResults} className="flex items-center gap-2 text-sm">
                      <Download size={14} /> Export
                    </Button>
                    <Button variant="ghost" onClick={clearResults} className="flex items-center gap-2 text-sm">
                      <RefreshCw size={14} /> Clear
                    </Button>
                  </div>
                )}
              </div>

              <ResultsTable data={results} isLoading={loading} />
            </div>
          )}

        </div>
      </Container>
    </div>
  );
}
