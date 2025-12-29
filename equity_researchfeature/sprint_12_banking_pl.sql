-- Migration to add missing Banking P&L columns
ALTER TABLE financials_annual 
ADD COLUMN IF NOT EXISTS net_interest_income_cr NUMERIC(20, 2),
ADD COLUMN IF NOT EXISTS interest_expense_cr NUMERIC(20, 2);
