import { FundamentalRecord } from '../types';

interface AnalysisContext {
    data: FundamentalRecord[];
    latestYear: string;
    prevYear: string;
    years: string[]; // Sorted oldest to latest
}

// Helper: robust number parsing
const safeNum = (val: any) => {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    return Number(String(val).replace(/,/g, '')) || 0;
};

// Helper: Get row by fuzzy name match
const getRow = (data: FundamentalRecord[], queries: string[]) => {
    return data.find(row => {
        const h = String(row.headers || row.Annual || row['Unnamed: 0'] || row.Attributes || row.ratios || row.Ratio || '');
        return queries.some(q => h.toLowerCase().includes(q.toLowerCase()));
    });
};

const formatCr = (val: number) => `₹${val.toLocaleString()} Cr`;

// --- P&L ANALYSIS ---
export const generatePLAnalysis = (data: FundamentalRecord[]): string => {
    if (!data || data.length < 2) return "Insufficient data for deep analysis.";

    const keys = Object.keys(data[0]);
    const years = keys.filter(k => k.match(/(Mar|Dec|Sep|Jun) \d{4}/)).sort((a, b) => {
        const yearA = parseInt(a.split(' ')[1]);
        const yearB = parseInt(b.split(' ')[1]);
        return yearA - yearB;
    });

    if (years.length < 3) return "Need at least 3 years of data for trend analysis.";

    const latest = years[years.length - 1];
    const prev = years[years.length - 2];
    const oldest = years[0];

    const salesRow = getRow(data, ['Sales', 'Revenue', 'Income from Operations']);
    const otherIncomeRow = getRow(data, ['Other Income']);
    const totalExpRow = getRow(data, ['Total Expenditure', 'Total Expenses']);
    const ebitRow = getRow(data, ['Operating Profit', 'EBIT', 'PBIT']);
    const interestRow = getRow(data, ['Interest', 'Finance Cost']);
    const taxRow = getRow(data, ['Tax']);
    const netProfitRow = getRow(data, ['Net Profit', 'Profit After Tax']);

    let report = `Here's a **clear, investor-style analysis** of the financials (₹ Cr, ${oldest}–${latest}).\n\n---\n\n`;
    let seq = 1;

    // --- 1. Revenue & Growth ---
    if (salesRow) {
        const salesLatest = safeNum(salesRow[latest]);
        const salesOldest = safeNum(salesRow[oldest]);
        const salesPrev = safeNum(salesRow[prev]);
        const cagr = ((Math.pow(salesLatest / salesOldest, 1 / (years.length - 1)) - 1) * 100).toFixed(1);
        const yoy = ((salesLatest - salesPrev) / salesPrev * 100).toFixed(1);

        report += `## ${seq++}. Revenue & Growth\n\n`;
        report += `**Sales trend**\n\n`;
        report += `* ${oldest} → ${latest}: **${salesOldest.toLocaleString()} → ${salesLatest.toLocaleString()}**\n`;
        report += `* **~${cagr}% growth over ${years.length - 1} years** (${Number(yoy) > Number(cagr) ? 'Accelerating' : 'Steady'}).\n\n`;

        report += `**Key takeaway**\n\n`;
        report += `* Core business revenue is **${Number(cagr) > 10 ? 'growing strongly' : Number(cagr) > 0 ? 'growing steadily' : 'stagnating'}**.\n`;

        if (otherIncomeRow) {
            const oiLatest = safeNum(otherIncomeRow[latest]);
            const oiOldest = safeNum(otherIncomeRow[oldest]);
            report += `\n**Other income**\n\n`;
            report += `* ${oiLatest < oiOldest ? 'Declining' : 'Increasing'}: **${oiOldest} → ${oiLatest}**\n`;
            if ((oiLatest / salesLatest) < 0.05) {
                report += `* Indicates **less reliance on non-core income** (good quality improvement).\n`;
                report += `\n✅ **Revenue quality is improving**.\n`;
            } else {
                report += `* ⚠️ High other income component (${((oiLatest / salesLatest) * 100).toFixed(1)}% of Sales).\n`;
            }
        }
        report += `\n---\n\n`;
    }

    // --- 2. Cost Structure ---
    if (totalExpRow && salesRow) {
        const expLatest = safeNum(totalExpRow[latest]);
        const expPrev = safeNum(totalExpRow[prev]);
        const salesLatest = safeNum(salesRow[latest]);
        const salesPrev = safeNum(salesRow[prev]);
        const expChange = (expLatest - expPrev) / expPrev;
        const salesChange = (salesLatest - salesPrev) / salesPrev;

        report += `## ${seq++}. Cost Structure & Operating Leverage\n\n`;
        report += `**Total Expenditure**\n\n`;
        report += `* ${prev} → ${latest}: **${expPrev.toLocaleString()} → ${expLatest.toLocaleString()}** (**${(expChange * 100).toFixed(1)}% YoY**)\n\n`;

        report += `**Implication**\n\n`;
        if (expChange < 0 && salesChange > 0) {
            report += `* This is the **single most important inflection point**.\n`;
            report += `* Sales grew while costs collapsed. This creates massive **operating leverage**.\n`;
            report += `* ⚠️ Needs verification: Is this sustainable or one-off?\n`;
        } else if (expChange > salesChange) {
            report += `* ⚠️ Costs are growing faster than sales. Margins under pressure.\n`;
        } else {
            report += `* Costs moving in line with revenue scale.\n`;
        }
        report += `\n---\n\n`;
    }

    // --- 3. EBIT / Margins ---
    if (ebitRow || (salesRow && totalExpRow)) {
        const getEbit = (y: string) => ebitRow ? safeNum(ebitRow[y]) : (safeNum(salesRow![y]) - safeNum(totalExpRow![y]));

        const ebitLatest = getEbit(latest);
        const salesLatest = safeNum(salesRow![latest]);
        const margin = (ebitLatest / salesLatest * 100).toFixed(1);

        report += `## ${seq++}. Operating Profit (EBIT)\n\n`;
        report += `| Year | EBIT |\n|---|---|\n`;
        years.slice(-5).forEach(y => {
            report += `| ${y.split(' ')[1]} | ${getEbit(y).toLocaleString()} |\n`;
        });

        report += `\n**EBIT margin ${latest}**\n\n`;
        report += `* ${ebitLatest.toLocaleString()} / ${salesLatest.toLocaleString()} ≈ **${margin}%** 🔥\n\n`;

        if (Number(margin) > 30) {
            report += `This is **exceptional**. Usually indicates a moat or a temporary cyclical peak.\n`;
        } else if (Number(margin) < 5) {
            report += `⚠️ Razor thin margins. No room for error.\n`;
        }
        report += `\n---\n\n`;
    }

    // --- 4. Interest ---
    if (interestRow) {
        const intLatest = safeNum(interestRow[latest]);
        const intOldest = safeNum(interestRow[oldest]);

        report += `## ${seq++}. Interest & Leverage\n\n`;
        report += `**Interest expense**\n\n`;
        report += `* ${oldest}: ${intOldest}\n`;
        report += `* ${latest}: **${intLatest}** (${intLatest < intOldest ? 'Down' : 'Up'} ${Math.abs((intLatest - intOldest) / intOldest * 100).toFixed(0)}%)\n\n`;

        if (intLatest < intOldest * 0.8) {
            report += `**Implications**\n\n`;
            report += `* Significant **deleveraging**.\n`;
            report += `✅ Balance sheet strength improving.\n`;
        }
        report += `\n---\n\n`;
    }

    // --- 5. Tax ---
    if (taxRow) {
        const tax = safeNum(taxRow[latest]);
        const pbt = (netProfitRow && taxRow) ? safeNum(netProfitRow[latest]) + tax : 0;

        if (pbt > 0 && (tax / pbt) < 0.15) {
            report += `## ${seq++}. Tax Anomaly (Important)\n\n`;
            report += `**Tax line**\n\n`;
            report += `* Tax paid is only **${(tax / pbt * 100).toFixed(1)}%** of profits.\n`;
            report += `This suggests accumulated losses or tax credits.\n`;
            report += `⚠️ **Future profits may decrease** when full tax rate kicks in.\n`;
            report += `\n---\n\n`;
        }
    }

    // --- 6. Net Profit ---
    if (netProfitRow && salesRow) {
        const patLatest = safeNum(netProfitRow[latest]);
        const patPrev = safeNum(netProfitRow[prev]);
        const salesLatest = safeNum(salesRow[latest]);

        report += `## ${seq++}. Net Profit Analysis\n\n`;
        report += `| Year | Net Profit |\n|---|---|\n`;
        years.slice(-5).forEach(y => {
            report += `| ${y.split(' ')[1]} | **${safeNum(netProfitRow[y]).toLocaleString()}** |\n`;
        });

        report += `\n`;

        if (patPrev < 0 && patLatest > 0) {
            report += `**This is a classic turnaround year.**\n\n`;
        }

        const netMargin = (patLatest / salesLatest * 100).toFixed(1);
        report += `Net margin ${latest}: **${netMargin}%**\n`;
        if (Number(netMargin) > 20) report += `🟢 Very strong profitability.\n`;

        report += `\n---\n\n`;
    }

    // --- 7. Synthesis ---
    report += `## 7. What’s REALLY happening (Synthesis)\n\n`;
    report += `### Positives\n`;
    if (salesRow && safeNum(salesRow[latest]) > safeNum(salesRow[prev])) report += `✔ Strong revenue growth\n`;
    if (totalExpRow && safeNum(totalExpRow[latest]) < safeNum(totalExpRow[prev])) report += `✔ Massive operating leverage (Costs down)\n`;
    if (interestRow && safeNum(interestRow[latest]) < safeNum(interestRow[prev])) report += `✔ Sharp interest reduction\n`;
    if (netProfitRow && safeNum(netProfitRow[latest]) > 0) report += `✔ Profitable Operations\n`;

    report += `\n### Red Flags / Checks Needed\n`;
    if (taxRow) {
        const tax = safeNum(taxRow[latest]);
        const pbt = (netProfitRow) ? safeNum(netProfitRow[latest]) + tax : 0;
        if (pbt > 0 && tax / pbt < 0.15) report += `⚠ Tax normalization impact (Tax too low)\n`;
    }
    report += `⚠ Sustainability of margins\n`;

    report += `\n---\n\n`;

    // --- Bottom Line ---
    report += `## Bottom Line\n\n`;
    if (netProfitRow && safeNum(netProfitRow[latest]) > 0 && safeNum(netProfitRow[prev]) < 0) {
        report += `> **${latest} looks phenomenal as a turnaround, but must be treated as a “prove-it” year.**\n`;
    } else {
        report += `> **Solid performance, but ensure growth is priced reasonably.**\n`;
    }

    return report;
};

