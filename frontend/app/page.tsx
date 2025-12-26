"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Container } from "../components/ui/Container";
import { Typography } from "../components/ui/Typography";
import {
  ArrowRight,
  BarChart3,
  TrendingUp,
  Filter,
  Calculator,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="pt-24 pb-20 overflow-hidden">
        <Container>
          <div className="max-w-5xl mx-auto text-center relative z-10">
            {/* Logo */}
            <div className="mb-12 flex justify-center">
              <Image
                src="/logo1.png"
                alt="Klyx"
                width={200}
                height={60}
                className="h-20 w-auto"
                priority
              />
            </div>

            <Typography
              variant="h1"
              className="text-5xl md:text-7xl font-bold tracking-tight mb-6 leading-tight"
            >
              Smart Financial Tools <br />
              <span className="text-neutral-400">for Smarter Decisions</span>
            </Typography>

            <Typography
              variant="body"
              className="text-xl text-neutral-600 max-w-3xl mx-auto mb-12 leading-relaxed"
            >
              Professional-grade portfolio analysis, stock screening, and debt
              optimization. Everything you need to take control of your
              financial future.
            </Typography>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/login"
                className="px-8 py-4 bg-black text-white rounded-full font-semibold text-base hover:bg-neutral-800 transition-all hover:scale-105 shadow-xl shadow-black/10 flex items-center gap-2"
              >
                Get Started <ArrowRight size={20} />
              </Link>
              <Link
                href="#features"
                className="px-8 py-4 bg-neutral-100 text-neutral-700 rounded-full font-semibold text-base hover:bg-neutral-200 transition-all"
              >
                Explore Features
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-neutral-50">
        <Container>
          <div className="mb-16 text-center">
            <Typography
              variant="h2"
              className="text-4xl md:text-5xl font-bold mb-4"
            >
              All-in-One Financial Platform
            </Typography>
            <Typography
              variant="body"
              className="text-lg text-neutral-600 max-w-2xl mx-auto"
            >
              Powerful tools designed to help you analyze, optimize, and grow
              your wealth
            </Typography>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Portfolio Analysis */}
            <Link
              href="/portfolio"
              className="group bg-white rounded-3xl p-10 border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BarChart3 size={28} className="text-emerald-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold mb-3">
                Portfolio Analysis
              </Typography>
              <p className="text-neutral-600 leading-relaxed">
                Upload your portfolio and get deep insights into health,
                valuation, and performance. See quality scores and fundamentals
                for every holding.
              </p>
            </Link>

            {/* Stock Screener */}
            <Link
              href="/screener"
              className="group bg-white rounded-3xl p-10 border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#ccf32f] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Filter size={28} className="text-black" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold mb-3">
                Stock Screener
              </Typography>
              <p className="text-neutral-600 leading-relaxed">
                Find your next investment using professional presets like Value,
                Growth, and Momentum. Filter 2000+ NSE/BSE stocks instantly.
              </p>
            </Link>

            {/* Explore Stocks */}
            <Link
              href="/stocks"
              className="group bg-white rounded-3xl p-10 border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <TrendingUp size={28} className="text-blue-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold mb-3">
                Explore Stocks
              </Typography>
              <p className="text-neutral-600 leading-relaxed">
                Browse the complete database of NSE/BSE stocks with real-time
                prices, quality scores, and detailed fundamentals.
              </p>
            </Link>

            {/* Debt Optimizer */}
            <Link
              href="/debt-optimizer"
              className="group bg-white rounded-3xl p-10 border border-neutral-200 hover:border-neutral-300 hover:shadow-xl transition-all"
            >
              <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Calculator size={28} className="text-purple-600" />
              </div>
              <Typography variant="h3" className="text-2xl font-bold mb-3">
                Debt Optimizer
              </Typography>
              <p className="text-neutral-600 leading-relaxed">
                Create a strategic plan to pay off debts faster. Compare
                Snowball, Avalanche, and Ski methods with detailed payment
                schedules.
              </p>
            </Link>
          </div>
        </Container>
      </section>

      {/* Footer */}
      <footer className="bg-black text-white py-20">
        <Container>
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div>
              <div className="mb-6">
                <Image
                  src="/logo1.png"
                  alt="Klyx"
                  width={140}
                  height={46}
                  className="h-10 w-auto brightness-0 invert"
                />
              </div>
              <p className="text-neutral-500 max-w-xs">
                Smart financial tools making professional-grade analysis
                accessible to everyone.
              </p>
            </div>
            <div className="flex gap-12 text-sm text-neutral-400">
              <div className="flex flex-col gap-4">
                <span className="text-white font-bold mb-2">Platform</span>
                <Link
                  href="/portfolio"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Portfolio
                </Link>
                <Link
                  href="/screener"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Screener
                </Link>
                <Link
                  href="/stocks"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Stocks
                </Link>
                <Link
                  href="/debt-optimizer"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Debt Optimizer
                </Link>
              </div>
              <div className="flex flex-col gap-4">
                <span className="text-white font-bold mb-2">Resources</span>
                <Link
                  href="/dashboard"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Dashboard
                </Link>
                <a
                  href="#features"
                  className="hover:text-[#ccf32f] transition-colors"
                >
                  Features
                </a>
                <a href="#" className="hover:text-[#ccf32f] transition-colors">
                  Support
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-20 pt-8 text-center text-neutral-500 text-sm">
            © 2025 Klyx. All rights reserved.
          </div>
        </Container>
      </footer>
    </div>
  );
}
