# Weekend Analysis Tool

A comprehensive stock analysis and portfolio management tool designed for the Indian market (NSE).

## Features

- **Portfolio Analysis**: Track and analyze your stock portfolio with real-time data.
- **Stock Screener**: Filter stocks based on custom criteria or preset strategies (e.g., "Golden Crossover", "Oversold RSI").
- **Debt Optimizer**: Analyze and optimize debt reduction strategies.
- **Data Verification**: Built-in tools ensuring symbol validity and data consistency.
- **Market Data**: Fetches data from multiple sources including NSEPython, yfinance, and localized datasets.

## Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Lucide Icons
- **State Management**: React Hooks

### Backend
- **Framework**: Flask (Python)
- **Database**: SQLite
- **Key Libraries**: pandas, numpy, nsepython, yfinance, APScheduler

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+

### Installation

1. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python app.py
   ```

## Production Deployment

### Build
To create a production build of the frontend:
```bash
cd frontend
npm run build
```

## Project Structure
- `/frontend`: Next.js application
- `/backend`: Flask API and services
- `/assets`: Static assets
