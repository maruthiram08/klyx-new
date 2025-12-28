"use client";

import React from "react";
import { ScreenerResult } from "@/types/screener";
import { ArrowUpRight } from "lucide-react";

interface ResultsTableProps {
    data: ScreenerResult | null;
    isLoading: boolean;
}

export function ResultsTable({ data, isLoading }: ResultsTableProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-neutral-200 border-t-black rounded-full mx-auto mb-4"></div>
                <p className="text-neutral-500">Scanning market data...</p>
            </div>
        );
    }

    if (!data || data.results.length === 0) {
        return (
            <div className="bg-white rounded-xl border border-neutral-200 p-12 text-center">
                <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl">🔍</span>
                </div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-1">
                    No matches found
                </h3>
                <p className="text-neutral-500">
                    Try adjusting your filters to be less restrictive
                </p>
            </div>
        );
    }

    // Get dynamic headers from first result, excluding internal IDs if needed
    // We want specific order: Stock Name, NSE Code, Price, others...
    const firstRow = data.results[0];
    const priorityKeys = ["Stock Name", "NSE Code", "Current Price", "Sector"];
    const otherKeys = Object.keys(firstRow).filter(
        (k) => !priorityKeys.includes(k) && k !== "id" && k !== "user_id"
    );
    const headers = [...priorityKeys, ...otherKeys];

    return (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
            {/* Metadata Header */}
            <div className="bg-neutral-50 px-6 py-3 border-b border-neutral-200 flex items-center justify-between">
                <div className="text-sm font-medium text-neutral-600">
                    Found <span className="text-black font-bold">{data.metadata.total_matches}</span> matches
                    <span className="text-neutral-400 mx-2">|</span>
                    <span className="text-neutral-500">
                        {data.metadata.match_rate} of market
                    </span>
                </div>
                <div className="text-xs text-neutral-400">
                    Top 50 results shown
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-neutral-50 text-neutral-500 font-medium border-b border-neutral-200">
                        <tr>
                            {headers.map((header) => (
                                <th key={header} className="px-6 py-3 whitespace-nowrap">
                                    {header}
                                </th>
                            ))}
                            <th className="px-6 py-3 text-right">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                        {data.results.map((row, i) => (
                            <tr
                                key={i}
                                className="hover:bg-neutral-50 transition-colors group"
                            >
                                {headers.map((header) => (
                                    <td key={header} className="px-6 py-3 whitespace-nowrap">
                                        {/* Formatting specific columns */}
                                        {header === "Stock Name" ? (
                                            <span className="font-semibold text-neutral-900">
                                                {row[header]}
                                            </span>
                                        ) : header.includes("%") ? (
                                            <span
                                                className={
                                                    row[header] > 0
                                                        ? "text-green-600"
                                                        : row[header] < 0
                                                            ? "text-red-600"
                                                            : "text-neutral-600"
                                                }
                                            >
                                                {row[header] != null ? `${Number(row[header]).toFixed(2)}%` : "-"}
                                            </span>
                                        ) : typeof row[header] === "number" ? (
                                            row[header]?.toLocaleString("en-IN")
                                        ) : (
                                            <span className="text-neutral-600">{row[header]}</span>
                                        )}
                                    </td>
                                ))}
                                <td className="px-6 py-3 text-right">
                                    <a
                                        href={`/stocks/${row['NSE Code']}`}
                                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
                                    >
                                        Analyze <ArrowUpRight size={12} />
                                    </a>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
