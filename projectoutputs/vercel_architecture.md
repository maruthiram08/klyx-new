# Vercel-Compatible Production Stack

Vercel is a "Serverless" platform. It works differently than a traditional Virtual Machine (VM).
*   **Incompatible**: Gunicorn, Nginx, Docker (direct), Persistent Local Files, Long-running Background Processes (Celery).
*   **Compatible**: Serverless Functions, Managed Databases, Object Storage, Cron Jobs.

Here is the **Serverless / Vercel-Native** alternative to the previous list.

## 1. Core Component Swaps

| Component | Traditional (VM/Docker) | **Vercel (Serverless)** |
| :--- | :--- | :--- |
| **Web Server** | Gunicorn + Nginx | **Vercel Python Runtime** (Automatic) |
| **Database** | Local PostgreSQL | **Vercel Postgres** (managed by Neon) or **Supabase** |
| **File Storage** | Local Disk (Uploads folder) | **Vercel Blob** or **AWS S3** (Object Storage) |
| **State** | Global Variables (`allData`) | **Redis** (Upstash) or **Postgres** |
| **Long Tasks** | Celery Worker | **Vercel Cron** (Scheduled) or **GitHub Actions** |

---

## 2. Detailed Technical Requirements

### **A. Database: Vercel Postgres**
*   **Status**: Required.
*   **Why**: Vercel functions "freeze" and "restart" constantly. Your `allData` global variable will be wiped every time no one uses the app for 15 minutes.
*   **Action**: We must rewrite the app to read/write from a SQL database instead of the `allData` list.

### **B. File Storage: Vercel Blob**
*   **Status**: Required.
*   **Why**: You cannot save the Excel file to a local `uploads/` folder on Vercel. It is read-only or ephemeral (deleted after execution).
*   **Action**: Update the upload endpoint to pipe files directly to Vercel Blob storage.

### **C. The "Analysis" Problem (Timeouts)**
*   **Limitation**: Vercel functions time out after **10 seconds** (Hobby) or **60 seconds** (Pro).
*   **The Issue**: Your generic analysis loops through 50 stocks. This takes >60 seconds. It *will fail* on Vercel.
*   **The Solution**:
    1.  **Option 1 (Recommended): GitHub Actions**
        *   Move the heavy "Weekend Analysis" script to a GitHub Action that runs automatically every Friday night.
        *   It fetches data, runs AI, and saves results to the **PostgreSQL** DB.
        *   The Vercel App becomes just a "Viewer" for the DB (ultra-fast).
    2.  **Option 2: Asynchronous Queues (QStash)**
        *   Complex. Triggers a separate function for *each* stock so they run in parallel within the time limit.

## 3. The "Interactive Web App" Flow

To maintain the "Web App" feel (User Uploads -> Clicks Run -> Sees Results) without hitting timeouts:

### **Architecture: Event-Driven Async Compute**

1.  **UI (Vercel)**:
    *   User uploads Excel file.
    *   App saves file to **Vercel Blob** (fast).
    *   App inserts a record into database: `job_id: 123, status: "PENDING"`.
2.  **Trigger (Vercel)**:
    *   App calls **GitHub Actions API** (`POST /dispatches`) to trigger the "Analysis Worker".
    *   *Alternative*: Use **QStash** to trigger a background function.
3.  **Worker (GitHub Action / Background Job)**:
    *   Wakes up immediately.
    *   Downloads Excel from Blob.
    *   Runs the heavy AI/Math analysis (takes 5 mins).
    *   Updates Database: `job_id: 123, status: "COMPLETED"`.
4.  **UI (Vercel)**:
    *   Frontend polls `/api/status` every 5 seconds.
    *   When status becomes "COMPLETED", it fetches data from **Vercel Postgres** and displays the dashboard.

**Result**: To the user, it feels like a standard loading screen. Behind the scenes, we are bypassing serverless limits.

## 4. Implementation Plan (Vercel Path)

1.  **Database**: Set up **Vercel Postgres**.
2.  **Storage**: Set up **Vercel Blob** for uploads.
3.  **Compute**: Create a `worker.py` script and a `.github/workflows/analysis.yml` to run it on demand.
4.  **Backend**: Update Flask to use `psycopg2` (Postgres) instead of global variables.
5.  **Deploy**: Push to Vercel (configure `vercel.json`).

## 4. Dependencies List (`requirements.txt`)

```text
Flask==3.0.0
psycopg2-binary==2.9.9    # For Postgres connection
python-dotenv==1.0.0      # Env vars
pandas==2.1.1             # Data manipulation
openpyxl==3.1.2           # Excel reading
yfinance==0.2.31          # Market data
requests==2.31.0          # API calls
```

## Recommendation

**Go with Vercel + Vercel Postgres + GitHub Actions.**
*   **Vercel**: Hosts the UI (Flask).
*   **Postgres**: Stores the data safely.
*   **GitHub Actions**: Runs the heavy "Weekend Analysis" Python script for free, with no timeout issues (you get 6 hours).

This is the most strictly "Serverless" and cost-effective approach.
