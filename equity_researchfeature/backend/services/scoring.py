
"""
Composite Scoring Engine
Synthesizes raw metrics into standardized 0-100 scores for easy comparison.
"""
from backend.services.metric_router import get_value_creation_metrics
from backend.services.computations import calculate_incremental_roic, calculate_cash_conversion

def calculate_value_creation_score(stock_id: int, db_connection) -> dict:
    """
    Score (0-100) based on Economic Spread (ROIC - WACC or similar).
    
    Logic:
    - Spread > 10%: 100 (Exceptional)
    - Spread > 5%: 80-99 (Strong)
    - Spread > 2%: 60-79 (Good)
    - Spread > 0%: 50-59 (Marginal)
    - Spread < 0%: < 50 (Destructive)
    
    Returns:
        dict: {'score': int, 'grade': str, 'spread': float}
    """
    
    # 1. Get Framework Type
    q = "SELECT metric_framework_type FROM stocks WHERE id = %s"
    row = db_connection.execute(q, (stock_id,)).fetchone()
    framework = row['metric_framework_type'] if row else 'standard'
    
    # 2. Get Metrics via Router
    metrics = get_value_creation_metrics(stock_id, framework, db_connection)
    spread = metrics.get('spread')
    
    if spread is None:
        return {
            'metric': 'Value Creation',
            'score': 0, 
            'grade': 'N/A', 
            'raw_spread_pct': None,
            'details': {}
        }
        
    # 3. Calculate Base Score
    score = 50 # Default neutral
    
    if spread >= 10:
        score = 100
    elif spread >= 5:
        # Scale 80-99 for spread 5 to 10
        score = 80 + ((spread - 5) / 5) * 19
    elif spread >= 2:
        # Scale 60-79 for spread 2 to 5
        score = 60 + ((spread - 2) / 3) * 19
    elif spread >= 0:
        # Scale 50-59 for spread 0 to 2
        score = 50 + (spread / 2) * 9
    elif spread >= -5:
        # Scale 20-49 for spread -5 to 0
        score = 20 + ((spread + 5) / 5) * 29
    else:
        score = 10 # Cap floor
        
    score = int(round(score))
    
    # Check consistency (bonus/penalty) - placeholder for now
    # Ideally look at 3Y trend. If improving +5 points.
    
    grade = get_grade(score)
    
    return {
        'metric': 'Value Creation',
        'score': score,
        'grade': grade,
        'raw_spread_pct': spread,
        'details': metrics
    }

