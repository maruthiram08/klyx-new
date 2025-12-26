"use client";

// Payoff Timeline Chart Component
// Location: frontend/components/debt-optimizer/PayoffChart.tsx

import React, { useState } from "react";
import { OptimizationResult } from "@/types/debt";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/utils/currencyFormatter";

interface PayoffChartProps {
  result: OptimizationResult;
}

type TimeRange = "3M" | "6M" | "1Y" | "5Y" | "MAX";

const TIME_RANGES: { label: TimeRange; months: number | null }[] = [
  { label: "3M", months: 3 },
  { label: "6M", months: 6 },
  { label: "1Y", months: 12 },
  { label: "5Y", months: 60 },
  { label: "MAX", months: null },
];

// Color palette for debts
const DEBT_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#f59e0b", // amber
  "#84cc16", // lime
  "#22c55e", // green
  "#14b8a6", // teal
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#6366f1", // indigo
  "#8b5cf6", // violet
  "#a855f7", // purple
  "#ec4899", // pink
];

export function PayoffChart({ result }: PayoffChartProps) {
  const { schedule } = result;

  // Get total months from data
  const totalMonths = Math.max(...schedule.monthlyPayments.map((p) => p.month));

  // State for selected time range
  const [selectedRange, setSelectedRange] = useState<TimeRange>("MAX");

  // State for chart view mode
  const [viewMode, setViewMode] = useState<"stacked" | "individual">(
    "individual",
  );

  // State for Y-axis scale
  const [yAxisScale, setYAxisScale] = useState<"absolute" | "percentage">(
    "absolute",
  );

  // Calculate displayed months based on selected range
  const getDisplayMonths = () => {
    const range = TIME_RANGES.find((r) => r.label === selectedRange);
    if (!range || range.months === null) return totalMonths;
    return Math.min(range.months, totalMonths);
  };

  const maxMonth = getDisplayMonths();

  // Group payments by month and debt to create chart data
  const chartData: any[] = [];
  const debtNames = new Set<string>();

  // Collect all unique debt names
  schedule.monthlyPayments.forEach((p) => debtNames.add(p.debtName));
  const debtNameArray = Array.from(debtNames);

  // Get initial balances for percentage calculation
  const initialBalances: { [key: string]: number } = {};
  debtNameArray.forEach((debtName) => {
    const firstPayment = schedule.monthlyPayments.find(
      (p) => p.debtName === debtName && p.month === 1,
    );
    if (firstPayment) {
      // Initial balance = remaining balance at month 1 + principal paid in month 1
      initialBalances[debtName] =
        firstPayment.remainingBalance + firstPayment.principalPaid;
    }
  });

  // Build data for each month
  for (let month = 1; month <= maxMonth; month++) {
    const monthData: any = {
      month,
      monthLabel: `Month ${month}`,
      total: 0,
    };

    // For each debt, add its remaining balance
    debtNameArray.forEach((debtName) => {
      const payment = schedule.monthlyPayments.find(
        (p) => p.month === month && p.debtName === debtName,
      );

      if (payment) {
        if (yAxisScale === "percentage") {
          // Show as percentage of initial balance
          const percentageRemaining =
            (payment.remainingBalance / initialBalances[debtName]) * 100;
          monthData[debtName] = percentageRemaining;
        } else {
          // Show absolute amount
          monthData[debtName] = payment.remainingBalance;
        }
        monthData.total += payment.remainingBalance;
      } else {
        monthData[debtName] = 0;
      }
    });

    chartData.push(monthData);
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-neutral-200">
          <p className="font-semibold mb-2">{label}</p>
          {payload.reverse().map((entry: any, index: number) => (
            <div
              key={index}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span>{entry.name}:</span>
              </div>
              <span className="font-mono font-semibold">
                {formatCurrency(entry.value)}
              </span>
            </div>
          ))}
          <div className="mt-2 pt-2 border-t border-neutral-200 flex justify-between">
            <span className="font-semibold">Total:</span>
            <span className="font-mono font-bold">
              {formatCurrency(
                payload.reduce((sum: number, p: any) => sum + p.value, 0),
              )}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate dynamic width based on number of months
  // For long-term debts, make chart wider and scrollable
  const chartWidth = maxMonth > 24 ? maxMonth * 40 : "100%";
  const containerHeight = 350;

  return (
    <div className="bg-neutral-900 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
          Payoff Timeline
        </h3>

        <div className="flex items-center gap-3">
          {/* Y-Axis Scale Toggle */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setYAxisScale("absolute")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                yAxisScale === "absolute"
                  ? "bg-[#ccf32f] text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
              title="Show actual rupee amounts"
            >
              ₹ Amount
            </button>
            <button
              onClick={() => setYAxisScale("percentage")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                yAxisScale === "percentage"
                  ? "bg-[#ccf32f] text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
              title="Show as percentage - all debts normalized to 0-100%"
            >
              % Progress
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode("individual")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                viewMode === "individual"
                  ? "bg-[#ccf32f] text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
              title="Individual lines - better for mixed debt sizes"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M3 21h18M3 10h18M3 7h18M3 14h18"
                />
              </svg>
              Lines
            </button>
            <button
              onClick={() => setViewMode("stacked")}
              className={`px-3 py-1 text-xs font-semibold rounded transition-all flex items-center gap-1 ${
                viewMode === "stacked"
                  ? "bg-[#ccf32f] text-black"
                  : "text-neutral-400 hover:text-white hover:bg-neutral-700"
              }`}
              title="Stacked area - shows total debt visually"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
              </svg>
              Stack
            </button>
          </div>

          {/* Time Range Buttons */}
          <div className="flex items-center gap-1 bg-neutral-800 rounded-lg p-1">
            {TIME_RANGES.map((range) => {
              // Don't show range if it exceeds total months (except MAX)
              if (range.months !== null && range.months > totalMonths)
                return null;

              const isSelected = selectedRange === range.label;
              return (
                <button
                  key={range.label}
                  onClick={() => setSelectedRange(range.label)}
                  className={`px-3 py-1 text-xs font-semibold rounded transition-all ${
                    isSelected
                      ? "bg-[#ccf32f] text-black"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-700"
                  }`}
                >
                  {range.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className={maxMonth > 24 ? "overflow-x-auto pb-4" : ""}>
        <ResponsiveContainer width={chartWidth} height={containerHeight}>
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
          >
            <defs>
              {debtNameArray.map((debtName, index) => (
                <linearGradient
                  key={debtName}
                  id={`color${index}`}
                  x1="0"
                  y1="0"
                  x2="0"
                  y2="1"
                >
                  <stop
                    offset="5%"
                    stopColor={DEBT_COLORS[index % DEBT_COLORS.length]}
                    stopOpacity={0.8}
                  />
                  <stop
                    offset="95%"
                    stopColor={DEBT_COLORS[index % DEBT_COLORS.length]}
                    stopOpacity={0.3}
                  />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#374151"
              opacity={0.3}
            />
            <XAxis
              dataKey="monthLabel"
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
            />
            <YAxis
              stroke="#9ca3af"
              tick={{ fill: "#9ca3af", fontSize: 12 }}
              tickFormatter={(value) =>
                yAxisScale === "percentage"
                  ? `${value.toFixed(0)}%`
                  : `₹${(value / 100000).toFixed(0)}L`
              }
              domain={[0, yAxisScale === "percentage" ? 100 : "auto"]}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ paddingTop: "20px" }}
              iconType="circle"
              formatter={(value) => (
                <span style={{ color: "#d1d5db" }}>{value}</span>
              )}
            />
            {debtNameArray.map((debtName, index) => (
              <Area
                key={debtName}
                type="monotone"
                dataKey={debtName}
                stackId={viewMode === "stacked" ? "1" : undefined}
                stroke={DEBT_COLORS[index % DEBT_COLORS.length]}
                fill={viewMode === "stacked" ? `url(#color${index})` : "none"}
                fillOpacity={viewMode === "stacked" ? 1 : 0}
                strokeWidth={viewMode === "individual" ? 3 : 2}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
