import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableEventItem } from '../components/SortableEventItem';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMemo } from 'react';
import { parseISO, format } from 'date-fns';
import { Plus, Calendar, ArrowLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function Events() {
    const navigate = useNavigate();
    const { events, transactions, reorderList, eventLogs, eventPlans } = useFinanceStore();

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor)
    );

    const eventsWithStats = useMemo(() => {
        return [...events]
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map(event => {
                const eventTransactions = transactions.filter(t => t.eventId === event.id);
                const totalExpense = eventTransactions
                    .filter(t => t.type === 'expense')
                    .reduce((sum, t) => sum + t.amount, 0);
                const totalIncome = eventTransactions
                    .filter(t => t.type === 'income')
                    .reduce((sum, t) => sum + t.amount, 0);

                const totalPlanned = eventPlans.filter(p => p.eventId === event.id).reduce((sum, p) => sum + p.amount, 0);

                return {
                    ...event,
                    transactionCount: eventTransactions.length,
                    totalExpense,
                    totalIncome,
                    totalPlanned,
                    netAmount: totalIncome - totalExpense
                };
            });
    }, [events, transactions, eventPlans]);

    const activeEvents = useMemo(() => {
        const now = new Date();
        return eventsWithStats.filter(event => {
            const start = parseISO(event.startDate);
            const end = event.endDate ? parseISO(event.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
            return now >= start && now <= end;
        });
    }, [eventsWithStats]);

    const upcomingEvents = useMemo(() => {
        const now = new Date();
        return eventsWithStats.filter(event => {
            const start = parseISO(event.startDate);
            return start > now;
        });
    }, [eventsWithStats]);

    const pastEvents = useMemo(() => {
        const now = new Date();
        return eventsWithStats.filter(event => {
            // If no end date, and start date is past, and not active (which means it ended), then past.
            // But logic above for Active uses default 30 days if no end date.
            // So if no end date, "End" is start + 30 days.
            // Let's reuse the same end calculation logic for consistency
            const start = parseISO(event.startDate);
            const effectiveEnd = event.endDate ? parseISO(event.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
            return effectiveEnd < now;
        });
    }, [eventsWithStats]);

    const standaloneLogs = useMemo(() => {
        return eventLogs
            .filter(log => !log.eventId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [eventLogs]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            // Determine if we are in active or past events list
            // We can check which list the active item belongs to
            const isActive = activeEvents.some(e => e.id === active.id);
            const isPast = pastEvents.some(e => e.id === active.id);

            let groupItems: typeof eventsWithStats = [];

            if (isActive) {
                groupItems = activeEvents;
            } else if (isPast) {
                groupItems = pastEvents;
            } else {
                // Check upcoming
                const isUpcoming = upcomingEvents.some(e => e.id === active.id);
                if (isUpcoming) groupItems = upcomingEvents;
            }

            if (groupItems.length > 0) {
                const oldIndex = groupItems.findIndex(item => item.id === active.id);
                const newIndex = groupItems.findIndex(item => item.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(groupItems, oldIndex, newIndex).map(item => item.id);
                    reorderList('events', newOrder);
                }
            }
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div className="flex items-center">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 mr-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <ArrowLeft size={24} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Event/Log</h1>
                        <p className="text-sm text-gray-500">Track expenses by event/log</p>
                    </div>
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate('/logs/new')}
                        className="p-3 bg-orange-100 text-orange-600 rounded-full shadow-sm hover:bg-orange-200 active:scale-95 transition-all"
                    >
                        <Calendar size={24} />
                    </button>
                    <button
                        onClick={() => navigate('/events/new')}
                        className="p-3 bg-blue-100 text-blue-600 rounded-full shadow-sm hover:bg-blue-200 active:scale-95 transition-all"
                    >
                        <Plus size={24} />
                    </button>
                </div>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Active Events */}
                {activeEvents.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Active Event/Log</h2>
                        <div className="space-y-3">
                            <SortableContext items={activeEvents} strategy={verticalListSortingStrategy}>
                                {activeEvents.map(event => (
                                    <SortableEventItem
                                        key={event.id}
                                        event={event}
                                        navigate={navigate}
                                        formatCurrency={formatCurrency}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </section>
                )}

                {/* Upcoming Events */}
                {upcomingEvents.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Event/Log</h2>
                        <div className="space-y-3">
                            <SortableContext items={upcomingEvents} strategy={verticalListSortingStrategy}>
                                {upcomingEvents.map(event => (
                                    <SortableEventItem
                                        key={event.id}
                                        event={event}
                                        navigate={navigate}
                                        formatCurrency={formatCurrency}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </section>
                )}

                {/* Past Events */}
                {pastEvents.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Past Event/Log</h2>
                        <div className="space-y-3">
                            <SortableContext items={pastEvents} strategy={verticalListSortingStrategy}>
                                {pastEvents.map(event => (
                                    <SortableEventItem
                                        key={event.id}
                                        event={event}
                                        navigate={navigate}
                                        formatCurrency={formatCurrency}
                                    />
                                ))}
                            </SortableContext>
                        </div>
                    </section>
                )}

                {/* Independent Logs */}
                {standaloneLogs.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Independent Logs</h2>
                        <div className="space-y-3 pb-8">
                            {standaloneLogs.map(log => (
                                <div
                                    key={log.id}
                                    onClick={() => navigate(`/logs/edit/${log.id}`)}
                                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-all"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn(
                                            "w-10 h-10 rounded-full flex items-center justify-center text-lg",
                                            log.type === 'expense' ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"
                                        )}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-semibold text-gray-900">{log.description}</h3>
                                            <p className="text-xs text-gray-500">{format(new Date(log.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <div className={cn("text-sm font-bold", log.type === 'expense' ? "text-red-600" : "text-green-600")}>
                                        {log.type === 'expense' ? '-' : '+'}{formatCurrency(log.amount)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </DndContext>

            {/* Empty State */}
            {events.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm mb-4">No events or logs yet.</p>
                    <button
                        onClick={() => navigate('/events/new')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
                    >
                        Create Your First Event/Log
                    </button>
                </div>
            )}
        </div>
    );
}
