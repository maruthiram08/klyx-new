// Debt Optimization Calculation Algorithms
// Location: frontend/utils/debtCalculations.ts

import {
  Debt,
  OptimizationMethod,
  OptimizationResult,
  MonthlyPayment,
  MonthlySummary,
  isCreditCardDebt,
  isLoanDebt,
} from "../types/debt";

// Constants
const MAX_MONTHS = 600; // 50 years safety limit

/**
 * Get current balance for any debt type
 */
function getCurrentBalance(debt: Debt): number {
  if (isCreditCardDebt(debt)) {
    return debt.outstandingBalance;
  } else {
    return debt.outstandingPrincipal;
  }
}

/**
 * Calculate monthly interest for a debt
 */
function calculateMonthlyInterest(debt: Debt, currentBalance: number): number {
  if (isCreditCardDebt(debt)) {
    // Credit card: interest on outstanding balance
    const monthlyRate = debt.monthlyInterestRate / 100;
    return currentBalance * monthlyRate;
  } else {
    // Loan: convert annual to monthly rate
    const monthlyRate = debt.annualInterestRate / 12 / 100;
    return currentBalance * monthlyRate;
  }
}

/**
 * Get minimum payment for a debt
 */
function getMinimumPayment(debt: Debt): number {
  if (isCreditCardDebt(debt)) {
    return debt.minimumPayment;
  } else {
    return debt.emiAmount;
  }
}

/**
 * Calculate total minimum payments
 */
export function calculateTotalMinimums(debts: Debt[]): number {
  return debts.reduce((sum, debt) => sum + getMinimumPayment(debt), 0);
}

/**
 * Core simulation engine for debt payoff
 * Takes sorted debts and applies the debt avalanche/snowball strategy
 */
function simulatePayments(
  sortedDebts: Debt[],
  monthlyBudget: number,
  method: OptimizationMethod,
): OptimizationResult {
  // Create working copies with tracking
  const activeDebts = sortedDebts.map((debt) => ({
    id: debt.id,
    name: debt.name,
    originalDebt: debt,
    remainingBalance: getCurrentBalance(debt),
    minimumPayment: getMinimumPayment(debt),
  }));

  const allPayments: MonthlyPayment[] = [];
  const monthlySummary: MonthlySummary[] = [];
  let month = 0;

  // Calculate total minimums
  const totalMinimums = activeDebts.reduce(
    (sum, d) => sum + d.minimumPayment,
    0,
  );

  if (totalMinimums > monthlyBudget) {
    throw new Error(
      `Monthly budget (₹${monthlyBudget.toLocaleString("en-IN")}) is less than total minimum payments (₹${totalMinimums.toLocaleString("en-IN")})`,
    );
  }

  const extraBudget = monthlyBudget - totalMinimums;

  // Simulation loop
  while (
    activeDebts.some((d) => d.remainingBalance > 0.01) &&
    month < MAX_MONTHS
  ) {
    month++;
    let monthlyPaymentTotal = 0;
    let monthlyInterestTotal = 0;
    let monthlyPrincipalTotal = 0;
    let remainingExtraBudget = extraBudget;

    // Find target debt (first unpaid in sorted order)
    let targetDebtIndex = activeDebts.findIndex(
      (d) => d.remainingBalance > 0.01,
    );

    // Calculate rolled-over payments from paid-off debts
    let rolledPayments = 0;
    for (let i = 0; i < targetDebtIndex; i++) {
      if (activeDebts[i].remainingBalance <= 0.01) {
        rolledPayments += activeDebts[i].minimumPayment;
      }
    }

    // Add rolled payments to extra budget for this month
    remainingExtraBudget += rolledPayments;

    // Process each debt in order
    activeDebts.forEach((debt, index) => {
      if (debt.remainingBalance <= 0.01) {
        // Already paid off
        return;
      }

      // Calculate monthly interest
      const interestCharge = calculateMonthlyInterest(
        debt.originalDebt,
        debt.remainingBalance,
      );

      // Start with minimum payment
      let payment = debt.minimumPayment;

      // If this is the target debt, apply ALL extra budget to it
      if (index === targetDebtIndex && remainingExtraBudget > 0) {
        payment += remainingExtraBudget;
        remainingExtraBudget = 0; // All extra budget used
      }

      // Don't overpay - payment should not exceed remaining balance + interest
      const maxPayment = debt.remainingBalance + interestCharge;
      if (payment > maxPayment) {
        // Return unused amount to extra budget for next debt
        const overpayment = payment - maxPayment;
        payment = maxPayment;

        // If we overpaid the target, the extra goes to the next debt in line
        if (index === targetDebtIndex) {
          remainingExtraBudget += overpayment;
          // Move target to next unpaid debt
          targetDebtIndex = activeDebts.findIndex(
            (d, i) => i > index && d.remainingBalance > 0.01,
          );
        }
      }

      // Calculate principal payment
      const principalPayment = Math.max(0, payment - interestCharge);

      // Update balance
      debt.remainingBalance -= principalPayment;
      if (debt.remainingBalance < 0.01) {
        debt.remainingBalance = 0;
      }

      // Record payment
      allPayments.push({
        month,
        debtId: debt.id,
        debtName: debt.name,
        payment,
        interestPaid: interestCharge,
        principalPaid: principalPayment,
        remainingBalance: debt.remainingBalance,
        isPaidOff: debt.remainingBalance === 0,
      });

      monthlyPaymentTotal += payment;
      monthlyInterestTotal += interestCharge;
      monthlyPrincipalTotal += principalPayment;
    });

    // Record monthly summary
    monthlySummary.push({
      month,
      totalPayment: monthlyPaymentTotal,
      totalInterest: monthlyInterestTotal,
      totalPrincipal: monthlyPrincipalTotal,
      remainingDebts: activeDebts.filter((d) => d.remainingBalance > 0.01)
        .length,
      debtsActive: activeDebts
        .filter((d) => d.remainingBalance > 0.01)
        .map((d) => d.name),
    });
  }

  // Calculate totals
  const totalInterestPaid = allPayments.reduce(
    (sum, p) => sum + p.interestPaid,
    0,
  );
  const totalAmountPaid = allPayments.reduce((sum, p) => sum + p.payment, 0);

  return {
    method,
    monthsToPayoff: month,
    totalInterestPaid,
    totalAmountPaid,
    schedule: {
      method,
      monthlyPayments: allPayments,
      allDebts: [],
    },
    monthlySummary,
  };
}

