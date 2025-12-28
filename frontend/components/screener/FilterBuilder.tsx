"use client";

import React, { useEffect, useState } from "react";
import { Plus, X, AlertCircle } from "lucide-react";
import { Filter, ScreenerField } from "@/types/screener";
import { getScreenerFields } from "@/utils/screenerAPI";

interface FilterBuilderProps {
    filters: Filter[];
    onChange: (filters: Filter[]) => void;
    onSearch: () => void;
    isLoading?: boolean;
}

export function FilterBuilder({
    filters,
    onChange,
    onSearch,
    isLoading,
}: FilterBuilderProps) {
    const [availableFields, setAvailableFields] = useState<ScreenerField[]>([]);
    const [groupedFields, setGroupedFields] = useState<
        Record<string, ScreenerField[]>
    >({});

    useEffect(() => {
        async function loadFields() {
            const fields = await getScreenerFields();
            setAvailableFields(fields);

            // Group by category
            const grouped = fields.reduce((acc, field) => {
                if (!acc[field.category]) acc[field.category] = [];
                acc[field.category].push(field);
                return acc;
            }, {} as Record<string, ScreenerField[]>);
            setGroupedFields(grouped);
        }
        loadFields();
    }, []);

    const addFilter = () => {
        onChange([
            ...filters,
            { field: "pe_ttm", operator: "lt", value: 20 }, // Default
        ]);
    };

    const removeFilter = (index: number) => {
        onChange(filters.filter((_, i) => i !== index));
    };

    const updateFilter = (index: number, updates: Partial<Filter>) => {
        onChange(
            filters.map((f, i) => (i === index ? { ...f, ...updates } : f))
        );
    };

    const getOperators = (field: string) => {
        // Return operators relevant to field type (mostly numeric for now)
        return [
            { value: "gt", label: "Greater Than (>)" },
            { value: "lt", label: "Less Than (<)" },
            { value: "between", label: "Between" },
            { value: "eq", label: "Equals (=)" },
        ];
    };

    return (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-900">
                    Custom Filters
                </h3>
                <button
                    onClick={onSearch}
                    disabled={isLoading}
                    className="px-4 py-2 bg-[#ccf32f] text-black font-medium rounded-lg hover:bg-[#bce325] transition-colors disabled:opacity-50"
                >
                    {isLoading ? "Searching..." : "Apply Filters"}
                </button>
            </div>

            <div className="space-y-3">
                {filters.length === 0 && (
                    <div className="text-center py-8 bg-neutral-50 rounded-lg border border-dashed border-neutral-200">
                        <p className="text-neutral-500 mb-2">No filters applied</p>
                        <button
                            onClick={addFilter}
                            className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        >
                            Add your first filter
                        </button>
                    </div>
                )}

                {filters.map((filter, index) => (
                    <div
                        key={index}
                        className="flex flex-wrap items-center gap-3 p-3 bg-neutral-50 rounded-lg border border-neutral-100 group animate-in slide-in-from-left-2 duration-200"
                    >
                        {/* Field Select */}
                        <select
                            value={filter.field}
                            onChange={(e) =>
                                updateFilter(index, { field: e.target.value })
                            }
                            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm min-w-[200px] focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            {Object.entries(groupedFields).map(([category, catFields]) => (
                                <optgroup key={category} label={category}>
                                    {catFields.map((f) => (
                                        <option key={f.field} value={f.field}>
                                            {f.field}
                                        </option>
                                    ))}
                                </optgroup>
                            ))}
                        </select>

                        {/* Operator Select */}
                        <select
                            value={filter.operator}
                            onChange={(e) =>
                                updateFilter(index, { operator: e.target.value as any })
                            }
                            className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm w-[140px] focus:ring-2 focus:ring-black focus:outline-none"
                        >
                            {getOperators(filter.field).map((op) => (
                                <option key={op.value} value={op.value}>
                                    {op.label}
                                </option>
                            ))}
                        </select>

                        {/* Value Input */}
                        {filter.operator === "between" ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    value={Array.isArray(filter.value) ? filter.value[0] : ""}
                                    onChange={(e) =>
                                        updateFilter(index, {
                                            value: [
                                                Number(e.target.value),
                                                Array.isArray(filter.value) ? filter.value[1] : 0,
                                            ],
                                        })
                                    }
                                    placeholder="Min"
                                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm w-[100px] focus:ring-2 focus:ring-black focus:outline-none"
                                />
                                <span className="text-neutral-400 text-sm">to</span>
                                <input
                                    type="number"
                                    value={Array.isArray(filter.value) ? filter.value[1] : ""}
                                    onChange={(e) =>
                                        updateFilter(index, {
                                            value: [
                                                Array.isArray(filter.value) ? filter.value[0] : 0,
                                                Number(e.target.value),
                                            ],
                                        })
                                    }
                                    placeholder="Max"
                                    className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm w-[100px] focus:ring-2 focus:ring-black focus:outline-none"
                                />
                            </div>
                        ) : (
                            <input
                                type="number"
                                value={filter.value}
                                onChange={(e) =>
                                    updateFilter(index, { value: Number(e.target.value) })
                                }
                                className="px-3 py-2 bg-white border border-neutral-200 rounded-lg text-sm w-[120px] focus:ring-2 focus:ring-black focus:outline-none"
                            />
                        )}

                        {/* Hint/Stats helper */}
                        <div className="text-xs text-neutral-400 hidden lg:block ml-2">
                            {availableFields.find((f) => f.field === filter.field)?.stats?.mean && (
                                <span>
                                    Avg: {availableFields.find((f) => f.field === filter.field)?.stats?.mean?.toFixed(1)}
                                </span>
                            )}
                        </div>

                        <div className="flex-1" />

                        <button
                            onClick={() => removeFilter(index)}
                            className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                <button
                    onClick={addFilter}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 rounded-lg hover:border-neutral-300 hover:bg-neutral-50 transition-all w-full justify-center border-dashed"
                >
                    <Plus size={16} />
                    Add Another Filter
                </button>
            </div>
        </div>
    );
}
