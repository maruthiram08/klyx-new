"""
Background tasks for portfolio processing
"""

import os
import sys
import time
from celery import Task
from celery.utils.log import get_task_logger

# Add backend to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from celery_app import celery_app

logger = get_task_logger(__name__)


class CallbackTask(Task):
    """Base task with progress callback support"""
    
    def update_progress(self, current, total, message=""):
        """Update task progress"""
        self.update_state(
            state='PROGRESS',
            meta={
                'current': current,
                'total': total,
                'percent': int((current / total) * 100) if total > 0 else 0,
                'message': message
            }
        )


@celery_app.task(bind=True, base=CallbackTask, name='tasks.process_portfolio')
def process_portfolio_task(self, user_id, use_multi_source=True):
    """
    Background task to process portfolio data via Database.
    
    Args:
        user_id: User ID who requested the processing
        use_multi_source: Always True (defaults to parallel multi-source)
        
    Returns:
        dict: Processing results
    """
    logger.info(f"Starting portfolio processing for user {user_id}")
    
    try:
        from app import app, db
        from models import UserPortfolio, UserAnalysis
        from services.multi_source_data_service import multi_source_service
        
        with app.app_context():
            # Step 1: Fetch User Portfolio (10% progress)
            self.update_progress(10, 100, "Fetching portfolio from database...")
            portfolio_items = UserPortfolio.query.filter_by(user_id=user_id).all()
            
            if not portfolio_items:
                return {
                    'status': 'error',
                    'user_id': user_id,
                    'message': 'No stocks found in portfolio. Please add stocks first.'
                }
            
            symbols = [item.stock_name for item in portfolio_items]
            logger.info(f"Found {len(symbols)} stocks for user {user_id}: {symbols}")
            
            # Step 2: Enrich Data (Parallel) (50% progress)
            self.update_progress(20, 100, f"Enriching {len(symbols)} stocks (Parallel)...")
            
            # Use parallel fetching (max 10 workers)
            enrichment_results = multi_source_service.fetch_multiple_stocks(
                symbols, max_workers=10
            )
            
            # Step 3: Save to UserAnalysis (90% progress)
            self.update_progress(80, 100, "Saving analysis results...")
            
            # Clear old analysis for this user (full refresh)
            # Or should we upsert? Full refresh is cleaner for now to avoid duplicates/stale
            UserAnalysis.query.filter_by(user_id=user_id).delete()
            
            saved_count = 0
            for symbol, result in enrichment_results.items():
                data = result.get('data', {})
                quality = result.get('quality', {})
                
                # Create analysis record
                analysis = UserAnalysis(
                    user_id=user_id,
                    stock_name=symbol,
                    nse_code=symbol, # Assume symbol is code for now
                    analysis_data={
                        **data, 
                        "_quality": quality
                    }
                )
                db.session.add(analysis)
                saved_count += 1
            
            db.session.commit()
            
            self.update_progress(100, 100, "Portfolio analysis complete!")
            logger.info(f"Saved {saved_count} analysis records for user {user_id}")
            
            return {
                'status': 'completed',
                'user_id': user_id,
                'message': f'Successfully analyzed {saved_count} stocks',
                'timestamp': time.time()
            }
        
    except Exception as e:
        logger.error(f"Portfolio processing failed for user {user_id}: {str(e)}")
        # Log full traceback
        import traceback
        logger.error(traceback.format_exc())
        raise


@celery_app.task(name='tasks.enrich_stock_database')
def enrich_stock_database_task(batch_size=10, max_stocks=None):
    """
    Background task to enrich stock database with external data.
    
    Args:
        batch_size: Number of stocks to process in each batch
        max_stocks: Maximum number of stocks to enrich (None = all)
        
    Returns:
        dict: Enrichment results
    """
    logger.info(f"Starting database enrichment (batch_size={batch_size}, max_stocks={max_stocks})")
    
    try:
        from database.stock_populator import StockDataPopulator
        
        populator = StockDataPopulator()
        result = populator.enrich_stock_data(
            batch_size=batch_size,
            max_stocks=max_stocks
        )
        
        logger.info(f"Database enrichment completed: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Database enrichment failed: {str(e)}")
        raise


@celery_app.task(name='tasks.refresh_stock_database')
def refresh_stock_database_task(full_refresh=False):
    """
    Background task to refresh stock database.
    
    Args:
        full_refresh: If True, refresh all stocks. If False, only stale data.
        
    Returns:
        dict: Refresh results
    """
    logger.info(f"Starting database refresh (full={full_refresh})")
    
    try:
        from database.stock_populator import StockDataPopulator, StockListFetcher
        
        populator = StockDataPopulator()
        results = {}
        
        # Step 1: Update stock list
        logger.info("Fetching stock list...")
        stock_list = StockListFetcher.get_nse_stock_list()
        pop_result = populator.populate_initial_stocks(stock_list)
        results['populate'] = pop_result
        
        # Step 2: Enrich stocks
        logger.info("Enriching stocks...")
        max_stocks = None if full_refresh else 50
        enrich_result = populator.enrich_stock_data(max_stocks=max_stocks)
        results['enrich'] = enrich_result
        
        # Step 3: Get stats
        stats = populator.get_database_stats()
        results['stats'] = stats
        
        logger.info(f"Database refresh completed: {results}")
        return results
        
    except Exception as e:
        logger.error(f"Database refresh failed: {str(e)}")
        raise
