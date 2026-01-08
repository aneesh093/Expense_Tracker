import { useState, useMemo } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { startOfMonth, endOfMonth, isWithinInterval, format, addMonths, subMonths, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, FileDown, TrendingUp, DollarSign, ArrowDown, ArrowUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { generateReportPDF } from '../lib/pdfGenerator';

export function Reports() {
    const navigate = useNavigate();
    const { transactions, categories, accounts } = useFinanceStore();

    // View Mode State
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    // current date state
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate start and end based on view mode
    const periodStart = viewMode === 'monthly' ? startOfMonth(currentDate) : startOfYear(currentDate);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(currentDate) : endOfYear(currentDate);

    // Filter transactions for current period
    const periodTransactions = useMemo(() => {
        const reportAccountIds = new Set(accounts.filter(a => a.isPrimary || a.type === 'credit').map(a => a.id));

        const relevantTransactions = transactions.filter(t =>
            t.excludeFromBalance ||
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
    };

    const handleNext = () => {
        setCurrentDate(prev => viewMode === 'monthly' ? addMonths(prev, 1) : addYears(prev, 1));
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
                if (t.excludeFromBalance) return;

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
                    color: name === 'Investment' ? '#8b5cf6' : (category?.color || '#9ca3af')
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
            manualChartData
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#387908'];

    const navigateToTransactions = (filter: 'all' | 'manual' | 'core' = 'all') => {
        navigate('/reports/transactions', {
            state: {
                start: periodStart,
                end: periodEnd,
                title: viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy'),
                filter
            }
        });
    };

    return (
        <div className="flex flex-col bg-gray-50 -mx-4 -mt-4 min-h-full">
            <header className="flex flex-col gap-3 p-4 bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20">
                <div className="flex justify-between items-center">
                    <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Financial Reports</h1>
                    <div className="flex bg-gray-100 p-1 rounded-xl">
                        <button
                            onClick={() => setViewMode('monthly')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                                viewMode === 'monthly' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Monthly
                        </button>
                        <button
                            onClick={() => setViewMode('yearly')}
                            className={cn(
                                "px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-200",
                                viewMode === 'yearly' ? "bg-white shadow-sm text-blue-600" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Yearly
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <button
                        onClick={handleExportPDF}
                        className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-semibold text-xs border border-blue-100"
                    >
                        <FileDown size={16} />
                        <span>Export PDF</span>
                    </button>

                    <div className="flex items-center bg-gray-100 rounded-xl p-0.5 border border-gray-200">
                        <button onClick={handlePrev} className="p-1.5 rounded-lg hover:bg-white text-gray-600 transition-colors">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="text-xs font-bold text-gray-800 w-24 text-center select-none uppercase">
                            {format(currentDate, viewMode === 'monthly' ? 'MMM yyyy' : 'yyyy')}
                        </span>
                        <button onClick={handleNext} className="p-1.5 rounded-lg hover:bg-white text-gray-600 transition-colors">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </header>

            <div className="flex-1 p-4 space-y-6 pb-24">
                {/* Summary List */}
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Financial Overview</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 text-green-600 rounded-xl">
                                    <ArrowUp size={18} />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">Total Income</span>
                            </div>
                            <span className="text-base font-bold text-green-600">{formatCurrency(totalIncome)}</span>
                        </div>
                        <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-red-50 text-red-600 rounded-xl">
                                    <ArrowDown size={18} />
                                </div>
                                <span className="text-sm font-semibold text-gray-600">Total Expenses</span>
                            </div>
                            <span className="text-base font-bold text-red-600">{formatCurrency(totalExpense)}</span>
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
                        {manualTotalExpense > 0 && (
                            <div className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-gray-50 text-gray-600 rounded-xl">
                                        <DollarSign size={18} />
                                    </div>
                                    <span className="text-sm font-semibold text-gray-500">Manual Expenses</span>
                                </div>
                                <span className="text-base font-bold text-gray-600">{formatCurrency(manualTotalExpense)}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Chart Section */}
                <div
                    onClick={() => navigateToTransactions('core')}
                    className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform group"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Expense Breakdown</h3>
                        <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                            View Details →
                        </span>
                    </div>
                    {chartData.length > 0 ? (
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={60}
                                        outerRadius={85}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                            No expenses to display
                        </div>
                    )}
                </div>

                {/* Manual Expenses Breakdown (if any) */}
                {manualChartData.length > 0 && (
                    <div
                        onClick={() => navigateToTransactions('manual')}
                        className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform group"
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Manual Expenses</h3>
                            <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details →
                            </span>
                        </div>
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                                    <Pie
                                        data={manualChartData}
                                        cx="50%"
                                        cy="45%"
                                        innerRadius={50}
                                        outerRadius={75}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {manualChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        formatter={(value: number) => formatCurrency(value)}
                                        contentStyle={{ backgroundColor: 'white', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Legend
                                        iconType="circle"
                                        layout="horizontal"
                                        verticalAlign="bottom"
                                        align="center"
                                        wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 'bold' }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
