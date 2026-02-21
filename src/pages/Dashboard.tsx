import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { format, startOfMonth, endOfMonth, isWithinInterval, isSameDay, startOfWeek, addDays } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, CreditCard, Eye, EyeOff, ArrowRightLeft, Plus, BookOpen } from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
    const navigate = useNavigate();
    const { accounts, transactions, events, isBalanceHidden, toggleBalanceHidden, isAccountTypeHidden } = useFinanceStore();

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => {
            // Determine the group for this account
            // If account has explicit group, use it. Otherwise infer from type.
            let group: 'banking' | 'investment';
            if (acc.group) {
                group = acc.group;
            } else {
                // Fallback: infer group from type (for legacy accounts)
                const isInvestmentType = acc.type === 'stock' || acc.type === 'mutual-fund' || acc.type === 'land' || acc.type === 'insurance' || acc.type === 'other';
                group = isInvestmentType ? 'investment' : 'banking';
            }

            // Check if this account type is hidden from Net Worth
            if (isAccountTypeHidden(acc.type, group)) {
                return sum;
            }

            // Loans are liabilities - subtract from net worth
            if (acc.type === 'loan') {
                return sum - acc.balance;
            }

            // All other account types (if not hidden) add to net worth
            return sum + acc.balance;
        }, 0);
    }, [accounts, isAccountTypeHidden]);

    const displayedAccounts = useMemo(() => {
        const primaryAccounts = accounts.filter(acc => acc.isPrimary);
        // If there are primary accounts, show only them. 
        // Otherwise show all (or maybe top 3 by balance if you want to limit?).
        // Let's mirror the transaction logic: if NO primary, show all.
        return primaryAccounts.length > 0 ? primaryAccounts : accounts;
    }, [accounts]);

    // Calculate monthly totals
    const { totalIncome, totalExpense } = useMemo(() => {
        const now = new Date();
        const start = startOfMonth(now);
        const end = endOfMonth(now);

        return transactions
            .filter(t => !t.excludeFromBalance && isWithinInterval(new Date(t.date), { start, end }))
            .reduce((acc, t) => {
                if (t.type === 'income') {
                    acc.totalIncome += t.amount;
                } else if (t.type === 'expense') {
                    acc.totalExpense += t.amount;
                } else if (t.type === 'transfer' && t.toAccountId) {
                    const toAccount = accounts.find(a => a.id === t.toAccountId);
                    if (toAccount) {
                        if (toAccount.type === 'credit' || toAccount.type === 'loan' || toAccount.type === 'stock' || toAccount.type === 'mutual-fund') {
                            acc.totalExpense += t.amount;
                        }
                    }
                }
                return acc;
            }, { totalIncome: 0, totalExpense: 0 });
    }, [transactions, accounts]);


    const weekSpendData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfCurrentWeek = startOfWeek(todayStart, { weekStartsOn: 1 }); // Monday is 1
        const relevantAccountTypes = new Set(['savings', 'cash', 'credit']);

        const days = Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(startOfCurrentWeek, i);
            const spend = transactions
                .filter(t => {
                    if (t.type !== 'expense' || t.excludeFromBalance) return false;
                    if (!isSameDay(new Date(t.date), date)) return false;

                    const account = accounts.find(a => a.id === t.accountId);
                    return account && relevantAccountTypes.has(account.type);
                })
                .reduce((sum, t) => sum + t.amount, 0);

            return {
                date,
                dayNumber: date.getDate(),
                spend,
                isToday: isSameDay(date, now)
            };
        });

        let maxSpend = -Infinity;
        let minSpend = Infinity;

        days.forEach(d => {
            if (d.date > todayStart) return;
            if (d.spend > maxSpend) maxSpend = d.spend;
            if (d.spend < minSpend) minSpend = d.spend;
        });

        return days.map(d => {
            const isFuture = d.date > todayStart;
            // Only highlight if there's a difference between max and min. If all are 0, no highlights.
            const hasSpendVariation = maxSpend > minSpend;
            return {
                ...d,
                isFuture,
                isMost: !isFuture && hasSpendVariation && d.spend === maxSpend,
                isLeast: !isFuture && hasSpendVariation && d.spend === minSpend
            };
        });
    }, [transactions, accounts]);

    const filteredTransactions = useMemo(() => {
        const targetAccountIds = new Set(
            accounts.filter(a => a.isPrimary || a.type === 'credit').map(a => a.id)
        );

        // If no primary accounts or credit cards exist, maybe show all? Or show none? 
        // User said "only display transactions from primary bank accounts".
        // Now adding credit cards. Let's show all if NO targets exist, otherwise filter.
        if (targetAccountIds.size === 0) {
            return transactions
                .filter(t => !t.excludeFromBalance)
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return transactions
            .filter(t =>
                !t.excludeFromBalance &&
                (targetAccountIds.has(t.accountId) ||
                    (t.toAccountId && targetAccountIds.has(t.toAccountId)))
            )
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, accounts]);

    const recentTransactions = filteredTransactions.slice(0, 5);

    const lastUpdated = useMemo(() => {
        if (transactions.length === 0) return null;
        // Sort all transactions to find absolute latest, regardless of filter?
        // Usually "Last Updated" refers to the latest activity in the system.
        const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted[0].date;
    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
                    <p className="text-sm text-gray-500">{format(new Date(), 'EEEE, MMMM do')}</p>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => navigate('/settings/user-guide')}
                        title="User Guide"
                        className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-emerald-100"
                    >
                        <BookOpen size={20} />
                    </button>
                    <button
                        onClick={() => navigate('/add')}
                        title="Add Transaction"
                        className="h-10 w-10 bg-blue-600 text-white rounded-full flex items-center justify-center shadow-sm active:scale-95 transition-transform hover:bg-blue-700"
                    >
                        <Plus size={24} />
                    </button>
                    <div
                        onClick={() => navigate('/settings')}
                        title="Settings"
                        className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
                    </div>
                </div>
            </header>

            {/* Net Worth Card */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <p className="text-blue-100 text-sm font-medium mb-1">Total Net Worth</p>
                        <h2 className="text-4xl font-bold tracking-tight">
                            {isBalanceHidden ? '₹ •••••' : formatCurrency(totalBalance)}
                        </h2>
                        <p className="text-blue-200 text-xs mt-1">* Land & Insurance assets are not included in Net Worth</p>
                    </div>
                    <button
                        onClick={toggleBalanceHidden}
                        className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors backdrop-blur-sm"
                    >
                        {isBalanceHidden ? <EyeOff className="text-blue-100" size={24} /> : <Eye className="text-blue-100" size={24} />}
                    </button>
                    {/* <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                        <IndianRupee size={24} />
                    </div> */}
                </div>
                <div className="flex gap-2 md:gap-4 mb-4">
                    <div className="flex-1 bg-white/10 rounded-xl p-2 md:p-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 bg-green-400/20 w-fit p-1 rounded-full mb-2">
                            <ArrowUpRight size={16} className="text-green-300" />
                        </div>
                        <span className="text-xs text-green-100 block mb-1">Income</span>
                        <p className="font-bold">{isBalanceHidden ? '•••••' : formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-2 md:p-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 bg-red-400/20 w-fit p-1 rounded-full mb-2">
                            <ArrowDownRight size={16} className="text-red-300" />
                        </div>
                        <span className="text-xs text-red-100 block mb-1">Expense</span>
                        <p className="font-bold">{isBalanceHidden ? '•••••' : formatCurrency(totalExpense)}</p>
                    </div>
                </div>
            </div>

            {/* Weekly Spend Visual */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Current Week</h3>
                </div>
                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center px-1 sm:px-4">
                        {weekSpendData.map((day, idx) => (
                            <div key={idx} className="flex flex-col items-center group">
                                <span className="text-[10px] text-gray-400 font-semibold mb-2 uppercase tracking-widest">
                                    {format(day.date, 'EEEEEE')}
                                </span>
                                <div
                                    className={cn(
                                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm font-bold relative transition-all mb-1",
                                        day.isMost ? "bg-red-500 text-white shadow-md shadow-red-200 ring-2 ring-red-100" :
                                            day.isLeast ? "bg-emerald-500 text-white shadow-md shadow-emerald-200 ring-2 ring-emerald-100" :
                                                "text-gray-700 bg-gray-50 hover:bg-gray-100",
                                        day.isToday && !day.isMost && !day.isLeast && "bg-blue-600 text-white shadow-md shadow-blue-200 ring-2 ring-blue-100",
                                        day.isToday && (day.isMost || day.isLeast) && "ring-2 ring-blue-600 ring-offset-2",
                                        day.isFuture && "opacity-40"
                                    )}
                                >
                                    {day.dayNumber}
                                </div>
                                {!day.isFuture ? (
                                    <span className={cn(
                                        "text-[9px] font-bold tracking-tighter truncate w-12 text-center",
                                        day.isMost ? "text-red-500" :
                                            day.isLeast ? "text-emerald-500" : "text-gray-500"
                                    )}>
                                        {formatCurrency(day.spend).replace('.00', '')}
                                    </span>
                                ) : (
                                    <span className="text-[9px] text-transparent tracking-tighter w-12 text-center">-</span>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-center space-x-4 sm:space-x-6 text-[10px] text-gray-400 uppercase tracking-widest font-semibold">
                        <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span>Most Spent</span></div>
                        <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>Least Spent</span></div>
                    </div>
                </div>
            </section>

            {/* Recent Activity */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                        {lastUpdated && (
                            <p className="text-xs text-gray-500 mt-1">
                                Last updated: {format(new Date(lastUpdated), 'MMM dd, h:mm a')}
                            </p>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No transactions yet.</p>
                        </div>
                    ) : (
                        recentTransactions.map((t) => {
                            const isTransfer = t.type === 'transfer';
                            const fromAccount = isTransfer ? accounts.find(a => a.id === t.accountId) : null;
                            const toAccount = isTransfer ? accounts.find(a => a.id === t.toAccountId) : null;

                            return (
                                <div
                                    key={t.id}
                                    className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100 transition-colors"
                                >
                                    <div className="flex items-center space-x-3">
                                        <div className={cn("p-2 rounded-full",
                                            isTransfer ? "bg-blue-50 text-blue-500" :
                                                t.type === 'expense' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
                                        )}>
                                            {isTransfer ? <ArrowRightLeft size={20} /> :
                                                t.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">
                                                {isTransfer
                                                    ? `Transfer: ${fromAccount?.name || 'Unknown'} -> ${toAccount?.name || 'Unknown'}`
                                                    : (t.note || t.category)
                                                }
                                            </p>
                                            <div className="flex items-center text-[10px] text-gray-500 space-x-1 mt-0.5">
                                                <span>{format(new Date(t.date), 'MMM dd, h:mm a')}</span>
                                                <span>•</span>
                                                <span>
                                                    {isTransfer ? 'Transfer' : accounts.find(a => a.id === t.accountId)?.name || 'Unknown Account'}
                                                </span>
                                                {t.eventId && (
                                                    <>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[100px]">
                                                            {events.find(e => e.id === t.eventId)?.name || 'Event'}
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <span className={cn("font-bold text-sm",
                                        isTransfer ? "text-blue-600" :
                                            t.type === 'expense' ? "text-gray-900" : "text-green-600"
                                    )}>
                                        {isTransfer ? '' : (t.type === 'expense' ? '-' : '+')}{formatCurrency(t.amount)}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

            {/* Accounts Preview */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Accounts</h3>
                <div className="space-y-3">
                    {displayedAccounts.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No matching accounts found.</p>
                        </div>
                    ) : (
                        displayedAccounts.slice(0, 3).map(acc => {
                            const isCredit = acc.type === 'credit';
                            const spentAmount = isCredit
                                ? transactions
                                    .filter(t => !t.excludeFromBalance && (t.accountId === acc.id || t.toAccountId === acc.id))
                                    .reduce((sum, t) => {
                                        if (t.accountId === acc.id) {
                                            return sum + (t.type === 'income' ? -t.amount : t.amount);
                                        }
                                        if (t.toAccountId === acc.id) {
                                            return sum + (t.type === 'transfer' ? -t.amount : 0);
                                        }
                                        return sum;
                                    }, 0)
                                : acc.balance;

                            return (
                                <div key={acc.id} className="bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border border-gray-100">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                                            <CreditCard size={20} />
                                        </div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{acc.name}</p>
                                            <p className="text-xs text-gray-500 capitalize">{acc.type}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {isCredit && <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Spent</p>}
                                        <span className="font-bold text-sm text-gray-900">
                                            {isBalanceHidden && !acc.isPrimary ? '•••••' : formatCurrency(spentAmount)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </section>

        </div>
    );
}
