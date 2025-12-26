"use client";

// How It Works Infographic Component - Creative Design with Collapse
// Location: frontend/components/debt-optimizer/HowItWorksInfographic.tsx

import React, { useState } from "react";
import { ArrowRight, Zap, ChevronDown, ChevronUp } from "lucide-react";

export function HowItWorksInfographic() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="relative mb-8 overflow-hidden">
      {/* Collapsed State - Summary Bar */}
      {!isExpanded && (
        <div className="bg-gradient-to-r from-neutral-900 to-neutral-800 rounded-2xl p-6 border border-neutral-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 bg-[#ccf32f]/10 border border-[#ccf32f]/20 rounded-full px-3 py-1.5">
                <Zap size={12} className="text-[#ccf32f]" />
                <span className="text-xs font-semibold text-[#ccf32f] uppercase tracking-wider">
                  How It Works
                </span>
              </div>
              <p className="text-sm text-neutral-400">
                Smart debt optimization in 3 simple steps
              </p>
            </div>

            <button
              onClick={() => setIsExpanded(true)}
              className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg transition-all text-sm font-medium border border-neutral-600"
            >
              <span>Learn More</span>
              <ChevronDown size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Expanded State - Full Infographic */}
      {isExpanded && (
        <div className="relative bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-900 rounded-3xl p-12">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
              }}
            ></div>
          </div>

          {/* Glowing accent lines */}
          <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-[#ccf32f]/20 to-transparent"></div>
          <div className="absolute top-0 right-1/3 w-px h-full bg-gradient-to-b from-transparent via-[#ccf32f]/10 to-transparent"></div>

          {/* Collapse Button - Top Right */}
          <button
            onClick={() => setIsExpanded(false)}
            className="absolute top-6 right-6 z-10 p-2 bg-neutral-800/80 hover:bg-neutral-700 text-neutral-400 hover:text-white rounded-lg transition-all border border-neutral-700"
            title="Collapse"
          >
            <ChevronUp size={18} />
          </button>

          {/* Header with badge */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-[#ccf32f]/10 border border-[#ccf32f]/20 rounded-full px-4 py-1.5 mb-4">
              <Zap size={14} className="text-[#ccf32f]" />
              <span className="text-xs font-semibold text-[#ccf32f] uppercase tracking-wider">
                Simple & Powerful
              </span>
            </div>
            <h2 className="text-4xl font-bold text-white mb-3">
              Your Path to Financial Freedom
            </h2>
            <p className="text-neutral-400 text-base max-w-2xl mx-auto">
              Smart debt optimization in three simple steps. No signup required,
              completely private.
            </p>
          </div>

          {/* Steps - Horizontal Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto mb-12">
            {/* Step 1 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-8 border border-neutral-700 hover:border-[#ccf32f]/30 transition-all duration-300 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ccf32f] rounded-xl flex items-center justify-center shadow-lg shadow-[#ccf32f]/20">
                    <span className="text-2xl font-bold text-black">1</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Add Your Debts
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      List all credit cards and loans. We'll handle the rest.
                    </p>
                  </div>
                </div>

                {/* Visual element */}
                <div className="mt-6 flex gap-2">
                  <div className="h-2 flex-1 bg-rose-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-3/4 bg-rose-500 rounded-full"></div>
                  </div>
                  <div className="h-2 flex-1 bg-blue-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-1/2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="h-2 flex-1 bg-purple-500/20 rounded-full overflow-hidden">
                    <div className="h-full w-2/3 bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                <ArrowRight size={24} className="text-[#ccf32f]/40" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-8 border border-neutral-700 hover:border-[#ccf32f]/30 transition-all duration-300 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ccf32f] rounded-xl flex items-center justify-center shadow-lg shadow-[#ccf32f]/20">
                    <span className="text-2xl font-bold text-black">2</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Set Budget
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      How much can you pay monthly after essentials?
                    </p>
                  </div>
                </div>

                {/* Visual element */}
                <div className="mt-6">
                  <div className="flex items-end gap-1.5 h-16">
                    {[40, 60, 45, 75, 55, 90, 65, 80].map((height, i) => (
                      <div
                        key={i}
                        className="flex-1 bg-gradient-to-t from-[#ccf32f] to-[#ccf32f]/60 rounded-t"
                        style={{ height: `${height}%` }}
                      ></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Arrow connector */}
              <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 z-10">
                <ArrowRight size={24} className="text-[#ccf32f]/40" />
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-2xl p-8 border border-neutral-700 hover:border-[#ccf32f]/30 transition-all duration-300 h-full">
                <div className="flex items-start gap-4 mb-4">
                  <div className="flex-shrink-0 w-12 h-12 bg-[#ccf32f] rounded-xl flex items-center justify-center shadow-lg shadow-[#ccf32f]/20">
                    <span className="text-2xl font-bold text-black">3</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Get Your Plan
                    </h3>
                    <p className="text-sm text-neutral-400 leading-relaxed">
                      Compare strategies and save thousands in interest.
                    </p>
                  </div>
                </div>

                {/* Visual element */}
                <div className="mt-6 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <div className="h-1.5 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
                      <div className="h-full w-full bg-emerald-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-emerald-400 font-mono">
                      Best
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <div className="h-1.5 flex-1 bg-blue-500/20 rounded-full overflow-hidden">
                      <div className="h-full w-[95%] bg-blue-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono">
                      -5%
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                    <div className="h-1.5 flex-1 bg-purple-500/20 rounded-full overflow-hidden">
                      <div className="h-full w-[90%] bg-purple-500 rounded-full"></div>
                    </div>
                    <span className="text-xs text-neutral-500 font-mono">
                      -10%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Stats */}
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-8 border-t border-neutral-700/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">3</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">
                Strategies
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Snowball • Avalanche • Ski
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">100%</div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">
                Private
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                Calculations run locally
              </div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white mb-1">
                <span className="text-[#ccf32f]">₹</span>000s
              </div>
              <div className="text-xs text-neutral-400 uppercase tracking-wider">
                Saved
              </div>
              <div className="text-xs text-neutral-500 mt-0.5">
                In interest payments
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
