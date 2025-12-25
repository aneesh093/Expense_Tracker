import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { startOfMonth, endOfMonth, isWithinInterval, format, addMonths, subMonths } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export function Reports() {
    const navigate = useNavigate();
    const { transactions, categories, events, accounts } = useFinanceStore();

    // current month state
    const [currentDate, setCurrentDate] = useState(new Date());
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);

    // Filter transactions for current month
    const monthTransactions = useMemo(() => {
        const primaryAccountIds = new Set(accounts.filter(a => a.isPrimary).map(a => a.id));

        // Similar to Dashboard, if no primary accounts are explicitly set, assume all are visible.
        // Or if strict, show none. Sticking to "if no primary, show all" as a safe fallback?
        // Actually, user said "only display transactions from primary bank accounts".
        // If user hasn't set any primary, showing everything is a better UX than showing empty.

        const relevantTransactions = transactions.filter(t =>
            primaryAccountIds.size === 0 ||
            primaryAccountIds.has(t.accountId) ||
            (t.toAccountId && primaryAccountIds.has(t.toAccountId))
        );

        return relevantTransactions
            .filter(t => isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, currentDate, accounts]);

    const handlePrevMonth = () => setCurrentDate(prev => subMonths(prev, 1));
    const handleNextMonth = () => setCurrentDate(prev => addMonths(prev, 1));

    // Calculate totals
    const { totalIncome, totalExpense } = useMemo(() => {
        return monthTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.totalIncome += t.amount;
            else if (t.type === 'expense') acc.totalExpense += t.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0 });
    }, [monthTransactions]);

    // Prepare chart data (Expense by Category)
    const chartData = useMemo(() => {
        const expenseMap = new Map<string, number>();

        monthTransactions
            .filter(t => t.type === 'expense')
            .forEach(t => {
                const current = expenseMap.get(t.category) || 0;
                expenseMap.set(t.category, current + t.amount);
            });

        return Array.from(expenseMap.entries())
            .map(([name, value]) => {
                const category = categories.find(c => c.name === name);
                return {
                    name,
                    value,
                    color: category?.color || '#9ca3af'
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [monthTransactions, categories]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="flex flex-col h-full space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
                </div>
                <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={handlePrevMonth}
                        className="p-1 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 w-32 text-center select-none">
                        {format(currentDate, 'MMMM yyyy')}
                    </span>
                    <button
                        onClick={handleNextMonth}
                        className="p-1 rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-600"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-xl shadow-sm border border-green-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Income</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(totalIncome)}</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-sm border border-red-100">
                    <p className="text-xs font-medium text-gray-500 mb-1">Expense</p>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(totalExpense)}</p>
                </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 min-h-[300px]">
                <h3 className="text-base font-bold text-gray-900 mb-4">Expense Breakdown</h3>
                {chartData.length > 0 ? (
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="h-64 flex items-center justify-center text-gray-400 text-sm italic">
                        No expenses this month
                    </div>
                )}
            </div>

            {/* Monthly Transactions List */}
            <div className="pb-4">
                <h3 className="text-base font-bold text-gray-900 mb-4">Monthly Transactions</h3>
                <div className="space-y-3">
                    {monthTransactions.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500 text-sm">No transactions this month.</p>
                        </div>
                    ) : (
                        monthTransactions.map((t) => (
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
                                        <p className="text-xs text-gray-500">{format(new Date(t.date), 'MMM dd')}</p>
                                    </div>
                                </div>
                                <span className={cn("font-bold text-sm", t.type === 'expense' ? "text-gray-900" : "text-green-600")}>
                                    {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
