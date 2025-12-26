"use client";

// Budget Input Component - Simplified Dark Design
// Location: frontend/components/debt-optimizer/BudgetInput.tsx

import React from "react";
import { formatCurrency } from "@/utils/currencyFormatter";
import { Debt } from "@/types/debt";

interface BudgetInputProps {
  value: number;
  onChange: (value: number) => void;
  debts: Debt[];
  totalMinimums: number;
}

export function BudgetInput({
  value,
  onChange,
  debts,
  totalMinimums,
}: BudgetInputProps) {
  return (
    <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-700">
      <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-3">
        Your Monthly Payment
      </label>

      <div className="flex items-baseline mb-2">
        <span className="text-3xl font-bold text-white mr-2">₹</span>
        <input
          type="number"
          value={value || ""}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full text-5xl font-bold text-white bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-neutral-600"
          placeholder="0"
          min="0"
          step="1000"
        />
      </div>

      <p className="text-sm text-neutral-400">Fixed amount every month</p>
    </div>
  );
}
