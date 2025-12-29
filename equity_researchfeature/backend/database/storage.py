from datetime import datetime
import uuid

def get_stock_by_code(code: str, db_connection) -> dict:
    """Get stock by NSE or BSE code"""
    
    query = """
    SELECT * FROM stocks
    WHERE nse_code = %(code)s OR bse_code = %(code)s OR stock_code = %(code)s
    LIMIT 1
    """
    
    result = db_connection.execute(query, {'code': code.upper()}).fetchone()
    return dict(result) if result else None


def store_stock_data(data: dict, db_connection) -> int:
    """
    Store or update stock data in database
    
    Returns: stock_id
    """
    
    # Check if stock exists
    check_query = """
    SELECT id FROM stocks WHERE nse_code = %(nse_code)s
    """
    result = db_connection.execute(check_query, {'nse_code': data['nse_code']}).fetchone()
    
    # Prepare cash/debt in Cr (Yahoo gives absolute)
    yahoo_cash = data.get('total_cash')
    yahoo_debt = data.get('total_debt')
    
    yahoo_cash_cr = yahoo_cash / 10000000 if yahoo_cash else None
    yahoo_debt_cr = yahoo_debt / 10000000 if yahoo_debt else None
    
    if result:
        stock_id = result['id']
        # Update existing record
        update_query = """
        UPDATE stocks SET
            current_price = %(current_price)s,
            previous_close = %(previous_close)s,
            day_change_pct = %(day_change_pct)s,
            high_52w = %(high_52w)s,
            low_52w = %(low_52w)s,
            market_cap_cr = %(market_cap)s / 10000000,
            pe_ttm = %(pe_ttm)s,
            pb_ratio = %(pb_ratio)s,
            beta_1yr = %(beta)s,
            yahoo_cash_cr = %(yahoo_cash_cr)s,
            yahoo_debt_cr = %(yahoo_debt_cr)s,
            yahoo_total_cash = %(yahoo_total_cash)s,
            cash_and_equivalents_cr = %(cash_and_equivalents_cr)s,
            cash_data_source = %(cash_data_source)s,
            last_price_update = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = %(stock_id)s
        """
        db_connection.execute(update_query, {
            **data, 
            'stock_id': stock_id,
            'yahoo_cash_cr': yahoo_cash_cr,
            'yahoo_debt_cr': yahoo_debt_cr,
            'yahoo_total_cash': yahoo_cash,
            'cash_and_equivalents_cr': yahoo_cash_cr, # Use Yahoo Cash as primary for now
            'cash_data_source': 'yahoo_finance'
        })
    else:
        # Insert new record
        insert_query = """
        INSERT INTO stocks (
            stock_name, nse_code, stock_code, sector_name, industry_name,
            current_price, market_cap_cr, pe_ttm, pb_ratio, beta_1yr,
            yahoo_cash_cr, yahoo_debt_cr, yahoo_total_cash, cash_and_equivalents_cr, cash_data_source,
            created_at, updated_at
        ) VALUES (
            %(company_name)s, %(nse_code)s, %(nse_code)s, %(sector)s, %(industry)s,
            %(current_price)s, %(market_cap)s / 10000000, %(pe_ttm)s, %(pb_ratio)s, %(beta)s,
            %(yahoo_cash_cr)s, %(yahoo_debt_cr)s, %(yahoo_total_cash)s, %(cash_and_equivalents_cr)s, %(cash_data_source)s,
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
        )
        RETURNING id
        """
        data.update({
             'yahoo_cash_cr': yahoo_cash_cr,
             'yahoo_debt_cr': yahoo_debt_cr,
             'yahoo_total_cash': yahoo_cash,
             'cash_and_equivalents_cr': yahoo_cash_cr,
             'cash_data_source': 'yahoo_finance'
        })
        result = db_connection.execute(insert_query, data).fetchone()
        stock_id = result['id']
    
    return stock_id


