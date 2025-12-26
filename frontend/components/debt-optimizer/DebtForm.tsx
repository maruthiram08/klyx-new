'use client';

// Debt Form Component
// Location: frontend/components/debt-optimizer/DebtForm.tsx

import React, { useState, useEffect } from 'react';
import { Debt, DebtType, CreditCardDebt, LoanDebt, isCreditCardDebt } from '@/types/debt';
import { Input } from '@/components/ui/Input';
import { Select, SelectOption } from '@/components/ui/Select';
import { NumberInput } from '@/components/ui/NumberInput';
import { Button } from '@/components/ui/Button';
import { validateDebt } from '@/utils/validations';
import { CreditCard, Landmark, Plus, X } from 'lucide-react';

interface DebtFormProps {
  onAdd: (debt: Debt) => void;
  onCancel?: () => void;
  existingDebt?: Debt;
  mode?: 'add' | 'edit';
}

export function DebtForm({ onAdd, onCancel, existingDebt, mode = 'add' }: DebtFormProps) {
  const [debtType, setDebtType] = useState<DebtType>(
    existingDebt?.type || DebtType.CREDIT_CARD
  );
  const [name, setName] = useState(existingDebt?.name || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Credit Card fields
  const [outstandingBalance, setOutstandingBalance] = useState(
    existingDebt && isCreditCardDebt(existingDebt) ? existingDebt.outstandingBalance : 0
  );
  const [monthlyInterestRate, setMonthlyInterestRate] = useState(
    existingDebt && isCreditCardDebt(existingDebt) ? existingDebt.monthlyInterestRate : 0
  );
  const [minimumPayment, setMinimumPayment] = useState(
    existingDebt && isCreditCardDebt(existingDebt) ? existingDebt.minimumPayment : 0
  );

  // Loan fields
  const [outstandingPrincipal, setOutstandingPrincipal] = useState(
    existingDebt && !isCreditCardDebt(existingDebt) ? existingDebt.outstandingPrincipal : 0
  );
  const [emiAmount, setEmiAmount] = useState(
    existingDebt && !isCreditCardDebt(existingDebt) ? existingDebt.emiAmount : 0
  );
  const [remainingTenure, setRemainingTenure] = useState(
    existingDebt && !isCreditCardDebt(existingDebt) ? existingDebt.remainingTenure : 0
  );
  const [annualInterestRate, setAnnualInterestRate] = useState(
    existingDebt && !isCreditCardDebt(existingDebt) ? existingDebt.annualInterestRate : 0
  );

  // Debt type options
  const debtTypeOptions: SelectOption[] = [
    { value: DebtType.CREDIT_CARD, label: 'Credit Card' },
    { value: DebtType.PERSONAL_LOAN, label: 'Personal Loan' },
    { value: DebtType.HOME_LOAN, label: 'Home Loan' },
    { value: DebtType.CAR_LOAN, label: 'Car Loan' },
    { value: DebtType.EDUCATION_LOAN, label: 'Education Loan' },
    { value: DebtType.OTHER, label: 'Other Loan' }
  ];

  // Reset form when debt type changes
  useEffect(() => {
    if (!existingDebt) {
      // Clear all fields when switching types in add mode
      setOutstandingBalance(0);
      setMonthlyInterestRate(0);
      setMinimumPayment(0);
      setOutstandingPrincipal(0);
      setEmiAmount(0);
      setRemainingTenure(0);
      setAnnualInterestRate(0);
      setErrors({});
    }
  }, [debtType, existingDebt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Build debt object based on type
    let debt: Partial<Debt>;

    if (debtType === DebtType.CREDIT_CARD) {
      debt = {
        id: existingDebt?.id || crypto.randomUUID(),
        type: DebtType.CREDIT_CARD,
        name,
        outstandingBalance,
        monthlyInterestRate,
        minimumPayment,
        createdAt: existingDebt?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as CreditCardDebt;
    } else {
      debt = {
        id: existingDebt?.id || crypto.randomUUID(),
        type: debtType,
        name,
        outstandingPrincipal,
        emiAmount,
        remainingTenure,
        annualInterestRate,
        createdAt: existingDebt?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as LoanDebt;
    }

    // Validate
    const validation = validateDebt(debt);

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach(err => {
        errorMap[err.field] = err.message;
      });
      setErrors(errorMap);
      return;
    }

    // Submit
    onAdd(debt as Debt);
  };

  const isCreditCard = debtType === DebtType.CREDIT_CARD;

  return (
    <div className="bg-white rounded-[2rem] p-8 border border-neutral-100">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#ccf32f] flex items-center justify-center">
            {isCreditCard ? (
              <CreditCard size={24} className="text-black" />
            ) : (
              <Landmark size={24} className="text-black" />
            )}
          </div>
          <div>
            <h3 className="text-2xl font-bold text-neutral-900">
              {mode === 'edit' ? 'Edit Debt' : 'Add Debt'}
            </h3>
            <p className="text-sm text-neutral-500">
              {mode === 'edit' ? 'Update debt details' : 'Enter your debt information'}
            </p>
          </div>
        </div>
        {onCancel && (
          <button
            onClick={onCancel}
            className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            <X size={20} className="text-neutral-500" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Debt Type */}
        <Select
          label="Debt Type"
          value={debtType}
          onChange={(e) => setDebtType(e.target.value as DebtType)}
          options={debtTypeOptions}
          required
          disabled={mode === 'edit'}
          helperText={mode === 'edit' ? 'Cannot change debt type when editing' : undefined}
        />

        {/* Debt Name */}
        <Input
          label="Debt Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={isCreditCard ? 'e.g., HDFC Millennia' : 'e.g., Home Loan - SBI'}
          error={errors.name}
          required
        />

        {/* Conditional Fields based on Debt Type */}
        {isCreditCard ? (
          <>
            {/* Credit Card Fields */}
            <NumberInput
              label="Outstanding Balance"
              value={outstandingBalance}
              onChange={setOutstandingBalance}
              variant="currency"
              placeholder="Enter current outstanding balance"
              error={errors.outstandingBalance}
              helperText="Total amount currently owed on this credit card"
              required
            />

            <NumberInput
              label="Monthly Interest Rate"
              value={monthlyInterestRate}
              onChange={setMonthlyInterestRate}
              variant="percentage"
              decimals={2}
              placeholder="e.g., 3.5"
              error={errors.monthlyInterestRate}
              helperText="Monthly interest rate (typical range: 2.5% - 4%)"
              required
            />

            <NumberInput
              label="Minimum Payment"
              value={minimumPayment}
              onChange={setMinimumPayment}
              variant="currency"
              placeholder="Enter minimum payment amount"
              error={errors.minimumPayment}
              helperText="Minimum amount you must pay each month (as per card statement)"
              required
            />
          </>
        ) : (
          <>
            {/* Loan Fields */}
            <NumberInput
              label="Outstanding Principal"
              value={outstandingPrincipal}
              onChange={setOutstandingPrincipal}
              variant="currency"
              placeholder="Enter remaining loan amount"
              error={errors.outstandingPrincipal}
              helperText="Remaining principal amount to be repaid"
              required
            />

            <NumberInput
              label="EMI Amount"
              value={emiAmount}
              onChange={setEmiAmount}
              variant="currency"
              placeholder="Enter monthly EMI"
              error={errors.emiAmount}
              helperText="Monthly EMI as per your loan statement"
              required
            />

            <NumberInput
              label="Remaining Tenure (Months)"
              value={remainingTenure}
              onChange={setRemainingTenure}
              variant="number"
              placeholder="e.g., 60"
              error={errors.remainingTenure}
              helperText="Number of months left to repay"
              required
            />

            <NumberInput
              label="Annual Interest Rate"
              value={annualInterestRate}
              onChange={setAnnualInterestRate}
              variant="percentage"
              decimals={2}
              placeholder="e.g., 10.5"
              error={errors.annualInterestRate}
              helperText="Annual interest rate percentage"
              required
            />
          </>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            className="flex-1 flex items-center justify-center gap-2"
          >
            <Plus size={20} />
            {mode === 'edit' ? 'Update Debt' : 'Add Debt'}
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              onClick={onCancel}
              className="flex-1"
            >
              Cancel
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
