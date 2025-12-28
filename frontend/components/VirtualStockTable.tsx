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
    Trash2,
} from "lucide-react";

interface VirtualStockTableProps {
    stocks: Stock[];
    portfolioStocks: Set<string>;
    loadingPortfolio: string | null;
    onTogglePortfolio: (e: React.MouseEvent, stockName: string) => void;
}

const ROW_HEIGHT = 64; // Height of each row in pixels

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
        overscan: 5, // Render 5 extra rows above/below viewport
    });

    const formatCurrency = (val: number | undefined) => {
        if (val === undefined || val === null) return "-";
        return Number(val).toLocaleString("en-IN", {
            style: "currency",
            currency: "INR",
        });
    };

    const formatPercent = (val: number | undefined) => {
        if (val === undefined || val === null) return "-";
        const num = Number(val);
        return `${num > 0 ? "+" : ""}${num.toFixed(2)}%`;
    };

    // Debug: log stocks count
    console.log(`[VirtualStockTable] Rendering ${stocks.length} stocks`);

    // Handle empty state
    if (!stocks || stocks.length === 0) {
        return (
            <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm p-12 text-center">
                <p className="text-neutral-500">No stocks found</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-[2rem] border border-neutral-100 overflow-hidden shadow-sm">
            {/* Fixed Header */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-neutral-50 border-b border-neutral-100">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider w-[200px]">
                                Stock
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-neutral-400 uppercase tracking-wider w-[140px]">
                                Sector
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[120px]">
                                Price
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[100px]">
                                Change
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[120px]">
                                Market Cap
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[80px]">
                                P/E
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[80px]">
                                ROE
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[80px]">
                                Quality
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-neutral-400 uppercase tracking-wider w-[100px]">
                                Action
                            </th>
                        </tr>
                    </thead>
                </table>
            </div>

            {/* Virtualized Body */}
            <div
                ref={parentRef}
                className="overflow-auto"
                style={{ height: "600px" }} // Fixed height for scrolling
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
                                className="absolute top-0 left-0 w-full flex items-center hover:bg-neutral-50/50 transition-colors cursor-pointer group border-b border-neutral-100"
                                style={{
                                    height: `${ROW_HEIGHT}px`,
                                    transform: `translateY(${virtualRow.start}px)`,
                                }}
                                onClick={() => router.push(`/stock/${stock["NSE Code"]}`)}
                            >
                                {/* Stock Name */}
                                <div className="px-6 w-[200px] whitespace-nowrap">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-neutral-900">
                                            {stockName}
                                        </span>
                                        <span className="text-xs text-neutral-400">
                                            {stock["NSE Code"]}
                                        </span>
                                    </div>
                                </div>

                                {/* Sector */}
                                <div className="px-6 w-[140px] whitespace-nowrap">
                                    <span className="px-2 py-1 bg-neutral-100 rounded-lg text-xs font-medium text-neutral-600">
                                        {stock.sector_name || "N/A"}
                                    </span>
                                </div>

                                {/* Price */}
                                <div className="px-6 w-[120px] whitespace-nowrap text-right font-mono font-medium">
                                    {formatCurrency(stock["Current Price"])}
                                </div>

                                {/* Change */}
                                <div className="px-6 w-[100px] whitespace-nowrap text-right">
                                    <div
                                        className={`inline-flex items-center gap-1 font-medium ${Number(stock["Day change %"]) >= 0
                                            ? "text-emerald-600"
                                            : "text-rose-600"
                                            }`}
                                    >
                                        {Number(stock["Day change %"]) >= 0 ? (
                                            <TrendingUp size={14} />
                                        ) : (
                                            <TrendingDown size={14} />
                                        )}
                                        {formatPercent(stock["Day change %"])}
                                    </div>
                                </div>

                                {/* Market Cap */}
                                <div className="px-6 w-[120px] whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                                    {stock["Market Capitalization"]
                                        ? `₹${(
                                            Number(stock["Market Capitalization"]) / 10000000
                                        ).toFixed(0)}Cr`
                                        : "-"}
                                </div>

                                {/* P/E */}
                                <div className="px-6 w-[80px] whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                                    {stock["PE TTM Price to Earnings"]
                                        ? Number(stock["PE TTM Price to Earnings"]).toFixed(2)
                                        : "-"}
                                </div>

                                {/* ROE */}
                                <div className="px-6 w-[80px] whitespace-nowrap text-right text-neutral-600 font-mono text-sm">
                                    {stock["ROE Annual %"]
                                        ? `${Number(stock["ROE Annual %"]).toFixed(1)}%`
                                        : "-"}
                                </div>

                                {/* Quality */}
                                <div className="px-6 w-[80px] whitespace-nowrap text-right">
                                    {stock["Data Quality Score"] && (
                                        <div className="inline-flex items-center gap-1">
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
                                <div className="px-6 w-[100px] whitespace-nowrap text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            disabled={isProcessing}
                                            onClick={(e) => onTogglePortfolio(e, stockName)}
                                            className={`
                        flex items-center justify-center w-8 h-8 rounded-full transition-all duration-200
                        ${isInPortfolio
                                                    ? "bg-emerald-100 text-emerald-600 hover:bg-rose-100 hover:text-rose-600"
                                                    : "bg-neutral-100 text-neutral-400 hover:bg-[#ccf32f] hover:text-black hover:scale-110"
                                                }
                        ${isProcessing ? "cursor-wait opacity-70" : ""}
                      `}
                                            title={
                                                isInPortfolio
                                                    ? "Remove from Portfolio"
                                                    : "Add to Portfolio"
                                            }
                                        >
                                            {isProcessing ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : isInPortfolio ? (
                                                <Check size={14} />
                                            ) : (
                                                <Plus size={16} />
                                            )}
                                        </button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="rounded-full w-8 h-8 p-0"
                                        >
                                            <Eye
                                                size={16}
                                                className="text-neutral-400 group-hover:text-black"
                                            />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
