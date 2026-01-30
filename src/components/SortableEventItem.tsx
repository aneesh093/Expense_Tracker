import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, MoreVertical, Edit2, Eye } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Event } from '../types';
import { format, parseISO } from 'date-fns';
import { useState } from 'react';

interface EventWithStats extends Event {
    transactionCount: number;
    totalExpense: number;
    totalIncome: number;
    totalPlanned: number;
    netAmount: number;
}

interface SortableEventItemProps {
    event: EventWithStats;
    navigate: (path: string) => void;
    formatCurrency: (amount: number) => string;
}

export function SortableEventItem({ event, navigate, formatCurrency }: SortableEventItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: event.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "bg-white p-4 rounded-xl shadow-sm border border-gray-100 transition-all",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
            onClick={() => navigate(`/events/${event.id}`)}
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                    <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 -ml-2 mr-1" onClick={(e) => e.stopPropagation()}>
                        <GripVertical size={20} />
                    </div>
                    {/* Icon */}
                    <div
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                        style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                        {event.icon}
                    </div>

                    {/* Name and Date */}
                    <div className="flex flex-col">
                        <h3 className="text-sm font-semibold text-gray-900">{event.name}</h3>
                        <div className="flex items-center text-xs text-gray-500 mt-0.5">
                            <Calendar size={12} className="mr-1" />
                            <span>
                                {format(parseISO(event.startDate), 'MMM dd, yyyy')}
                                {event.endDate && ` - ${format(parseISO(event.endDate), 'MMM dd, yyyy')}`}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Amount and Menu */}
                <div className="flex items-center space-x-3 ml-2">
                    <div className="flex flex-col items-end">
                        <div className={cn("text-sm font-bold", event.netAmount >= 0 ? "text-green-600" : "text-red-600")}>
                            {formatCurrency(event.netAmount)}
                        </div>
                        {event.totalPlanned > 0 && (
                            <div className="text-[10px] text-gray-400 font-medium">
                                Plan: {formatCurrency(event.totalPlanned)}
                            </div>
                        )}
                    </div>

                    {/* More Menu */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMenuOpen(!isMenuOpen);
                            }}
                            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <MoreVertical size={16} />
                        </button>

                        {isMenuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsMenuOpen(false);
                                    }}
                                />
                                <div className="absolute right-0 mt-1 w-32 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-20">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/logs/new?eventId=${event.id}`);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-orange-600 hover:bg-orange-50 flex items-center gap-2 border-b border-gray-50"
                                    >
                                        <Calendar size={12} className="text-orange-500" />
                                        Add Log
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/plans/new?eventId=${event.id}`);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center gap-2 border-b border-gray-50"
                                    >
                                        <Calendar size={12} className="text-indigo-500" />
                                        Add Plan
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/events/${event.id}`);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                                    >
                                        <Eye size={12} />
                                        View
                                    </button>
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/events/edit/${event.id}`);
                                            setIsMenuOpen(false);
                                        }}
                                        className="w-full text-left px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 flex items-center gap-2"
                                    >
                                        <Edit2 size={12} />
                                        Edit
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
