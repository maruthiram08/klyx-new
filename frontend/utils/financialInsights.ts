import { FundamentalData, FundamentalRecord } from '../types';

export interface Insight {
    type: 'positive' | 'negative' | 'neutral';
    text: string;
}

export interface SectionAnalysis {
    insights: Insight[];
    commentary: string; // The consolidated paragraph
}

export interface FinancialAnalysis {
    profit_loss: SectionAnalysis;
    balance_sheet: SectionAnalysis;
    cash_flow: SectionAnalysis;
    ratios: SectionAnalysis;
}

const getMetricName = (row: any): string => {
    return String(row.headers || row.Annual || row['Unnamed: 0'] || row.Attributes || row.ratios || row.Ratio || '');
};

const safeNum = (val: string | number | undefined) => {
    if (!val) return 0;
    if (typeof val === 'number') return val;
    return Number(val.replace(/,/g, '')) || 0;
};

const getRecentYears = (row: FundamentalRecord) => {
    return Object.keys(row)
        .filter(k => k !== 'headers' && k !== 'Annual' && k !== 'Unnamed: 0')
        .sort()
        .reverse(); // ['Mar 2025', 'Mar 2024', ...]
};

const generateCommentary = (insights: Insight[], sectionName: string): string => {
    if (insights.length === 0) return `No specific ${sectionName.toLowerCase()} flags detected based on available data.`;

    const positives = insights.filter(i => i.type === 'positive');
    const negatives = insights.filter(i => i.type === 'negative');
    const neutrals = insights.filter(i => i.type === 'neutral');

    let parts = [];

    if (positives.length > 0) {
        const positiveText = positives.map(i => i.text.split(':')[1]?.trim() || i.text).join(' and ');
        parts.push(`The company demonstrates strength in ${sectionName.toLowerCase()}, highlighted by ${positiveText}.`);
    }

    if (negatives.length > 0) {
        const negativeText = negatives.map(i => i.text.split(':')[1]?.trim() || i.text).join(', while ');
        parts.push(`${positives.length > 0 ? 'However, ' : ''}concerns arise from ${negativeText}.`);
    }

    if (neutrals.length > 0) {
        parts.push(`Additionally, we observe ${neutrals.map(i => i.text.split(':')[1]?.trim() || i.text).join(', and ')}.`);
    }

    return parts.join(' ');
};

export const generateFinancialInsights = (fundamentals: FundamentalData | null): FinancialAnalysis => {
    // 1. Collect raw insights first (using Arrays as before)
    const raw: { [key in keyof FinancialAnalysis]: Insight[] } = {
        profit_loss: [],
        balance_sheet: [],
        cash_flow: [],
        ratios: []
    };

    if (!fundamentals) {
        return {
            profit_loss: { insights: [], commentary: '' },
            balance_sheet: { insights: [], commentary: '' },
            cash_flow: { insights: [], commentary: '' },
            ratios: { insights: [], commentary: '' }
        };
    }

    // --- Profit & Loss Analysis ---
    if (fundamentals.profit_loss && fundamentals.profit_loss.length > 0) {
        const salesRow = fundamentals.profit_loss.find(r => { const h = getMetricName(r); return h.includes('Sales') || h.includes('Revenue'); });
        const profitRow = fundamentals.profit_loss.find(r => { const h = getMetricName(r); return h.includes('Net Profit') || h.includes('Profit After Tax'); });

        if (salesRow) {
            const years = getRecentYears(salesRow);
            if (years.length >= 2) {
                const currentSales = safeNum(salesRow[years[0]]);
                const prevSales = safeNum(salesRow[years[1]]);

                if (currentSales > prevSales * 1.10) {
                    raw.profit_loss.push({ type: 'positive', text: `Consistent Revenue Growth: Sales increased by ${((currentSales - prevSales) / prevSales * 100).toFixed(1)}% year-over-year.` });
                } else if (currentSales < prevSales) {
                    raw.profit_loss.push({ type: 'negative', text: `Declining Revenue: Sales dropped compared to the previous year.` });
                }
            }
        }

        if (profitRow && salesRow) {
            const years = getRecentYears(profitRow);
            const latest = years[0];
            const profit = safeNum(profitRow[latest]);
            const sales = safeNum(salesRow[latest]);
            const margin = sales > 0 ? (profit / sales) * 100 : 0;

            if (margin > 15) {
                raw.profit_loss.push({ type: 'positive', text: `Healthy Margins: Net Profit Margin stands at a robust ${margin.toFixed(1)}%.` });
            } else if (margin < 5) {
                raw.profit_loss.push({ type: 'neutral', text: `Thin Margins: Net Profit Margin is currently low at ${margin.toFixed(1)}%.` });
            }
        }
    }

    // --- Cash Flow Analysis ---
    if (fundamentals.cash_flow && fundamentals.cash_flow.length > 0) {
        const ocfRow = fundamentals.cash_flow.find(r => getMetricName(r).includes('Operating Activities'));

        if (ocfRow) {
            const years = getRecentYears(ocfRow);
            const latest = years[0];
            const ocf = safeNum(ocfRow[latest]);

            if (ocf > 0) {
                raw.cash_flow.push({ type: 'positive', text: `Positive Cash Flow: The company is generating healthy cash from core operations (₹${ocf.toLocaleString()} Cr).` });
            } else {
                raw.cash_flow.push({ type: 'negative', text: `Cash Burn: Operations are consuming cash (₹${ocf.toLocaleString()} Cr), which needs monitoring.` });
            }
        }
    }

    // --- Ratios Analysis ---
    if (fundamentals.ratios && fundamentals.ratios.length > 0) {
        const roeRow = fundamentals.ratios.find(r => { const h = getMetricName(r); return h.includes('Return on Net Worth') || h.includes('ROE'); });
        if (roeRow) {
            const years = getRecentYears(roeRow);
            const roe = safeNum(roeRow[years[0]]);
            if (roe > 15) {
                raw.ratios.push({ type: 'positive', text: `Superior Returns: ROE of ${roe.toFixed(2)}% indicates excellent management efficiency.` });
            } else if (roe < 8) {
                raw.ratios.push({ type: 'negative', text: `Subpar Returns: ROE of ${roe.toFixed(2)}% is below the desired threshold of 15%.` });
            }
        }
    }

    // --- Balance Sheet Analysis ---
    if (fundamentals.balance_sheet && fundamentals.balance_sheet.length > 0) {
        const reservesRow = fundamentals.balance_sheet.find(r => getMetricName(r).includes('Reserves'));
        // const debtRow ... (unused currently)

        if (reservesRow) {
            const years = getRecentYears(reservesRow);
            const current = safeNum(reservesRow[years[0]]);
            const prev = safeNum(reservesRow[years[1]]);
            if (current > prev) {
                raw.balance_sheet.push({ type: 'positive', text: `Strengthening Balance Sheet: Reserves & Surplus increased to ₹${current.toLocaleString()} Cr.` });
            }
        }
    }

    // 2. Package into SectionAnalysis with Commentary
    return {
        profit_loss: { insights: raw.profit_loss, commentary: generateCommentary(raw.profit_loss, 'Profit & Loss') },
        balance_sheet: { insights: raw.balance_sheet, commentary: generateCommentary(raw.balance_sheet, 'Balance Sheet') },
        cash_flow: { insights: raw.cash_flow, commentary: generateCommentary(raw.cash_flow, 'Cash Flow') },
        ratios: { insights: raw.ratios, commentary: generateCommentary(raw.ratios, 'Key Ratios') }
    };
};
