import { useNavigate } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import {
    format,
    startOfMonth,
    endOfMonth,
    isWithinInterval,
    isSameDay,
    startOfWeek,
    addDays,
    addWeeks,
    addMonths,
    eachDayOfInterval
} from 'date-fns';
import {
    Eye,
    EyeOff,
    ArrowRightLeft,
    ArrowUpRight,
    ArrowDownRight,
    Plus,
    BookOpen,
    ChevronLeft,
    ChevronRight,
    Paperclip,
    ArrowUp,
    ArrowDown,
    TrendingUp,
    CreditCard,
    Landmark
} from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
    const navigate = useNavigate();
    const {
        accounts,
        transactions,
        events,
        isBalanceHidden,
        toggleBalanceHidden,
        isAccountTypeHidden,
        getCreditCardStats
    } = useFinanceStore();

    const [spendViewMode, setSpendViewMode] = useState<'week' | 'month'>('week');
    const [weekOffset, setWeekOffset] = useState(0);
    const [monthOffset, setMonthOffset] = useState(0);

    const dashboardMonthDate = useMemo(() => addMonths(new Date(), monthOffset), [monthOffset]);

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => {
            if (acc.includeInNetWorth === false) {
                return sum;
            }

            let group: 'banking' | 'investment';
            if (acc.group) {
                group = acc.group;
            } else {
                const isInvestmentType = acc.type === 'stock' || acc.type === 'mutual-fund' || acc.type === 'land' || acc.type === 'insurance' || acc.type === 'other';
                group = isInvestmentType ? 'investment' : 'banking';
            }

            if (isAccountTypeHidden(acc.type, group)) {
                return sum;
            }

            if (acc.type === 'loan') {
                return sum - acc.balance;
            }

            if (acc.type === 'stock' || acc.type === 'mutual-fund') {
                return sum + (acc.currentAmount !== undefined ? acc.currentAmount : acc.balance);
            }

            return sum + acc.balance;
        }, 0);
    }, [accounts, isAccountTypeHidden]);

    // Week Spend Data
    const weekSpendData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        let targetWeekStart = startOfWeek(todayStart, { weekStartsOn: 1 }); // Monday is 1

        if (weekOffset !== 0) {
            targetWeekStart = addWeeks(targetWeekStart, weekOffset);
        }

        const relevantAccountTypes = new Set(['savings', 'cash', 'credit', 'online-wallet', 'other', 'loan']);

        const days = Array.from({ length: 7 }).map((_, i) => {
            const date = addDays(targetWeekStart, i);
            const spend = transactions
                .filter(t => {
                    if ((t.type !== 'expense' && t.type !== 'income') || t.excludeFromBalance) return false;
                    if (!isSameDay(new Date(t.date), date)) return false;

                    const account = accounts.find(a => a.id === t.accountId);
                    return account && relevantAccountTypes.has(account.type) && account.includeInNetWorth !== false;
                })
                .reduce((sum, t) => {
                    return sum + (t.type === 'expense' ? t.amount : -t.amount);
                }, 0);

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
            const hasSpendVariation = maxSpend > minSpend;
            return {
                ...d,
                isFuture,
                isMost: !isFuture && hasSpendVariation && d.spend === maxSpend,
                isLeast: !isFuture && hasSpendVariation && d.spend === minSpend
            };
        });
    }, [transactions, accounts, weekOffset]);

    // Month Spend Data (calculates most and least spent days in the selected month)
    const monthSpendData = useMemo(() => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const targetMonthStart = startOfMonth(dashboardMonthDate);
        const targetMonthEnd = endOfMonth(dashboardMonthDate);
        const allDays = eachDayOfInterval({ start: targetMonthStart, end: targetMonthEnd });

        const relevantAccountTypes = new Set(['savings', 'cash', 'credit', 'online-wallet', 'other', 'loan']);

        const days = allDays.map(date => {
            const spend = transactions
                .filter(t => {
                    if ((t.type !== 'expense' && t.type !== 'income') || t.excludeFromBalance) return false;
                    if (!isSameDay(new Date(t.date), date)) return false;

                    const account = accounts.find(a => a.id === t.accountId);
                    return account && relevantAccountTypes.has(account.type) && account.includeInNetWorth !== false;
                })
                .reduce((sum, t) => sum + (t.type === 'expense' ? t.amount : -t.amount), 0);

            return {
                date,
                dayNumber: date.getDate(),
                spend,
                isToday: isSameDay(date, now)
            };
        });

        let maxSpend = -Infinity;
        let minSpend = Infinity;
        let hasPastDays = false;

        days.forEach(d => {
            if (d.date > todayStart) return;
            hasPastDays = true;
            if (d.spend > maxSpend) maxSpend = d.spend;
            if (d.spend < minSpend) minSpend = d.spend;
        });

        const hasSpendVariation = hasPastDays && maxSpend > minSpend;

        const mappedDays = days.map(d => {
            const isFuture = d.date > todayStart;
            return {
                ...d,
                isFuture,
                isMost: !isFuture && hasSpendVariation && d.spend === maxSpend,
                isLeast: !isFuture && hasSpendVariation && d.spend === minSpend
            };
        });

        const mostSpentDay = mappedDays.find(d => d.isMost);
        const leastSpentDays = mappedDays.filter(d => d.isLeast);

        // Leading empty days for Monday-based week (Mon = 0, Sun = 6)
        const startDayOfWeek = (targetMonthStart.getDay() + 6) % 7;

        return {
            days: mappedDays,
            startDayOfWeek,
            mostSpentDay,
            leastSpentDays,
            leastSpentDay: leastSpentDays[0],
            hasSpendVariation,
            maxSpend: hasSpendVariation ? maxSpend : 0,
            minSpend: hasSpendVariation ? minSpend : 0
        };
    }, [transactions, accounts, dashboardMonthDate]);

    // Period Transactions for Financial Overview
    const periodStart = useMemo(() => startOfMonth(dashboardMonthDate), [dashboardMonthDate]);
    const periodEnd = useMemo(() => endOfMonth(dashboardMonthDate), [dashboardMonthDate]);

    const periodTransactions = useMemo(() => {
        const reportAccountIds = new Set(
            accounts
                .filter(a => a.includeInReports !== false && a.includeInNetWorth !== false)
                .map(a => a.id)
        );

        return transactions.filter(t => {
            const account = accounts.find(a => a.id === t.accountId);
            if (account && account.includeInNetWorth === false) return false;
            if (t.toAccountId) {
                const toAccount = accounts.find(a => a.id === t.toAccountId);
                if (toAccount && toAccount.includeInNetWorth === false) return false;
            }

            if (t.eventId) {
                const event = events.find(e => e.id === t.eventId);
                if (event?.includeInReports === false) return false;
            }

            const isIncluded = t.excludeFromBalance ||
                reportAccountIds.size === 0 ||
                reportAccountIds.has(t.accountId) ||
                (t.toAccountId && reportAccountIds.has(t.toAccountId));

            if (!isIncluded) return false;

            return isWithinInterval(new Date(t.date), { start: periodStart, end: periodEnd });
        });
    }, [transactions, accounts, events, periodStart, periodEnd]);

    const isInvestment = (t: any) => {
        if (t.type !== 'transfer' || !t.toAccountId) return false;
        const toAccount = accounts.find(a => a.id === t.toAccountId);
        return toAccount?.type === 'stock' || toAccount?.type === 'mutual-fund';
    };

    // Financial Overview Totals
    const { totalPeriodIncome, totalPeriodExpense, totalInvestment, totalCreditCardPayment, totalLoanRepayment } = useMemo(() => {
        return periodTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.totalPeriodIncome += t.amount;
            else if (t.type === 'expense') {
                if (!t.excludeFromBalance) acc.totalPeriodExpense += t.amount;
            }
            else if (isInvestment(t)) acc.totalInvestment += t.amount;
            else if (t.type === 'transfer') {
                if (t.toAccountId) {
                    const toAccount = accounts.find(a => a.id === t.toAccountId);
                    if (toAccount?.type === 'credit') {
                        acc.totalCreditCardPayment += t.amount;
                    } else if (toAccount?.type === 'loan') {
                        acc.totalLoanRepayment += t.amount;
                    }
                }
            }
            return acc;
        }, { totalPeriodIncome: 0, totalPeriodExpense: 0, totalInvestment: 0, totalCreditCardPayment: 0, totalLoanRepayment: 0 });
    }, [periodTransactions, accounts]);

    // Credit Card Spends
    const creditCardAsOfDate = useMemo(() => {
        const today = new Date();
        return (dashboardMonthDate.getMonth() === today.getMonth() && dashboardMonthDate.getFullYear() === today.getFullYear()) ? today : periodEnd;
    }, [dashboardMonthDate, periodEnd]);

    const creditCardStats = useMemo(() => {
        return accounts
            .filter(a => a.type === 'credit' && a.includeInReports !== false && a.includeInNetWorth !== false)
            .reduce((acc, card) => {
                const stats = getCreditCardStats(card.id, creditCardAsOfDate);
                return {
                    billed: acc.billed + stats.billed,
                    unbilled: acc.unbilled + stats.unbilled
                };
            }, { billed: 0, unbilled: 0 });
    }, [accounts, getCreditCardStats, creditCardAsOfDate]);

    // Recent Transactions
    const filteredTransactions = useMemo(() => {
        const targetAccountIds = new Set(
            accounts
                .filter(a => (a.isPrimary || a.type === 'credit' || a.includeInReports !== false) && a.includeInNetWorth !== false)
                .map(a => a.id)
        );

        if (targetAccountIds.size === 0) {
            return transactions
                .filter(t => {
                    if (t.excludeFromBalance) return false;
                    const account = accounts.find(a => a.id === t.accountId);
                    if (account && account.includeInNetWorth === false) return false;
                    if (t.toAccountId) {
                        const toAccount = accounts.find(a => a.id === t.toAccountId);
                        if (toAccount && toAccount.includeInNetWorth === false) return false;
                    }
                    return true;
                })
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
        const sorted = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted[0].date;
    }, [transactions]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const handlePrevSpend = () => {
        if (spendViewMode === 'week') {
            setWeekOffset(prev => prev - 1);
        } else {
            setMonthOffset(prev => prev - 1);
        }
    };

    const handleNextSpend = () => {
        if (spendViewMode === 'week') {
            setWeekOffset(prev => Math.min(0, prev + 1));
        } else {
            setMonthOffset(prev => Math.min(0, prev + 1));
        }
    };

    return (
        <div className="space-y-6 pb-12">
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
                <div className="flex justify-between items-start">
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
                </div>
            </div>

            {/* Spend Visual (Week / Month view with Most & Least Spent Days) */}
            <section>
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center space-x-3">
                        <h3 className="text-lg font-bold text-gray-900">
                            {spendViewMode === 'week'
                                ? (weekOffset === 0 ? 'Current Week' : weekOffset === -1 ? 'Last Week' : `${Math.abs(weekOffset)} Weeks Ago`)
                                : format(dashboardMonthDate, 'MMMM yyyy')}
                        </h3>
                        <div className="flex bg-gray-100 p-0.5 rounded-lg text-xs font-semibold">
                            <button
                                onClick={() => setSpendViewMode('week')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all text-xs font-bold",
                                    spendViewMode === 'week' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setSpendViewMode('month')}
                                className={cn(
                                    "px-2.5 py-1 rounded-md transition-all text-xs font-bold",
                                    spendViewMode === 'month' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Month
                            </button>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handlePrevSpend}
                            className="p-1 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                            title="Previous"
                        >
                            <ChevronLeft size={20} />
                        </button>
                        <button
                            onClick={handleNextSpend}
                            disabled={spendViewMode === 'week' ? weekOffset === 0 : monthOffset === 0}
                            className={cn(
                                "p-1 rounded-lg transition-colors",
                                (spendViewMode === 'week' ? weekOffset === 0 : monthOffset === 0)
                                    ? "bg-gray-50 text-gray-300 cursor-not-allowed"
                                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                            )}
                            title="Next"
                        >
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                    {spendViewMode === 'week' ? (
                        /* Weekly Visual */
                        <>
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
                        </>
                    ) : (
                        /* Monthly Visual with Most & Least Spent Highlights */
                        <div className="space-y-4">
                            {/* Highlight Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-red-50/70 border border-red-100 rounded-xl p-3 flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                        {monthSpendData.mostSpentDay ? monthSpendData.mostSpentDay.dayNumber : '-'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">Most Spent Day</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">
                                            {monthSpendData.mostSpentDay ? format(monthSpendData.mostSpentDay.date, 'EEE, MMM d') : 'No spend'}
                                        </p>
                                        <p className="text-xs font-black text-red-600">
                                            {monthSpendData.mostSpentDay && monthSpendData.mostSpentDay.spend > 0
                                                ? formatCurrency(monthSpendData.mostSpentDay.spend)
                                                : '₹0'}
                                        </p>
                                    </div>
                                </div>
                                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3 flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                                        {monthSpendData.leastSpentDay ? monthSpendData.leastSpentDay.dayNumber : '-'}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Least Spent Day</p>
                                        <p className="text-xs font-bold text-gray-900 truncate">
                                            {monthSpendData.leastSpentDays && monthSpendData.leastSpentDays.length > 1
                                                ? `${monthSpendData.leastSpentDays.length} days (lowest)`
                                                : monthSpendData.leastSpentDay
                                                    ? format(monthSpendData.leastSpentDay.date, 'EEE, MMM d')
                                                    : 'No spend'}
                                        </p>
                                        <p className="text-xs font-black text-emerald-600">
                                            {monthSpendData.leastSpentDay ? formatCurrency(monthSpendData.leastSpentDay.spend) : '₹0'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Month Calendar Grid */}
                            <div>
                                <div className="grid grid-cols-7 text-center mb-2">
                                    {['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'].map((d) => (
                                        <span key={d} className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                                            {d}
                                        </span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {Array.from({ length: monthSpendData.startDayOfWeek }).map((_, i) => (
                                        <div key={`empty-${i}`} className="h-10" />
                                    ))}
                                    {monthSpendData.days.map((day) => (
                                        <div
                                            key={day.dayNumber}
                                            className={cn(
                                                "h-11 flex flex-col items-center justify-center rounded-xl transition-all relative",
                                                day.isMost ? "bg-red-50 text-red-700 ring-1 ring-red-200" :
                                                    day.isLeast ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200" :
                                                        day.isToday ? "bg-blue-50 text-blue-700 ring-1 ring-blue-300" :
                                                            day.isFuture ? "opacity-30 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                            )}
                                        >
                                            <div
                                                className={cn(
                                                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                                    day.isMost ? "bg-red-500 text-white shadow-sm" :
                                                        day.isLeast ? "bg-emerald-500 text-white shadow-sm" :
                                                            day.isToday ? "bg-blue-600 text-white shadow-sm" :
                                                                "text-gray-700"
                                                )}
                                            >
                                                {day.dayNumber}
                                            </div>
                                            {!day.isFuture ? (
                                                <span className={cn(
                                                    "text-[8px] font-bold tracking-tight truncate max-w-full px-0.5",
                                                    day.isMost ? "text-red-600 font-black" :
                                                        day.isLeast ? "text-emerald-600 font-black" :
                                                            day.spend > 0 ? "text-gray-500" : "text-gray-400"
                                                )}>
                                                    {day.spend !== 0 ? `₹${Math.round(day.spend).toLocaleString('en-IN')}` : '₹0'}
                                                </span>
                                            ) : (
                                                <span className="text-[8px] text-transparent">-</span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-2 flex justify-center space-x-4 sm:space-x-6 text-[10px] text-gray-400 uppercase tracking-widest font-semibold border-t border-gray-50">
                                <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-red-500"></div><span>Most Spent</span></div>
                                <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span>Least Spent</span></div>
                                <div className="flex items-center space-x-1.5"><div className="w-2 h-2 rounded-full bg-blue-600"></div><span>Today</span></div>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Financial Overview */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Financial Overview</h3>
                    <div className="flex items-center space-x-1.5">
                        <span className="text-xs text-gray-500 font-bold">{format(dashboardMonthDate, 'MMMM yyyy')}</span>
                        <button
                            onClick={() => setMonthOffset(prev => prev - 1)}
                            className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                            title="Previous Month"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={() => setMonthOffset(prev => Math.min(0, prev + 1))}
                            disabled={monthOffset === 0}
                            className={cn(
                                "p-1 rounded-md transition-colors",
                                monthOffset === 0 ? "text-gray-200 cursor-not-allowed" : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
                            )}
                            title="Next Month"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                <ArrowUp size={18} />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">Total Income</span>
                        </div>
                        <span className="text-base font-bold text-green-600">{formatCurrency(totalPeriodIncome)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                <ArrowDown size={18} />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">Total Expenses</span>
                        </div>
                        <span className="text-base font-bold text-red-600">{formatCurrency(totalPeriodExpense)}</span>
                    </div>
                    <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-3">
                            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                <TrendingUp size={18} />
                            </div>
                            <span className="text-sm font-semibold text-gray-600">Total Invested</span>
                        </div>
                        <span className="text-base font-bold text-purple-600">{formatCurrency(totalInvestment)}</span>
                    </div>
                    {totalCreditCardPayment > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                                    <CreditCard size={18} />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">Credit Card Payments</span>
                            </div>
                            <span className="text-base font-bold text-indigo-600">{formatCurrency(totalCreditCardPayment)}</span>
                        </div>
                    )}
                    {totalLoanRepayment > 0 && (
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-teal-50 text-teal-600 rounded-xl">
                                    <Landmark size={18} />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">Loan Repayments</span>
                            </div>
                            <span className="text-base font-bold text-teal-600">{formatCurrency(totalLoanRepayment)}</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Credit Card Spends Summary */}
            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Credit Card Spends</h3>
                    <CreditCard size={16} className="text-gray-400" />
                </div>
                <div className="grid grid-cols-2 divide-x divide-gray-50">
                    <div className="px-5 py-6 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Billed</span>
                        <span className="text-lg font-bold text-purple-600">{formatCurrency(creditCardStats.billed)}</span>
                    </div>
                    <div className="px-5 py-6 flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Unbilled</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(creditCardStats.unbilled)}</span>
                    </div>
                </div>
            </section>

            {/* Recent Activity (At bottom) */}
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
                                            <p className="font-semibold text-gray-900 text-sm flex items-center gap-1.5">
                                                {isTransfer
                                                    ? `Transfer: ${fromAccount?.name || 'Unknown'} -> ${toAccount?.name || 'Unknown'}`
                                                    : (t.note || t.category)
                                                }
                                                {!isTransfer && t.billImage && (
                                                    <span title="Bill Attached" className="text-blue-500 shrink-0 inline-flex items-center">
                                                        <Paperclip size={12} className="stroke-[2.5]" />
                                                    </span>
                                                )}
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
        </div>
    );
}
