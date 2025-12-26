'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '../../../api';
import { Stock } from '../../../types';
import StockDetails from '../../../components/StockDetails';
import { Typography } from '../../../components/ui/Typography';

export default function StockDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const code = params.code as string;

    const [stock, setStock] = useState<Stock | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchStock = async () => {
            setLoading(true);
            try {
                const res = await api.getStockDetails(code);
                if (res.status === 'success') {
                    setStock(res.data);
                } else {
                    setError(res.message || 'Stock not found');
                }
            } catch (err) {
                console.error(err);
                setError('Failed to load stock details');
            } finally {
                setLoading(false);
            }
        };

        if (code) {
            fetchStock();
        }
    }, [code]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#ccf32f] border-t-black rounded-full animate-spin shadow-lg"></div>
                    <Typography variant="body" className="text-neutral-400 font-medium animate-pulse">
                        Loading Analysis...
                    </Typography>
                </div>
            </div>
        );
    }

    if (error || !stock) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
                <div className="text-center">
                    <Typography variant="h3" className="mb-2">Stock Not Found</Typography>
                    <p className="text-neutral-500 mb-4">{error || "Could not find stock data."}</p>
                    <button
                        onClick={() => router.back()}
                        className="px-6 py-2 bg-black text-white rounded-full hover:shadow-lg transition-all"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <StockDetails
            stock={stock}
            onBack={() => router.push('/stocks')}
        />
    );
}
