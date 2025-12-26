"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import Header from "../../components/Header";
import { Container } from "../../components/ui/Container";
import { Typography } from "../../components/ui/Typography";
import {
    TrendingUp,
    Filter,
    BarChart2,
    ArrowRight,
    Calculator,
} from "lucide-react";

export default function DashboardHub() {
    const cards = [
        {
            title: "Portfolio Analysis",
            description:
                "Upload your portfolio data and get deep insights into health, valuation, and performance.",
            icon: <BarChart2 size={32} className="text-black" />,
            href: "/portfolio",
            color: "bg-emerald-100",
        },
        {
            title: "Explore Stocks",
            description:
                "Browse the complete database of NSE/BSE stocks with real-time prices and quality scores.",
            icon: <TrendingUp size={32} className="text-black" />,
            href: "/stocks",
            color: "bg-blue-100",
        },
        {
            title: "Stock Screener",
            description:
                "Find your next investment using professional presets like Value, Growth, and Momentum.",
            icon: <Filter size={32} className="text-black" />,
            href: "/screener",
            color: "bg-[#ccf32f]", // Neon green
        },
        {
            title: "Debt Optimizer",
            description:
                "Create a strategic plan to pay off debts faster using proven methods like Snowball, Avalanche, and Ski.",
            icon: <Calculator size={32} className="text-black" />,
            href: "/debt-optimizer",
            color: "bg-purple-100",
        },
    ];

    return (
        <div className="flex flex-col bg-[#F8FAFB] min-h-screen">
            <Header />
            <div className="flex-1 py-16">
                <Container>
                    <div className="mb-12 text-center">
                        {/* Logo */}
                        <div className="mb-8 flex justify-center">
                            <Image
                                src="/logo1.png"
                                alt="Klyx"
                                width={160}
                                height={53}
                                className="h-14 w-auto"
                            />
                        </div>

                        <Typography variant="h1" className="text-4xl font-bold mb-4">
                            All-in-One Financial Platform
                        </Typography>
                        <Typography
                            variant="body"
                            className="text-neutral-500 max-w-2xl mx-auto"
                        >
                            Powerful tools designed to help you analyze, optimize, and grow
                            your wealth
                        </Typography>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {cards.map((card, idx) => (
                            <Link
                                key={idx}
                                href={card.href}
                                className="group bg-white rounded-[2rem] p-8 border border-neutral-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-start"
                            >
                                <div
                                    className={`w-16 h-16 rounded-2xl ${card.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}
                                >
                                    {card.icon}
                                </div>
                                <Typography
                                    variant="h3"
                                    className="text-2xl font-bold mb-3 group-hover:text-black"
                                >
                                    {card.title}
                                </Typography>
                                <Typography
                                    variant="body"
                                    className="text-neutral-500 mb-8 flex-grow leading-relaxed"
                                >
                                    {card.description}
                                </Typography>

                                <div className="flex items-center gap-2 font-bold text-sm uppercase tracking-wider group-hover:gap-3 transition-all">
                                    Open Tool <ArrowRight size={16} />
                                </div>
                            </Link>
                        ))}
                    </div>
                </Container>
            </div>
        </div>
    );
}
