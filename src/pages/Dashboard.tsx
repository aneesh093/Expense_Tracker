import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, CreditCard, Eye, EyeOff, ArrowRightLeft } from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
    const navigate = useNavigate();
    const { accounts, transactions, events, isBalanceHidden, toggleBalanceHidden } = useFinanceStore();

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => {
            if (acc.type === 'credit' || acc.type === 'land' || acc.type === 'insurance') {
                return sum;
            }
            if (acc.type === 'loan') {
                return sum - acc.balance;
            }
            return sum + acc.balance;
        }, 0);
    }, [accounts]);

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
            .filter(t => isWithinInterval(new Date(t.date), { start, end }))
            .reduce((acc, t) => {
                if (t.type === 'income') acc.totalIncome += t.amount;
                else if (t.type === 'expense') acc.totalExpense += t.amount;
                return acc;
            }, { totalIncome: 0, totalExpense: 0 });
    }, [transactions]);


    const filteredTransactions = useMemo(() => {
        const primaryAccountIds = new Set(accounts.filter(a => a.isPrimary).map(a => a.id));

        // If no primary accounts are set, maybe show all? Or show none? 
        // User said "only display transactions from primary bank accounts".
        // Let's assume strict filtering. If no primary, show nothing? Or show all as fallback?
        // Let's show all if NO primary accounts exist, otherwise filter.
        if (primaryAccountIds.size === 0) return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return transactions
            .filter(t =>
                primaryAccountIds.has(t.accountId) ||
                (t.toAccountId && primaryAccountIds.has(t.toAccountId))
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
                <div
                    onClick={() => navigate('/settings')}
                    className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 font-bold cursor-pointer hover:bg-gray-200 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.1a2 2 0 0 1-1-1.72v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></svg>
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
                <div className="flex space-x-4">
                    <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 bg-green-400/20 w-fit p-1 rounded-full mb-2">
                            <ArrowUpRight size={16} className="text-green-300" />
                        </div>
                        <span className="text-xs text-green-100 block mb-1">Income</span>
                        <p className="font-bold">{isBalanceHidden ? '•••••' : formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="flex-1 bg-white/10 rounded-xl p-3 backdrop-blur-sm">
                        <div className="flex items-center space-x-2 bg-red-400/20 w-fit p-1 rounded-full mb-2">
                            <ArrowDownRight size={16} className="text-red-300" />
                        </div>
                        <span className="text-xs text-red-100 block mb-1">Expense</span>
                        <p className="font-bold">{isBalanceHidden ? '•••••' : formatCurrency(totalExpense)}</p>
                    </div>
                </div>
            </div>

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
                    <button onClick={() => navigate('/transactions')} className="text-sm text-blue-600 font-medium pb-1">See all</button>
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
                                                    : (t.eventId
                                                        ? (events.find(e => e.id === t.eventId)?.name || t.note || t.category)
                                                        : (t.note || t.category)
                                                    )
                                                }
                                            </p>
                                            <p className="text-xs text-gray-500">{format(new Date(t.date), 'MMM dd, h:mm a')}</p>
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
                                    .filter(t => t.accountId === acc.id || t.toAccountId === acc.id)
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
