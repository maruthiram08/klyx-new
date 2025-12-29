
"""
Financial Analysis Service
Computes derived metrics (margins, return ratios, efficiency) from raw financial data.
Reference: PART5 Section 3 and PART6 Section 3.1
"""
from decimal import Decimal
from backend.services.computations import calculate_roic, calculate_wacc

class FinancialAnalysisService:
    def __init__(self, db_wrapper):
        self.db = db_wrapper

    def analyze_stock_financials(self, stock_id: int):
        """
        Orchestrates full financial analysis for a stock and updates the database.
        """
        # 1. Fetch Framework Type
        stock = self.db.execute("SELECT id, metric_framework_type FROM stocks WHERE id = %s", (stock_id,)).fetchone()
        if not stock:
            return
        
        framework = stock['metric_framework_type'] or 'standard'
        
        # 2. Fetch all historical years
        financials = self.db.execute(\
            "SELECT * FROM financials_annual WHERE stock_id = %s ORDER BY fiscal_year ASC", \
            (stock_id,)).fetchall()
        
        if not financials:
            return

        # 3. Calculate and Update Derived Metrics for each year
        for i, year_data in enumerate(financials):
            derived = self._compute_year_metrics(year_data, framework)
            if derived:
                self._update_year_metrics(year_data['id'], derived)

        # 4. Compute ROIC History (Standard Only) and WACC
        if framework == 'standard':
            # We use the existing calculate_roic which handles average capital and history
            roic_results = calculate_roic(stock_id, self.db)
            if 'roic_history' in roic_results:
                for entry in roic_results['roic_history']:
                    self.db.execute(
                        "UPDATE financials_annual SET roic_pct = %s, invested_capital_cr = %s WHERE stock_id = %s AND fiscal_year = %s",
                        (entry['roic_pct'], entry['invested_capital_cr'], stock_id, entry['fiscal_year'])
                    )
        
        return True

    def _compute_year_metrics(self, data, framework):
        """Internal helper for per-year derived metrics"""
        try:
            results = {}
            
            # Common conversions
            rev = float(data['revenue_cr'] or 0)
            ebitda = float(data['ebitda_cr'] or 0)
            pbt = float(data['profit_before_tax_cr'] or 0)
            pat = float(data['net_profit_cr'] or 0)
            equity = float(data['total_equity_cr'] or 0)
            assets = float(data['total_assets_cr'] or 0)
            
            # 1. Margins
            if rev > 0:
                results['ebitda_margin_pct'] = (ebitda / rev) * 100
                results['net_margin_pct'] = (pat / rev) * 100
            
            # 2. Return Ratios
            if equity > 0:
                results['roe_pct'] = (pat / equity) * 100
            
            if assets > 0:
                results['roa_pct'] = (pat / assets) * 100
                results['asset_turnover'] = rev / assets
            
            # 4. Debts & Coverage
            debt = float(data['total_debt_cr'] or 0)
            if equity > 0:
                results['debt_to_equity'] = debt / equity
            
            # Interest Coverage: EBIT / Interest
            ebit = float(data.get('ebit_cr') or 0)
            if ebit == 0:
                ebitda = float(data.get('ebitda_cr') or 0)
                depr = float(data.get('depreciation_cr') or 0)
                ebit = ebitda - depr
            
            interest = float(data.get('interest_expense_cr') or 0)
            if interest > 0 and ebit > 0:
                results['interest_coverage'] = ebit / interest
            elif interest == 0 and ebit > 0:
                results['interest_coverage'] = 100.0 # High coverage if no interest
            
            # 5. Tax Rate
            if pbt > 0:
                results['effective_tax_rate_pct'] = (float(data['tax_expense_cr'] or 0) / pbt) * 100

            # 6. Banking specific derivations
            if framework in ['banking', 'nbfc']:
                # Refined NIM derivation: NIM = (NII / Interest Earning Assets) * 100
                # Proxy for Earning Assets = Investments + Advances
                nii = float(data.get('net_interest_income_cr') or 0)
                if nii == 0:
                    ii = float(data.get('interest_income_cr') or 0)
                    ie = float(data.get('interest_expense_cr') or 0)
                    nii = ii - ie
                
                advances = float(data.get('advances_cr') or 0)
                investments = float(data.get('investments_cr') or 0)
                earning_assets = advances + investments
                
                # Validation: For banks, earning assets are usually 85-95% of total assets
                # If advances+investments is too low (common in some scrapers), use 90% of total assets
                if earning_assets < (assets * 0.5) and assets > 0:
                    earning_assets = assets * 0.9
                
                if nii > 0 and earning_assets > 0 and data.get('nim_pct') is None:
                    results['nim_pct'] = (nii / earning_assets) * 100
                
                # Derive Gearing Ratio for NBFCs
                if framework == 'nbfc' and equity > 0:
                    results['gearing_ratio'] = debt / equity

            # Clean up results (Round to 2 decimal places)
            for k, v in results.items():
                if v is not None:
                    results[k] = round(float(v), 2)
            
            return results
        except Exception as e:
            print(f"Error computing metrics for FY {data['fiscal_year']}: {e}")
            return None

    def _update_year_metrics(self, row_id, metrics):
        """Update a single row with derived metrics"""
        if not metrics: return
        
        fields = ", ".join([f"{k} = %s" for k in metrics.keys()])
        query = f"UPDATE financials_annual SET {fields} WHERE id = %s"
        params = list(metrics.values()) + [row_id]
        
        self.db.execute(query, params)
