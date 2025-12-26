"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, BarChart2, Filter, PieChart, TrendingUp, ShieldCheck } from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import Header from "@/components/Header";

export default function Home() {
    return (
        <div className="min-h-screen bg-white flex flex-col">
            <Header />

            {/* Hero Section */}
            <section className="relative pt-20 pb-32 overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lime-100/40 via-transparent to-transparent opacity-70"></div>

                <Container className="relative z-10">
                    <div className="max-w-4xl mx-auto text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 text-neutral-600 text-sm font-medium mb-8">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </span>
                            Weekend Analysis Tool v2.0
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-neutral-900 mb-8 leading-[1.1]">
                            Master Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-500 to-emerald-600">Portfolio</span> with Data-Driven Insights.
                        </h1>

                        <p className="text-xl text-neutral-600 mb-12 max-w-2xl mx-auto leading-relaxed">
                            Professional-grade stock analysis, debt optimization, and portfolio screening tools designed for the modern Indian investor.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                            <Link href="/portfolio">
                                <Button size="lg" className="rounded-full px-8 text-lg h-14 bg-black hover:bg-neutral-800 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
                                    Go to Portfolio <ArrowRight className="ml-2 w-5 h-5" />
                                </Button>
                            </Link>
                            <Link href="/stocks">
                                <Button variant="outline" size="lg" className="rounded-full px-8 text-lg h-14 border-neutral-200 hover:bg-neutral-50 hover:border-neutral-300 text-neutral-700">
                                    Explore Stocks
                                </Button>
                            </Link>
                        </div>
                    </div>
                </Container>
            </section>

            {/* Features Grid */}
            <section className="py-24 bg-[#F8FAFB]">
                <Container>
                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Feature 1 */}
                        <Link href="/screener" className="group">
                            <div className="bg-white rounded-3xl p-8 h-full border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-lime-200 relative overflow-hidden">
                                <div className="w-14 h-14 bg-lime-50 rounded-2xl flex items-center justify-center mb-6 text-lime-600 group-hover:scale-110 transition-transform duration-300">
                                    <Filter size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-neutral-900">Stock Screener</h3>
                                <p className="text-neutral-500 leading-relaxed">
                                    Filter thousands of stocks using advanced technical strategies like Golden Crossover and RSI Overbought.
                                </p>
                            </div>
                        </Link>

                        {/* Feature 2 */}
                        <Link href="/portfolio" className="group">
                            <div className="bg-white rounded-3xl p-8 h-full border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-blue-200 relative overflow-hidden">
                                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform duration-300">
                                    <PieChart size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-neutral-900">Portfolio Health</h3>
                                <p className="text-neutral-500 leading-relaxed">
                                    Visualize your allocation, check data quality scores, and verify your holdings against NSE records.
                                </p>
                            </div>
                        </Link>

                        {/* Feature 3 */}
                        <Link href="/debt-optimizer" className="group">
                            <div className="bg-white rounded-3xl p-8 h-full border border-neutral-100 shadow-sm hover:shadow-md transition-all duration-300 hover:border-rose-200 relative overflow-hidden">
                                <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mb-6 text-rose-600 group-hover:scale-110 transition-transform duration-300">
                                    <ShieldCheck size={28} />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-neutral-900">Debt Optimizer</h3>
                                <p className="text-neutral-500 leading-relaxed">
                                    Strategic tools to help you manage and pay off liabilities efficiently, freeing up capital for investment.
                                </p>
                            </div>
                        </Link>
                    </div>
                </Container>
            </section>

        </div>
    );
}
