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
                "bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            <div className="flex items-center space-x-3">
                <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                    <GripVertical size={20} />
                </div>
                <div>
                    <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{mandate.description}</h3>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                            Day {mandate.dayOfMonth}
                        </span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                        {sourceAccount?.name} → {destAccount?.name}
                    </p>
                    <p className="font-bold text-gray-900 mt-1">
                        ₹{mandate.amount.toLocaleString()}
                    </p>
                    {mandate.lastRunDate && (
                        <p className="text-xs text-green-600 flex items-center mt-1">
                            <CheckCircle size={12} className="mr-1" />
                            Last run: {mandate.lastRunDate}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex flex-col items-end space-y-2">
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => updateMandate(mandate.id, { isEnabled: !mandate.isEnabled })}
                        className={cn("p-2 rounded-full transition-colors", mandate.isEnabled
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        )}
                        title={mandate.isEnabled ? 'Pause' : 'Restart'}
                    >
                        {mandate.isEnabled ? <Play size={18} className="fill-current" /> : <RefreshCcw size={18} />}
                    </button>
                    <button
                        onClick={() => handleEdit(mandate)}
                        className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <Edit2 size={18} />
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Delete this mandate?')) {
                                deleteMandate(mandate.id);
                            }
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Trash2 size={18} />
                    </button>
                </div>

                <div className="flex space-x-2">
                    {!isDoneThisMonth(mandate) && mandate.isEnabled && (
                        <>
                            <button
                                onClick={() => handleSkip(mandate.id)}
                                className="flex items-center px-2 py-1 bg-amber-50 text-amber-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-amber-100 transition-colors"
                            >
                                <XCircle size={12} className="mr-1" />
                                Skip
                            </button>
                            <button
                                onClick={() => handleRunNow(mandate.id)}
                                className="flex items-center px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-blue-100 transition-colors"
                            >
                                <Play size={12} className="mr-1" />
                                Execute
                            </button>
                        </>
                    )}
                    {isDoneThisMonth(mandate) && (
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 px-2 py-1 rounded-lg">
                            Done this month
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
