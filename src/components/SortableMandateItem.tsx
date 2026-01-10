import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Play, CheckCircle, XCircle, RefreshCcw } from 'lucide-react';
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

                    {/* Edit Button */}
                    <button
                        onClick={() => handleEdit(mandate)}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <Edit2 size={14} />
                    </button>

                    {/* Delete Button */}
                    <button
                        onClick={() => {
                            if (window.confirm('Delete this mandate?')) {
                                deleteMandate(mandate.id);
                            }
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Trash2 size={14} />
                    </button>

                    {/* Execution Actions (Skip/Run) */}
                    {!isDoneThisMonth(mandate) && mandate.isEnabled && (
                        <div className="flex space-x-1 ml-1 pl-1 border-l border-gray-100">
                            <button
                                onClick={() => handleSkip(mandate.id)}
                                className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-full transition-colors"
                                title="Skip this month"
                            >
                                <XCircle size={14} />
                            </button>
                            <button
                                onClick={() => handleRunNow(mandate.id)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                title="Run now"
                            >
                                <Play size={14} />
                            </button>
                        </div>
                    )}
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
