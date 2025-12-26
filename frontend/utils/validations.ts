// Validation Utilities for Debt Optimizer
// Location: frontend/utils/validations.ts

import { Debt, DebtType, CreditCardDebt, LoanDebt, ValidationError, ValidationResult, isCreditCardDebt, isLoanDebt } from '../types/debt';

// Constants for validation
export const VALIDATION_LIMITS = {
  DEBT_NAME_MIN: 1,
  DEBT_NAME_MAX: 50,
  MIN_AMOUNT: 1,
  MAX_AMOUNT: 1000000000, // 10 crore
  CREDIT_CARD_RATE_MIN: 0.01,
  CREDIT_CARD_RATE_MAX: 10,
  LOAN_RATE_MIN: 0.1,
  LOAN_RATE_MAX: 50,
  MIN_TENURE: 1,
  MAX_TENURE: 600, // 50 years
  MIN_BUDGET: 1000,
  MAX_BUDGET: 100000000, // 1 crore
  MAX_DEBTS: 20,
  MIN_DEBTS: 1
};

/**
 * Validate debt name
 */
export function validateDebtName(name: string): ValidationError | null {
  if (!name || name.trim().length < VALIDATION_LIMITS.DEBT_NAME_MIN) {
    return { field: 'name', message: 'Debt name is required' };
  }

  if (name.length > VALIDATION_LIMITS.DEBT_NAME_MAX) {
    return { field: 'name', message: `Debt name must be ${VALIDATION_LIMITS.DEBT_NAME_MAX} characters or less` };
  }

  // Check for invalid characters (allow letters, numbers, spaces, hyphens, apostrophes)
  if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) {
    return { field: 'name', message: 'Debt name contains invalid characters' };
  }

  return null;
}

/**
 * Calculate monthly interest for a debt
 */
export function calculateMonthlyInterest(debt: Debt): number {
  if (isCreditCardDebt(debt)) {
    return debt.outstandingBalance * (debt.monthlyInterestRate / 100);
  } else {
    const monthlyRate = debt.annualInterestRate / 12 / 100;
    return debt.outstandingPrincipal * monthlyRate;
  }
}

/**
 * Get minimum payment for a debt
 */
export function getMinimumPayment(debt: Debt): number {
  if (isCreditCardDebt(debt)) {
    return debt.minimumPayment;
  } else {
    return debt.emiAmount;
  }
}

/**
 * Validate credit card debt
 */
