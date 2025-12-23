import { useNavigate } from 'react-router-dom';
import { useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { format, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { ArrowUpRight, ArrowDownRight, CreditCard } from 'lucide-react';
import { cn } from '../lib/utils';

export function Dashboard() {
    const navigate = useNavigate();
    const { accounts, transactions, events } = useFinanceStore();

    const totalBalance = useMemo(() => {
        return accounts.reduce((sum, acc) => {
            if (acc.type === 'loan') {
                return sum - acc.balance;
            }
            return sum + acc.balance;
        }, 0);
    }, [accounts]);

    const displayedAccounts = useMemo(() => {
        const allowedBanks = ['ICICI', 'HDFC', 'BOB'];
        return accounts.filter(acc =>
            allowedBanks.some(bank => acc.name.toUpperCase().includes(bank))
        );
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

    const recentTransactions = transactions.slice(0, 5);

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
                <p className="text-blue-100 text-sm font-medium mb-1">Total Net Worth</p>
                <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(totalBalance)}</h2>
                <div className="mt-6 flex space-x-4">
                    <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 text-sm backdrop-blur-sm">
                        <div className="bg-green-400/20 p-1 rounded-full">
                            <ArrowUpRight size={16} className="text-green-300" />
                        </div>
                        <span>+ {formatCurrency(totalIncome)}</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-2 text-sm backdrop-blur-sm">
                        <div className="bg-red-400/20 p-1 rounded-full">
                            <ArrowDownRight size={16} className="text-red-300" />
                        </div>
                        <span>- {formatCurrency(totalExpense)}</span>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Recent Activity</h3>
                    <button className="text-sm text-blue-600 font-medium">See all</button>
                </div>

                <div className="space-y-3">
                    {recentTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No transactions yet.</p>
                        </div>
                    ) : (
                        recentTransactions.map((t) => (
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
                                        <p className="font-semibold text-gray-900 text-sm">
                                            {t.eventId
                                                ? (events.find(e => e.id === t.eventId)?.name || t.note || t.category)
                                                : (t.note || t.category)
                                            }
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

            {/* Accounts Preview */}
            <section>
                <h3 className="text-lg font-bold text-gray-900 mb-4">Your Accounts</h3>
                <div className="space-y-3">
                    {displayedAccounts.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No matching accounts found.</p>
                        </div>
                    ) : (
                        displayedAccounts.slice(0, 3).map(acc => (
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
                                <span className="font-bold text-sm text-gray-900">{formatCurrency(acc.balance)}</span>
                            </div>
                        ))
                    )}
                </div>
            </section>

        </div>
    );
}
