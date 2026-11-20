import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useMemo, useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Edit2, Trash2, Plus, ArrowUpRight, ArrowDownRight, Calendar, Paperclip, Download, Target, TrendingDown, TrendingUp, Wallet } from 'lucide-react';
import { cn } from '../lib/utils';
import { generateEventPDF } from '../lib/pdfGenerator';

export function EventDetails() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { events, transactions, eventLogs, eventPlans, deleteEvent, deleteEventPlan, accounts, allowIndividualEventExport } = useFinanceStore();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [transactionView, setTransactionView] = useState<'all' | 'monthly'>('all');

    const event = useMemo(() => events.find(e => e.id === id), [events, id]);

    const [activeTab, setActiveTab] = useState<'transactions' | 'logs' | 'plans'>(() => {
        if (event?.showTransactions === false) {
            if (event?.showLogs !== false) return 'logs';
            if (event?.showPlans !== false) return 'plans';
        }
        return 'transactions';
    });

    const isTransactionsVisible = event?.showTransactions !== false;
    const isLogsVisible = event?.showLogs !== false;
    const isPlansVisible = event?.showPlans !== false;

    useEffect(() => {
        if (!isTransactionsVisible && activeTab === 'transactions') {
            if (isLogsVisible) setActiveTab('logs');
            else if (isPlansVisible) setActiveTab('plans');
        } else if (!isLogsVisible && activeTab === 'logs') {
            if (isTransactionsVisible) setActiveTab('transactions');
            else if (isPlansVisible) setActiveTab('plans');
        } else if (!isPlansVisible && activeTab === 'plans') {
            if (isTransactionsVisible) setActiveTab('transactions');
            else if (isLogsVisible) setActiveTab('logs');
        }
    }, [isTransactionsVisible, isLogsVisible, isPlansVisible, activeTab]);

    const eventTransactions = useMemo(() => {
        return transactions
            .filter(t => t.eventId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, id]);

    const displayedTransactions = useMemo(() => {
        if (transactionView === 'monthly') {
            const now = new Date();
            const currentYear = now.getFullYear();
            const currentMonth = now.getMonth();
            return eventTransactions.filter(t => {
                const tDate = new Date(t.date);
                return tDate.getFullYear() === currentYear && tDate.getMonth() === currentMonth;
            });
        }
        return eventTransactions;
    }, [eventTransactions, transactionView]);

    const monthlyStats = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthTrans = eventTransactions.filter(t => {
            const d = new Date(t.date);
            return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
        });

        const expense = currentMonthTrans
            .filter(t => t.type === 'expense')
            .reduce((sum, t) => sum + t.amount, 0);

        const income = currentMonthTrans
            .filter(t => t.type === 'income')
            .reduce((sum, t) => sum + t.amount, 0);

        return {
            expense,
            income,
            count: currentMonthTrans.length
        };
    }, [eventTransactions]);

    const eventLogsList = useMemo(() => {
        return eventLogs
            .filter(l => l.eventId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [eventLogs, id]);

    const eventPlansList = useMemo(() => {
        return eventPlans
            .filter(p => p.eventId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [eventPlans, id]);

    const handleExportPDF = () => {
        if (event) {
            generateEventPDF(event, eventTransactions, eventLogsList, eventPlansList, accounts);
        }
    };

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

        const totalPlanned = eventPlansList
            .reduce((sum, p) => sum + p.amount, 0);

        const grandTotalExpense = totalExpense + logExpense;
        const grandTotalIncome = totalIncome + logIncome;

        return {
            totalExpense: grandTotalExpense,
            totalIncome: grandTotalIncome,
            totalPlanned,
            netAmount: grandTotalIncome - grandTotalExpense,
            remainingBudget: totalPlanned - grandTotalExpense
        };
    }, [eventTransactions, eventLogsList, eventPlansList]);

    const hasPlannedBudget = isPlansVisible && stats.totalPlanned > 0;

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
                <p className="text-gray-500">Event/Log not found</p>
                <button
                    onClick={() => navigate('/events')}
                    className="mt-4 text-blue-600 font-medium"
                >
                    Back to Event/Log
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
                    {allowIndividualEventExport && (
                        <button
                            onClick={handleExportPDF}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors"
                            title="Export to PDF"
                        >
                            <Download size={20} />
                        </button>
                    )}
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
                className="relative overflow-hidden rounded-3xl p-6 text-white shadow-lg"
                style={{ background: `linear-gradient(135deg, ${event.color} 0%, ${event.color}dd 100%)` }}
            >
                {/* Subtle decorative glow */}
                <div className="absolute -top-10 -right-10 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />

                <div className="relative flex justify-between items-start gap-3">
                    <div className="flex items-center space-x-3.5 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md border border-white/25 flex items-center justify-center text-2xl shadow-inner shrink-0">
                            {event.icon}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white truncate">{event.name}</h1>
                            <div className="inline-flex items-center text-white/90 text-xs font-medium mt-1 bg-black/10 px-2.5 py-0.5 rounded-full backdrop-blur-sm">
                                <Calendar size={12} className="mr-1.5 shrink-0" />
                                <span className="truncate">
                                    {format(parseISO(event.startDate), 'MMM dd, yyyy')}
                                    {event.endDate && ` - ${format(parseISO(event.endDate), 'MMM dd, yyyy')}`}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Top Metric Pill */}
                    <div className="bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl shadow-sm text-right shrink-0 border border-white/40 min-w-[105px]">
                        <p className="text-[10px] text-gray-500 uppercase font-extrabold tracking-wider">
                            {hasPlannedBudget
                                ? 'Remaining'
                                : (stats.totalIncome > 0 ? 'Net Balance' : 'Total Spent')}
                        </p>
                        <p className={cn(
                            "text-lg sm:text-xl font-bold font-mono tracking-tight",
                            hasPlannedBudget
                                ? (stats.remainingBudget >= 0 ? "text-emerald-600" : "text-rose-600")
                                : (stats.totalIncome > 0
                                    ? (stats.netAmount >= 0 ? "text-emerald-600" : "text-rose-600")
                                    : "text-gray-900")
                        )}>
                            {hasPlannedBudget
                                ? formatCurrency(stats.remainingBudget)
                                : (stats.totalIncome > 0
                                    ? formatCurrency(stats.netAmount)
                                    : formatCurrency(stats.totalExpense))}
                        </p>
                        {hasPlannedBudget && (
                            <span className={cn(
                                "text-[10px] font-bold px-1.5 py-0.5 rounded-md inline-block mt-0.5",
                                stats.remainingBudget >= 0
                                    ? "bg-emerald-50 text-emerald-700"
                                    : "bg-rose-50 text-rose-700"
                            )}>
                                {stats.remainingBudget >= 0
                                    ? `${Math.max(0, 100 - Math.round((stats.totalExpense / stats.totalPlanned) * 100))}% left`
                                    : 'Over budget'}
                            </span>
                        )}
                    </div>
                </div>

                {event.description && (
                    <p className="relative text-white/90 text-sm mt-3.5 pt-3 border-t border-white/15 leading-relaxed">{event.description}</p>
                )}
            </div>

            {/* Overall Stats Card */}
            <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 space-y-4">
                {hasPlannedBudget ? (
                    <>
                        {/* Progress Header */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <div className="flex items-center space-x-1.5">
                                    <Target size={15} className="text-blue-600" />
                                    <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                                        Budget Progress
                                    </span>
                                </div>
                                <span className={cn(
                                    "text-xs font-bold px-2.5 py-0.5 rounded-full",
                                    stats.totalExpense > stats.totalPlanned
                                        ? "bg-rose-100 text-rose-700"
                                        : "bg-blue-100 text-blue-700"
                                )}>
                                    {Math.round((stats.totalExpense / stats.totalPlanned) * 100)}% of budget
                                </span>
                            </div>

                            {/* Full-width smooth progress bar */}
                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden p-0.5">
                                <div
                                    className={cn(
                                        "h-full rounded-full transition-all duration-500",
                                        stats.totalExpense > stats.totalPlanned
                                            ? "bg-gradient-to-r from-rose-500 to-red-600"
                                            : "bg-gradient-to-r from-blue-500 to-indigo-600"
                                    )}
                                    style={{ width: `${Math.min(100, (stats.totalExpense / stats.totalPlanned) * 100)}%` }}
                                />
                            </div>

                            <div className="flex justify-between items-center text-[11px] text-gray-500 mt-1.5 px-0.5">
                                <span>Spent: <strong className="text-gray-900 font-mono">{formatCurrency(stats.totalExpense)}</strong></span>
                                <span>Budget: <strong className="text-gray-900 font-mono">{formatCurrency(stats.totalPlanned)}</strong></span>
                            </div>
                        </div>

                        {/* Breakdown Tiles */}
                        <div className={cn(
                            "grid gap-2.5 pt-3 border-t border-gray-100",
                            stats.totalIncome > 0 ? "grid-cols-3" : "grid-cols-2"
                        )}>
                            <div className="bg-rose-50/50 p-3 rounded-2xl border border-rose-100/60 flex flex-col items-center text-center">
                                <div className="flex items-center space-x-1 text-rose-600 mb-1">
                                    <TrendingDown size={13} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Spent</span>
                                </div>
                                <span className="text-sm sm:text-base font-bold font-mono text-rose-700">
                                    {formatCurrency(stats.totalExpense)}
                                </span>
                            </div>

                            <div className="bg-blue-50/50 p-3 rounded-2xl border border-blue-100/60 flex flex-col items-center text-center">
                                <div className="flex items-center space-x-1 text-blue-600 mb-1">
                                    <Target size={13} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Budget</span>
                                </div>
                                <span className="text-sm sm:text-base font-bold font-mono text-blue-700">
                                    {formatCurrency(stats.totalPlanned)}
                                </span>
                            </div>

                            {stats.totalIncome > 0 && (
                                <div className="bg-emerald-50/50 p-3 rounded-2xl border border-emerald-100/60 flex flex-col items-center text-center">
                                    <div className="flex items-center space-x-1 text-emerald-600 mb-1">
                                        <TrendingUp size={13} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Inflow</span>
                                    </div>
                                    <span className="text-sm sm:text-base font-bold font-mono text-emerald-700">
                                        {formatCurrency(stats.totalIncome)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Dedicated Pool Cash Balance Row if inflows exist */}
                        {stats.totalIncome > 0 && (
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Wallet size={14} className="text-gray-500" />
                                    <span className="font-medium">Pool Cash Balance</span>
                                </div>
                                <div className={cn(
                                    "font-bold font-mono",
                                    stats.netAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {stats.netAmount >= 0 ? '+' : ''}{formatCurrency(stats.netAmount)}
                                </div>
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Unplanned Trip State */}
                        <div className={cn(
                            "grid gap-2.5",
                            stats.totalIncome > 0 ? "grid-cols-2" : "grid-cols-2"
                        )}>
                            <div className="bg-rose-50/50 p-3.5 rounded-2xl border border-rose-100/60 flex flex-col items-center text-center">
                                <div className="flex items-center space-x-1 text-rose-600 mb-1">
                                    <TrendingDown size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-wider">Actual Spent</span>
                                </div>
                                <span className="text-base sm:text-lg font-bold font-mono text-rose-700">
                                    {formatCurrency(stats.totalExpense)}
                                </span>
                            </div>

                            {stats.totalIncome > 0 ? (
                                <div className="bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100/60 flex flex-col items-center text-center">
                                    <div className="flex items-center space-x-1 text-emerald-600 mb-1">
                                        <TrendingUp size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-wider">Total Inflow</span>
                                    </div>
                                    <span className="text-base sm:text-lg font-bold font-mono text-emerald-700">
                                        {formatCurrency(stats.totalIncome)}
                                    </span>
                                </div>
                            ) : (
                                <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-100 flex flex-col items-center text-center">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">Activity</span>
                                    <span className="text-base sm:text-lg font-bold text-gray-800">
                                        {eventTransactions.length + eventLogsList.length} items
                                    </span>
                                </div>
                            )}
                        </div>

                        {stats.totalIncome > 0 && (
                            <div className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50 rounded-2xl border border-gray-100 text-xs">
                                <div className="flex items-center space-x-2 text-gray-600">
                                    <Wallet size={14} className="text-gray-500" />
                                    <span className="font-medium">Net Pool Balance</span>
                                </div>
                                <div className={cn(
                                    "font-bold font-mono",
                                    stats.netAmount >= 0 ? "text-emerald-600" : "text-rose-600"
                                )}>
                                    {stats.netAmount >= 0 ? '+' : ''}{formatCurrency(stats.netAmount)}
                                </div>
                            </div>
                        )}

                        {isPlansVisible && (
                            <div className="flex items-center justify-between p-3.5 bg-blue-50/60 rounded-2xl border border-blue-100/70 text-xs text-blue-900">
                                <div className="flex items-center space-x-2">
                                    <Target size={15} className="text-blue-600 shrink-0" />
                                    <span className="font-medium">No planned budget set</span>
                                </div>
                                <button
                                    onClick={() => navigate(`/plans/new?eventId=${id}`)}
                                    className="px-3 py-1 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-95 transition-all shadow-sm shadow-blue-500/20 shrink-0"
                                >
                                    Set Budget
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Custom Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl">
                {(['transactions', 'logs', 'plans'] as const)
                    .filter(tab => {
                        if (tab === 'transactions') return isTransactionsVisible;
                        if (tab === 'logs') return isLogsVisible;
                        if (tab === 'plans') return isPlansVisible;
                        return true;
                    })
                    .map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg capitalize transition-all",
                                activeTab === tab
                                    ? "bg-white text-gray-900 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
            </div>

            {/* Tab Content */}
            <div className="space-y-6 pb-24">
                {activeTab === 'transactions' && (
                    <section className="space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between w-full sm:w-auto sm:space-y-2 sm:flex-col sm:items-start">
                                <h2 className="text-base font-bold text-gray-900">Actual Transactions</h2>
                                <button
                                    onClick={() => navigate(`/add?eventId=${id}`)}
                                    className="sm:hidden bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 active:scale-95 transition-all shadow-md shadow-blue-100"
                                >
                                    <Plus size={14} />
                                    <span>Add</span>
                                </button>
                            </div>
                            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                                <div className="flex p-0.5 bg-gray-100 rounded-xl w-fit">
                                    <button
                                        onClick={() => setTransactionView('all')}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                                            transactionView === 'all'
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        All
                                    </button>
                                    <button
                                        onClick={() => setTransactionView('monthly')}
                                        className={cn(
                                            "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                                            transactionView === 'monthly'
                                                ? "bg-white text-blue-600 shadow-sm"
                                                : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        Monthly
                                    </button>
                                </div>
                                <button
                                    onClick={() => navigate(`/add?eventId=${id}`)}
                                    className="hidden sm:flex bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold items-center justify-center space-x-2 active:scale-95 transition-all shadow-md shadow-blue-100 self-center"
                                >
                                    <Plus size={16} />
                                    <span>Add</span>
                                </button>
                            </div>
                        </div>

                        {transactionView === 'monthly' && displayedTransactions.length > 0 && (
                            <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3 text-xs">
                                <div className="flex items-center space-x-2">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <span className="text-blue-800 font-bold">
                                        Current Month: {format(new Date(), 'MMMM yyyy')} ({monthlyStats.count} {monthlyStats.count === 1 ? 'transaction' : 'transactions'})
                                    </span>
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Spent</span>
                                        <span className="text-red-600 font-bold font-mono">{formatCurrency(monthlyStats.expense)}</span>
                                    </div>
                                    {monthlyStats.income > 0 && (
                                        <div>
                                            <span className="text-[10px] text-gray-400 block font-bold uppercase tracking-wider">Income</span>
                                            <span className="text-green-600 font-bold font-mono">{formatCurrency(monthlyStats.income)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="space-y-3">
                            {displayedTransactions.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm italic font-medium">
                                        {transactionView === 'monthly'
                                            ? `No records found for ${format(new Date(), 'MMMM yyyy')}.`
                                            : 'No records found.'}
                                    </p>
                                    {transactionView === 'monthly' && eventTransactions.length > 0 && (
                                        <button
                                            onClick={() => setTransactionView('all')}
                                            className="mt-3 text-xs text-blue-600 font-bold hover:underline"
                                        >
                                            View all transactions
                                        </button>
                                    )}
                                </div>
                            ) : (
                                displayedTransactions.map((t) => (
                                    <div
                                        key={t.id}
                                        onClick={() => navigate(`/edit/${t.id}`)}
                                        className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 cursor-pointer active:scale-[0.99] hover:bg-gray-50/50 transition-all"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={cn("p-2 rounded-full", t.type === 'expense' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500")}>
                                                {t.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                    {t.note || t.category}
                                                    {t.billImage && (
                                                        <span title="Bill Attached" className="text-blue-500 shrink-0 inline-flex items-center">
                                                            <Paperclip size={12} className="stroke-[2.5]" />
                                                        </span>
                                                    )}
                                                </p>
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
                )}

                {activeTab === 'logs' && (
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Custom/Offline Logs</h2>
                            <button
                                onClick={() => navigate(`/logs/new?eventId=${id}`)}
                                className="bg-orange-100 text-orange-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 active:scale-95 transition-transform"
                            >
                                <Plus size={16} />
                                <span>Add Log</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {eventLogsList.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm italic font-medium">No log entries.</p>
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
                    </section>
                )}

                {activeTab === 'plans' && (
                    <section>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-gray-900">Trip/Event Plans</h2>
                            <button
                                onClick={() => navigate(`/plans/new?eventId=${id}`)}
                                className="bg-blue-100 text-blue-600 px-4 py-2 rounded-lg text-sm font-medium flex items-center space-x-2 active:scale-95 transition-transform"
                            >
                                <Plus size={16} />
                                <span>Add Plan</span>
                            </button>
                        </div>
                        <div className="space-y-3">
                            {eventPlansList.length === 0 ? (
                                <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                                    <p className="text-gray-400 text-sm italic font-medium">No tentative plans created.</p>
                                </div>
                            ) : (
                                eventPlansList.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => navigate(`/plans/edit/${p.id}`)}
                                        className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 cursor-pointer active:bg-gray-50 transition-colors relative group"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="p-2 rounded-full bg-blue-50 text-blue-500">
                                                <Calendar size={20} />
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">{p.description}</p>
                                                <p className="text-xs text-gray-500">{format(parseISO(p.date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-3">
                                            <span className="font-bold text-sm text-blue-600">
                                                {formatCurrency(p.amount)}
                                            </span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    deleteEventPlan(p.id);
                                                }}
                                                className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}
            </div>
            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 max-w-sm w-full">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Event/Log?</h3>
                        <p className="text-sm text-gray-600 mb-6">
                            This will delete the event/log but keep all transactions. Transactions will no longer be linked to this event/log.
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
