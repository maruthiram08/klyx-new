# Deployment Architecture Assessment

**Current Stack**: Python Flask (Monolithic), Local Filesystem Strategy, Heavy Compute (Pandas/Yfinance).

## Is it Vercel Ready?
**Short Answer**: **No.**

**Why?**
1.  **Ephemeral Filesystem**: Vercel Serverless functions can write to `/tmp` but data **does not persist** between requests. Your app relies on saving Excel files to `datasource/` and reading them back in subsequent API calls (`/api/process` -> `/api/results`). This flow will break on Vercel.
2.  **Timeouts**: Vercel has a strict execution limit (10s on specific plans, 60s max). Your "Enrichment" step for 50 stocks takes ~2-3 minutes. The request will time out before the process completes.
3.  **Compute Limits**: Running heavy `pandas` processing on 50 rows x 200 columns might be okay, but installing `pandas` + `yfinance` increases the serverless bundle size significantly.

## Recommended Platforms (PaaS)
For this specific "Weekend Analysis Tool" (which acts like a long-running data processor):

### 1. Render / Railway / Fly.io (Recommended)
These platforms serve **Dockerized Containers**.
- **Pros**: 
    - Full persistent filesystem (volumes) or simple in-memory retention for the session.
    - No strict timeouts (process can run for minutes).
    - Exact replica of your local environment.
- **Effort**: Low (Add a `Dockerfile`).

### 2. PythonAnywhere
- **Pros**: Native Python hosting. Great for Flask/Pandas apps.
- **Effort**: Low.

## Migration Path to Vercel (If required)
To make this run on Vercel, you would need to fundamentally re-architect:
1.  **Storage**: Move file saving to AWS S3 or Google Cloud Storage.
2.  **Async Processing**: Use a Queue (Redis/Celery) or Vercel Inngest to handle the long-running enrichment job in the background (cannot be synchronous HTTP).
3.  **Database**: Store results in Postgres/Supabase instead of Excel files.

## Next Steps
If you want to deploy **now**, I recommend adding a `PROCFILE` or `Dockerfile` for **Render** or **Railway**.
