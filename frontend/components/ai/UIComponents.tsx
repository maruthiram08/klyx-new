"use client";

import React from "react";
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
    ArrowUpRight, ArrowDownRight, Newspaper, Activity, TrendingUp, TrendingDown,
    BarChart3, PieChart, Layers
} from "lucide-react";
import { Typography } from "../ui/Typography";
import { Badge } from "../ui/Badge";

// --- Stock Info Card ---
export const VisualStockCard = ({ data }: { data: any }) => {
    if (!data) return null;
    const isPositive = (data.change || 0) >= 0;

    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm w-full max-w-sm mb-4">
            <div className="flex justify-between items-start mb-3">
                <div>
                    <Typography variant="h4" className="text-lg font-bold">{data.symbol || "Unknown"}</Typography>
                    <Typography variant="caption" className="text-neutral-500">{data.name || ""}</Typography>
                </div>
                {data.score !== undefined && (
                    <Badge variant={data.score >= 70 ? "success" : "neutral"}>
                        {data.score}
                    </Badge>
                )}
            </div>
            <div className="flex items-baseline gap-2">
                <Typography variant="h3" className="text-2xl font-bold">{data.price || "N/A"}</Typography>
                {data.change !== undefined && (
                    <div className={`flex items-center text-sm font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}>
                        {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(data.change).toFixed(2)}%
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Comparison Table/Card ---
export const VisualComparison = ({ data }: { data: any }) => {
    if (!data || !data.stocks || !data.metrics) return null;
    return (
        <div className="bg-neutral-50 border border-neutral-200 rounded-2xl overflow-hidden mb-4 shadow-sm">
            <div className="grid grid-cols-3 bg-neutral-100 p-3 border-b border-neutral-200">
                <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Metric</div>
                {data.stocks.map((s: any, i: number) => (
                    <div key={i} className="text-[10px] font-bold text-neutral-800 text-center uppercase tracking-wider truncate">{s.symbol}</div>
                ))}
            </div>
            <div className="divide-y divide-neutral-200">
                {data.metrics.map((m: any, i: number) => (
                    <div key={i} className="grid grid-cols-3 p-2.5 items-center hover:bg-white transition-colors">
                        <div className="text-xs font-medium text-neutral-600 truncate">{m.label}</div>
                        {m.values && m.values.map((v: any, j: number) => (
                            <div key={j} className="text-xs font-bold text-center text-neutral-900 truncate">{v}</div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- News List ---
export const VisualNews = ({ data }: { data: any }) => {
    if (!data || !data.items) return null;
    return (
        <div className="space-y-2 mb-4">
            {data.items.slice(0, 3).map((item: any, i: number) => (
                <div key={i} className="flex gap-3 p-2.5 bg-white border border-neutral-200 rounded-xl hover:shadow-sm transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-neutral-100 flex items-center justify-center flex-shrink-0 group-hover:bg-[#bce325] transition-colors">
                        <Newspaper size={14} className="text-neutral-500 group-hover:text-black" />
                    </div>
                    <div className="min-w-0">
                        <Typography variant="body" className="font-bold text-xs truncate leading-tight mb-0.5 group-hover:text-neutral-900">
                            {item.title}
                        </Typography>
                        <div className="flex items-center gap-2 text-[9px] text-neutral-400 font-medium">
                            <span>{item.source}</span>
                            {item.time && (
                                <>
                                    <span>•</span>
                                    <span>{item.time}</span>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
};

// --- Simple Line Chart ---
export const VisualChart = ({ data }: { data: any }) => {
    if (!data || !data.points || data.points.length === 0) return null;
    return (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 shadow-sm mb-4 h-[180px] w-full">
            <Typography variant="caption" className="font-bold text-neutral-400 uppercase tracking-widest block mb-2 text-[10px]">
                Price Trend ({data.period || "6M"})
            </Typography>
            <ResponsiveContainer width="100%" height="90%">
                <LineChart data={data.points} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f5f5f5" />
                    <XAxis
                        dataKey="time"
                        tick={{ fontSize: 10, fill: '#888' }}
                        tickFormatter={(value) => {
                            const date = new Date(value);
                            return `${date.getDate()}/${date.getMonth() + 1}`;
                        }}
                        interval="preserveStartEnd"
                    />
                    <YAxis
                        domain={['auto', 'auto']}
                        tick={{ fontSize: 10, fill: '#888' }}
                        width={40}
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <Tooltip
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '10px' }}
                        labelStyle={{ fontWeight: 'bold' }}
                    />
                    <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#bce325"
                        strokeWidth={2.5}
                        dot={false}
                        animationDuration={1500}
                    />
                </LineChart>
            </ResponsiveContainer>
        </div>
    );
};

// --- Main Dispatcher ---
export const AIGenerativeUI = ({ type, data }: { type: string, data: any }) => {
    switch (type) {
        case "stock-card":
            return <VisualStockCard data={data} />;
        case "comparison":
            return <VisualComparison data={data} />;
        case "news":
            return <VisualNews data={data} />;
        case "chart":
            return <VisualChart data={data} />;
        default:
            return null;
    }
};