/**
 * Snowball Method: Smallest balance first
 */
export function calculateSnowball(
  debts: Debt[],
  monthlyBudget: number,
): OptimizationResult {
  // Sort by current balance (ascending) - smallest first
  const sortedDebts = [...debts].sort((a, b) => {
    const balanceA = getCurrentBalance(a);
    const balanceB = getCurrentBalance(b);
    return balanceA - balanceB;
  });

  return simulatePayments(
    sortedDebts,
    monthlyBudget,
    OptimizationMethod.SNOWBALL,
  );
}

/**
 * Avalanche Method: Highest interest rate first
 */
export function calculateAvalanche(
  debts: Debt[],
  monthlyBudget: number,
): OptimizationResult {
  // Sort by interest rate (descending) - highest first
  const sortedDebts = [...debts].sort((a, b) => {
    const rateA = isCreditCardDebt(a)
      ? a.monthlyInterestRate
      : a.annualInterestRate / 12;
    const rateB = isCreditCardDebt(b)
      ? b.monthlyInterestRate
      : b.annualInterestRate / 12;
    return rateB - rateA;
  });

  return simulatePayments(
    sortedDebts,
    monthlyBudget,
    OptimizationMethod.AVALANCHE,
  );
}

/**
 * Ski Method: Smart Hybrid Approach
 *
 * Strategy: Weighted scoring that balances interest savings with psychological wins
 * Formula: score = (monthlyInterestRate × 0.6) + ((maxBalance - balance) / maxBalance × 40)
 *
 * This gives 60% weight to interest rate and 40% weight to being small/payable soon
 */
export function calculateSki(
  debts: Debt[],
  monthlyBudget: number,
): OptimizationResult {
  // Find max balance for normalization
  const maxBalance = Math.max(...debts.map((d) => getCurrentBalance(d)));

  // Calculate scores
  const scoredDebts = debts.map((debt) => {
    const balance = getCurrentBalance(debt);
    const monthlyRate = isCreditCardDebt(debt)
      ? debt.monthlyInterestRate
      : debt.annualInterestRate / 12;

    // Weighted score: 60% interest rate, 40% smallness factor
    const interestScore = monthlyRate * 0.6;
    const smallnessScore = ((maxBalance - balance) / maxBalance) * 40;
    const totalScore = interestScore + smallnessScore;

    return { debt, score: totalScore };
  });

  // Sort by score (descending) - highest score first
  const sortedDebts = scoredDebts
    .sort((a, b) => b.score - a.score)
    .map((item) => item.debt);

  return simulatePayments(sortedDebts, monthlyBudget, OptimizationMethod.SKI);
}

/**
 * Calculate all methods and return results
 */
export function calculateAllMethods(
  debts: Debt[],
  monthlyBudget: number,
): OptimizationResult[] {
  return [
    calculateSnowball(debts, monthlyBudget),
    calculateAvalanche(debts, monthlyBudget),
    calculateSki(debts, monthlyBudget),
  ];
}
