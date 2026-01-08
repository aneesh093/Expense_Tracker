import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { startOfMonth, endOfMonth, isWithinInterval, format, addMonths, subMonths, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight, FileDown, ArrowRightLeft, TrendingUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { generateReportPDF } from '../lib/pdfGenerator';

export function Reports() {
    const navigate = useNavigate();
    const { transactions, categories, events, accounts } = useFinanceStore();

    // View Mode State
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    // current date state
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate start and end based on view mode
    const periodStart = viewMode === 'monthly' ? startOfMonth(currentDate) : startOfYear(currentDate);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(currentDate) : endOfYear(currentDate);

    // Pagination state
    const [displayLimit, setDisplayLimit] = useState(20);

    // Filter transactions for current period
    const periodTransactions = useMemo(() => {
        // Include Primary accounts AND Credit Card accounts
        const reportAccountIds = new Set(accounts.filter(a => a.isPrimary || a.type === 'credit').map(a => a.id));

        const relevantTransactions = transactions.filter(t =>
            t.excludeFromBalance || // Always include manual transactions
            reportAccountIds.size === 0 ||
            reportAccountIds.has(t.accountId) ||
            (t.toAccountId && reportAccountIds.has(t.toAccountId))
        );

        return relevantTransactions
            .filter(t => isWithinInterval(new Date(t.date), { start: periodStart, end: periodEnd }))
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, currentDate, accounts, viewMode]);

    const isInvestment = (t: any) => {
        if (t.type !== 'transfer' || !t.toAccountId) return false;
        const toAccount = accounts.find(a => a.id === t.toAccountId);
        return toAccount?.type === 'stock' || toAccount?.type === 'mutual-fund';
    };

    const handlePrev = () => {
        setCurrentDate(prev => viewMode === 'monthly' ? subMonths(prev, 1) : subYears(prev, 1));
        setDisplayLimit(20); // Reset pagination
    };

    const handleNext = () => {
        setCurrentDate(prev => viewMode === 'monthly' ? addMonths(prev, 1) : addYears(prev, 1));
        setDisplayLimit(20);
    };

    // Calculate totals
    const { totalIncome, totalExpense, totalInvestment, manualTotalExpense } = useMemo(() => {
        return periodTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.totalIncome += t.amount;
            else if (t.type === 'expense') {
                if (t.excludeFromBalance) acc.manualTotalExpense += t.amount;
                else acc.totalExpense += t.amount;
            }
            else if (isInvestment(t)) acc.totalInvestment += t.amount;
            return acc;
        }, { totalIncome: 0, totalExpense: 0, totalInvestment: 0, manualTotalExpense: 0 });
    }, [periodTransactions, accounts]);

    // Prepare chart data (Expense by Category) - Excluding manual
    const chartData = useMemo(() => {
        const expenseMap = new Map<string, number>();

        periodTransactions
            .forEach(t => {
                if (t.excludeFromBalance) return; // Skip manual transactions

                if (t.type === 'expense') {
                    const current = expenseMap.get(t.category) || 0;
                    expenseMap.set(t.category, current + t.amount);
                } else if (isInvestment(t)) {
                    const current = expenseMap.get('Investment') || 0;
                    expenseMap.set('Investment', current + t.amount);
                }
            });

        return Array.from(expenseMap.entries())
            .map(([name, value]) => {
                const category = categories.find(c => c.name === name);
                return {
                    name,
                    value,
                    color: name === 'Investment' ? '#8b5cf6' : (category?.color || '#9ca3af') // Purple for Investment
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [periodTransactions, categories]);

    // Prepare manual chart data
    const manualChartData = useMemo(() => {
        const manualMap = new Map<string, number>();

        periodTransactions
            .forEach(t => {
                if (!t.excludeFromBalance) return;

                const current = manualMap.get(t.category) || 0;
                manualMap.set(t.category, current + t.amount);
            });

        return Array.from(manualMap.entries())
            .map(([name, value]) => {
                const category = categories.find(c => c.name === name);
                return {
                    name,
                    value,
                    color: category?.color || '#9ca3af'
                };
            })
            .sort((a, b) => b.value - a.value);
    }, [periodTransactions, categories]);

    const handleExportPDF = () => {
        const reportTitle = viewMode === 'monthly' ? 'Monthly Financial Report' : 'Yearly Financial Report';
        generateReportPDF({
            title: reportTitle,
            period: format(currentDate, viewMode === 'monthly' ? 'MMMM yyyy' : 'yyyy'),
            totalIncome,
            totalExpense,
            totalInvestment,
            manualTotalExpense,
            transactions: periodTransactions,
            accounts,
            categories,
            chartData,
            manualChartData // Pass manual chart data
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#387908'];

    return (
        <div className="flex flex-col bg-gray-50 -mx-4 -mt-4 min-h-full">
            <header className="flex flex-col gap-3 p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-900">Reports</h1>
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={cn(
                                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                                viewMode === 'monthly' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={cn(
                                "px-3 py-1 text-sm font-medium rounded-md transition-all",
                                viewMode === 'yearly' ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportPDF}
                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-full transition-colors"
                            title="Export to PDF"
                        >
                            <FileDown size={20} />
                        </button>
                    </div>

                    <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                        <button onClick={handlePrev} className="p-1 rounded-md hover:bg-white text-gray-600">
                            <ChevronLeft size={20} />
                        </button>
                        <span className="text-sm font-semibold text-gray-700 w-28 text-center select-none">
                            {format(currentDate, viewMode === 'monthly' ? 'MMM yyyy' : 'yyyy')}
                        </span>
                        <button onClick={handleNext} className="p-1 rounded-md hover:bg-white text-gray-600">
                            <ChevronRight size={20} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 space-y-4 pb-24">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-green-500">
                        <p className="text-xs font-medium text-gray-500 mb-1">Income</p>
                        <p className="text-lg font-bold text-green-600 truncate">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-red-500">
                        <p className="text-xs font-medium text-gray-500 mb-1">Expense</p>
                        <p className="text-lg font-bold text-red-600 truncate">{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-purple-500">
                        <div className="flex items-center space-x-1 mb-1">
                            <TrendingUp size={12} className="text-purple-500" />
                            <p className="text-xs font-medium text-gray-500">Invested</p>
                        </div>
                        <p className="text-lg font-bold text-purple-600 truncate">{formatCurrency(totalInvestment)}</p>
                    </div>
                    {manualTotalExpense > 0 && (
                        <div className="bg-white p-4 rounded-xl shadow-sm border-l-4 border-gray-400">
                            <p className="text-xs font-medium text-gray-500 mb-1 overflow-hidden">Manual Exp</p>
                            <p className="text-lg font-bold text-gray-600 truncate">{formatCurrency(manualTotalExpense)}</p>
                        </div>
                    )}
                </div>

                {/* Main Chart Section */}
                <div className="bg-white p-4 rounded-xl shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Expense Breakdown</h3>
                    {chartData.length > 0 ? (
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '10px', paddingTop: '20px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded-lg border border-dashed border-gray-200">
                            No expenses to display
                        </div>
                    )}
                </div>

                {/* Manual Expenses Breakdown (if any) */}
                {manualChartData.length > 0 && (
                    <div className="bg-white p-4 rounded-xl shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 mb-4 uppercase tracking-wide">Manual Expenses (Non-Impacting)</h3>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={manualChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={50}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {manualChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* Transactions List */}
                <div>
                    <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">
                        {viewMode === 'monthly' ? `Transactions (${periodTransactions.length})` : 'Category Breakdown'}
                    </h3>

                    <div className="space-y-3">
                        {viewMode === 'monthly' ? (
                            periodTransactions.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl">
                                    <p className="text-gray-500 text-sm">No transactions found.</p>
                                </div>
                            ) : (
                                <>
                                    {periodTransactions.slice(0, displayLimit).map((t) => (
                                        <div
                                            key={t.id}
                                            onClick={() => navigate(`/edit/${t.id}`)}
                                            className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between active:scale-[0.99] transition-transform"
                                        >
                                            <div className="flex items-center space-x-3 overflow-hidden">
                                                <div className={cn("p-2 rounded-full shrink-0",
                                                    t.type === 'expense' ? "bg-red-50 text-red-500" :
                                                        t.type === 'income' ? "bg-green-50 text-green-500" : "bg-blue-50 text-blue-500"
                                                )}>
                                                    {t.type === 'expense' ? <ArrowDownRight size={18} /> :
                                                        t.type === 'income' ? <ArrowUpRight size={18} /> : <ArrowRightLeft size={18} />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="font-medium text-gray-900 text-sm truncate">
                                                        {t.eventId
                                                            ? (events.find(e => e.id === t.eventId)?.name || t.note || t.category)
                                                            : (t.note || t.category)
                                                        }
                                                    </p>
                                                    <div className="flex items-center text-xs text-gray-500 space-x-1">
                                                        <span>{format(new Date(t.date), 'MMM dd')}</span>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[80px]">{t.category}</span>
                                                        <span>•</span>
                                                        <span className="truncate max-w-[80px] font-medium opacity-80">
                                                            {accounts.find(a => a.id === t.accountId)?.name || 'Unknown'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <span className={cn("font-bold text-sm whitespace-nowrap ml-2",
                                                t.type === 'expense' ? "text-gray-900" :
                                                    t.type === 'income' ? "text-green-600" : "text-blue-600"
                                            )}>
                                                {t.type === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                            </span>
                                        </div>
                                    ))}

                                    {periodTransactions.length > displayLimit && (
                                        <button
                                            onClick={() => setDisplayLimit(prev => prev + 20)}
                                            className="w-full py-3 text-sm text-blue-600 font-medium bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                                        >
                                            Load More
                                        </button>
                                    )}
                                </>
                            )
                        ) : (
                            // Yearly View: Category Breakdown
                            chartData.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-xl">
                                    <p className="text-gray-500 text-sm">No data to display.</p>
                                </div>
                            ) : (
                                chartData.map((item, index) => (
                                    <div
                                        key={index}
                                        className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div
                                                className="w-4 h-4 rounded-full shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="font-medium text-gray-900 text-sm">{item.name}</span>
                                        </div>
                                        <span className="font-bold text-gray-900 text-sm">
                                            {formatCurrency(item.value)}
                                        </span>
                                    </div>
                                ))
                            )
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