// --- BALANCE SHEET ANALYSIS ---
export const generateBSAnalysis = (data: FundamentalRecord[]): string => {
    if (!data || data.length < 2) return "Insufficient data.";
    const keys = Object.keys(data[0]);
    const years = keys.filter(k => k.match(/(Mar|Dec|Sep|Jun) \d{4}/)).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
    if (years.length === 0) return "No dated columns found.";

    const latest = years[years.length - 1];
    const prev = years[years.length - 2] || years[0];
    const oldest = years[0];

    const reservesRow = getRow(data, ['Reserves', 'Other Equity']);
    const borrowingsRow = getRow(data, ['Borrowings', 'Total Debt', 'Loan Funds']);
    const shareCapitalRow = getRow(data, ['Share Capital', 'Equity Capital']);
    const totalLiabilitiesRow = getRow(data, ['Total Liabilities']);
    const assetsRow = getRow(data, ['Total Assets']);

    let report = `## Balance Sheet Deep Dive (₹ Cr)\n\n---\n\n`;
    let seq = 1;

    // 1. Reserves
    if (reservesRow) {
        const curr = safeNum(reservesRow[latest]);
        const old = safeNum(reservesRow[oldest]);
        report += `## ${seq++}. Internal Accruals (Reserves)\n\n`;
        report += `* **Growth**: ${old.toLocaleString()} → **${curr.toLocaleString()}**\n`;
        report += `* Consistent accumulation of profits indicates **financial stability**.\n\n---\n\n`;
    }

    // 2. Debt / Liabilities
    let debtVal = 0;
    let debtName = "Total Debt";
    let isEstimated = false;

    if (borrowingsRow) {
        debtVal = safeNum(borrowingsRow[latest]);
        debtName = borrowingsRow.headers || "Total Debt";
    } else if (totalLiabilitiesRow && reservesRow && shareCapitalRow) {
        // Fallback: Total Liabilities - Equity = Outside Liabilities
        const totalLiab = safeNum(totalLiabilitiesRow[latest]);
        const equity = safeNum(reservesRow[latest]) + safeNum(shareCapitalRow[latest]);
        debtVal = totalLiab - equity;
        debtName = "Total Outside Liabilities";
        isEstimated = true;
    }

    if (debtVal > 0 && reservesRow) {
        const reserves = safeNum(reservesRow[latest]);
        const debtEquity = reserves > 0 ? (debtVal / reserves).toFixed(2) : 'N/A';

        report += `## ${seq++}. ${isEstimated ? 'Liability Profile' : 'Debt Profile'}\n\n`;
        report += `* ${debtName}: **₹${debtVal.toLocaleString()} Cr** ${isEstimated ? '(Debt + Payables)' : ''}\n`;
        report += `* ${isEstimated ? 'Ext. Liab.' : 'Debt'}-to-Equity: **${debtEquity}**\n`;

        if (Number(debtEquity) < 0.5) report += `✅ **Conservative leverage**. Very safe.\n`;
        else if (Number(debtEquity) > 2) report += `⚠️ **High leverage**. Risks are elevated.\n`;

        report += `\n---\n\n`;
    }

    // 3. Asset Size
    if (assetsRow) {
        const curr = safeNum(assetsRow[latest]);
        const prevVal = safeNum(assetsRow[prev]);
        report += `## ${seq++}. Asset Base Growth\n\n`;
        report += `* Assets grew by **${((curr - prevVal) / prevVal * 100).toFixed(1)}%** this year.\n`;
        if (curr > prevVal) report += `* Indicates capacity expansion or working capital increase.\n`;
        report += `\n---\n\n`;
    }

    return report;
};

