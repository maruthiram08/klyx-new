import React from 'react';
import { Database, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { Badge } from './Badge';
import { Typography } from './Typography';

interface DataQualityBadgeProps {
    score?: number;
    sources?: string;
    lastUpdated?: string;
    variant?: 'compact' | 'detailed';
    className?: string;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({
    score,
    sources,
    lastUpdated,
    variant = 'compact',
    className = ''
}) => {
    // If no quality score, don't render anything
    if (score === undefined || score === null) {
        return null;
    }

    const getQualityConfig = (s: number) => {
        if (s >= 80) {
            return {
                variant: 'success' as const,
                icon: CheckCircle2,
                label: 'High Quality',
                color: 'text-emerald-600',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-200'
            };
        } else if (s >= 50) {
            return {
                variant: 'warning' as const,
                icon: AlertTriangle,
                label: 'Medium Quality',
                color: 'text-yellow-600',
                bgColor: 'bg-yellow-50',
                borderColor: 'border-yellow-200'
            };
        } else {
            return {
                variant: 'danger' as const,
                icon: XCircle,
                label: 'Low Quality',
                color: 'text-rose-600',
                bgColor: 'bg-rose-50',
                borderColor: 'border-rose-200'
            };
        }
    };

    const config = getQualityConfig(score);
    const Icon = config.icon;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-IN', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return '';
        }
    };

    if (variant === 'compact') {
        return (
            <div
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full ${config.bgColor} ${config.borderColor} border ${className}`}
                title={`Data Quality: ${score}%${sources ? ` | Sources: ${sources}` : ''}`}
            >
                <Database size={12} className={config.color} />
                <span className={`text-xs font-semibold ${config.color}`}>
                    {score}%
                </span>
            </div>
        );
    }

    // Detailed variant
    return (
        <div className={`${config.bgColor} ${config.borderColor} border rounded-xl p-4 ${className}`}>
            <div className="flex items-start gap-3">
                <Icon size={20} className={config.color} />
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                        <Typography variant="caption" className={`font-bold uppercase tracking-wider ${config.color}`}>
                            {config.label}
                        </Typography>
                        <span className={`text-sm font-bold ${config.color}`}>
                            {score}%
                        </span>
                    </div>

                    {sources && (
                        <Typography variant="caption" className="text-neutral-600 mb-1">
                            <span className="font-semibold">Sources:</span> {sources}
                        </Typography>
                    )}

                    {lastUpdated && (
                        <Typography variant="caption" className="text-neutral-500">
                            Updated: {formatDate(lastUpdated)}
                        </Typography>
                    )}
                </div>
            </div>
        </div>
    );
};
