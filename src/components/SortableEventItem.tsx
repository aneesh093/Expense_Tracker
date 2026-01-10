import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Calendar, Receipt, TrendingDown } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Event } from '../types';
import { format, parseISO } from 'date-fns';

interface EventWithStats extends Event {
    transactionCount: number;
    totalExpense: number;
    totalIncome: number;
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => navigate(`/events/${event.id}`)}
            className={cn(
                "bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer hover:bg-gray-50 transition-all",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1 -ml-2 mr-1">
                        <GripVertical size={20} />
                    </div>
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl shrink-0"
                        style={{ backgroundColor: `${event.color}20`, color: event.color }}
                    >
                        {event.icon}
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">{event.name}</h3>
                        <p className="text-xs text-gray-500 flex items-center mt-1">
                            <Calendar size={12} className="mr-1" />
                            {format(parseISO(event.startDate), 'MMM dd')}
                            {event.endDate && ` - ${format(parseISO(event.endDate), 'MMM dd, yyyy')}`}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between text-sm pl-8">
                <div className="flex items-center space-x-4">
                    <div className="flex items-center text-gray-600">
                        <Receipt size={14} className="mr-1" />
                        <span>{event.transactionCount}</span>
                    </div>
                    <div className="flex items-center text-red-600">
                        <TrendingDown size={14} className="mr-1" />
                        <span>{formatCurrency(event.totalExpense)}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
