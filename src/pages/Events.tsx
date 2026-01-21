import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableEventItem } from '../components/SortableEventItem';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { Plus, Calendar, ArrowLeft } from 'lucide-react';

export function Events() {
    const navigate = useNavigate();
    const { events, transactions, reorderList } = useFinanceStore();

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

                return {
                    ...event,
                    transactionCount: eventTransactions.length,
                    totalExpense,
                    totalIncome,
                    netAmount: totalIncome - totalExpense
                };
            });
    }, [events, transactions]);

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
                        <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                        <p className="text-sm text-gray-500">Track expenses by event</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/events/new')}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </header>

            <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
            >
                {/* Active Events */}
                {activeEvents.length > 0 && (
                    <section>
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Active Events</h2>
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
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Upcoming Events</h2>
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
                        <h2 className="text-lg font-bold text-gray-900 mb-3">Past Events</h2>
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
            </DndContext>

            {/* Empty State */}
            {events.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500 text-sm mb-4">No events yet.</p>
                    <button
                        onClick={() => navigate('/events/new')}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium active:scale-95 transition-transform"
                    >
                        Create Your First Event
                    </button>
                </div>
            )}
        </div>
    );
}
