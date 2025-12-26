"use client";

// Method Comparison Component - Clean Minimal Design
// Location: frontend/components/debt-optimizer/MethodComparison.tsx

import React from "react";
import { OptimizationResult, OptimizationMethod } from "@/types/debt";
import { formatCurrency } from "@/utils/currencyFormatter";
import { Check } from "lucide-react";
import { PayoffChart } from "./PayoffChart";

interface MethodComparisonProps {
  results: OptimizationResult[];
  selectedMethod: OptimizationMethod;
  onSelectMethod: (method: OptimizationMethod) => void;
  monthlyBudget: number;
  onBudgetChange: (value: number) => void;
}

const methodDetails = {
  [OptimizationMethod.SNOWBALL]: {
    name: "Snowball",
    description: "Smallest balance first",
    color: "from-blue-500 to-blue-600",
  },
  [OptimizationMethod.AVALANCHE]: {
    name: "Avalanche",
    description: "Highest interest first",
    color: "from-emerald-500 to-emerald-600",
  },
  [OptimizationMethod.SKI]: {
    name: "Ski",
    description: "Smart hybrid",
    color: "from-purple-500 to-purple-600",
  },
};

export function MethodComparison({
  results,
  selectedMethod,
  onSelectMethod,
  monthlyBudget,
  onBudgetChange,
}: MethodComparisonProps) {
  // Find best method (lowest interest)
  const bestMethod = results.reduce((best, result) =>
    result.totalInterestPaid < best.totalInterestPaid ? result : best,
  );

  // Calculate totals
  const totalDebt =
    results[0]?.totalAmountPaid - results[0]?.totalInterestPaid || 0;

  return (
    <div className="space-y-6">
      {/* Three Method Cards - Clean minimal design */}
      <div className="grid grid-cols-3 gap-4">
        {results.map((result) => {
          const details = methodDetails[result.method];
          const isSelected = selectedMethod === result.method;
          const isBest = result.method === bestMethod.method;

          return (
            <button
              key={result.method}
              onClick={() => onSelectMethod(result.method)}
              className={`relative bg-white rounded-xl p-5 text-left transition-all border-2 ${
                isSelected
                  ? "border-neutral-900 shadow-lg scale-[1.02]"
                  : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
              }`}
            >
              {/* Best Badge */}
              {isBest && (
                <div className="absolute -top-2 -right-2 bg-neutral-900 text-white text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Check size={12} />
                  Best
                </div>
              )}

              {/* Method Name */}
              <div className="mb-4">
                <h3 className="font-semibold text-neutral-900 mb-0.5">
                  {details.name}
                </h3>
                <p className="text-xs text-neutral-500">
                  {details.description}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-neutral-500 mb-1">Interest Paid</p>
                  <p className="text-xl font-bold text-neutral-900">
                    {formatCurrency(result.totalInterestPaid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-neutral-500 mb-1">
                    Time to Freedom
                  </p>
                  <p className="text-sm font-semibold text-neutral-700">
                    {result.monthsToPayoff} months
                  </p>
                </div>
              </div>

              {/* Selected Indicator */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-5 h-5 rounded-full bg-neutral-900 flex items-center justify-center">
                    <Check size={14} className="text-white" />
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Four Summary Cards */}
      <div className="grid grid-cols-4 gap-4">
        {/* Total Debt */}
        <div className="bg-gradient-to-br from-rose-500 to-rose-600 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 mb-1.5 font-medium">Total Debt</p>
          <p className="text-2xl font-bold">{formatCurrency(totalDebt)}</p>
        </div>

        {/* Debt Free By */}
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 mb-1.5 font-medium">Debt Free By</p>
          <p className="text-2xl font-bold">
            {new Date(
              Date.now() +
                results.find((r) => r.method === selectedMethod)!
                  .monthsToPayoff *
                  30 *
                  24 *
                  60 *
                  60 *
                  1000,
            ).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
          </p>
          <p className="text-xs opacity-70 mt-1">
            {results.find((r) => r.method === selectedMethod)!.monthsToPayoff}{" "}
            months
          </p>
        </div>

        {/* Total Interest */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 mb-1.5 font-medium">
            Total Interest
          </p>
          <p className="text-2xl font-bold">
            {formatCurrency(
              results.find((r) => r.method === selectedMethod)!
                .totalInterestPaid,
            )}
          </p>
          <p className="text-xs opacity-70 mt-1 capitalize">{selectedMethod}</p>
        </div>

        {/* You Save */}
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-5">
          <p className="text-xs opacity-80 mb-1.5 font-medium">You Save</p>
          <p className="text-2xl font-bold">
            {formatCurrency(
              Math.max(...results.map((r) => r.totalInterestPaid)) -
                results.find((r) => r.method === selectedMethod)!
                  .totalInterestPaid,
            )}
          </p>
          <p className="text-xs opacity-70 mt-1">vs worst case</p>
        </div>
      </div>

      {/* Payoff Timeline Chart */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6">
        <h3 className="font-semibold text-neutral-900 mb-4 text-sm">
          Payoff Timeline
        </h3>

        <PayoffChart
          result={results.find((r) => r.method === selectedMethod)!}
        />
      </div>
    </div>
  );
}