export function validateCreditCardDebt(debt: Partial<CreditCardDebt>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name
  const nameError = validateDebtName(debt.name || '');
  if (nameError) errors.push(nameError);

  // Outstanding Balance
  if (!debt.outstandingBalance || debt.outstandingBalance <= 0) {
    errors.push({ field: 'outstandingBalance', message: 'Outstanding balance must be greater than 0' });
  } else if (debt.outstandingBalance > VALIDATION_LIMITS.MAX_AMOUNT) {
    errors.push({ field: 'outstandingBalance', message: `Outstanding balance cannot exceed ₹${VALIDATION_LIMITS.MAX_AMOUNT.toLocaleString('en-IN')}` });
  }

  // Monthly Interest Rate
  if (!debt.monthlyInterestRate || debt.monthlyInterestRate < VALIDATION_LIMITS.CREDIT_CARD_RATE_MIN) {
    errors.push({ field: 'monthlyInterestRate', message: `Monthly interest rate must be at least ${VALIDATION_LIMITS.CREDIT_CARD_RATE_MIN}%` });
  } else if (debt.monthlyInterestRate > VALIDATION_LIMITS.CREDIT_CARD_RATE_MAX) {
    errors.push({ field: 'monthlyInterestRate', message: `Monthly interest rate cannot exceed ${VALIDATION_LIMITS.CREDIT_CARD_RATE_MAX}%` });
  }

  // Minimum Payment
  if (!debt.minimumPayment || debt.minimumPayment <= 0) {
    errors.push({ field: 'minimumPayment', message: 'Minimum payment must be greater than 0' });
  } else if (debt.outstandingBalance && debt.monthlyInterestRate) {
    const monthlyInterest = debt.outstandingBalance * (debt.monthlyInterestRate / 100);
    if (debt.minimumPayment <= monthlyInterest) {
      errors.push({
        field: 'minimumPayment',
        message: `Minimum payment (₹${debt.minimumPayment.toLocaleString('en-IN')}) must be greater than monthly interest (₹${monthlyInterest.toLocaleString('en-IN')})`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate loan debt
 */
export function validateLoanDebt(debt: Partial<LoanDebt>): ValidationResult {
  const errors: ValidationError[] = [];

  // Name
  const nameError = validateDebtName(debt.name || '');
  if (nameError) errors.push(nameError);

  // Outstanding Principal
  if (!debt.outstandingPrincipal || debt.outstandingPrincipal <= 0) {
    errors.push({ field: 'outstandingPrincipal', message: 'Outstanding principal must be greater than 0' });
  } else if (debt.outstandingPrincipal > VALIDATION_LIMITS.MAX_AMOUNT) {
    errors.push({ field: 'outstandingPrincipal', message: `Outstanding principal cannot exceed ₹${VALIDATION_LIMITS.MAX_AMOUNT.toLocaleString('en-IN')}` });
  }

  // EMI Amount
  if (!debt.emiAmount || debt.emiAmount <= 0) {
    errors.push({ field: 'emiAmount', message: 'EMI amount must be greater than 0' });
  } else if (debt.outstandingPrincipal && debt.annualInterestRate) {
    const monthlyRate = debt.annualInterestRate / 12 / 100;
    const monthlyInterest = debt.outstandingPrincipal * monthlyRate;
    if (debt.emiAmount <= monthlyInterest) {
      errors.push({
        field: 'emiAmount',
        message: `EMI amount (₹${debt.emiAmount.toLocaleString('en-IN')}) must be greater than monthly interest (₹${monthlyInterest.toLocaleString('en-IN')})`
      });
    }
  }

  // Remaining Tenure
  if (!debt.remainingTenure || debt.remainingTenure < VALIDATION_LIMITS.MIN_TENURE) {
    errors.push({ field: 'remainingTenure', message: `Remaining tenure must be at least ${VALIDATION_LIMITS.MIN_TENURE} month` });
  } else if (debt.remainingTenure > VALIDATION_LIMITS.MAX_TENURE) {
    errors.push({ field: 'remainingTenure', message: `Remaining tenure cannot exceed ${VALIDATION_LIMITS.MAX_TENURE} months (50 years)` });
  }

  // Annual Interest Rate
  if (!debt.annualInterestRate || debt.annualInterestRate < VALIDATION_LIMITS.LOAN_RATE_MIN) {
    errors.push({ field: 'annualInterestRate', message: `Annual interest rate must be at least ${VALIDATION_LIMITS.LOAN_RATE_MIN}%` });
  } else if (debt.annualInterestRate > VALIDATION_LIMITS.LOAN_RATE_MAX) {
    errors.push({ field: 'annualInterestRate', message: `Annual interest rate cannot exceed ${VALIDATION_LIMITS.LOAN_RATE_MAX}%` });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate a debt based on its type
 */
export function validateDebt(debt: Partial<Debt>): ValidationResult {
  if (debt.type === DebtType.CREDIT_CARD) {
    return validateCreditCardDebt(debt as Partial<CreditCardDebt>);
  } else {
    return validateLoanDebt(debt as Partial<LoanDebt>);
  }
}

/**
 * Validate monthly budget
 */
export function validateMonthlyBudget(budget: number, debts: Debt[]): ValidationResult {
  const errors: ValidationError[] = [];

  if (!budget || budget < VALIDATION_LIMITS.MIN_BUDGET) {
    errors.push({ field: 'monthlyBudget', message: `Monthly budget must be at least ₹${VALIDATION_LIMITS.MIN_BUDGET.toLocaleString('en-IN')}` });
  } else if (budget > VALIDATION_LIMITS.MAX_BUDGET) {
    errors.push({ field: 'monthlyBudget', message: `Monthly budget cannot exceed ₹${VALIDATION_LIMITS.MAX_BUDGET.toLocaleString('en-IN')}` });
  }

  // Check if budget covers minimum payments
  if (debts.length > 0) {
    const totalMinimums = debts.reduce((sum, debt) => sum + getMinimumPayment(debt), 0);
    if (budget < totalMinimums) {
      errors.push({
        field: 'monthlyBudget',
        message: `Monthly budget (₹${budget.toLocaleString('en-IN')}) must be at least ₹${totalMinimums.toLocaleString('en-IN')} to cover all minimum payments`
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate debt count
 */
export function validateDebtCount(count: number): ValidationError | null {
  if (count < VALIDATION_LIMITS.MIN_DEBTS) {
    return { field: 'debts', message: 'At least one debt is required' };
  }

  if (count > VALIDATION_LIMITS.MAX_DEBTS) {
    return { field: 'debts', message: `Cannot have more than ${VALIDATION_LIMITS.MAX_DEBTS} debts` };
  }

  return null;
}

/**
 * Check if payoff timeline is reasonable
 */
export function validatePayoffTimeline(months: number): {
  hasWarning: boolean;
  hasError: boolean;
  message?: string;
} {
  const years = Math.round(months / 12);

  if (months > 600) { // 50 years
    return {
      hasWarning: false,
      hasError: true,
      message: `Payoff time (${years} years) exceeds calculation limit. Please increase your monthly budget.`
    };
  }

  if (months > 360) { // 30 years
    return {
      hasWarning: true,
      hasError: false,
      message: `Payoff will take ${years} years. Consider increasing your monthly budget to pay off debts faster.`
    };
  }

  return { hasWarning: false, hasError: false };
}
