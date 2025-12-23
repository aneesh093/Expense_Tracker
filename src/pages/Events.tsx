import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMemo } from 'react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { Plus, Calendar, TrendingDown, Receipt } from 'lucide-react';

export function Events() {
    const navigate = useNavigate();
    const { events, transactions } = useFinanceStore();

    const eventsWithStats = useMemo(() => {
        return events.map(event => {
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
            const end = event.endDate ? parseISO(event.endDate) : new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000); // Default 30 days
            return isWithinInterval(now, { start, end });
        });
    }, [eventsWithStats]);

    const pastEvents = useMemo(() => {
        const now = new Date();
        return eventsWithStats.filter(event => {
            const end = event.endDate ? parseISO(event.endDate) : parseISO(event.startDate);
            return end < now;
        });
    }, [eventsWithStats]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const EventCard = ({ event }: { event: typeof eventsWithStats[0] }) => (
        <div
            onClick={() => navigate(`/events/${event.id}`)}
            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
        >
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
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

            <div className="flex items-center justify-between text-sm">
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Events</h1>
                    <p className="text-sm text-gray-500">Track expenses by event</p>
                </div>
                <button
                    onClick={() => navigate('/events/new')}
                    className="bg-blue-600 text-white p-3 rounded-full shadow-lg active:scale-95 transition-transform"
                >
                    <Plus size={24} />
                </button>
            </header>

            {/* Active Events */}
            {activeEvents.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Active Events</h2>
                    <div className="space-y-3">
                        {activeEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

            {/* Past Events */}
            {pastEvents.length > 0 && (
                <section>
                    <h2 className="text-lg font-bold text-gray-900 mb-3">Past Events</h2>
                    <div className="space-y-3">
                        {pastEvents.map(event => (
                            <EventCard key={event.id} event={event} />
                        ))}
                    </div>
                </section>
            )}

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