def store_historical_financials(stock_id: int, financials: list, db_connection):
    """
    Store historical financial data with UPSERT logic
    """
    
    # Map Screener keys to DB columns
    # operating_profit_cr -> ebitda_cr
    # interest_cr -> interest_expense_cr
    # borrowings_cr -> total_debt_cr (Approx)
    
    upsert_query = """
    INSERT INTO financials_annual (
        stock_id, fiscal_year, revenue_cr, ebitda_cr, net_profit_cr,
        eps, interest_expense_cr, depreciation_cr, profit_before_tax_cr,
        tax_expense_cr, 
        
        -- Ratios
        roe_pct, roce_pct, debt_to_equity, interest_coverage,
        
        -- Banking Specifics
        interest_income_cr, financing_profit_cr, 
        gnpa_pct, nnpa_pct, car_pct, 
        pcr_pct, nim_pct, casa_pct,
        cost_to_income_pct, tier1_pct, credit_cost_pct,
        
        -- Balance Sheet
        share_capital_cr, reserves_cr, total_equity_cr, 
        total_debt_cr, total_liabilities_cr, 
        fixed_assets_cr, investments_cr, total_assets_cr,
        cash_and_equivalents_cr,
        
        data_source, created_at, updated_at
    ) VALUES (
        %(stock_id)s, %(fiscal_year)s, %(revenue_cr)s, %(operating_profit_cr)s,
        %(net_profit_cr)s, %(eps)s, %(interest_cr)s, %(depreciation_cr)s,
        %(profit_before_tax_cr)s, 
        %(profit_before_tax_cr)s * COALESCE(%(tax_pct)s, 25) / 100,
        
        -- Ratios
        %(roe_pct)s, %(roce_pct)s, %(debt_to_equity)s, %(interest_coverage)s,
        
        -- Banking Specifics
        %(interest_income_cr)s, %(financing_profit_cr)s,
        %(gnpa_pct)s, %(nnpa_pct)s, %(car_pct)s,
        %(pcr_pct)s, %(nim_pct)s, %(casa_pct)s,
        %(cost_to_income_pct)s, %(tier1_pct)s, %(credit_cost_pct)s,
        
        -- Balance Sheet
        %(share_capital_cr)s, %(reserves_cr)s, COALESCE(%(share_capital_cr)s, 0) + COALESCE(%(reserves_cr)s, 0),
        %(borrowings_cr)s, %(total_liabilities_cr)s,
        %(fixed_assets_cr)s, %(investments_cr)s, %(total_assets_cr)s,
        %(cash_and_equivalents_cr)s,
        
        'screener.in', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    )
    ON CONFLICT (stock_id, fiscal_year) DO UPDATE SET
        revenue_cr = EXCLUDED.revenue_cr,
        ebitda_cr = EXCLUDED.ebitda_cr,
        net_profit_cr = EXCLUDED.net_profit_cr,
        roe_pct = EXCLUDED.roe_pct,
        roce_pct = EXCLUDED.roce_pct,
        debt_to_equity = EXCLUDED.debt_to_equity,
        interest_coverage = EXCLUDED.interest_coverage,
        interest_income_cr = EXCLUDED.interest_income_cr,
        financing_profit_cr = EXCLUDED.financing_profit_cr,
        gnpa_pct = EXCLUDED.gnpa_pct,
        nnpa_pct = EXCLUDED.nnpa_pct,
        car_pct = EXCLUDED.car_pct,
        pcr_pct = EXCLUDED.pcr_pct,
        nim_pct = EXCLUDED.nim_pct,
        casa_pct = EXCLUDED.casa_pct,
        cost_to_income_pct = EXCLUDED.cost_to_income_pct,
        total_equity_cr = EXCLUDED.total_equity_cr,
        total_debt_cr = EXCLUDED.total_debt_cr,
        total_assets_cr = EXCLUDED.total_assets_cr,
        updated_at = CURRENT_TIMESTAMP
    """
    
    # Ensure parameter validation
    for year_data in financials:
        if year_data.get('fiscal_year'):
            params = {
                'stock_id': stock_id,
                'tax_pct': 25,
                **year_data
            }
            # Key Mappings / Fallbacks
            if 'interest_expense_cr' in params: params['interest_cr'] = params['interest_expense_cr']
            
            # Ensure all banking keys exist (default to None if missing)
            ratio_keys = ['gnpa_pct', 'nnpa_pct', 'car_pct', 'pcr_pct', 'nim_pct', 'casa_pct', 
                          'cost_to_income_pct', 'tier1_pct', 'credit_cost_pct', 'interest_coverage',
                          'debt_to_equity', 'current_ratio', 'quick_ratio', 'ebitda_margin_pct',
                          'net_margin_pct', 'roe_pct', 'roic_pct', 'roce_pct', 'roa_pct',
                          'gross_npa_pct', 'net_npa_pct', 'capital_adequacy_ratio_pct', 
                          'provision_coverage_pct', 'net_interest_margin_pct']
            
            for k in ratio_keys:
                if k not in params: 
                    params[k] = None
                elif params[k] is not None:
                    try:
                        # Safety cap for DECIMAL(10,4)
                        val = float(params[k])
                        if val > 999999.9999: params[k] = 999999.9999
                        if val < -999999.9999: params[k] = -999999.9999
                    except:
                        pass
                
            # Cross-map if legacy keys are used in scraper results
            if params['gross_npa_pct'] is not None and params['gnpa_pct'] is None: params['gnpa_pct'] = params['gross_npa_pct']
            if params['gnpa_pct'] is not None and params['gross_npa_pct'] is None: params['gross_npa_pct'] = params['gnpa_pct']
            
            if params['net_npa_pct'] is not None and params['nnpa_pct'] is None: params['nnpa_pct'] = params['net_npa_pct']
            if params['nnpa_pct'] is not None and params['net_npa_pct'] is None: params['net_npa_pct'] = params['nnpa_pct']
            
            if params['capital_adequacy_ratio_pct'] is not None and params['car_pct'] is None: params['car_pct'] = params['capital_adequacy_ratio_pct']
            if params['car_pct'] is not None and params['capital_adequacy_ratio_pct'] is None: params['capital_adequacy_ratio_pct'] = params['car_pct']
            
            if params['provision_coverage_pct'] is not None and params['pcr_pct'] is None: params['pcr_pct'] = params['provision_coverage_pct']
            if params['pcr_pct'] is not None and params['provision_coverage_pct'] is None: params['provision_coverage_pct'] = params['pcr_pct']
            
            if params['net_interest_margin_pct'] is not None and params['nim_pct'] is None: params['nim_pct'] = params['net_interest_margin_pct']
            if params['nim_pct'] is not None and params['net_interest_margin_pct'] is None: params['net_interest_margin_pct'] = params['nim_pct']

            # Ensure P&L keys exist
            for k in ['revenue_cr', 'operating_profit_cr', 'net_profit_cr', 'eps', 'interest_cr', 
                      'depreciation_cr', 'profit_before_tax_cr', 'tax_pct', 'interest_income_cr', 'financing_profit_cr']:
                if k not in params: params[k] = None

            # Ensure BS keys exist (default to None if missing)
            for k in ['share_capital_cr', 'reserves_cr', 'borrowings_cr', 'total_liabilities_cr', 
                      'fixed_assets_cr', 'investments_cr', 'total_assets_cr', 'cash_and_equivalents_cr',
                      'operating_cash_flow_cr', 'investing_cash_flow_cr', 'financing_cash_flow_cr', 'net_cash_flow_cr']:
                if k not in params: params[k] = None
                 
            db_connection.execute(upsert_query, params)


