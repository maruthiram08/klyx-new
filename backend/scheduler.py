import logging
import time
from datetime import datetime
import pytz
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger

# Local imports
from database.stock_populator import StockDataPopulator

logger = logging.getLogger(__name__)

# IST Timezone
IST = pytz.timezone('Asia/Kolkata')

def job_update_prices_intraday():
    """
    Intraday job: Updates ONLY prices for active stocks.
    Runs every 15 mins during market hours.
    """
    try:
         # Check if market is likely open (roughly)
        now = datetime.now(IST)
        # Market hours: 09:15 to 15:30, Mon-Fri
        if now.weekday() < 5 and (9 <= now.hour <= 15):
             logger.info("⏰ Starting Intraday Price Update Job...")
             populator = StockDataPopulator()
             # Update top 200 stocks by market cap to keep them fresh
             # We assume update_prices is a fast method fetching only price/change
             result = populator.update_prices(max_stocks=200) 
             logger.info(f"✅ Intraday Update Complete: {result}")
        else:
            logger.info("💤 Market closed, skipping intraday update.")

    except Exception as e:
        logger.error(f"❌ Intraday Job Failed: {e}")

def job_daily_enrichment():
    """
    Daily job: Full enrichment for all stocks.
    Runs after market close (e.g. 18:00 IST).
    """
    logger.info("🌙 Starting Daily Full Enrichment Job...")
    try:
        populator = StockDataPopulator()
        # Full enrichment logic
        # We might want to cap it or run it in batches, but for now ensuring we touch stale ones
        result = populator.enrich_stock_data(batch_size=20, max_stocks=None) 
        logger.info(f"✅ Daily Enrichment Complete: {result}")
    except Exception as e:
        logger.error(f"❌ Daily Job Failed: {e}")

def init_scheduler(app):
    """Initialize and start the scheduler"""
    scheduler = BackgroundScheduler(timezone=IST)
    
    # 1. Intraday Price Update: Every 15 minutes
    scheduler.add_job(
        func=job_update_prices_intraday,
        trigger=IntervalTrigger(minutes=15),
        id='intraday_price_update',
        name='Update stock prices every 15 mins',
        replace_existing=True
    )

    # 2. Daily Full Enrichment: Every weekday at 18:00 IST
    scheduler.add_job(
        func=job_daily_enrichment,
        trigger=CronTrigger(hour=18, minute=0, day_of_week='mon-fri', timezone=IST),
        id='daily_enrichment',
        name='Daily full stock enrichment',
        replace_existing=True
    )

    scheduler.start()
    logger.info("🚀 Scheduler Started with Intraday (15m) and Daily (18:00) jobs.")
    return scheduler
