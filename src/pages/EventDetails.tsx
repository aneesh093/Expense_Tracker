import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Plus, ArrowUpRight, ArrowDownRight, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export function EventDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { events, transactions, eventLogs, deleteEvent } = useFinanceStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const event = useMemo(() => events.find(e => e.id === id), [events, id]);

    const eventTransactions = useMemo(() => {
        return transactions.filter(t => t.eventId === id);
    }, [transactions, id]);

    const eventLogsList = useMemo(() => {
        return eventLogs.filter(l => l.eventId === id);
    }, [eventLogs, id]);

    const stats = useMemo(() => {
        const totalExpense = eventTransactions
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);
        const totalIncome = eventTransactions
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        const logExpense = eventLogsList
            .filter(l => l.type === 'expense')
            .reduce((sum, l) => sum + l.amount, 0);
        const logIncome = eventLogsList
            .filter(l => l.type === 'income')
            .reduce((sum, l) => sum + l.amount, 0);

        const grandTotalExpense = totalExpense + logExpense;
        const grandTotalIncome = totalIncome + logIncome;

        return {
            totalExpense: grandTotalExpense,
            totalIncome: grandTotalIncome,
            netAmount: grandTotalIncome - grandTotalExpense
        };
    }, [eventTransactions, eventLogsList]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const handleDelete = () => {
        if (id) {
            deleteEvent(id);
            navigate('/events');
        }
    };

    if (!event) {
        return (
            <div className="text-center py-16">
                <p className="text-gray-500">Event not found</p>
                <button
                    onClick={() => navigate('/events')}
                    className="mt-4 text-blue-600 font-medium"
                >
                    Back to Events
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center justify-between">
                <button
                    onClick={() => navigate('/events')}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="flex space-x-2">
                    <button
                        onClick={() => navigate(`/events/edit/${id}`)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    >
                        <Edit2 size={20} />
                    </button>
                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    >
                        <Trash2 size={20} />
                    </button>
                </div>
            </header>

            {/* Event Info Card */}
            <div
                className="rounded-2xl p-6 text-white shadow-xl"
                style={{ background: `linear-gradient(135deg, ${event.color} 0%, ${event.color}dd 100%)` }}
            >
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center space-x-3">
                        <div className="text-4xl">{event.icon}</div>
                        <div>
                            <h1 className="text-2xl font-bold">{event.name}</h1>
                            <p className="text-white/80 text-sm flex items-center mt-1">
                                <Calendar size={14} className="mr-1" />
                                {format(parseISO(event.startDate), 'MMM dd, yyyy')}
                                {event.endDate && ` - ${format(parseISO(event.endDate), 'MMM dd, yyyy')}`}
                            </p>
                        </div>
                    </div>
                    <div className="text-right bg-white p-2.5 rounded-xl shadow-sm border border-white/20">
                        <p className="text-[10px] text-gray-400 uppercase font-bold mb-0.5">Balance</p>
                        <p className={cn(
                            "text-lg sm:text-xl font-bold font-mono tracking-tight",
                            stats.netAmount >= 0 ? "text-green-600" : "text-red-600"
                        )}>
                            {formatCurrency(stats.netAmount)}
                        </p>
                    </div>
                </div>
                {event.description && (
                    <p className="text-white/90 text-sm">{event.description}</p>
                )}
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1 truncate">Total Expense</p>
                    <p className="text-sm sm:text-lg font-bold text-red-600 break-words">{formatCurrency(stats.totalExpense)}</p>
                </div>
                <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <p className="text-xs text-gray-500 mb-1 truncate">Total Income</p>
                    <p className="text-sm sm:text-lg font-bold text-green-600 break-words">{formatCurrency(stats.totalIncome)}</p>
                </div>
            </div>

            {/* Activity Sections */}
            <div className="space-y-6">
                <section>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-bold text-gray-900">Transactions</h2>
                        <button
                            onClick={() => navigate(`/add?eventId=${id}`)}
                            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 active:scale-95 transition-transform"
                        >
                            <Plus size={16} />
                            <span>Add</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {eventTransactions.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No transactions yet.</p>
                            </div>
                        ) : (
                            eventTransactions.map((t) => (
                                <div
                                    key={t.id}
                                    onClick={() => navigate(`/edit/${t.id}`)}
                                    className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("p-2 rounded-full", t.type === 'expense' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")}>
                                            {t.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{t.note || t.category}</p>
                                            <p className="text-xs text-gray-500">{format(new Date(t.date), 'MMM dd, h:mm a')}</p>
                                        </div>
                                    </div>
                                    <span className={cn("font-bold text-sm", t.type === 'expense' ? "text-gray-900" : "text-green-600")}>
                                        {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>

                <section>
                    <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center space-x-2">
                            <h2 className="text-lg font-bold text-gray-900">Manual Logs</h2>
                            <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Historical</span>
                        </div>
                        <button
                            onClick={() => navigate(`/logs/new?eventId=${id}`)}
                            className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 active:scale-95 transition-transform"
                        >
                            <Plus size={16} />
                            <span>Log</span>
                        </button>
                    </div>

                    <div className="space-y-3">
                        {eventLogsList.length === 0 ? (
                            <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                                <p className="text-gray-500 text-sm">No manual logs yet.</p>
                            </div>
                        ) : (
                            eventLogsList.map((l) => (
                                <div
                                    key={l.id}
                                    onClick={() => navigate(`/logs/edit/${l.id}`)}
                                    className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("p-2 rounded-full", l.type === 'expense' ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500")}>
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{l.description}</p>
                                            <p className="text-xs text-gray-500">{format(parseISO(l.date), 'MMM dd, yyyy')}</p>
                                        </div>
                                    </div>
                                    <span className={cn("font-bold text-sm", l.type === 'expense' ? "text-gray-900" : "text-blue-600")}>
                                        {l.type === 'expense' ? '-' : '+'}{formatCurrency(l.amount)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-4 leading-relaxed italic">
                        * Manual logs allow tracking past bills or offline expenses without affecting bank balances.
                    </p>
                </section>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            This will delete the event but keep all transactions. Transactions will no longer be linked to this event.
                        </p>
                        <div className="flex space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 active:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium active:bg-red-700"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
