"use client";

// Debt Optimizer Main Page - Optimized UX
// Location: frontend/app/debt-optimizer/page.tsx

import React, { useState, useEffect } from "react";
import { Debt, OptimizationResult, OptimizationMethod } from "@/types/debt";
import {
  calculateAllMethods,
  calculateTotalMinimums,
} from "@/utils/debtCalculations";
import {
  saveCurrentScenario,
  loadCurrentScenario,
  clearCurrentScenario,
  migrateFromLocalStorage,
  hasLocalStorageData,
} from "@/utils/debtStorageAPI";
import { DebtForm } from "@/components/debt-optimizer/DebtForm";
import { DebtList } from "@/components/debt-optimizer/DebtList";
import { MethodComparison } from "@/components/debt-optimizer/MethodComparison";
import { PaymentSchedule } from "@/components/debt-optimizer/PaymentSchedule";
import { HowItWorksInfographic } from "@/components/debt-optimizer/HowItWorksInfographic";
import { ConfirmModal } from "@/components/ui/Modal";
import Header from "@/components/Header";
import { Plus, Trash2, TrendingDown } from "lucide-react";

export default function DebtOptimizerPage() {
  const [debts, setDebts] = useState<Debt[]>([]);
  const [monthlyBudget, setMonthlyBudget] = useState<number>(0);
  const [optimizationResults, setOptimizationResults] = useState<
    OptimizationResult[]
  >([]);
  const [selectedMethod, setSelectedMethod] = useState<OptimizationMethod>(
    OptimizationMethod.AVALANCHE,
  );
  const [editingDebt, setEditingDebt] = useState<Debt | undefined>(undefined);
  const [showAddForm, setShowAddForm] = useState(false);
  const [calculationError, setCalculationError] = useState<string>("");
  const [deleteConfirm, setDeleteConfirm] = useState<{
    isOpen: boolean;
    debtId: string;
    debtName: string;
  }>({
    isOpen: false,
    debtId: "",
    debtName: "",
  });
  const [clearAllConfirm, setClearAllConfirm] = useState(false);

  // Load saved scenario on mount and handle migration
  useEffect(() => {
    const loadData = async () => {
      try {
        // Check if there's localStorage data that needs migration
        if (hasLocalStorageData()) {
          const shouldMigrate = confirm(
            "We found saved debt scenarios in your browser. Would you like to migrate them to your account for cloud backup and multi-device access?",
          );

          if (shouldMigrate) {
            try {
              const count = await migrateFromLocalStorage();
              alert(
                `Successfully migrated ${count} scenario(s) to your account!`,
              );
            } catch (e) {
              console.error("Migration failed:", e);
              alert(
                "Migration failed. Your data is still safe in your browser.",
              );
            }
          }
        }

        // Load current scenario from database
        const saved = await loadCurrentScenario();
        if (saved) {
          setDebts(saved.debts);
          setMonthlyBudget(saved.monthlyBudget);
        }
      } catch (e) {
        console.error("Failed to load scenario:", e);
        // User might not be logged in, that's okay
      }
    };

    loadData();
  }, []);

  // Auto-calculate and auto-save when debts or budget change
  useEffect(() => {
    if (debts.length > 0 && monthlyBudget > 0) {
      const timer = setTimeout(async () => {
        try {
          await saveCurrentScenario(debts, monthlyBudget);
        } catch (e) {
          console.error("Auto-save failed:", e);
          // Continue with calculation even if save fails
        }
        handleCalculate();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setOptimizationResults([]);
    }
  }, [debts, monthlyBudget]);

  const handleAddDebt = (debt: Debt) => {
    if (editingDebt) {
      setDebts(debts.map((d) => (d.id === debt.id ? debt : d)));
      setEditingDebt(undefined);
    } else {
      setDebts([...debts, debt]);
    }
    setShowAddForm(false);
  };

  const handleEditDebt = (debt: Debt) => {
    setEditingDebt(debt);
    setShowAddForm(true);
  };

  const handleDeleteDebt = (debtId: string) => {
    const debt = debts.find((d) => d.id === debtId);
    if (debt) {
      setDeleteConfirm({
        isOpen: true,
        debtId: debtId,
        debtName: debt.name,
      });
    }
  };

  const confirmDelete = () => {
    setDebts(debts.filter((d) => d.id !== deleteConfirm.debtId));
    setDeleteConfirm({ isOpen: false, debtId: "", debtName: "" });
  };

  const handleCancelEdit = () => {
    setEditingDebt(undefined);
    setShowAddForm(false);
  };

  const handleCalculate = () => {
    if (debts.length === 0 || monthlyBudget === 0) return;

    try {
      setCalculationError("");
      const results = calculateAllMethods(debts, monthlyBudget);
      setOptimizationResults(results);

      const bestMethod = results.reduce((best, result) =>
        result.totalInterestPaid < best.totalInterestPaid ? result : best,
      );
      setSelectedMethod(bestMethod.method);
    } catch (err) {
      console.error("Calculation error:", err);
      setCalculationError(
        err instanceof Error ? err.message : "Calculation failed",
      );
      setOptimizationResults([]);
    }
  };

  const handleClearAll = () => {
    setClearAllConfirm(true);
  };

  const confirmClearAll = async () => {
    try {
      await clearCurrentScenario();
      setDebts([]);
      setMonthlyBudget(0);
      setOptimizationResults([]);
      setClearAllConfirm(false);
    } catch (e) {
      console.error("Failed to clear scenario:", e);
      alert("Failed to clear data. Please try again.");
    }
  };

  const totalMinimums = calculateTotalMinimums(debts);

  return (
    <div className="flex flex-col bg-[#FAFBFC] min-h-screen">
      <Header />

      {/* Page Header */}
      <div className="w-full max-w-[1800px] mx-auto px-8 pt-12 pb-6">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">
            Debt Optimizer
          </h1>
          <p className="text-neutral-600 text-base">
            Create a strategic plan to become debt-free faster and save
            thousands on interest
          </p>
        </div>
      </div>

      {/* How It Works Infographic */}
      <div className="w-full max-w-[1800px] mx-auto px-8">
        <HowItWorksInfographic />
      </div>

      {/* Main Layout - Cleaner spacing */}
      <div className="flex-1 w-full max-w-[1800px] mx-auto px-8 py-6">
        <div className="grid grid-cols-12 gap-8">
          {/* LEFT SIDEBAR - Debts */}
          <div className="col-span-3">
            {/* Header - Simplified */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-neutral-800">
                Your Debts
              </h2>
              <div className="flex items-center gap-2">
                {debts.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-2 hover:bg-neutral-100 rounded-lg transition-colors group"
                    title="Clear all"
                  >
                    <Trash2
                      size={16}
                      className="text-neutral-400 group-hover:text-neutral-600"
                    />
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 text-white rounded-lg hover:bg-neutral-800 transition-all text-sm font-medium"
                >
                  <Plus size={16} />
                  Add
                </button>
              </div>
            </div>

            {/* Add Form - Cleaner */}
            {showAddForm && (
              <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-5 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                <DebtForm
                  onAdd={handleAddDebt}
                  onCancel={handleCancelEdit}
                  existingDebt={editingDebt}
                  mode={editingDebt ? "edit" : "add"}
                />
              </div>
            )}

            {/* Debt List */}
            <div
              className="space-y-3 overflow-y-auto pr-1"
              style={{ maxHeight: "calc(100vh - 280px)" }}
            >
              <DebtList
                debts={debts}
                onEdit={handleEditDebt}
                onDelete={handleDeleteDebt}
              />
            </div>
          </div>

          {/* CENTER PANEL - Strategy */}
          <div className="col-span-6">
            <h2 className="text-base font-semibold text-neutral-800 mb-6">
              Pick your strategy
            </h2>

            {/* Budget Input - Always visible when there are debts */}
            {debts.length > 0 && (
              <div className="bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-2xl p-6 mb-6 border-2 border-neutral-700 hover:border-[#ccf32f]/50 transition-all group">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs uppercase tracking-wider text-neutral-400 font-semibold">
                    Your Monthly Payment
                  </label>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-500 group-hover:text-[#ccf32f] transition-colors">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                      />
                    </svg>
                    <span className="font-medium">Click to edit</span>
                  </div>
                </div>
                <div className="flex items-baseline mb-2 px-3 py-2 rounded-xl bg-neutral-800/50 border border-neutral-700 group-hover:border-[#ccf32f]/30 transition-all">
                  <span className="text-3xl font-bold text-white mr-2">₹</span>
                  <input
                    type="number"
                    value={monthlyBudget || ""}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full text-5xl font-bold text-white bg-transparent border-none outline-none focus:ring-0 p-0 placeholder-neutral-600"
                    placeholder="Enter amount"
                    min="0"
                    step="1000"
                  />
                </div>
                <p className="text-sm text-neutral-400">
                  Fixed amount every month after rent, food & essentials
                  {totalMinimums > 0 && (
                    <span className="block mt-1 text-xs text-neutral-500">
                      Minimum required: ₹{totalMinimums.toLocaleString("en-IN")}
                    </span>
                  )}
                </p>
              </div>
            )}

            {optimizationResults.length > 0 ? (
              <MethodComparison
                results={optimizationResults}
                selectedMethod={selectedMethod}
                onSelectMethod={setSelectedMethod}
                monthlyBudget={monthlyBudget}
                onBudgetChange={setMonthlyBudget}
              />
            ) : debts.length === 0 ? (
              /* Empty state - No debts */
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
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No strategies yet
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-[240px]">
                  Add debts and set a budget to compare optimization methods
                </p>
              </div>
            ) : calculationError ? (
              /* Error state - Budget too low */
              <div className="relative overflow-hidden bg-gradient-to-br from-rose-50 to-red-50 rounded-2xl border-2 border-rose-200 p-16">
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-rose-500 to-red-500 shadow-xl">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    Budget Too Low
                  </h3>
                  <p className="text-neutral-700 mb-2 max-w-md mx-auto leading-relaxed">
                    {calculationError}
                  </p>
                  <p className="text-neutral-600 text-sm max-w-md mx-auto">
                    Increase your monthly budget to at least cover all minimum
                    payments
                  </p>
                </div>
              </div>
            ) : monthlyBudget === 0 ? (
              /* Empty state - No budget set */
              <div className="relative overflow-hidden bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border-2 border-amber-200 p-16">
                <div className="relative text-center">
                  <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 shadow-xl">
                    <svg
                      className="w-10 h-10 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                    Almost There!
                  </h3>
                  <p className="text-neutral-700 mb-2 max-w-md mx-auto leading-relaxed">
                    You have{" "}
                    <span className="font-semibold text-amber-700">
                      {debts.length} debt{debts.length > 1 ? "s" : ""}
                    </span>{" "}
                    added
                  </p>
                  <p className="text-neutral-600 mb-6 max-w-md mx-auto">
                    Enter your monthly budget above to see personalized
                    strategies
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 rounded-full text-sm text-neutral-600 border border-amber-200">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 10l7-7m0 0l7 7m-7-7v18"
                      />
                    </svg>
                    Minimum: ₹{totalMinimums.toLocaleString("en-IN")}/month
                  </div>
                </div>
              </div>
            ) : (
              /* Loading state */
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border-2 border-blue-200 p-16 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 mb-6 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 shadow-xl animate-pulse">
                  <svg
                    className="w-10 h-10 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-neutral-900 mb-3">
                  Optimizing Your Debt Strategy
                </h3>
                <p className="text-neutral-600 max-w-md mx-auto">
                  Calculating the best payoff methods...
                </p>
              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR - Payment Schedule */}
          <div className="col-span-3">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-semibold text-neutral-800">
                Payment Plan
              </h2>
              {optimizationResults.length > 0 && (
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                  {selectedMethod}
                </span>
              )}
            </div>

            {optimizationResults.length > 0 ? (
              <PaymentSchedule
                result={optimizationResults.find(
                  (r) => r.method === selectedMethod,
                )}
                monthlyBudget={monthlyBudget}
              />
            ) : (
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
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-2">
                  No payment plan yet
                </h3>
                <p className="text-sm text-neutral-500 leading-relaxed max-w-[220px]">
                  Your month-by-month payment schedule will appear here
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        onClose={() =>
          setDeleteConfirm({ isOpen: false, debtId: "", debtName: "" })
        }
        onConfirm={confirmDelete}
        title="Delete Debt"
        message={`Are you sure you want to delete "${deleteConfirm.debtName}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />

      <ConfirmModal
        isOpen={clearAllConfirm}
        onClose={() => setClearAllConfirm(false)}
        onConfirm={confirmClearAll}
        title="Clear All Debts"
        message={`Are you sure you want to clear all ${debts.length} debt${debts.length > 1 ? "s" : ""} and start over? This action cannot be undone.`}
        confirmText="Clear All"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  );
}
