// Test to verify Snowball vs Avalanche produce different results

import { DebtType, CreditCardDebt } from '@/types/debt';
import { calculateSnowball, calculateAvalanche } from './debtCalculations';

// Test case: 3 debts with different balances and interest rates
const testDebts: CreditCardDebt[] = [
  {
    id: '1',
    type: DebtType.CREDIT_CARD,
    name: 'High Interest Card',
    outstandingBalance: 5000, // Medium balance
    monthlyInterestRate: 3.5, // Highest interest
    minimumPayment: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    type: DebtType.CREDIT_CARD,
    name: 'Low Balance Card',
    outstandingBalance: 2000, // Smallest balance
    monthlyInterestRate: 2.0, // Medium interest
    minimumPayment: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    type: DebtType.CREDIT_CARD,
    name: 'High Balance Card',
    outstandingBalance: 10000, // Largest balance
    monthlyInterestRate: 1.5, // Lowest interest
    minimumPayment: 300,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const monthlyBudget = 1000; // Total minimums = 600, extra = 400

console.log('=== Testing Debt Optimization Algorithms ===\n');

const snowballResult = calculateSnowball(testDebts, monthlyBudget);
const avalancheResult = calculateAvalanche(testDebts, monthlyBudget);

console.log('SNOWBALL (Smallest Balance First):');
console.log('- Total Interest:', snowballResult.totalInterestPaid);
console.log('- Months to Payoff:', snowballResult.monthsToPayoff);
console.log('- First debt paid:', snowballResult.schedule.monthlyPayments.find(p => p.isPaidOff)?.debtName);

console.log('\nAVALANCHE (Highest Interest First):');
console.log('- Total Interest:', avalancheResult.totalInterestPaid);
console.log('- Months to Payoff:', avalancheResult.monthsToPayoff);
console.log('- First debt paid:', avalancheResult.schedule.monthlyPayments.find(p => p.isPaidOff)?.debtName);

console.log('\nDIFFERENCE:');
console.log('- Interest Savings (Avalanche vs Snowball):', snowballResult.totalInterestPaid - avalancheResult.totalInterestPaid);
console.log('- Time Difference (months):', snowballResult.monthsToPayoff - avalancheResult.monthsToPayoff);

if (snowballResult.totalInterestPaid === avalancheResult.totalInterestPaid) {
  console.log('\n⚠️ WARNING: Results are identical! This should not happen with different debts.');
} else {
  console.log('\n✓ Results are different as expected!');
}
