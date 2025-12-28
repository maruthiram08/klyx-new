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
def process_portfolio_task(self, user_id, use_multi_source=False):
    """
    Background task to process portfolio data.
    
    Args:
        user_id: User ID who requested the processing
        use_multi_source: Whether to use multi-source enrichment
        
    Returns:
        dict: Processing results
    """
    logger.info(f"Starting portfolio processing for user {user_id}")
    
    try:
        import clean_data
        import enrich_data
        import generate_insights
        
        # Step 1: Clean data (33% progress)
        self.update_progress(1, 3, "Cleaning and merging data files...")
        logger.info("Step 1/3: Cleaning data...")
        clean_data.main()
        
        # Step 2: Enrich data (66% progress)
        self.update_progress(2, 3, "Enriching with external data sources...")
        logger.info("Step 2/3: Enriching data...")
        
        if use_multi_source:
            import enrich_data_v2
            enrich_data_v2.main()
        else:
            enrich_data.main()
        
        # Step 3: Generate insights (100% progress)
        self.update_progress(3, 3, "Generating insights and analysis...")
        logger.info("Step 3/3: Generating insights...")
        generate_insights.main()
        
        logger.info(f"Portfolio processing completed for user {user_id}")
        
        return {
            'status': 'completed',
            'user_id': user_id,
            'message': 'Portfolio analysis completed successfully',
            'timestamp': time.time()
        }
        
    except Exception as e:
        logger.error(f"Portfolio processing failed for user {user_id}: {str(e)}")
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
