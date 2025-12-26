import React, { useRef } from 'react';
import { LayoutDashboard, PieChart, Settings, Activity, UploadCloud, Play, Trash2, Database } from 'lucide-react';

interface SidebarProps {
    onUpload: (files: FileList) => void;
    onRunAnalysis: () => void;
    onClearData: () => void;
    isProcessing: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ onUpload, onRunAnalysis, onClearData, isProcessing }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            onUpload(e.target.files);
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-screen w-20 hover:w-64 bg-white border-r border-slate-200 z-50 transition-all duration-300 group flex flex-col shadow-sm">
            {/* Logo Area */}
            <div className="h-16 flex items-center justify-center border-b border-slate-100 mb-6">
                <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center shadow-indigo-200 shadow-lg text-white font-bold text-lg">
                    A
                </div>
                <span className="ml-3 font-bold text-xl text-slate-800 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap overflow-hidden">
                    Aura
                </span>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 space-y-2">
                <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active />
                <NavItem icon={<Activity size={20} />} label="Heatmap" />
                <NavItem icon={<PieChart size={20} />} label="Sectors" />
                <div className="my-4 border-t border-slate-100 mx-2"></div>
                <NavItem icon={<Database size={20} />} label="Data Sources" />
                <NavItem icon={<Settings size={20} />} label="Settings" />
            </nav>

            {/* Actions Footer */}
            <div className="p-4 border-t border-slate-100 space-y-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                    accept=".xlsx,.xls,.csv"
                />

                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
                >
                    <UploadCloud size={16} />
                    Upload Data
                </button>

                <button
                    onClick={onRunAnalysis}
                    disabled={isProcessing}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-indigo-500 hover:bg-indigo-600 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
                >
                    <Play size={16} className={isProcessing ? "animate-spin" : ""} />
                    {isProcessing ? ' analyzing...' : 'Run Analysis'}
                </button>

                <button
                    onClick={onClearData}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 transition-all"
                >
                    <Trash2 size={16} />
                    Clear
                </button>
            </div>
        </aside>
    );
};

const NavItem = ({ icon, label, active = false }: { icon: React.ReactNode, label: string, active?: boolean }) => (
    <button className={`w-full flex items-center p-3 rounded-xl transition-all ${active ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'}`}>
        <span className="shrink-0">{icon}</span>
        <span className="ml-3 text-sm font-medium whitespace-nowrap overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {label}
        </span>
    </button>
);

export default Sidebar;
