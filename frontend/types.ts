export interface Stock {
  "Stock Name": string;
  "NSE Code": string;
  "Industry Name"?: string;
  sector_name?: string;
  "Current Price"?: number;
  "Day change %"?: number;
  News_Sentiment?: string;
  Tech_Trend?: string;
  "Trendlyne Momentum Score"?: number;
  "ROE Annual %"?: number;
  "PE TTM Price to Earnings"?: number;
  News_Headlines?: string; // JSON string

  // Performance
  "Month Change %"?: number;
  "Qtr Change %"?: number;
  "1Yr change %"?: number;
  "3Yr price change %"?: number;
  "Relative returns vs Nifty50 week%"?: number;
  "Relative returns vs Sector month%"?: number;

  // Range
  "Day High"?: number;
  "Day Low"?: number;
  "1Yr High"?: number;
  "1Yr Low"?: number;
  "5Yr High"?: number;
  "5Yr Low"?: number;

  // Technicals
  "Day RSI"?: number;
  "Day MACD"?: number;
  "Day MACD Signal Line"?: number;
  "Day MFI"?: number;
  Tech_MFI?: number;
  "Day ADX"?: number;
  "Day ATR"?: number;
  "Beta 1Year"?: number;
  "Beta 1Month"?: number;
  "Day ROC21"?: number;
  "Day ROC125"?: number;

  // MAs
  "Day SMA5"?: number;
  "Day SMA30"?: number;
  "Day SMA50"?: number;
  "Day SMA100"?: number;
  "Day SMA200"?: number;
  "Day EMA12"?: number;
  "Day EMA20"?: number;
  "Day EMA50"?: number;
  "Day EMA100"?: number;

  // Levels
  "Standard Pivot point"?: number;
  "Standard support S1"?: number;
  "Standard support S2"?: number;
  "Standard support S3"?: number;
  "Standard resistance R1"?: number;
  "Standard resistance R2"?: number;
  "Standard resistance R3"?: number;

  // Fundamentals
  "Sector PE TTM"?: number;
  "Industry PE TTM"?: number;
  "PE 3Yr Average"?: number;
  "PEG TTM PE to Growth"?: number;
  "Price to Book Value Adjusted"?: number;
  "Piotroski Score"?: number;
  "Sector Return on Equity ROE"?: number;
  "RoA Annual %"?: number;
  "Operating Profit Margin Qtr %"?: number;
  "Dividend Yield Annual %"?: number;
  "Revenue Growth Annual YoY %"?: number;
  "Net Profit Annual YoY Growth %"?: number;
  "EPS TTM Growth %"?: number;
  "Sector Revenue Growth Annual YoY %"?: number;

  // Financials
  "Operating Revenue Annual"?: number;
  "Net Profit Annual"?: number;
  "Operating Profit Annual"?: number;
  "Basic EPS TTM"?: number;
  "Cash from Operating Activity Annual"?: number;
  "Cash from Investing Activity Annual"?: number;
  "Cash from Financing Annual Activity"?: number;
  "Net Cash Flow Annual"?: number;

  // Holdings
  "Promoter holding latest %"?: number;
  "Promoter holding change QoQ %"?: number;
  "Promoter holding change 4Qtr %"?: number;
  "Promoter holding change 8Qtr %"?: number;

  "FII holding current Qtr %"?: number;
  "FII holding change QoQ %"?: number;
  "FII holding change 4Qtr %"?: number;
  "FII holding change 8Qtr %"?: number;

  "MF holding current Qtr %"?: number;
  "MF holding change 1Month %"?: number;
  "MF holding change 3Month%"?: number;
  "MF holding change QoQ %"?: number;
  "MF holding change 4Qtr %"?: number;
  "MF holding change 8Qtr %"?: number;

  "Institutional holding current Qtr %"?: number;
  "Institutional holding change QoQ %"?: number;
  "Institutional holding change 4Qtr %"?: number;
  "Institutional holding change 8Qtr %"?: number;

  "VWAP Day"?: number;

  // New Fields from UI
  "Market Capitalization"?: number;
  "Trendlyne Durability Score"?: number;
  "Trendlyne Valuation Score"?: number;
  "Forecaster Estimates 12Mth Upside %"?: number;
  "Forecaster Estimates Target Price"?: number;
  "Forecaster Estimates Reco"?: string;
  "Forecaster Estimates 1Y forward Dividend Yield %"?: number;
  "Forecaster Estimates No of bullish Estimates"?: number;
  "Forecaster Estimates No of bearish Estimates"?: number;
  YF_TotalDebt?: number;
  YF_StockholdersEquity?: number;
  "Operating Revenue Qtr"?: number;
  "Operating Revenue TTM"?: number;
  "Net Profit Qtr"?: number;
  "Net profit TTM"?: number;
  "Revenue QoQ Growth %"?: number;
  "Revenue Growth Qtr YoY %"?: number;
  "Net Profit QoQ Growth %"?: number;
  "Net Profit Qtr Growth YoY %"?: number;
  Tech_RSI?: number;
  Tech_RSI_State?: string;
  Tech_MACD?: number;
  Tech_MACD_Signal?: string;
  Tech_Vol_Signal?: string;

  // Data Quality Metrics (from Multi-Source Service)
  "Data Quality Score"?: number;
  "Data Sources"?: string;
  "Last Updated"?: string;
}

export interface FundamentalRecord {
  headers: string;
  [key: string]: string | number;
}

export interface FundamentalData {
  balance_sheet: FundamentalRecord[];
  profit_loss: FundamentalRecord[];
  cash_flow: FundamentalRecord[];
  ratios: FundamentalRecord[];
}
