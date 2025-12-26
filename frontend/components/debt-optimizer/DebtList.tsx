"use client";

// Debt List Component - Minimal Clean Design
// Location: frontend/components/debt-optimizer/DebtList.tsx

import React from "react";
import { Debt, isCreditCardDebt } from "@/types/debt";
import { formatCurrency } from "@/utils/currencyFormatter";
import { getMinimumPayment } from "@/utils/validations";
import { Trash2 } from "lucide-react";

interface DebtListProps {
  debts: Debt[];
  onEdit: (debt: Debt) => void;
  onDelete: (debtId: string) => void;
}

export function DebtList({ debts, onEdit, onDelete }: DebtListProps) {
  if (debts.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-neutral-200 p-16 text-center min-h-[400px] flex flex-col items-center justify-center">
        <div className="w-14 h-14 mx-auto mb-6 rounded-xl bg-neutral-100 flex items-center justify-center">
          <svg
            className="w-7 h-7 text-neutral-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          No debts yet
        </h3>
        <p className="text-sm text-neutral-500 leading-relaxed max-w-[200px]">
          Click "Add" above to start tracking your debts
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {debts.map((debt) => (
        <DebtCard
          key={debt.id}
          debt={debt}
          onEdit={() => onEdit(debt)}
          onDelete={() => onDelete(debt.id)}
        />
      ))}
    </div>
  );
}

interface DebtCardProps {
  debt: Debt;
  onEdit: () => void;
  onDelete: () => void;
}

function DebtCard({ debt, onEdit, onDelete }: DebtCardProps) {
  const isCreditCard = isCreditCardDebt(debt);
  const balance = isCreditCard
    ? debt.outstandingBalance
    : debt.outstandingPrincipal;
  const interestRate = isCreditCard
    ? debt.monthlyInterestRate
    : debt.annualInterestRate;
  const minimumPayment = getMinimumPayment(debt);

  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 p-4 hover:border-neutral-300 hover:shadow-sm transition-all group relative">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <button onClick={onEdit} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                isCreditCard ? "bg-blue-500" : "bg-emerald-500"
              }`}
            />
            <h3 className="font-medium text-neutral-900 truncate text-sm">
              {debt.name}
            </h3>
          </div>
          <p className="text-xs text-neutral-500">{debt.type}</p>
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 hover:bg-neutral-100 rounded-lg transition-colors opacity-0 group-hover:opacity-100 flex-shrink-0 ml-2"
          title="Delete"
        >
          <Trash2 size={14} className="text-neutral-400" />
        </button>
      </div>

      {/* Balance - Clickable to edit */}
      <button onClick={onEdit} className="w-full text-left mb-3">
        <div className="text-2xl font-bold text-neutral-900">
          {formatCurrency(balance)}
        </div>
      </button>

      {/* Details - Clickable to edit */}
      <button onClick={onEdit} className="w-full text-left">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <span
              className={`font-semibold ${
                isCreditCard ? "text-rose-600" : "text-amber-600"
              }`}
            >
              {interestRate}%{isCreditCard ? "/mo" : "/yr"}
            </span>
            {!isCreditCard && debt.remainingTenure && (
              <span className="text-neutral-500">
                {debt.remainingTenure}mo left
              </span>
            )}
          </div>
          <span className="text-neutral-600 font-medium">
            {formatCurrency(minimumPayment)}/mo
          </span>
        </div>
      </button>
    </div>
  );
}
