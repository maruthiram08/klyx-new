import React from 'react';
import { Typography } from './Typography';

interface MarkdownRendererProps {
    content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
    if (!content) return null;

    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let tableBuffer: string[] = [];
    let inTable = false;

    const flushTable = () => {
        if (tableBuffer.length > 0) {
            // Parse table
            const headers = tableBuffer[0].split('|').filter(s => s.trim()).map(s => s.trim());
            const rows = tableBuffer.slice(2).map(line => line.split('|').filter(s => s.trim()).map(s => s.trim()));

            elements.push(
                <div key={`table-${elements.length}`} className="my-6 overflow-x-auto">
                    <table className="w-full text-sm border-collapse bg-neutral-50 rounded-lg overflow-hidden border border-neutral-200">
                        <thead className="bg-neutral-100">
                            <tr>{headers.map((h, i) => <th key={i} className="p-3 text-left font-bold text-neutral-600 border-b border-neutral-200">{h}</th>)}</tr>
                        </thead>
                        <tbody>
                            {rows.map((r, i) => <tr key={i} className="border-b border-neutral-100 last:border-0 hover:bg-white">{r.map((c, j) =>
                                <td key={j} className="p-3 border-r border-neutral-100 last:border-0" dangerouslySetInnerHTML={{ __html: c.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></td>
                            )}</tr>)}
                        </tbody>
                    </table>
                </div>
            );
            tableBuffer = [];
            inTable = false;
        }
    };

    lines.forEach((line, idx) => {
        const trimmed = line.trim();

        // Table handling
        if (trimmed.startsWith('|')) {
            inTable = true;
            tableBuffer.push(trimmed);
            return;
        } else if (inTable) {
            flushTable();
        }

        // Headers
        if (trimmed.startsWith('## ')) {
            elements.push(<Typography key={idx} variant="h3" className="mt-8 mb-4 text-xl font-bold text-neutral-800">{trimmed.replace('## ', '')}</Typography>);
        }
        // Lists
        else if (trimmed.startsWith('* ')) {
            elements.push(
                <div key={idx} className="flex gap-2 mb-2 ml-4">
                    <span className="text-neutral-400 mt-1.5">•</span>
                    <span className="text-neutral-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/⚠️/g, '⚠️').replace(/🔥/g, '🔥').replace(/✅/g, '✅') }}></span>
                </div>
            );
        }
        // Blockquotes (Conclusions)
        else if (trimmed.startsWith('> ')) {
            elements.push(
                <div key={idx} className="my-6 pl-4 border-l-4 border-emerald-500 bg-emerald-50/50 p-4 rounded-r-lg">
                    <span className="text-emerald-900 font-medium italic block" dangerouslySetInnerHTML={{ __html: trimmed.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></span>
                </div>
            );
        }
        // Horizontal Rule
        else if (trimmed === '---') {
            elements.push(<hr key={idx} className="my-8 border-neutral-200" />);
        }
        // Normal Text (if not empty)
        else if (trimmed.length > 0) {
            elements.push(<p key={idx} className="mb-4 text-neutral-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: trimmed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>);
        }
    });

    if (inTable) flushTable(); // Flush trailing table

    return <div className="prose max-w-none">{elements}</div>;
};
