import React from 'react';
import { Button } from './ui/Button';
import { Typography } from './ui/Typography';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    isDestructive?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    title,
    message,
    confirmLabel = "Confirm",
    isDestructive = false,
    onConfirm,
    onCancel
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md overflow-hidden border border-neutral-100 flex flex-col animate-in zoom-in-95 duration-200 scale-100">
                <div className={`p-8 border-b border-neutral-100 ${isDestructive ? 'bg-rose-50/30' : 'bg-neutral-50'} flex-shrink-0 text-center`}>
                    <div className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${isDestructive ? 'bg-rose-100' : 'bg-neutral-200'}`}>
                        {isDestructive ? (
                            <Trash2 className="w-8 h-8 text-rose-600" />
                        ) : (
                            <AlertTriangle className="w-8 h-8 text-neutral-600" />
                        )}
                    </div>
                    <Typography variant="h3" className="text-xl font-bold text-neutral-900 mb-2">
                        {title}
                    </Typography>
                    <Typography variant="body" className="text-neutral-600">
                        {message}
                    </Typography>
                </div>

                <div className="p-6 bg-white flex flex-col gap-3">
                    <Button
                        variant="primary"
                        onClick={onConfirm}
                        className={`w-full justify-center py-4 text-base ${isDestructive ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-200' : 'bg-black hover:bg-neutral-800'}`}
                    >
                        {confirmLabel}
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={onCancel}
                        className="w-full justify-center text-neutral-500 hover:text-neutral-900"
                    >
                        Cancel
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
