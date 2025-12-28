"""
Logging configuration for production.
Provides structured JSON logging for better observability.
"""

import logging
import sys
import os
from datetime import datetime


class JSONFormatter(logging.Formatter):
    """Format logs as JSON for easier parsing in production"""
    
    def format(self, record):
        log_record = {
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
        }
        
        if record.exc_info:
            log_record["exception"] = self.formatException(record.exc_info)
        
        if hasattr(record, 'request_id'):
            log_record["request_id"] = record.request_id
            
        # Convert to JSON string
        import json
        return json.dumps(log_record)


def configure_logging(app=None):
    """Configure logging for the application"""
    
    is_production = os.environ.get('FLASK_ENV') == 'production'
    log_level = logging.INFO if is_production else logging.DEBUG
    
    # Create handler
    handler = logging.StreamHandler(sys.stdout)
    handler.setLevel(log_level)
    
    if is_production:
        handler.setFormatter(JSONFormatter())
    else:
        # Human-readable format for development
        handler.setFormatter(logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        ))
    
    # Configure root logger
    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    root_logger.addHandler(handler)
    
    # Configure Flask app logger if provided
    if app:
        app.logger.handlers = []
        app.logger.addHandler(handler)
        app.logger.setLevel(log_level)
    
    return handler


# Request ID middleware for tracing
def add_request_id_middleware(app):
    """Add request ID to all requests for tracing"""
    import uuid
    from flask import g, request
    
    @app.before_request
    def set_request_id():
        g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4())[:8])
    
    @app.after_request
    def add_request_id_header(response):
        if hasattr(g, 'request_id'):
            response.headers['X-Request-ID'] = g.request_id
        return response
