import React from 'react';
import { Typography } from './Typography';
import { Badge } from './Badge';
import { Activity, CheckCircle, AlertTriangle } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';
import { Insight } from '../../utils/financialInsights';

interface FinancialTableProps {
    title: string;
    data: any[];
    analysis?: {
        insights: Insight[];
        commentary: string;
        deepDive?: string;
    };
}

export const FinancialTable: React.FC<FinancialTableProps> = ({ title, data, analysis = { insights: [], commentary: '' } }) => {
    if (!data || data.length === 0) return null;

    // Extract years/columns dynamically
    const keys = Object.keys(data[0]);

    // Identify the column that contains the metric name
    // Added 'ratios', 'Ratio' to coverage list based on debugging
    const headerKey = keys.find(k => ['headers', 'Annual', 'Unnamed: 0', 'Attributes', 'ratios', 'Ratio'].includes(k)) || 'headers';

    // Filter out the identifier column to get only value columns (Years/Quarters)
    const yearKeys = keys.filter(k => k !== headerKey).sort().reverse();

    return (
        <div className="bg-white rounded-[2rem] border border-neutral-100 p-8 shadow-sm overflow-hidden scroll-mt-24" id={title.replace(/\s+/g, '-').toLowerCase()}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex items-center gap-3">
                    <Typography variant="h3" className="text-xl font-bold">{title}</Typography>
                    <Badge variant="success">Live Data</Badge>
                </div>
            </div>

            {/* Deep Dive Analysis Report (Investor Style) */}
            {analysis.deepDive ? (
                <div className="mb-10 bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
                    <div className="bg-neutral-50 px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Activity className="w-5 h-5 text-purple-600" />
                            <span className="font-bold text-neutral-800 uppercase tracking-wider text-sm">Deep Dive Analysis</span>
                        </div>
                        <Badge variant="neutral">AI Generated</Badge>
                    </div>
                    <div className="p-8">
                        <MarkdownRenderer content={analysis.deepDive} />
                    </div>
                </div>
            ) : analysis.commentary ? (
                // Fallback to simple commentary if no deep dive avail
                <div className="mb-6 bg-blue-50/50 p-5 rounded-xl border border-blue-100/50">
                    <Typography variant="body" className="text-neutral-700 text-sm leading-relaxed">{analysis.commentary}</Typography>
                </div>
            ) : null}

            {/* Individual Flags/Insights Section */}
            {analysis.insights && analysis.insights.length > 0 && (
                <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {analysis.insights.map((insight, idx) => (
                        <div key={idx} className={`p-4 rounded-xl border flex items-start gap-3 ${insight.type === 'positive' ? 'bg-emerald-50 border-emerald-100' :
                            insight.type === 'negative' ? 'bg-rose-50 border-rose-100' :
                                'bg-neutral-50 border-neutral-100'
                            }`}>
                            <div className={`mt-0.5 ${insight.type === 'positive' ? 'text-emerald-600' :
                                insight.type === 'negative' ? 'text-rose-500' :
                                    'text-neutral-500'
                                }`}>
                                {insight.type === 'positive' ? <CheckCircle className="w-5 h-5" /> :
                                    insight.type === 'negative' ? <AlertTriangle className="w-5 h-5" /> :
                                        <Activity className="w-5 h-5" />}
                            </div>
                            <div>
                                <Typography variant="caption" className={`font-bold block mb-0.5 ${insight.type === 'positive' ? 'text-emerald-800' :
                                    insight.type === 'negative' ? 'text-rose-800' :
                                        'text-neutral-800'
                                    }`}>
                                    {insight.type === 'positive' ? 'Strength' : insight.type === 'negative' ? 'Caution' : 'Observation'}
                                </Typography>
                                <Typography variant="body" className={`text-sm ${insight.type === 'positive' ? 'text-emerald-900' :
                                    insight.type === 'negative' ? 'text-rose-900' :
                                        'text-neutral-700'
                                    }`}>
                                    {insight.text}
                                </Typography>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-neutral-100">
                            <th className="text-left py-4 px-4 font-bold text-neutral-400 uppercase tracking-wider text-xs sticky left-0 bg-white z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                                Metric
                            </th>
                            {yearKeys.map(key => (
                                <th key={key} className="text-right py-4 px-4 font-bold text-neutral-600 uppercase tracking-wider text-xs min-w-[100px]">
                                    {key}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-50/50">
                        {data.map((row, i) => {
                            const label = row[headerKey] as string;
                            if (!label) return null;
                            const isHeading = label.toUpperCase() === label || ['Total', 'Profit', 'Net'].some(k => label.includes(k) && !label.includes('%'));

                            return (
                                <tr key={i} className={`group transition-colors hover:bg-neutral-50/50 ${isHeading ? 'bg-neutral-50/30' : ''}`}>
                                    <td className={`py-4 px-4 sticky left-0 z-10 w-64 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)] group-hover:bg-neutral-50 transition-colors ${isHeading ? 'font-bold text-neutral-900 bg-neutral-50/30' : 'text-neutral-600 bg-white'}`}>
                                        {label}
                                    </td>
                                    {yearKeys.map((key, j) => {
                                        const val = row[key];
                                        const numVal = Number(val);
                                        const isNegative = !isNaN(numVal) && numVal < 0;

                                        return (
                                            <td key={j} className={`text-right py-4 px-4 font-mono font-medium ${isNegative ? 'text-rose-500' : 'text-neutral-800'} ${isHeading ? 'font-bold' : ''}`}>
                                                {!isNaN(numVal) && val !== null && val !== "" ? numVal.toLocaleString('en-IN') : (val || '-')}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