// --- CASH FLOW ANALYSIS ---
export const generateCFAnalysis = (data: FundamentalRecord[]): string => {
    if (!data || data.length < 2) return "Insufficient data.";
    const keys = Object.keys(data[0]);
    const years = keys.filter(k => k.match(/(Mar|Dec|Sep|Jun) \d{4}/)).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
    if (years.length === 0) return "No dated columns found.";

    const latest = years[years.length - 1];

    const cfoRow = getRow(data, ['Operating Activities', 'Cash from Operations']);
    const cfiRow = getRow(data, ['Investing Activities']);

    let report = `## Cash Flow Deep Dive (₹ Cr)\n\n---\n\n`;
    let seq = 1;

    // 1. CFO
    if (cfoRow) {
        let totalCfo = 0;
        years.forEach(y => totalCfo += safeNum(cfoRow[y]));
        const avgCfo = totalCfo / years.length;
        const currCfo = safeNum(cfoRow[latest]);

        report += `## ${seq++}. Cash from Operations (CFO)\n\n`;
        report += `* ${latest}: **${currCfo.toLocaleString()}**\n`;
        report += `* 5-Year Average: **${avgCfo.toFixed(0)}**\n\n`;

        if (currCfo > 0) report += `✅ Company is **generating cash** from core business.\n`;
        else report += `⚠️ **Cash Burn**. Operations are draining cash.\n`;

        report += `\n---\n\n`;
    }

    // 2. Capex (Approx via Investing)
    if (cfiRow) {
        const cfi = safeNum(cfiRow[latest]);
        report += `## ${seq++}. Reinvestment (Investing Activity)\n\n`;
        report += `* Net Investing Cash Flow: **${cfi.toLocaleString()}**\n`;
        if (cfi < 0) report += `* Negative figure usually indicates **Capex** (investing in future growth).\n`;
        else report += `* Positive figure implies **Asset Sales** (divestment).\n`;
        report += `\n---\n\n`;
    }

    return report;
};

