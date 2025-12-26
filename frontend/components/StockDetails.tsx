import React, { useState, useMemo, useEffect } from 'react';
import { Container } from './ui/Container';
import { Typography } from './ui/Typography';
import { Badge } from './ui/Badge';
import { StatCard } from './molecules/StatCard';
import { Button } from './ui/Button';
import {
    ArrowUpRight, ArrowDownRight,
    ArrowRight,
    CheckCircle2,
    Plus,
    Activity,
    TrendingUp,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { generateStockAnalysis } from '../utils/analysisGenerator';
import { generateTechnicalAnalysis } from '../utils/technicalReportGenerator';
import { generatePLAnalysis, generateBSAnalysis, generateCFAnalysis, generateRatiosAnalysis } from '../utils/financialReportGenerator';


import { generateFinancialInsights, Insight } from '../utils/financialInsights';
import { Stock, FundamentalData } from '../types';
import { FinancialTable } from './ui/FinancialTable';
import { MarkdownRenderer } from './ui/MarkdownRenderer';

const API_BASE = 'http://127.0.0.1:5001/api';

interface StockDetailsProps {
    stock: Stock;
    onBack?: () => void;
}

const StockDetails: React.FC<StockDetailsProps> = ({ stock, onBack }) => {
    const [activeTab, setActiveTab] = useState('Overview');
    const [financialsType, setFinancialsType] = useState<'standalone' | 'consolidated'>('standalone');
    const [fundamentals, setFundamentals] = useState<FundamentalData | null>(null);
    const analysisSections = useMemo(() => generateStockAnalysis(stock, fundamentals), [stock, fundamentals]);
    const financialInsights = useMemo(() => generateFinancialInsights(fundamentals), [fundamentals]);

    // Deep Dive Generators
    const plDeepDive = useMemo(() => {
        if (!fundamentals?.profit_loss) return '';
        try { return generatePLAnalysis(fundamentals.profit_loss); } catch (e) { return ''; }
    }, [fundamentals]);

    const bsDeepDive = useMemo(() => {
        if (!fundamentals?.balance_sheet) return '';
        try { return generateBSAnalysis(fundamentals.balance_sheet); } catch (e) { return ''; }
    }, [fundamentals]);

    const cfDeepDive = useMemo(() => {
        if (!fundamentals?.cash_flow) return '';
        try { return generateCFAnalysis(fundamentals.cash_flow); } catch (e) { return ''; }
    }, [fundamentals]);

    const ratiosDeepDive = useMemo(() => {
        if (!fundamentals?.ratios) return '';
        try { return generateRatiosAnalysis(fundamentals.ratios); } catch (e) { return ''; }
    }, [fundamentals]);

    // Tech Deep Dive
    const techDeepDive = useMemo(() => {
        return generateTechnicalAnalysis(stock);
    }, [stock]);

    useEffect(() => {
        const fetchFundamentals = async () => {
            if (!stock['NSE Code']) return;
            try {
                const res = await fetch(`${API_BASE}/stock/${stock['NSE Code']}/fundamentals?type=${financialsType}`);
                if (res.ok) {
                    const data = await res.json();
                    if (data.status === 'success' && data.data) {
                        setFundamentals(data.data);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch fundamentals", error);
            }
        };
        fetchFundamentals();
    }, [stock, financialsType]);

    // --- Helpers (Formatters) ---
    const formatCurrency = (val: number | string | undefined) => {
        if (val === undefined || val === null || val === '') return '-';
        const num = Number(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 });
    };

    const formatNumber = (val: number | string | undefined, decimals = 2) => {
        if (val === undefined || val === null || val === '') return '-';
        const num = Number(val);
        if (isNaN(num)) return val;
        return num.toLocaleString('en-IN', { maximumFractionDigits: decimals });
    };

    const formatPercentage = (val: number | string | undefined) => {
        if (val === undefined || val === null || val === '') return '-';
        const num = Number(val);
        return `${num > 0 ? '+' : ''}${num.toFixed(2)}%`;
    };

    // --- Data Extraction ---
    const price = Number(stock['Current Price'] || 0);
    const changePct = Number(stock['Day change %'] || 0);
    const changeAmt = price * (changePct / 100);
    const isPositive = changePct >= 0;

    const marketCapCr = (Number(stock['Market Capitalization'] || 0) / 10000000).toFixed(2) + ' Cr';

    const durabilityScore = Math.round(Number(stock['Trendlyne Durability Score'] || 0));
    const valuationScore = Math.round(Number(stock['Trendlyne Valuation Score'] || 0));
    const momentumScore = Math.round(Number(stock['Trendlyne Momentum Score'] || 0));

    const headlines = stock['News_Headlines'] && stock['News_Headlines'] !== '[]'
        ? JSON.parse(stock['News_Headlines'])
        : [];

    const upside = Number(stock['Forecaster Estimates 12Mth Upside %'] || 0);
    const targetPrice = Number(stock['Forecaster Estimates Target Price'] || 0);

    // --- Render Functions ---

    const renderTableLike = (data: { label: string, value: string | number, sub?: string }[]) => (
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-6 gap-x-12">
                {data.map((item, i) => (
                    <div key={i} className="flex justify-between items-center border-b border-neutral-50 pb-2">
                        <span className="text-neutral-500 font-medium">{item.label}</span>
                        <div className="text-right">
                            <span className="font-mono font-semibold block text-neutral-900">{item.value}</span>
                            {item.sub && <span className="text-xs text-neutral-400">{item.sub}</span>}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );




    const renderOverview = () => (
        <>
            {/* 1. Primary Scores (StatCards) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <StatCard
                    label="Durability Score"
                    value={durabilityScore.toString()}
                    trendLabel="Financial Strength"
                    chart={
                        <div className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative">
                            <div className={`absolute bottom-0 left-0 w-full ${durabilityScore >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ height: `${durabilityScore}%` }}></div>
                        </div>
                    }
                />
                <StatCard
                    label="Valuation Score"
                    value={valuationScore.toString()}
                    trendLabel="Value Check"
                    chart={
                        <div className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative">
                            <div className={`absolute bottom-0 left-0 w-full ${valuationScore >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ height: `${valuationScore}%` }}></div>
                        </div>
                    }
                />
                <StatCard
                    label="Momentum Score"
                    value={momentumScore.toString()}
                    trendLabel="Technical Trend"
                    chart={
                        <div className="w-full h-full bg-neutral-100 rounded-lg overflow-hidden relative">
                            <div className={`absolute bottom-0 left-0 w-full ${momentumScore >= 50 ? 'bg-emerald-400' : 'bg-rose-400'}`} style={{ height: `${momentumScore}%` }}></div>
                        </div>
                    }
                />
            </div>

            {/* 2. Deep Dive Sections (Health & Forecast) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">

                {/* AI Insights Card */}
                <div className="lg:col-span-1 bg-white border border-neutral-100 rounded-[2rem] p-8 shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-between mb-6 relative z-10">
                        <Typography variant="h3" className="text-lg">Quick Insights</Typography>
                        <Badge variant="neutral">AI Generated</Badge>
                    </div>

                    <div className="space-y-4 relative z-10">
                        {/* ROE Insight */}
                        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100/50">
                            <Typography variant="caption" className="text-emerald-800 font-bold mb-1 block">PROFITABILITY</Typography>
                            <Typography variant="body" className="text-sm text-emerald-900 leading-relaxed">
                                {Number(stock['ROE Annual %']) > 15
                                    ? "High Return on Equity (>15%), indicating efficient capital use."
                                    : "Return on Equity is below industry benchmarks."}
                            </Typography>
                        </div>
                        {/* PEG Insight */}
                        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100/50">
                            <Typography variant="caption" className="text-amber-800 font-bold mb-1 block">VALUATION</Typography>
                            <Typography variant="body" className="text-sm text-amber-900 leading-relaxed">
                                {Number(stock['PEG TTM PE to Growth']) < 1 && Number(stock['PEG TTM PE to Growth']) > 0
                                    ? "Undervalued based on PEG ratio."
                                    : "Valuation might be premium compared to growth."}
                            </Typography>
                        </div>
                    </div>
                </div>

                {/* Dark Forecast Section */}
                <div className="lg:col-span-2 bg-neutral-900 text-white rounded-[2rem] p-8 relative overflow-hidden flex flex-col md:flex-row gap-8">
                    {/* Decorative Blob */}
                    <div className="absolute top-[-50%] right-[-10%] w-[400px] h-[400px] bg-[#ccf32f] rounded-full blur-[120px] opacity-10 pointer-events-none"></div>

                    <div className="flex-1 z-10">
                        <Typography variant="h3" className="mb-6 flex items-center gap-2 text-white">
                            <CheckCircle2 className="w-5 h-5 text-[#ccf32f]" />
                            Health Check
                        </Typography>

                        <div className="space-y-6">
                            {/* Piotroski Bar */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-neutral-400">Piotroski Score</span>
                                    <span className="text-sm font-bold text-[#ccf32f]">{Number(stock['Piotroski Score'])} / 9</span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#ccf32f]" style={{ width: `${(Number(stock['Piotroski Score']) / 9) * 100}%` }}></div>
                                </div>
                            </div>

                            {/* ROE Visual */}
                            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                                <div className="flex justify-between mb-2">
                                    <span className="text-sm text-neutral-400">ROE Annual %</span>
                                    <span className={Number(stock['ROE Annual %']) > 15 ? "text-emerald-400 font-bold" : "text-neutral-400"}>
                                        {Number(stock['ROE Annual %']).toFixed(1)}%
                                    </span>
                                </div>
                                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${Number(stock['ROE Annual %']) > 15 ? 'bg-emerald-500' : 'bg-neutral-500'}`}
                                        style={{ width: `${Math.min(Number(stock['ROE Annual %']), 100)}%` }}></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-px bg-white/10 hidden md:block"></div>

                    <div className="flex-1 z-10 flex flex-col justify-center">
                        <Typography variant="h3" className="mb-4 text-white">1Y Forecast</Typography>
                        <div className="flex items-baseline gap-2 mb-2">
                            <Typography variant="display" className="text-[#ccf32f] text-4xl">
                                {targetPrice > 0 ? formatCurrency(targetPrice) : 'N/A'}
                            </Typography>
                        </div>
                        <div className="flex items-center gap-2 mb-6">
                            <Badge variant={upside > 0 ? 'success' : 'danger'}>
                                {upside > 0 ? `+${upside.toFixed(1)}%` : `${upside.toFixed(1)}%`} Upside
                            </Badge>
                        </div>
                        <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-neutral-400 uppercase tracking-wider">Consensus</span>
                                <span className="text-xs font-bold text-black bg-[#ccf32f] px-2 py-0.5 rounded-full">
                                    {stock['Forecaster Estimates Reco'] || 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Key Metrics Grid */}
            <div className="mb-16">
                <Typography variant="h2" className="mb-8">Key Metrics</Typography>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[
                        { label: 'Market Cap', value: `₹${marketCapCr}` },
                        { label: 'PE Ratio (TTM)', value: stock['PE TTM Price to Earnings'] },
                        { label: 'Dividend Yield', value: formatPercentage(stock['Forecaster Estimates 1Y forward Dividend Yield %']) },
                        { label: 'Sector PE', value: stock['Sector PE TTM'] },
                        { label: 'ROE', value: formatPercentage(stock['ROE Annual %']) },
                        { label: 'Debt to Equity', value: (Number(stock['YF_TotalDebt']) / (Number(stock['YF_StockholdersEquity']) || 1)).toFixed(2) },
                        { label: 'Beta', value: formatNumber(stock['Beta 1Year']) },
                        { label: 'EPS (TTM)', value: stock['Basic EPS TTM'] },
                    ].map((item, idx) => (
                        <div key={idx} className="p-5 bg-neutral-50 rounded-2xl hover:bg-neutral-100 transition-colors border border-transparent hover:border-neutral-200">
                            <Typography variant="caption" className="mb-2 block font-bold">{item.label}</Typography>
                            <Typography variant="h4" className="text-lg">{item.value ? item.value : '-'}</Typography>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] pb-20">
            <Container>
                {/* Top Navigation / Breadcrumb */}
                <div className="pt-8 pb-6">
                    <button onClick={onBack} className="group flex items-center gap-2 text-neutral-500 hover:text-black transition-colors mb-8">
                        <div className="w-10 h-10 rounded-full bg-white border border-neutral-200 flex items-center justify-center group-hover:border-neutral-300 shadow-sm">
                            <ArrowRight className="w-5 h-5 rotate-180" />
                        </div>
                        <span className="font-medium">Back to Analysis</span>
                    </button>

                    {/* Header Block */}
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-12">
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <Badge variant="neutral" className="uppercase tracking-wider">{stock['sector_name'] || 'Market'}</Badge>
                                <span className="text-neutral-300">|</span>
                                <span className="text-neutral-500 font-medium text-sm">NSE: {stock['NSE Code']}</span>
                            </div>

                            <Typography variant="display" className="text-4xl md:text-6xl mb-4 text-black">
                                {stock['Stock Name']}
                            </Typography>

                            <div className="flex items-baseline gap-4">
                                <Typography variant="h1" className="text-5xl font-medium tracking-tight">
                                    {formatCurrency(price)}
                                </Typography>
                                <div className={`flex items-center gap-1.5 text-xl font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                                    {isPositive ? <ArrowUpRight className="w-6 h-6" /> : <ArrowDownRight className="w-6 h-6" />}
                                    <span>{changeAmt.toFixed(2)} ({Math.abs(changePct).toFixed(2)}%)</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button variant="primary" size="lg" className="rounded-full shadow-lg shadow-lime-400/20">
                                <Plus className="w-5 h-5 mr-2" />
                                Add to Portfolio
                            </Button>
                        </div>
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex overflow-x-auto no-scrollbar gap-2 border-b border-neutral-200 mb-12 pb-1">
                        {['Overview', 'Analysis', 'Financials', 'Technical', 'News', 'All Data'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-3 rounded-full font-medium text-sm whitespace-nowrap transition-all ${activeTab === tab
                                    ? 'bg-black text-white shadow-md'
                                    : 'bg-transparent text-neutral-500 hover:bg-neutral-100 hover:text-black'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'Overview' && renderOverview()}

                    {activeTab === 'Analysis' && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {analysisSections.map((section, idx) => (
                                <div key={idx} className={`p-8 rounded-[2rem] border ${section.type === 'highlight' ? 'bg-[#fcfdec] border-[#d9f99d]' :
                                    section.type === 'warning' ? 'bg-rose-50 border-rose-100' :
                                        'bg-white border-neutral-100'
                                    } shadow-sm transition-all hover:shadow-md`}>
                                    <Typography variant="h3" className={`mb-6 text-2xl font-bold ${section.type === 'highlight' ? 'text-lime-900' : 'text-neutral-900'}`}>{section.title}</Typography>
                                    <div className="space-y-4">
                                        {section.content.map((paragraph, pIdx) => (
                                            <div key={pIdx} dangerouslySetInnerHTML={{ __html: paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} className="text-lg text-neutral-700 leading-relaxed font-sans" />
                                        ))}
                                    </div>
                                </div>
                            ))}
                            <div className="text-center pt-8">
                                <Badge variant="neutral">Generated by Aura AI Analyst</Badge>
                            </div>
                        </div>
                    )}

                    {activeTab === 'Financials' && (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex justify-between items-center bg-neutral-50/50 p-4 rounded-2xl border border-neutral-100">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${financialsType === 'consolidated' ? 'bg-indigo-500' : 'bg-neutral-400'}`}></div>
                                    <Typography variant="body" className="text-sm text-neutral-600 font-medium">
                                        Viewing {financialsType === 'consolidated' ? 'Consolidated' : 'Standalone'} Financials
                                    </Typography>
                                </div>
                                <div className="bg-neutral-200/50 p-1 rounded-lg flex items-center">
                                    <button
                                        onClick={() => setFinancialsType('standalone')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${financialsType === 'standalone' ? 'bg-white shadow-sm text-neutral-900 ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Standalone
                                    </button>
                                    <button
                                        onClick={() => setFinancialsType('consolidated')}
                                        className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${financialsType === 'consolidated' ? 'bg-white shadow-sm text-neutral-900 ring-1 ring-black/5' : 'text-neutral-500 hover:text-neutral-700'}`}
                                    >
                                        Consolidated
                                    </button>
                                </div>
                            </div>
                            {renderTableLike([
                                {
                                    label: stock['Operating Revenue Qtr'] ? 'Operating Revenue Qtr' : 'Operating Revenue (Ann)',
                                    value: formatNumber(stock['Operating Revenue Qtr'] || stock['Operating Revenue Annual'])
                                },
                                {
                                    label: stock['Net Profit Qtr'] ? 'Net Profit Qtr' : 'Net Profit (Ann)',
                                    value: formatNumber(stock['Net Profit Qtr'] || stock['Net Profit Annual'])
                                },
                                {
                                    label: 'Revenue Growth',
                                    value: formatPercentage(stock['Revenue Growth Qtr YoY %'] || stock['Revenue Growth Annual YoY %'] || undefined),
                                    sub: stock['Revenue Growth Qtr YoY %'] ? 'Qtr YoY' : 'Annual'
                                },
                                {
                                    label: 'Net Profit Margin',
                                    value: formatPercentage(stock['Operating Profit Margin Qtr %'] ||
                                        (stock['Net Profit Annual'] && stock['Operating Revenue Annual'] ?
                                            ((stock['Net Profit Annual'] / stock['Operating Revenue Annual']) * 100) : undefined)
                                    ),
                                    sub: stock['Operating Profit Margin Qtr %'] ? 'Qtr' : 'Calculated Ann'
                                },
                            ])}

                            {fundamentals?.balance_sheet && <FinancialTable title="Balance Sheet" data={fundamentals.balance_sheet} analysis={{ ...financialInsights.balance_sheet, deepDive: bsDeepDive }} />}
                            {fundamentals?.profit_loss && <FinancialTable title="Profit & Loss" data={fundamentals.profit_loss} analysis={{ ...financialInsights.profit_loss, deepDive: plDeepDive }} />}
                            {fundamentals?.cash_flow && <FinancialTable title="Cash Flow" data={fundamentals.cash_flow} analysis={{ ...financialInsights.cash_flow, deepDive: cfDeepDive }} />}
                            {fundamentals?.ratios && <FinancialTable title="Key Ratios" data={fundamentals.ratios} analysis={{ ...financialInsights.ratios, deepDive: ratiosDeepDive }} />}
                        </div>
                    )}

                    {activeTab === 'Technical' && (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Technical Deep Dive */}
                            {techDeepDive && (
                                <div className="mb-10 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-purple-600" />
                                            <span className="font-bold text-neutral-800 uppercase tracking-wider text-sm">Technical Deep Dive</span>
                                        </div>
                                        <Badge variant="neutral">AI Generated</Badge>
                                    </div>
                                    <div className="p-8">
                                        <MarkdownRenderer content={techDeepDive} />
                                    </div>
                                </div>
                            )}

                            {renderTableLike([
                                { label: 'RSI (14)', value: formatNumber(stock['Tech_RSI']), sub: stock['Tech_RSI_State'] || (Number(stock['Tech_RSI']) > 70 ? 'Overbought' : Number(stock['Tech_RSI']) < 30 ? 'Oversold' : 'Neutral') },
                                { label: 'MACD', value: formatNumber(stock['Tech_MACD']), sub: stock['Tech_MACD_Signal'] },
                                { label: 'Trend', value: stock['Tech_Trend'] || '-' },
                                { label: 'SMA 50', value: formatNumber(stock['Day SMA50']) },
                                { label: 'SMA 200', value: formatNumber(stock['Day SMA200']) },
                                { label: 'MFI (14)', value: formatNumber(stock['Tech_MFI']) },
                                { label: 'Volume Signal', value: stock['Tech_Vol_Signal'] || '-' },
                            ])}
                        </div>
                    )}

                    {activeTab === 'News' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {headlines.map((news: { publisher: string; link: string; title: string; providerPublishTime: number }, i: number) => (
                                <div key={i} className="bg-white p-6 rounded-[2rem] border border-neutral-100 hover:shadow-md transition-all group cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <Badge variant="neutral" className="text-[10px] uppercase">{news.publisher || 'NEWS'}</Badge>
                                        <ArrowUpRight className="w-4 h-4 text-neutral-300 group-hover:text-black transition-colors" />
                                    </div>
                                    <Typography variant="h4" className="text-base font-medium line-clamp-3 mb-4 group-hover:text-blue-600 transition-colors">
                                        {news.title}
                                    </Typography>
                                    <Typography variant="caption">
                                        {new Date(news.providerPublishTime * 1000).toLocaleDateString()}
                                    </Typography>
                                </div>
                            ))}
                            {headlines.length === 0 && <div className="col-span-full text-center text-neutral-400 py-10">No recent news found.</div>}
                        </div>
                    )}

                    {activeTab === 'All Data' && (
                        <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <section>
                                <Typography variant="h3" className="mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-neutral-400" />
                                    Performance History
                                </Typography>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {[
                                        { label: '1 Month', value: stock['Month Change %'] },
                                        { label: '3 Months', value: stock['Qtr Change %'] },
                                        { label: '1 Year', value: stock['1Yr change %'] },
                                        { label: '3 Years', value: stock['3Yr price change %'] },
                                    ].map((item, i) => (
                                        <div key={i} className="bg-white p-6 rounded-[1.5rem] border border-neutral-100 flex flex-col justify-between h-28 relative overflow-hidden group hover:shadow-md transition-all">
                                            <Typography variant="caption" className="font-bold text-neutral-400 uppercase tracking-wider relative z-10">{item.label}</Typography>
                                            <div className="relative z-10">
                                                <Typography variant="h3" className={`text-2xl ${Number(item.value) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                    {formatPercentage(item.value)}
                                                </Typography>
                                            </div>
                                            <div className={`absolute bottom-0 right-0 w-24 h-24 opacity-5 ${Number(item.value) >= 0 ? 'bg-emerald-400' : 'bg-rose-400'} rounded-tl-full`}></div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <Typography variant="h3" className="mb-6 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-neutral-400" />
                                    Technical Analysis
                                </Typography>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-white rounded-[2rem] border border-neutral-100 p-6">
                                        <Typography variant="h4" className="mb-4 text-base">Moving Averages</Typography>
                                        <div className="space-y-3">
                                            {[
                                                { l: 'SMA 50', v: stock['Day SMA50'] },
                                                { l: 'SMA 200', v: stock['Day SMA200'] },
                                                { l: 'EMA 20', v: stock['Day EMA20'] },
                                            ].map((t, idx) => (
                                                <div key={idx} className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2 last:border-0">
                                                    <span className="text-neutral-500">{t.l}</span>
                                                    <span className="font-mono font-medium">{formatNumber(t.v)}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2rem] border border-neutral-100 p-6">
                                        <Typography variant="h4" className="mb-4 text-base">Oscillators</Typography>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2">
                                                <span className="text-neutral-500">RSI (14)</span>
                                                <div className="text-right">
                                                    <span className={`font-mono font-medium block ${Number(stock['Tech_RSI']) > 70 ? 'text-rose-500' : Number(stock['Tech_RSI']) < 30 ? 'text-emerald-500' : 'text-neutral-900'}`}>
                                                        {formatNumber(stock['Tech_RSI'])}
                                                    </span>
                                                    <span className="text-[10px] text-neutral-400">{Number(stock['Tech_RSI']) > 70 ? 'Overbought' : Number(stock['Tech_RSI']) < 30 ? 'Oversold' : 'Neutral'}</span>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center text-sm pb-2">
                                                <span className="text-neutral-500">MACD</span>
                                                <span className="font-mono font-medium">{formatNumber(stock['Tech_MACD'])}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[2rem] border border-neutral-100 p-6">
                                        <Typography variant="h4" className="mb-4 text-base">Volatility & Risk</Typography>
                                        <div className="space-y-3">
                                            <div className="flex justify-between items-center text-sm border-b border-neutral-50 pb-2">
                                                <span className="text-neutral-500">Beta (1Y)</span>
                                                <span className="font-mono font-medium">{formatNumber(stock['Beta 1Year'])}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm pb-2">
                                                <span className="text-neutral-500">ATR</span>
                                                <span className="font-mono font-medium">{formatNumber(stock['Day ATR'])}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <section>
                                <Typography variant="h3" className="mb-6 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-neutral-400" />
                                    Shareholding Pattern
                                </Typography>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[
                                        { label: 'Promoter', val: stock['Promoter holding latest %'], chg: stock['Promoter holding change QoQ %'], color: 'bg-neutral-900' },
                                        { label: 'FII', val: stock['FII holding current Qtr %'], chg: stock['FII holding change QoQ %'], color: 'bg-[#ccf32f]' },
                                        { label: 'Mutual Funds', val: stock['MF holding current Qtr %'], chg: stock['MF holding change QoQ %'], color: 'bg-neutral-200' },
                                    ].map((h, i) => (
                                        <div key={i} className="bg-white p-5 rounded-[2rem] border border-neutral-100 relative overflow-hidden">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${h.color}`}></div>
                                                    <span className="text-sm font-bold text-neutral-600">{h.label}</span>
                                                </div>
                                                {h.chg && Number(h.chg) !== 0 && (
                                                    <Badge variant={Number(h.chg) > 0 ? 'success' : 'danger'}>
                                                        {Number(h.chg) > 0 ? '+' : ''}{Number(h.chg).toFixed(2)}%
                                                    </Badge>
                                                )}
                                            </div>
                                            <Typography variant="h2" className="text-3xl font-medium mb-1">
                                                {h.val ? `${Number(h.val).toFixed(2)}%` : '-'}
                                            </Typography>
                                            <Typography variant="caption" className="text-neutral-400">Current Holding</Typography>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </Container >
        </div >
    );
};

export default StockDetails;