def calculate_financial_health_score(stock_id: int, db_connection) -> dict:
    """
    Score (0-100) based on Balance Sheet strength.
    
    Standard: Debt/Equity, Interest Coverage, Current Ratio
    Banking: GNPA%, Net NPA%, CAR%
    """
    # 1. Get Framework
    q = "SELECT metric_framework_type, current_price, market_cap_cr FROM stocks WHERE id = %s"
    stock_row = db_connection.execute(q, (stock_id,)).fetchone()
    framework = stock_row['metric_framework_type'] if stock_row else 'standard'
    
    score = 50
    details = {}
    
    if framework in ('banking', 'nbfc'):
        # Banking Health: Asset Quality & Capital Adequacy
        q_bank = """
            SELECT gnpa_pct, car_pct, nnpa_pct, pcr_pct, nim_pct
            FROM financials_annual 
            WHERE stock_id = %s 
            ORDER BY fiscal_year DESC LIMIT 1
        """
        fin_row = db_connection.execute(q_bank, (stock_id,)).fetchone()
        
        if not fin_row or (fin_row['gnpa_pct'] is None and fin_row['car_pct'] is None):
            return {'score': 0, 'grade': 'Data Missing', 'details': 'Critical banking metrics (GNPA/CAR) not found'}
            
        gnpa = float(fin_row['gnpa_pct']) if fin_row['gnpa_pct'] is not None else 5.0 # Conservative
        car = float(fin_row['car_pct']) if fin_row['car_pct'] is not None else 10.0 # Conservative fallback
        
        # GNPA Scoring (Lower is better): 100 if < 1%, 0 if > 6%
        if gnpa < 1.0:
            gnpa_score = 100
        elif gnpa > 6.0:
            gnpa_score = 0
        else:
            gnpa_score = 100 - ((gnpa - 1.0) / 5.0 * 100)
            
        # CAR Scoring (Higher is better): 100 if > 18%, 0 if < 9%
        if car >= 18.0:
            car_score = 100
        elif car < 9.0:
            car_score = 0
        else:
            car_score = ((car - 9.0) / 9.0) * 100
            
        score = (gnpa_score * 0.5) + (car_score * 0.5)
        details = {
            'gnpa_pct': round(gnpa, 2), 
            'car_pct': round(car, 2),
            'nnpa_pct': fin_row['nnpa_pct'],
            'pcr_pct': fin_row['pcr_pct'],
            'nim_pct': fin_row['nim_pct']
        }
        
    else:
        # Standard Health: Leverage & Solvency
        q_fin = """
            SELECT total_debt_cr, total_equity_cr, interest_coverage, debt_to_equity
            FROM financials_annual 
            WHERE stock_id = %s 
            ORDER BY fiscal_year DESC LIMIT 1
        """
        fin_row = db_connection.execute(q_fin, (stock_id,)).fetchone()
        
        if not fin_row:
            return {'score': 0, 'grade': 'N/A', 'details': 'No financial data'}
            
        # Use pre-calculated metrics if available
        de_ratio = float(fin_row['debt_to_equity'] or 0)
        int_cov = float(fin_row['interest_coverage'] or 0)
        
        if fin_row['debt_to_equity'] is None:
            debt = float(fin_row['total_debt_cr'] or 0)
            equity = float(fin_row['total_equity_cr'] or 1)
            de_ratio = debt / equity
            
        # D/E Scoring (Lower is better)
        de_score = 50
        if de_ratio < 0.1: de_score = 100
        elif de_ratio < 0.5: de_score = 80
        elif de_ratio < 1.0: de_score = 60
        else: de_score = 30
        
        # Int Cov Scoring (Higher is better) - Handle infinity/high coverage
        cov_score = 50
        if int_cov > 10: cov_score = 100
        elif int_cov > 5: cov_score = 80
        elif int_cov > 2: cov_score = 50
        else: cov_score = 20
        
        score = (de_score * 0.6) + (cov_score * 0.4)
        details = {'de_ratio': round(de_ratio, 2), 'int_cov': round(int_cov, 2)}

    score = int(round(score))
    return {
        'metric': 'Financial Health',
        'score': score,
        'grade': get_grade(score),
        'details': details
    }

def calculate_growth_score(stock_id: int, db_connection) -> dict:
    """
    Score (0-100) based on Growth Trajectory.
    
    Standard: Revenue Growth, PAT Growth (3Y CAGR preferred)
    Banking: NII Growth, Advances Growth
    """
    # 1. Get Framework
    q = "SELECT metric_framework_type FROM stocks WHERE id = %s"
    stock_row = db_connection.execute(q, (stock_id,)).fetchone()
    framework = stock_row['metric_framework_type'] if stock_row else 'standard'
    
    score = 50
    details = {}
    
    # Fetch history
    q_fin = """
        SELECT fiscal_year, revenue_cr, net_profit_cr, interest_income_cr
        FROM financials_annual 
        WHERE stock_id = %s 
        ORDER BY fiscal_year DESC LIMIT 2
    """
    rows = db_connection.execute(q_fin, (stock_id,)).fetchall()
    
    if len(rows) < 2:
        return {'score': 50, 'grade': 'N/A', 'details': 'Insufficient data'}
        
    curr = rows[0]
    prev = rows[1]
    
    if framework in ('banking', 'nbfc'):
        # Banking Growth: NII Growth
        curr_nii = float(curr['interest_income_cr'] or 0)
        prev_nii = float(prev['interest_income_cr'] or 0)
        
        if prev_nii <= 0:
            return {'score': 0, 'grade': 'N/A', 'details': 'Insufficient NII data'}
            
        nii_growth = ((curr_nii - prev_nii) / prev_nii * 100)
        
        # PAT Growth
        curr_pat = float(curr['net_profit_cr'] or 0)
        prev_pat = float(prev['net_profit_cr'] or 0)
        pat_growth = ((curr_pat - prev_pat) / prev_pat * 100) if prev_pat > 0 else 0
        
        # Scoring
        # NII > 15% -> 100, > 12% -> 80
        if nii_growth > 15: score = 100
        elif nii_growth > 12: score = 80
        elif nii_growth > 8: score = 60
        else: score = 40
        
        score = (score * 0.7) + (min(100, max(0, pat_growth)) * 0.3)
        details = {'nii_growth': round(nii_growth, 2), 'pat_growth': round(pat_growth, 2)}
        
    else:
        # Standard Growth: Sales & Profit
        curr_rev = float(curr['revenue_cr'] or 0)
        prev_rev = float(prev['revenue_cr'] or 0)
        
        rev_growth = ((curr_rev - prev_rev) / prev_rev * 100) if prev_rev > 0 else 0
        
        curr_pat = float(curr['net_profit_cr'] or 0)
        prev_pat = float(prev['net_profit_cr'] or 0)
        pat_growth = ((curr_pat - prev_pat) / prev_pat * 100) if prev_pat > 0 else 0
        
        # Scoring
        # Rev > 15% -> 100, > 10% -> 80
        rev_score = 50
        if rev_growth > 15: rev_score = 100
        elif rev_growth > 10: rev_score = 80
        elif rev_growth > 5: rev_score = 60
        elif rev_growth > 0: rev_score = 40
        else: rev_score = 20
        
        score = (rev_score * 0.6) + (min(pat_growth, 100) * 0.4)
        details = {'rev_growth': round(rev_growth, 2), 'pat_growth': round(pat_growth, 2)}

    score = min(max(int(round(score)), 0), 100)
    return {
        'metric': 'Growth',
        'score': score,
        'grade': get_grade(score),
        'details': details
    }

