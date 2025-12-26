import React from 'react';
import { Typography } from '../ui/Typography';
import { Badge } from '../ui/Badge';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    label: string;
    value: string;
    trend?: number;
    trendLabel?: string;
    chart?: React.ReactNode;
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    label,
    value,
    trend,
    trendLabel,
    chart,
    className = '',
}) => {
    const isPositive = trend && trend >= 0;

    return (
        <div className={`bg-white rounded-2xl p-5 shadow-sm border border-neutral-100 ${className}`}>
            <div className="flex items-start justify-between mb-2">
                <Typography variant="caption" className="font-medium text-neutral-400 uppercase tracking-wider">
                    {label}
                </Typography>
                {trend !== undefined && (
                    <Badge variant={isPositive ? 'success' : 'danger'}>
                        {isPositive ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                        {Math.abs(trend)}%
                    </Badge>
                )}
            </div>

            <div className="flex items-end justify-between gap-4">
                <div>
                    <Typography variant="h3" className="font-bold tabular-nums">
                        {value}
                    </Typography>
                    {trendLabel && (
                        <Typography variant="caption" className="mt-1 block">
                            {trendLabel}
                        </Typography>
                    )}
                </div>

                {chart && <div className="h-10 w-20">{chart}</div>}
            </div>
        </div>
    );
};
