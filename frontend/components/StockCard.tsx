import React from "react";
import { Stock } from "../types";
import { Badge } from "./ui/Badge";
import { Typography } from "./ui/Typography";
import { DataQualityBadge } from "./ui/DataQualityBadge";
import { ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";

interface StockCardProps {
  stock: Stock;
  onClick: (stock: Stock) => void;
}

const StockCard: React.FC<StockCardProps> = ({ stock, onClick }) => {
  // --- Logic Utilities ---
  const change = Number(stock["Day change %"] || 0);
  const isPositive = change >= 0;

  const price = Number(stock["Current Price"]).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });
  const score = Math.round(Number(stock["Trendlyne Momentum Score"] || 0));

  // Refined Score Color Logic
  const getScoreVariant = (s: number) => {
    if (s >= 70) return "success";
    if (s >= 50) return "warning";
    return "danger";
  };

  return (
    <div
      onClick={() => onClick(stock)}
      className="group relative bg-white rounded-[2rem] p-6 border border-neutral-100 hover:border-neutral-200 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer h-full flex flex-col justify-between"
    >
      {/* Top Row: Identity & Score */}
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-3">
          <div>
            <Typography
              variant="h4"
              className="text-xl font-bold leading-tight group-hover:text-[#bce325] transition-colors mb-1"
            >
              {stock["NSE Code"]}
            </Typography>
            <Typography
              variant="caption"
              className="font-medium text-neutral-500 uppercase tracking-wide block"
            >
              {stock["Stock Name"]}
            </Typography>
          </div>
        </div>

        {/* Minimal Score Badge */}
        <Badge
          variant="neutral"
          className="group-hover:scale-105 transition-transform bg-neutral-50 border border-neutral-100"
        >
          <Activity
            size={12}
            className={`mr-1 ${score >= 70 ? "text-emerald-500" : score >= 50 ? "text-yellow-500" : "text-rose-500"}`}
          />
          <span className="font-bold">{score}</span>
        </Badge>
      </div>

      {/* Middle Row: Price & Trend */}
      <div className="mb-6">
        <Typography
          variant="h2"
          className="text-3xl font-semibold tracking-tight text-neutral-900 mb-1"
        >
          {price}
        </Typography>
        <div
          className={`flex items-center gap-1.5 text-sm font-medium ${isPositive ? "text-emerald-600" : "text-rose-600"}`}
        >
          {isPositive ? (
            <ArrowUpRight size={16} />
          ) : (
            <ArrowDownRight size={16} />
          )}
          <span>{Math.abs(change).toFixed(2)}%</span>
        </div>
      </div>

      {/* Bottom Row: Key Fundamentals */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-neutral-50">
        <div>
          <Typography
            variant="caption"
            className="font-bold text-neutral-400 uppercase tracking-widest block mb-1"
          >
            ROE
          </Typography>
          <Typography
            variant="body"
            className="text-sm font-medium text-neutral-700"
          >
            {stock["ROE Annual %"]
              ? `${Number(stock["ROE Annual %"]).toFixed(1)}%`
              : "-"}
          </Typography>
        </div>
        <div>
          <Typography
            variant="caption"
            className="font-bold text-neutral-400 uppercase tracking-widest block mb-1"
          >
            P/E
          </Typography>
          <Typography
            variant="body"
            className="text-sm font-medium text-neutral-700"
          >
            {stock["PE TTM Price to Earnings"]
              ? `${Number(stock["PE TTM Price to Earnings"]).toFixed(1)}x`
              : "-"}
          </Typography>
        </div>
      </div>

      {/* Data Quality Indicator */}
      {stock["Data Quality Score"] !== undefined && (
        <div className="mt-3 pt-3 border-t border-neutral-50">
          <DataQualityBadge
            score={stock["Data Quality Score"]}
            sources={stock["Data Sources"]}
            lastUpdated={stock["Last Updated"]}
            variant="compact"
          />
        </div>
      )}

      {/* Hover Action (Subtle) */}
      <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
        <div className="w-8 h-8 rounded-full bg-[#ccf32f] flex items-center justify-center text-black shadow-sm">
          <ArrowUpRight size={16} />
        </div>
      </div>
    </div>
  );
};

export default StockCard;