def calculate_valuation_score(stock_id: int, db_connection) -> dict:
    """
    Score (0-100) based on relative valuation.
    """
    # 1. Get Framework & Metrics
    q = "SELECT metric_framework_type, pe_ttm, pb_ratio FROM stocks WHERE id = %s"
    row = db_connection.execute(q, (stock_id,)).fetchone()
    if not row:
        return {'score': 50, 'grade': 'N/A', 'details': 'No data'}
        
    framework = row['metric_framework_type'] or 'standard'
    pe = float(row['pe_ttm'] or 0)
    pb = float(row['pb_ratio'] or 0)
    
    score = 50
    details = {'pe': pe, 'pb': pb}
    
    # Simple relative valuation logic
    if framework in ('banking', 'nbfc', 'insurance'):
        # Use P/B for financials
        # P/B < 1: Cheap (90), 1-2: Fair (70-50), > 4: Expensive (20)
        if pb > 0:
            if pb < 1.5: score = 90
            elif pb < 2.5: score = 70
            elif pb < 4.0: score = 50
            else: score = 20
    else:
        # Use P/E for standard
        # PE < 20: Cheap
        if pe > 0:
            if pe < 20: score = 90
            elif pe < 35: score = 70
            elif pe < 50: score = 50
            else: score = 20
            
    return {
        'metric': 'Valuation',
        'score': score,
        'grade': get_grade(score),
        'details': details
    }

def calculate_overall_score(stock_id: int, db_connection) -> dict:
    """
    Weighted Average of component scores.
    """
    s1 = calculate_value_creation_score(stock_id, db_connection)
    s2 = calculate_financial_health_score(stock_id, db_connection)
    s3 = calculate_growth_score(stock_id, db_connection)
    s4 = calculate_valuation_score(stock_id, db_connection)
    
    # Weights
    w1 = 0.35 # Value Creation (Most important)
    w2 = 0.25 # Quality
    w3 = 0.25 # Growth
    w4 = 0.15 # Valuation (Least important, highly subjective)
    
    final = (s1['score'] * w1) + (s2['score'] * w2) + (s3['score'] * w3) + (s4['score'] * w4)
    final = int(round(final))
    
    return {
        'overall_score': final,
        'grade': get_grade(final),
        'components': {
            'value_creation': s1,
            'financial_health': s2,
            'growth': s3,
            'valuation': s4
        }
    }

def get_grade(score: int) -> str:
    if score >= 80: return 'Exceptional'
    if score >= 65: return 'Very Good'
    if score >= 50: return 'Good'
    if score >= 35: return 'Fair'
    return 'Poor'
