import { useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { format, isWithinInterval } from 'date-fns';
import { ChevronLeft, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export function ReportTransactions() {
    const navigate = useNavigate();
    const location = useLocation();
    const { transactions, accounts, events, categories, eventLogs } = useFinanceStore();

    // Get filter state from navigation
    const { start, end, title, filter, selectedAccountId: initialAccountId } = (location.state as {
        start: Date;
        end: Date;
        title: string;
        filter: 'all' | 'manual' | 'core' | 'transfer' | 'mandate';
        selectedAccountId?: string;
    }) || {
        start: new Date(),
        end: new Date(),
        title: 'Transactions',
        filter: 'all',
        selectedAccountId: 'all'
    };

    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [selectedAccountId, setSelectedAccountId] = useState<string>(initialAccountId || 'all');
    const [customStart, setCustomStart] = useState<string>(format(new Date(start), 'yyyy-MM-dd'));
    const [customEnd, setCustomEnd] = useState<string>(format(new Date(end), 'yyyy-MM-dd'));

    const displayItems = useMemo(() => {
        const reportAccountIds = new Set(
            accounts
                .filter(a => {
                    const isTypeAllowed = a.isPrimary || a.type === 'credit' || a.type === 'cash' || a.type === 'savings' || a.type === 'fixed-deposit' || a.type === 'loan';
                    return isTypeAllowed && a.includeInReports !== false;
                })
                .map(a => a.id)
        );

        // Filter transactions
        const filteredTrans = transactions.filter(t => {
            const isManual = !!t.excludeFromBalance;

            // Date filter
            if (!isWithinInterval(new Date(t.date), {
                start: new Date(customStart),
                end: new Date(customEnd)
            })) return false;

            // Event filter
            if (t.eventId) {
                const event = events.find(e => e.id === t.eventId);
                if (event?.includeInReports === false) return false;
            }

            // Category filter
            if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

            // Account filter
            const isRelevantAccount = t.excludeFromBalance ||
                reportAccountIds.size === 0 ||
                reportAccountIds.has(t.accountId) ||
                (t.toAccountId && reportAccountIds.has(t.toAccountId));

            if (!isRelevantAccount) return false;

            if (filter === 'manual') if (!isManual) return false;
            if (filter === 'core') if (isManual) return false;
            if (filter === 'transfer') if (t.type !== 'transfer') return false;
            if (filter === 'mandate') if (!t.note?.startsWith('Mandate:')) return false;

            // Account selection filter
            if (selectedAccountId !== 'all') {
                if (t.accountId !== selectedAccountId && t.toAccountId !== selectedAccountId) return false;
            }

            return true;
        });

        // Add manual logs if applicable
        const filteredLogs = eventLogs.filter(l => {
            const event = events.find(e => e.id === l.eventId);
            if (event?.includeInReports === false) return false;

            // Logs are always 'manual' style for reports
            if (filter === 'core' || filter === 'transfer' || filter === 'mandate') return false;

            // Date filter
            if (!isWithinInterval(new Date(l.date), {
                start: new Date(customStart),
                end: new Date(customEnd)
            })) return false;

            // Logs don't have categories, so if category filter is active, exclude them
            // unless we want to show them under a 'Manual Log' category (could be an improvement)
            if (selectedCategory !== 'all') return false;

            // Logs don't have account IDs, so if account filter is active, exclude them
            if (selectedAccountId !== 'all') return false;

            return true;
        });

        // Create unified list
        const items = [
            ...filteredTrans.map(t => ({ ...t, itemType: 'transaction' as const })),
            ...filteredLogs.map(l => ({ ...l, itemType: 'log' as const }))
        ];

        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, eventLogs, accounts, customStart, customEnd, filter, selectedCategory, selectedAccountId]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="flex flex-col bg-gray-50 -mx-4 -mt-4 min-h-full">
            <header className="flex items-center p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="ml-2">
                    <h1 className="text-lg font-bold text-gray-900">
                        {filter === 'manual' ? 'Manual Expenses' :
                            filter === 'core' ? 'Core Expenses' :
                                filter === 'transfer' ? 'Transfers' :
                                    filter === 'mandate' ? 'Mandate Payments' : 'Transactions'}
                    </h1>
                    <p className="text-xs text-gray-500">
                        {title}
                    </p>
                </div>
            </header>

            {/* Filters Section */}
            <div className="bg-white p-4 border-b border-gray-100 space-y-3">
                <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input
                            type="date"
                            value={customStart}
                            onChange={(e) => setCustomStart(e.target.value)}
                            className="p-2 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                            type="date"
                            value={customEnd}
                            onChange={(e) => setCustomEnd(e.target.value)}
                            className="p-2 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Category</label>
                    <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="w-full p-2 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Categories</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col space-y-2">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Account</label>
                    <select
                        value={selectedAccountId}
                        onChange={(e) => setSelectedAccountId(e.target.value)}
                        className="w-full p-2 text-xs bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="all">All Accounts</option>
                        {accounts.map(acc => (
                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="p-4 space-y-3 pb-24">
                {displayItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <p className="text-gray-400 font-medium">No activity found.</p>
                    </div>
                ) : (
                    displayItems.map((item) => {
                        const isLog = item.itemType === 'log';

                        if (isLog) {
                            const l = item as any; // Cast to access log properties
                            const event = events.find(e => e.id === l.eventId);

                            return (
                                <div
                                    key={l.id}
                                    onClick={() => navigate(`/logs/edit/${l.id}`)}
                                    className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform"
                                >
                                    <div className="flex items-center space-x-3 overflow-hidden">
                                        <div className={cn("p-2.5 rounded-xl shrink-0",
                                            l.type === 'expense' ? "bg-orange-50 text-orange-500" : "bg-blue-50 text-blue-500"
                                        )}>
                                            <Calendar size={20} />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 text-sm truncate">
                                                {l.description}
                                            </p>
                                            <div className="flex items-center text-[10px] text-gray-500 space-x-1 mt-0.5">
                                                <span>{format(new Date(l.date), 'MMM dd')}</span>
                                                <span>•</span>
                                                <span className="truncate max-w-[80px]">{event?.name || 'Manual Log'}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn("font-bold text-sm whitespace-nowrap ml-3",
                                        l.type === 'expense' ? "text-gray-900" : "text-green-600"
                                    )}>
                                        {l.type === 'expense' ? '-' : '+'}{formatCurrency(l.amount)}
                                    </span>
                                </div>
                            );
                        }

                        const t = item as any;
                        return (
                            <div
                                key={t.id}
                                onClick={() => navigate(`/edit/${t.id}`)}
                                className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.98] transition-transform"
                            >
                                <div className="flex items-center space-x-3 overflow-hidden">
                                    <div className={cn("p-2.5 rounded-xl shrink-0",
                                        t.type === 'expense' ? "bg-red-50 text-red-500" :
                                            t.type === 'income' ? "bg-green-50 text-green-500" : "bg-indigo-50 text-indigo-500"
                                    )}>
                                        {t.type === 'expense' ? <ArrowDownRight size={20} /> :
                                            t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowRightLeft size={20} />}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 text-sm truncate">
                                            {t.eventId
                                                ? (events.find(e => e.id === t.eventId)?.name || t.note || t.category)
                                                : (t.note || t.category)
                                            }
                                        </p>
                                        <div className="flex items-center text-[10px] text-gray-500 space-x-1 mt-0.5">
                                            <span>{format(new Date(t.date), 'MMM dd')}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[80px]">{t.category}</span>
                                            <span>•</span>
                                            <span className="truncate max-w-[80px]">
                                                {accounts.find(a => a.id === t.accountId)?.name || 'Unknown'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <span className={cn("font-bold text-sm whitespace-nowrap ml-3",
                                    t.type === 'expense' ? "text-gray-900" :
                                        t.type === 'income' ? "text-green-600" : "text-indigo-600"
                                )}>
                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