def get_historical_financials(stock_id: int, db_connection) -> list:
    """Get historical annual financials"""
    
    query = """
    SELECT * FROM financials_annual
    WHERE stock_id = %(stock_id)s
    ORDER BY fiscal_year DESC
    """
    
    results = db_connection.execute(query, {'stock_id': stock_id}).fetchall()
    return [dict(r) for r in results]


def store_generated_report(stock_id: int, report_type: str, content: str, 
                          quality_score: int, warnings: list, db_connection) -> str:
    """Store generated report in history"""
    
    report_id = f"{datetime.now().strftime('%Y%m%d')}_{stock_id}_{uuid.uuid4().hex[:8]}"
    
    query = """
    INSERT INTO report_history (
        stock_id, report_id, report_type, report_version,
        report_content_md, data_quality_score, warnings,
        framework_version, generated_at
    ) VALUES (
        %(stock_id)s, %(report_id)s, %(report_type)s, '1',
        %(content)s, %(quality_score)s, %(warnings)s,
        '2.0.0', CURRENT_TIMESTAMP
    )
    """
    # Note: Psycopg2 cursor.execute expects list/tuple/string for array types like warnings
    # We might need to handle list->string conversion if the DB column is text[] or jsonb
    # Assuming standard array or casting logic in wrapper/driver.
    
    db_connection.execute(query, {
        'stock_id': stock_id,
        'report_id': report_id,
        'report_type': report_type,
        'content': content,
        'quality_score': quality_score,
        'warnings': warnings # Psycopg2 handles list automatically for array types usually
    })
    
    return report_id
