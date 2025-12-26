import React from 'react';
import { Stock } from '../types';
import StockCard from './StockCard';
import { Container } from './ui/Container';
import { Typography } from './ui/Typography';

interface DashboardGridProps {
    stocks: Stock[];
    onStockClick: (stock: Stock) => void;
    isLoading: boolean;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ stocks, onStockClick, isLoading }) => {
    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#ccf32f] border-t-black rounded-full animate-spin shadow-lg"></div>
                    <Typography variant="body" className="text-neutral-400 font-medium animate-pulse">
                        Initializing System...
                    </Typography>
                </div>
            </div>
        );
    }

    if (stocks.length === 0) {
        return (
            <div className="flex h-screen flex-col items-center justify-center text-slate-400 bg-[#F8FAFB]">
                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 text-3xl shadow-sm border border-neutral-100"></div>
                <Typography variant="h3" className="font-bold text-neutral-600 mb-2">No Market Data</Typography>
                <Typography variant="body" className="text-sm">Upload your Excel analysis to begin.</Typography>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFB] py-4">
            <Container>
                {/* Optional Header for the Grid */}
                <div className="mb-6">
                    <Typography variant="h2" className="mb-2">Portfolio Overview</Typography>
                    <Typography variant="body" className="text-neutral-500">
                        Real-time tracking of your portfolio candidates.
                    </Typography>
                </div>

                {/* Smart Masonry Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-32">
                    {stocks.map((stock, index) => (
                        <div key={`${stock['NSE Code']}_${index}`} className="h-full">
                            <StockCard stock={stock} onClick={onStockClick} />
                        </div>
                    ))}
                </div>
            </Container>
        </div>
    );
};

export default DashboardGrid;
