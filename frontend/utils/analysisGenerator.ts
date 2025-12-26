import { Stock, FundamentalData, FundamentalRecord } from '../types';

interface AnalysisSection {
    title: string;
    content: string[];
    type?: 'normal' | 'highlight' | 'warning';
}

export const generateStockAnalysis = (stock: Stock, fundamentals?: FundamentalData | null): AnalysisSection[] => {
    const sections: AnalysisSection[] = [];

    // safe number parsing
    const safeNum = (val: number | string | undefined | null) => Number(val) || 0;
    const formatCurrency = (val: number) => val.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

    const price = safeNum(stock['Current Price']);
    const roe = safeNum(stock['ROE Annual %']);
    const pe = safeNum(stock['PE TTM Price to Earnings']);
    const sectorPe = safeNum(stock['Sector PE TTM']);
    const marketCap = safeNum(stock['Market Capitalization']);
    const durability = safeNum(stock['Trendlyne Durability Score']);

    // 1. HEADLINE
    let headline = "";
    if (durability > 70 && roe > 20) {
        headline = `${stock['Stock Name']}: A High-Quality Compounder Firing on All Cylinders`;
    } else if (pe < 15 && roe > 15) {
        headline = `${stock['Stock Name']}: The Undervalued Gem Hidden in Plain Sight`;
    } else if (safeNum(stock['1Yr change %']) > 50) {
        headline = `${stock['Stock Name']}: Riding the Momentum Wave - How Long Can It Last?`;
    } else {
        headline = `${stock['Stock Name']}: Navigating Through Volatility and Market Headwinds`;
    }

    sections.push({
        title: headline,
        content: [
            `**${stock['NSE Code']}** (${stock['Stock Name']}) is currently trading at **${formatCurrency(price)}**. This analysis dives deep into the company's fundamentals, technical posture, and long-term viability.`
        ],
        type: 'highlight'
    });

    // 2. EXECUTIVE SUMMARY
    const summaryPoints = [];
    if (roe > 15) summaryPoints.push(`Strong efficiency with an ROE of **${roe.toFixed(1)}%**, indicating superior capital allocation.`);
    if (pe < sectorPe) summaryPoints.push(`Trading at a discount (**${pe.toFixed(1)}x P/E**) relative to its sector average of ${sectorPe.toFixed(1)}x.`);
    else summaryPoints.push(`Trading at a premium (**${pe.toFixed(1)}x P/E**) compared to the sector (${sectorPe.toFixed(1)}x), suggesting high market expectations.`);

    if (durability > 60) summaryPoints.push(`With a Durability Score of **${durability}**, the company demonstrates robust financial health.`);

    sections.push({
        title: "Executive Summary",
        content: summaryPoints
    });

    // 3. FINANCIAL PERFORMANCE
    const profitGrowth = safeNum(stock['Net Profit Qtr Growth YoY %']);
    const salesGrowth = safeNum(stock['Revenue Growth Qtr YoY %']);

    let fundamentalsNarrative = "";
    if (fundamentals && fundamentals.balance_sheet && fundamentals.balance_sheet.length > 0) {
        // MoneyControl usually puts latest year columns first or last? 
        // Based on API response: "Mar 2025" is a key in the object. row['Mar 2025']
        // Let's iterate years to find the max year.
        try {
            const row0 = fundamentals.balance_sheet[0];
            const years = Object.keys(row0).filter(k => k !== 'headers' && (k.includes('Mar') || k.includes('Dec') || k.includes('Sep') || k.includes('Jun')));
            years.sort(); // Sorts lexically, e.g. "Mar 2021", "Mar 2022". 
            const latestYear = years[years.length - 1]; // "Mar 2025" (estimates) or "Mar 2024"

            const findRow = (headerPart: string) => fundamentals.balance_sheet.find((r: FundamentalRecord) => r.headers.includes(headerPart));

            const reservesRow = findRow('Reserves');
            const reserves = reservesRow ? safeNum(reservesRow[latestYear]) : 0;

            if (reserves > 0) {
                fundamentalsNarrative = ` The company holds a robust reserve position of **₹${reserves.toLocaleString()} Cr** (as of ${latestYear}), providing a cushion for future expansion or economic downturns.`;
            }
        } catch (e) {
            console.log("Error parsing fundamentals for analysis", e);
        }
    }

    const financialNarrative = `
        The company reported a Quarter-on-Quarter revenue growth of **${salesGrowth.toFixed(1)}%**, reflecting ${salesGrowth > 10 ? 'strong demand dynamics' : 'consolidated market presence'}. 
        Net Profit growth stood at **${profitGrowth.toFixed(1)}%**.
        ${profitGrowth > salesGrowth ? 'Significantly, profit growth outpaced revenue growth, indicating improving operating margins and operational leverage.' : ''}
        ${fundamentalsNarrative}
    `;
    sections.push({
        title: "Financial Performance & Segment Dynamics",
        content: [financialNarrative.trim()]
    });

    // 4. VALUATION CONTEXT
    const peg = safeNum(stock['PEG TTM PE to Growth']);
    let valNarrative = "";
    if (peg > 0 && peg < 1) valNarrative = "The stock appears undervalued based on its PEG ratio (under 1.0), suggesting that the market may be underappreciating its growth trajectory.";
    else if (peg > 2) valNarrative = "Valuation appears stretched with a high PEG ratio, implying that significant future growth is already priced in.";
    else valNarrative = "The company strikes a balance between growth and valuation, trading near fair value estimates relative to its earnings growth.";

    // Add Debt context if available
    let debtNarrative = "";
    if (fundamentals && fundamentals.balance_sheet) {
        try {
            // Re-finding latest year logic or simplify
            const row0 = fundamentals.balance_sheet[0];
            const years = Object.keys(row0).filter(k => k !== 'headers' && k.length > 4);
            years.sort();
            const latestYear = years[years.length - 1];

            const liabilitiesRow = fundamentals.balance_sheet.find((r: FundamentalRecord) => r.headers.includes('Total Liabilities') || r.headers.includes('Total Debt'));
            const assetsRow = fundamentals.balance_sheet.find((r: FundamentalRecord) => r.headers.includes('Total Assets'));

            if (liabilitiesRow && assetsRow) {
                const liabilities = safeNum(liabilitiesRow[latestYear]);
                const assets = safeNum(assetsRow[latestYear]);
                const ratio = assets > 0 ? (liabilities / assets) : 0;
                if (ratio > 0.6) {
                    debtNarrative = ` However, investors should monitor the liabilities-to-assets ratio of **${ratio.toFixed(2)}**, which indicates a leveraged capital structure.`;
                } else {
                    debtNarrative = ` The balance sheet remains healthy with a comfortable liabilities-to-assets ratio of **${ratio.toFixed(2)}**.`;
                }
            }
        } catch (e) { }
    }

    sections.push({
        title: "Valuation Context",
        content: [
            `With a P/E of **${pe.toFixed(1)}x** and a Market Cap of ₹${(marketCap / 10000000).toFixed(0)} Cr, ${valNarrative}${debtNarrative}`
        ]
    });

    // 5. CONCLUSION
    const upside = safeNum(stock['Forecaster Estimates 12Mth Upside %']);
    sections.push({
        title: "Conclusion: The Final Verdict",
        content: [
            `Given the ${upside > 0 ? 'potential upside' : 'current valuation risks'}, ${stock['Stock Name']} presents a ${upside > 15 ? 'compelling opportunity' : 'cautious hold'} for investors.`,
            `Analyst consensus suggests a **${upside > 0 ? '+' : ''}${upside.toFixed(1)}%** upside over the next 12 months.`
        ],
        type: upside > 0 ? 'highlight' : 'warning'
    });

    return sections;
};
