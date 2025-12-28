"use client";

import React, { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useRouter } from "next/navigation";
import { Stock } from "@/types";
import { Button } from "@/components/ui/Button";
import {
    TrendingUp,
    TrendingDown,
    Eye,
    Plus,
    Check,
    Loader2,
} from "lucide-react";

interface VirtualStockTableProps {
    stocks: Stock[];
    portfolioStocks: Set<string>;
    loadingPortfolio: string | null;
    onTogglePortfolio: (e: React.MouseEvent, stockName: string) => void;
}

const ROW_HEIGHT = 60;

export function VirtualStockTable({
    stocks,
    portfolioStocks,
    loadingPortfolio,
    onTogglePortfolio,
}: VirtualStockTableProps) {
    const router = useRouter();
    const parentRef = useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count: stocks.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5,
    });

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return "-";
        return Number(val).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        });
    };

    const formatPercent = (val: number | undefined) => {
        if (val === undefined || val === null) return "-";
        const num = Number(val);
        return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
    };

    if (!stocks || stocks.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm p-12 text-center">
                <p className="text-neutral-500">No stocks found</p>
            </div>
        );
    }

    // Column style definitions using flex
    const colStyles = {
        stock: "flex-[2] min-w-[120px]",
        sector: "flex-[1.5] min-w-[100px]",
        price: "flex-1 min-w-[80px] text-right",
        change: "flex-1 min-w-[80px] text-right",
        marketCap: "flex-1 min-w-[90px] text-right",
        pe: "flex-[0.7] min-w-[50px] text-right",
        roe: "flex-[0.7] min-w-[50px] text-right",
        quality: "flex-[0.8] min-w-[60px] text-right",
        action: "flex-[0.5] min-w-[50px] text-right",
    };

    return (
        <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
            {/* Header Row */}
            <div className="bg-neutral-50 border-b border-neutral-100 flex items-center px-4 py-3 gap-2">
                <div className={`${colStyles.stock} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Stock
                </div>
                <div className={`${colStyles.sector} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Sector
                </div>
                <div className={`${colStyles.price} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Price
                </div>
                <div className={`${colStyles.change} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Change
                </div>
                <div className={`${colStyles.marketCap} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Market Cap
                </div>
                <div className={`${colStyles.pe} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    P/E
                </div>
                <div className={`${colStyles.roe} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    ROE
                </div>
                <div className={`${colStyles.quality} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Quality
                </div>
                <div className={`${colStyles.action} text-xs font-bold text-neutral-400 uppercase tracking-wider`}>
                    Action
                </div>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: "600px" }}
            >
                <div
                    style={{
                        height: `${virtualizer.getTotalSize()}px`,
                        width: "100%",
                        position: "relative",
                    }}
                >
                    {virtualizer.getVirtualItems().map((virtualRow) => {
                        const stock = stocks[virtualRow.index];
                        const stockName = stock["Stock Name"];
                        const isInPortfolio = portfolioStocks.has(stockName);
                        const isProcessing = loadingPortfolio === stockName;

                        return (
                            <div
                                key={stock["NSE Code"]}
                                className="absolute top-0 left-0 w-full flex items-center px-4 gap-2 hover:bg-neutral-50/50 transition-colors cursor-pointer group border-b border-neutral-100"
                                style={{
                                    height: `${ROW_HEIGHT}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                onClick={() => router.push(`/stock/${stock["NSE Code"]}`)}
                            >
                                {/* Stock Name */}
                                <div className={colStyles.stock}>
                                    <div className="flex flex-col">
                                        <span className="font-semibold text-neutral-900 text-sm truncate">
                                            {stockName}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            {stock["NSE Code"]}
                                        </span>
                                    </div>
                                </div>

                                {/* Sector */}
                                <div className={colStyles.sector}>
                                    <span className="px-2 py-0.5 bg-neutral-100 rounded text-xs font-medium text-neutral-600 truncate inline-block max-w-full">
                                        {stock.sector_name || "N/A"}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className={`${colStyles.price} font-mono font-medium text-sm`}>
                                    {formatCurrency(stock["Current Price"])}
                                </div>

                                {/* Change */}
                                <div className={colStyles.change}>
                                    <span
                                        className={`inline-flex items-center gap-1 font-medium text-sm ${Number(stock["Day change %"]) >= 0
                                            ? "text-emerald-600"
                                            : "text-rose-600"
                                            }`}
                                    >
                                        {Number(stock["Day change %"]) >= 0 ? (
                                            <TrendingUp size={12} />
                                        ) : (
                                            <TrendingDown size={12} />
                                        )}
                                        {formatPercent(stock["Day change %"])}
                                    </span>
                                </div>

                                {/* Market Cap */}
                                <div className={`${colStyles.marketCap} text-neutral-600 font-mono text-sm`}>
                                    {stock["Market Capitalization"]
                                        ? `₹${(Number(stock["Market Capitalization"]) / 10000000).toFixed(0)}Cr`
                                        : "-"}
                                </div>

                                {/* P/E */}
                                <div className={`${colStyles.pe} text-neutral-600 font-mono text-sm`}>
                                    {stock["PE TTM Price to Earnings"]
                                        ? Number(stock["PE TTM Price to Earnings"]).toFixed(1)
                                        : "-"}
                                </div>

                                {/* ROE */}
                                <div className={`${colStyles.roe} text-neutral-600 font-mono text-sm`}>
                                    {stock["ROE Annual %"]
                                        ? `${Number(stock["ROE Annual %"]).toFixed(1)}%`
                                        : "-"}
                                </div>

                                {/* Quality */}
                                <div className={colStyles.quality}>
                                    {stock["Data Quality Score"] && (
                                        <div className="inline-flex items-center gap-1 justify-end">
                                            <div
                                                className={`w-2 h-2 rounded-full ${Number(stock["Data Quality Score"]) >= 80
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
                                </div>

                                {/* Action */}
                                <div className={colStyles.action}>
                                    <button
                                        disabled={isProcessing}
                                        onClick={(e) => onTogglePortfolio(e, stockName)}
                                        className={`
                                            flex items-center justify-center w-7 h-7 rounded-full transition-all duration-200 ml-auto
                                            ${isInPortfolio
                                                ? "bg-emerald-100 text-emerald-600 hover:bg-rose-100 hover:text-rose-600"
                                                : "bg-neutral-100 text-neutral-400 hover:bg-[#ccf32f] hover:text-black hover:scale-110"
                                            }
                                            ${isProcessing ? "cursor-wait opacity-70" : ""}
                                        `}
                                        title={isInPortfolio ? "Remove from Portfolio" : "Add to Portfolio"}
                                    >
                                        {isProcessing ? (
                                            <Loader2 size={12} className="animate-spin" />
                                        ) : isInPortfolio ? (
                                            <Check size={12} />
                                        ) : (
                                            <Plus size={14} />
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
