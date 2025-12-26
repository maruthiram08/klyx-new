# Production Readiness Checklist

To move the Weekend Analysis Tool from a local prototype to a robust production environment, we need to upgrade several components.

## 1. Core Architecture Upgrades

### **Server Handling**
*   **Current**: Flask Development Server (Single-threaded, not secure).
*   **Production Requirement**: **Gunicorn** (Green Unicorn).
    *   *Why*: A production-grade WSGI HTTP server that handles multiple concurrent requests and worker processes.
    *   *Config*: Run behind a reverse proxy (Nginx).

### **Database (The Big Shift)**
*   **Current**: In-Memory Python Lists (`allData` global variable) + Excel Files.
*   **Production Requirement**: **PostgreSQL**.
    *   *Why*:
        *   **Persistence**: Data isn't lost if the server restarts.
        *   **Concurrency**: Multiple users can read/write analysis without race conditions.
        *   **Querying**: Filtering "Bullish" stocks becomes a fast SQL query instead of Python loop.
    *   *Schema*: We need to map `nifty50_unified_master.xlsx` columns to a `stocks` table.

### **Asynchronous Task Queue**
*   **Current**: Synchronous processing (Browser hangs while "Run Analysis" happens).
*   **Production Requirement**: **Celery + Redis**.
    *   *Why*: fetching data from Yahoo and querying OpenAI takes time.
    *   *Flow*: User clicks "Run" -> Server accepts request immediately -> Celery Worker processes in background -> Frontend polls for status.

## 2. Infrastructure Dependencies

### **Web Server (Reverse Proxy)**
*   **Tool**: **Nginx**.
*   **Purpose**:
    *   Handles SSL/HTTPS (Security).
    *   Serves static files (JS/CSS) efficiently.
    *   Load balances requests to Gunicorn workers.

### **Caching Layer**
*   **Tool**: **Redis**.
*   **Purpose**:
    *   Cache Yahoo Finance API responses (don't re-fetch data for the same stock every minute).
    *   Broker for Celery task queue.

## 3. Deployment & DevOps

### **Containerization**
*   **Tool**: **Docker & Docker Compose**.
*   **Purpose**: Packages the App, Gunicorn, Postgres, and Redis into portable containers. Ensures "It works on my machine" equals "It works on production".

### **Configuration Management**
*   **Tool**: **.env file (python-dotenv)**.
*   **Requirement**: Move all secrets (OpenAI API Keys, DB Passwords) out of code and into environment variables.

## 4. Summary of New Dependencies

| Component | Dev Tool (Current) | Prod Tool (Required) |
| :--- | :--- | :--- |
| **Web Server** | `app.run()` | Gunicorn + Nginx |
| **Database** | variables / Excel | PostgreSQL |
| **Task Queue** | None (Sync) | Celery + Redis |
| **Caching** | None | Redis |
| **Process Manager**| Terminal | Systemd / Docker |
| **Monitoring** | Print statements | Sentry / Prometheus |

## 5. Immediate Next Steps (Plan)

1.  **Dockerize**: Create a `Dockerfile` for the application.
2.  **Add Gunicorn**: Add `gunicorn` to `requirements.txt` and create a `wsgi.py` entry point.
3.  **Persist Data**: (Optional Phase 1) Switch to **SQLite** (file-based DB) as a stepping stone to Postgres, to avoid setting up a full database server immediately but gaining persistence.
