import React from 'react';
import StockDetails from '../../../components/StockDetails';
import { Typography } from '../../../components/ui/Typography';
import { Stock, FundamentalData } from '../../../types';

// Force dynamic rendering since we fetch fresh data
export const dynamic = 'force-dynamic';

async function getStockData(code: string) {
    const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:5001/api';

    try {
        const [stockRes, fundRes] = await Promise.all([
            fetch(`${API_BASE}/stock/${code}`, { next: { revalidate: 60 } }),
            fetch(`${API_BASE}/stock/${code}/fundamentals?type=standalone`, { next: { revalidate: 300 } }) // Cache fundamentals longer
        ]);

        if (!stockRes.ok) throw new Error('Failed to fetch stock');

        const stockJson = await stockRes.json();
        const fundJson = await fundRes.json();

        return {
            stock: stockJson.status === 'success' ? stockJson.data : null,
            fundamentals: fundJson.status === 'success' ? fundJson.data : null,
            error: null
        };
    } catch (err) {
        console.error("Server Fetch Error:", err);
        return { stock: null, fundamentals: null, error: 'Failed to load stock data' };
    }
}

export default async function StockDetailsPage({ params }: { params: { code: string } }) {
    const { code } = params;

    // Server-side Fetch
    const { stock, fundamentals, error } = await getStockData(code);

    if (error || !stock) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
                <div className="text-center">
                    <Typography variant="h3" className="mb-2">Stock Not Found</Typography>
                    <p className="text-neutral-500 mb-4">{error || "Could not find stock data."}</p>
                    {/* Since this is server component, we can use simple anchor tag or client component for back button if needed */}
                    <a
                        href="/stocks"
                        className="px-6 py-2 bg-black text-white rounded-full hover:shadow-lg transition-all inline-block"
                    >
                        Go Back
                    </a>
                </div>
            </div>
        );
    }

    return (
        <StockDetails
            stock={stock}
            initialFundamentals={fundamentals}
        />
    );
}
