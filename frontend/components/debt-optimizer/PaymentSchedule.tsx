"use client";

// Payment Schedule Component - Shows Payment Priority
// Location: frontend/components/debt-optimizer/PaymentSchedule.tsx

import React, { useState } from "react";
import { OptimizationResult } from "@/types/debt";
import { formatCurrency } from "@/utils/currencyFormatter";
import { ChevronDown, ChevronUp, Target } from "lucide-react";

interface PaymentScheduleProps {
  result: OptimizationResult | undefined;
  monthlyBudget: number;
}

export function PaymentSchedule({
  result,
  monthlyBudget,
}: PaymentScheduleProps) {
  const [expanded, setExpanded] = useState(true); // Start expanded by default

  if (!result) {
    return null;
  }

  const { monthlySummary, schedule } = result;
  const displayMonths = expanded ? monthlySummary : monthlySummary.slice(0, 6);
  const debtFreeMonth = monthlySummary.find((m) => m.remainingDebts === 0);

  // Group payments by month
  const getMonthPayments = (month: number) => {
    return schedule.monthlyPayments.filter((p) => p.month === month);
  };

  // Find which debt gets the most payment (target debt)
  const getTargetDebt = (payments: any[]) => {
    const activePayments = payments.filter(
      (p) => p.payment > 0 && !p.isPaidOff,
    );
    if (activePayments.length === 0) return null;

    return activePayments.reduce((max, payment) =>
      payment.payment > max.payment ? payment : max,
    );
  };

  return (
    <div className="space-y-4">
      {/* Debt Free Date */}
      <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-xl p-5">
        <p className="text-xs uppercase tracking-wider opacity-80 mb-1.5 font-medium">
          Debt Free By
        </p>
        <p className="text-2xl font-bold mb-0.5">
          {debtFreeMonth
            ? new Date(
                Date.now() + debtFreeMonth.month * 30 * 24 * 60 * 60 * 1000,
              ).toLocaleDateString("en-US", { month: "short", year: "numeric" })
            : "Calculating..."}
        </p>
        <p className="text-xs opacity-80">
          {result.monthsToPayoff} months total
        </p>
      </div>

      {/* Monthly Breakdown - Shows ALL Debts with Priority Indicator */}
      <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-600">
            Payment Breakdown
          </h3>
        </div>

        <div className="divide-y divide-neutral-100">
          {displayMonths.map((monthSummary) => {
            const monthPayments = getMonthPayments(monthSummary.month);
            const targetDebt = getTargetDebt(monthPayments);

            return (
              <div key={monthSummary.month} className="p-4">
                {/* Month Header */}
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-neutral-900">
                    Month {monthSummary.month}
                  </span>
                  <span className="text-sm font-bold text-neutral-900">
                    {formatCurrency(monthSummary.totalPayment)}
                  </span>
                </div>

                {/* Individual Debt Payments */}
                <div className="space-y-2 mb-3">
                  {monthPayments.map((payment, idx) => {
                    const isTarget =
                      targetDebt &&
                      payment.debtId === targetDebt.debtId &&
                      !payment.isPaidOff;
                    const isMinimumOnly =
                      payment.payment > 0 && !isTarget && !payment.isPaidOff;

                    if (payment.payment === 0) return null; // Skip zero payments

                    return (
                      <div
                        key={idx}
                        className={`rounded-lg p-3 border-2 transition-all ${
                          isTarget
                            ? "bg-[#ccf32f]/10 border-[#ccf32f]"
                            : payment.isPaidOff
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-neutral-50 border-neutral-200"
                        }`}
                      >
                        {/* Debt Name & Payment */}
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {isTarget && (
                              <div className="flex items-center gap-1 bg-[#ccf32f] text-black px-2 py-0.5 rounded text-xs font-bold">
                                <Target size={12} />
                                Priority
                              </div>
                            )}
                            {isMinimumOnly && (
                              <div className="flex items-center gap-1 bg-neutral-200 text-neutral-600 px-2 py-0.5 rounded text-xs font-medium">
                                Minimum
                              </div>
                            )}
                            <span className="text-sm font-medium text-neutral-900">
                              {payment.debtName}
                            </span>
                          </div>
                          <span
                            className={`text-sm font-bold ${
                              isTarget ? "text-black" : "text-neutral-900"
                            }`}
                          >
                            {formatCurrency(payment.payment)}
                          </span>
                        </div>

                        {/* Principal vs Interest */}
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="text-emerald-600 font-semibold">
                              ↑ {formatCurrency(payment.principalPaid)}
                            </span>
                            <span className="text-rose-600 font-semibold">
                              ↓ {formatCurrency(payment.interestPaid)}
                            </span>
                          </div>
                          {payment.isPaidOff ? (
                            <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full font-bold">
                              ✓ Paid Off
                            </span>
                          ) : (
                            <span className="text-neutral-500 font-mono">
                              {formatCurrency(payment.remainingBalance)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Month Summary */}
                <div className="pt-3 border-t border-neutral-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-4">
                      <span className="text-emerald-600 font-semibold">
                        ↑ {formatCurrency(monthSummary.totalPrincipal)}
                      </span>
                      <span className="text-rose-600 font-semibold">
                        ↓ {formatCurrency(monthSummary.totalInterest)}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        monthSummary.remainingDebts === 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-neutral-100 text-neutral-600"
                      }`}
                    >
                      {monthSummary.remainingDebts} left
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Expand/Collapse */}
        {monthlySummary.length > 6 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="w-full px-4 py-3 bg-neutral-50 hover:bg-neutral-100 transition-colors flex items-center justify-center gap-2 text-xs font-medium text-neutral-600"
          >
            {expanded ? (
              <>
                <ChevronUp size={14} />
                Show first 6 months only
              </>
            ) : (
              <>
                <ChevronDown size={14} />
                Show all {monthlySummary.length} months
              </>
            )}
          </button>
        )}
      </div>

      {/* Total Summary */}
      <div className="bg-neutral-900 rounded-xl p-4 text-white">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-xs opacity-70 mb-1">Total Interest</p>
            <p className="text-lg font-bold text-rose-400">
              {formatCurrency(result.totalInterestPaid)}
            </p>
          </div>
          <div>
            <p className="text-xs opacity-70 mb-1">Total Paid</p>
            <p className="text-lg font-bold text-emerald-400">
              {formatCurrency(result.totalAmountPaid)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