// --- RATIOS ANALYSIS ---
export const generateRatiosAnalysis = (data: FundamentalRecord[]): string => {
    if (!data || data.length < 2) return "Insufficient data.";
    const keys = Object.keys(data[0]);
    const years = keys.filter(k => k.match(/(Mar|Dec|Sep|Jun) \d{4}/)).sort((a, b) => parseInt(a.split(' ')[1]) - parseInt(b.split(' ')[1]));
    if (years.length === 0) return "No dated columns found.";

    const latest = years[years.length - 1];

    const roeRow = getRow(data, ['ROE', 'Return on Net Worth']);
    const roceRow = getRow(data, ['ROCE', 'Capital Employed']);
    const marginRow = getRow(data, ['Net Profit Margin']);

    let report = `## Key Ratios Deep Dive\n\n---\n\n`;
    let seq = 1;

    if (roeRow) {
        const curr = safeNum(roeRow[latest]);
        report += `## ${seq++}. Return Ratios\n\n`;
        report += `* **ROE**: **${curr}%**\n`;
        if (curr > 15) report += `🔥 **Excellent Wealth Creator** (>15%)\n`;
        else if (curr < 10) report += `⚠️ **Subpar Returns** (<10%)\n`;
    }

    if (roceRow) {
        const curr = safeNum(roceRow[latest]);
        // If ROCE is shown alongside ROE, it might not need a new number header or should, handled below?
        // Let's keep it clean: if both exist, maybe combine? But separated for now is fine.
        if (!roeRow) report += `## ${seq++}. Return Ratios\n\n`;
        report += `* **ROCE**: **${curr}%**\n\n`;
        if (curr > 20) report += `✅ Efficient capital deployment.\n`;
    }
    report += `\n---\n\n`;

    if (marginRow) {
        const curr = safeNum(marginRow[latest]);
        report += `## ${seq++}. Profitability\n\n`;
        report += `* **Net Margin**: **${curr}%**\n`;
        report += `Higher margins indicate pricing power or cost efficiency.\n`;
        report += `\n---\n\n`;
    }

    report += `## Bottom Line\n\n`;
    if (roeRow && safeNum(roeRow[latest]) > 15) {
        report += `> **High-quality business metrics. Investable grade.**\n`;
    } else {
        report += `> **Metrics are average. Needs growth kicker to verify.**\n`;
    }

    return report;
};
