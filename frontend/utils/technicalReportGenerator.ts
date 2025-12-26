import { Stock } from '../types';

export const generateTechnicalAnalysis = (stock: Stock): string => {
    let report = `## Technical Analysis Deep Dive\n\n---\n\n`;

    // 1. Trend Analysis
    const trend = stock.Tech_Trend || "Unknown";
    report += `### 1. Trend Analysis\n`;
    report += `* **Current Trend**: **${trend}**\n`;
    if (trend.includes('Bullish')) {
        report += `* The stock is showing **positive momentum**, trading above key moving averages.\n`;
    } else if (trend.includes('Bearish')) {
        report += `* The stock is in a **downtrend**, trading below key moving averages.\n`;
    }
    report += `\n---\n\n`;

    // 2. Momentum (RSI)
    const rsi = stock.Tech_RSI;
    const rsiState = stock.Tech_RSI_State;

    if (rsi !== undefined) {
        report += `### 2. Momentum (RSI)\n`;
        // RSI Value
        report += `* **RSI (14)**: **${rsi.toFixed(2)}**\n`;

        // Interpretation
        if (rsi > 70) {
            report += `* 🔴 **Overbought**: The stock may be **overextended** and due for a correction or consolidation.\n`;
        } else if (rsi < 30) {
            report += `* 🟢 **Oversold**: The stock may be **undervalued** and due for a bounce.\n`;
        } else if (rsi > 60) {
            report += `* **Strong Momentum**: Bulls are in control.\n`;
        } else if (rsi < 40) {
            report += `* **Weak Momentum**: Bears are dominating.\n`;
        } else {
            report += `* **Neutral**: Market is indecisive.\n`;
        }
        report += `\n---\n\n`;
    }

    // 3. MACD
    const macd = stock.Tech_MACD;
    const macdSignal = stock.Tech_MACD_Signal;

    if (macd !== undefined) {
        report += `### 3. MACD (Trend Strength)\n`;
        report += `* **MACD Value**: **${macd.toFixed(2)}**\n`;
        if (macdSignal) {
            report += `* **Signal**: **${macdSignal}**\n`;
            if (macdSignal === 'Bullish') {
                report += `* 🟢 **Bullish Crossover**: MACD line is above the Signal line, suggesting upward momentum.\n`;
            } else {
                report += `* 🔴 **Bearish Crossover**: MACD line is below the Signal line, suggesting downward momentum.\n`;
            }
        }
        report += `\n---\n\n`;
    }

    // 4. MFI
    const mfi = stock.Tech_MFI;
    if (mfi !== undefined) {
        report += `### 4. Money Flow Index (MFI)\n`;
        report += `* **MFI (14)**: **${mfi.toFixed(2)}**\n`;
        if (mfi > 80) report += `* **High Buying Pressure**: Warning of potential top.\n`;
        else if (mfi < 20) report += `* **High Selling Pressure**: Warning of potential bottom.\n`;
        else report += `* Balanced money flow.\n`;
        report += `\n---\n\n`;
    }

    // 5. Volume
    const volSignal = stock.Tech_Vol_Signal;
    if (volSignal && volSignal !== 'Normal') {
        report += `### 5. Volume Analysis\n`;
        report += `* **Volume State**: **${volSignal}**\n`;
        if (volSignal === 'High') report += `* 🔥 **High Volume**: Indicates strong conviction in the current move.\n`;
        else if (volSignal === 'Low') report += `* ❄️ **Low Volume**: Suggests lack of participation or consolidation.\n`;
        report += `\n---\n\n`;
    }

    // Synthesis / Conclusion
    report += `### Summary Verdict\n`;
    let score = 0;
    if (trend.includes('Bullish')) score++; else score--;
    if (rsi && rsi > 40 && rsi < 70) score++;
    if (macdSignal === 'Bullish') score++; else score--;

    report += `> **Technical Outlook**: `;
    if (score >= 2) report += `🟢 **Positive**\n`;
    else if (score <= -2) report += `🔴 **Negative**\n`;
    else report += `🟡 **Mixed / Neutral**\n`;

    report += `\n*The above analysis is generated based on standard technical indicators and should not be taken as financial advice.*\n`;

    return report;
}
