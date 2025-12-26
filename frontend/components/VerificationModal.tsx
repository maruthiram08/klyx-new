import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';
import { AlertTriangle, Check, ChevronDown } from 'lucide-react';

interface Candidate {
    stock_name: string;
    sc_id: string;
    nse_code?: string;
}

export interface InvalidItem {
    symbol: string;
    candidates: Candidate[];
}

interface VerificationModalProps {
    invalidSymbols: InvalidItem[];
    onConfirm: (corrections: Record<string, string>) => void;
    onCancel: () => void;
}

const VerificationModal: React.FC<VerificationModalProps> = ({ invalidSymbols, onConfirm, onCancel }) => {
    const [corrections, setCorrections] = useState<Record<string, string>>({});
    const [manualEntryMode, setManualEntryMode] = useState<Record<string, boolean>>({});

    const handleChange = (original: string, corrected: string) => {
        setCorrections(prev => ({
            ...prev,
            [original]: corrected
        }));
    };

    const toggleManual = (symbol: string) => {
        setManualEntryMode(prev => ({ ...prev, [symbol]: !prev[symbol] }));
    };

    const handleSubmit = () => {
        const finalCorrections: Record<string, string> = {};
        Object.keys(corrections).forEach(key => {
            if (corrections[key] && corrections[key].trim() !== '') {
                finalCorrections[key] = corrections[key].trim().toUpperCase();
            }
        });
        onConfirm(finalCorrections);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-[2rem] shadow-xl w-full max-w-3xl overflow-hidden border border-neutral-100 flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-neutral-100 bg-rose-50/30 flex-shrink-0">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle className="w-6 h-6 text-rose-600" />
                        </div>
                        <div>
                            <Typography variant="h3" className="text-xl font-bold text-neutral-900 mb-2">
                                Ambiguous or Unidentified Symbols
                            </Typography>
                            <Typography variant="body" className="text-neutral-600">
                                We found <strong>{invalidSymbols.length}</strong> symbol(s) that need clarification.
                                Please select the correct company or enter the NSE code manually.
                            </Typography>
                        </div>
                    </div>
                </div>

                <div className="p-8 overflow-y-auto flex-grow">
                    <div className="space-y-4">
                        <div className="grid grid-cols-12 gap-4 mb-2 px-2">
                            <div className="col-span-4">
                                <Typography variant="caption" className="font-bold text-neutral-400 uppercase">Input Symbol</Typography>
                            </div>
                            <div className="col-span-8">
                                <Typography variant="caption" className="font-bold text-neutral-400 uppercase">Identify Correct Stock</Typography>
                            </div>
                        </div>

                        {invalidSymbols.map((item) => {
                            const isManual = manualEntryMode[item.symbol] || item.candidates.length === 0;
                            const currentVal = corrections[item.symbol] || '';

                            return (
                                <div key={item.symbol} className="grid grid-cols-12 gap-4 items-start bg-neutral-50 p-4 rounded-xl border border-neutral-100">
                                    <div className="col-span-4 pt-2">
                                        <div className="font-mono font-bold text-lg text-neutral-900 line-clamp-1" title={item.symbol}>
                                            {item.symbol}
                                        </div>
                                        <div className="text-xs text-neutral-400 mt-1">
                                            {item.candidates.length > 0 ? `${item.candidates.length} matches found` : 'No matches found'}
                                        </div>
                                    </div>

                                    <div className="col-span-8 space-y-2">
                                        {!isManual ? (
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-white border border-neutral-200 rounded-lg pl-3 pr-10 py-3 text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        if (val === 'MANUAL_ENTRY') {
                                                            toggleManual(item.symbol);
                                                        } else if (val) {
                                                            handleChange(item.symbol, val);
                                                        }
                                                    }}
                                                    value={corrections[item.symbol] || ''}
                                                >
                                                    <option value="">Select a match...</option>
                                                    {item.candidates.map((c, idx) => (
                                                        <option key={idx} value={c.nse_code || c.stock_name}>
                                                            {c.stock_name} {c.nse_code ? `(${c.nse_code})` : ''}
                                                        </option>
                                                    ))}
                                                    <option value="MANUAL_ENTRY" className="font-bold text-black border-t">
                                                        + Enter Manually...
                                                    </option>
                                                </select>
                                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none" />
                                            </div>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Enter NSE Code (e.g. RELIANCE)"
                                                    className="w-full bg-white border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all uppercase"
                                                    value={currentVal}
                                                    onChange={(e) => handleChange(item.symbol, e.target.value)}
                                                    autoFocus
                                                />
                                                {item.candidates.length > 0 && (
                                                    <Button variant="ghost" size="sm" onClick={() => toggleManual(item.symbol)}>
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 flex-shrink-0">
                    <Button variant="ghost" onClick={onCancel}>
                        Skip & Process Anyway
                    </Button>
                    <Button variant="primary" onClick={handleSubmit}>
                        <Check className="w-4 h-4 mr-2" />
                        Apply Corrections
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default VerificationModal;
