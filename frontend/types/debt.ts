// Debt Optimizer Type Definitions
// Location: frontend/types/debt.ts

export enum DebtType {
  CREDIT_CARD = "Credit Card",
  PERSONAL_LOAN = "Personal Loan",
  HOME_LOAN = "Home Loan",
  CAR_LOAN = "Car Loan",
  EDUCATION_LOAN = "Education Loan",
  OTHER = "Other"
}

export enum OptimizationMethod {
  SNOWBALL = "snowball",      // Smallest balance first (regardless of interest)
  AVALANCHE = "avalanche",    // Highest interest first
  SKI = "ski"                 // Smart hybrid (TBD algorithm)
}

// Base debt interface with common fields
export interface BaseDebt {
  id: string;
  name: string;
  type: DebtType;
  createdAt: string;
  updatedAt: string;
}

// Credit Card specific fields
export interface CreditCardDebt extends BaseDebt {
  type: DebtType.CREDIT_CARD;
  outstandingBalance: number;     // Current outstanding balance in ₹
  monthlyInterestRate: number;    // Monthly % (e.g., 3.5 for 3.5% per month)
  minimumPayment: number;         // User-provided minimum payment in ₹
}

// Loan specific fields
export interface LoanDebt extends BaseDebt {
  type: DebtType.PERSONAL_LOAN | DebtType.HOME_LOAN | DebtType.CAR_LOAN | DebtType.EDUCATION_LOAN | DebtType.OTHER;
  outstandingPrincipal: number;   // Remaining principal in ₹
  emiAmount: number;              // Monthly EMI in ₹ (also serves as minimum payment)
  remainingTenure: number;        // Remaining months
  annualInterestRate: number;     // Annual % (e.g., 10.5 for 10.5% per year)
}

// Union type for all debts
export type Debt = CreditCardDebt | LoanDebt;

// Helper type guards
export function isCreditCardDebt(debt: Debt): debt is CreditCardDebt {
  return debt.type === DebtType.CREDIT_CARD;
}

export function isLoanDebt(debt: Debt): debt is LoanDebt {
  return debt.type !== DebtType.CREDIT_CARD;
}

// Payment tracking interfaces
export interface MonthlyPayment {
  month: number;
  debtId: string;
  debtName: string;
  payment: number;
  interestPaid: number;
  principalPaid: number;
  remainingBalance: number;
  isPaidOff: boolean;
}

export interface DebtProgress {
  month: number;
  debtId: string;
  debtName: string;
  remainingBalance: number;
  isPaidOff: boolean;
}

export interface MonthlySummary {
  month: number;
  totalPayment: number;
  totalInterest: number;
  totalPrincipal: number;
  remainingDebts: number;
  debtsActive: string[];           // Debt names
}

export interface PaymentSchedule {
  method: OptimizationMethod;
  monthlyPayments: MonthlyPayment[];
  allDebts: DebtProgress[];
}

export interface OptimizationResult {
  method: OptimizationMethod;
  monthsToPayoff: number;
  totalInterestPaid: number;
  totalAmountPaid: number;
  schedule: PaymentSchedule;
  monthlySummary: MonthlySummary[];
}

// Scenario management
export interface DebtScenario {
  id: string;
  name: string;                    // User-provided name
  debts: Debt[];
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
}

// Validation
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
