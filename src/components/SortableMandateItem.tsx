import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Play, CheckCircle, XCircle, RefreshCcw, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { cn } from '../lib/utils';
import { type Mandate, type Account } from '../types';

interface SortableMandateItemProps {
    mandate: Mandate;
    accounts: Account[];
    updateMandate: (id: string, updates: Partial<Mandate>) => void;
    deleteMandate: (id: string) => void;
    handleEdit: (mandate: Mandate) => void;
    handleSkip: (id: string) => void;
    handleRunNow: (id: string) => void;
    isDoneThisMonth: (mandate: Mandate) => boolean;
}

export function SortableMandateItem({
    mandate,
    accounts,
    updateMandate,
    deleteMandate,
    handleEdit,
    handleSkip,
    handleRunNow,
    isDoneThisMonth
}: SortableMandateItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: mandate.id });

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    const sourceAccount = accounts.find(a => a.id === mandate.sourceAccountId);
    const destAccount = accounts.find(a => a.id === mandate.destinationAccountId);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex flex-col gap-2",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            {/* Row 1: Grip + Name + Date + Buttons */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-0.5">
                        <GripVertical size={16} />
                    </div>
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900 text-sm">{mandate.description}</h3>
                        <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md font-medium">
                            Day {mandate.dayOfMonth}
                        </span>
                    </div>
                </div>

                <div className="flex items-center space-x-1">
                    {/* Active/Pause Button */}
                    <button
                        onClick={() => updateMandate(mandate.id, { isEnabled: !mandate.isEnabled })}
                        className={cn("p-1.5 rounded-full transition-colors", mandate.isEnabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        title={mandate.isEnabled ? 'Pause' : 'Restart'}
                    >
                        {mandate.isEnabled ? <Play size={14} className="fill-current" /> : <RefreshCcw size={14} />}
                    </button>

                    {/* Menu Button */}
                    <div className="relative">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setIsMenuOpen(false)}
                                />
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                    <button
                                        onClick={() => {
                                            handleEdit(mandate);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} />
                                        Edit
                                    </button>

                                    {!isDoneThisMonth(mandate) && mandate.isEnabled && (
                                        <>
                                            <button
                                                onClick={() => {
                                                    handleSkip(mandate.id);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs text-amber-600 hover:bg-amber-50 flex items-center gap-2"
                                            >
                                                <XCircle size={12} />
                                                Skip
                                            </button>
                                            <button
                                                onClick={() => {
                                                    handleRunNow(mandate.id);
                                                    setIsMenuOpen(false);
                                                }}
                                                className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                            >
                                                <Play size={12} />
                                                Run Now
                                            </button>
                                        </>
                                    )}

                                    <div className="my-1 border-t border-gray-100" />

                                    <button
                                        onClick={() => {
                                            if (window.confirm('Delete this mandate?')) {
                                                deleteMandate(mandate.id);
                                            }
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
                                    >
                                        <Trash2 size={12} />
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Row 2: From -> To + Amount */}
            <div className="flex items-center justify-between pl-7 text-xs">
                <div className="text-gray-500 font-medium">
                    {sourceAccount?.name} <span className="mx-1 text-gray-300">→</span> {destAccount?.name}
                </div>
                <div className="flex items-center space-x-2">
                    {mandate.lastRunDate && (
                        <span className="text-[10px] text-green-600 flex items-center bg-green-50 px-1.5 py-0.5 rounded">
                            <CheckCircle size={10} className="mr-1" />
                            Run: {mandate.lastRunDate.split('-').slice(1).join('/')}
                        </span>
                    )}
                    <span className="font-bold text-gray-900">
                        ₹{mandate.amount.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
