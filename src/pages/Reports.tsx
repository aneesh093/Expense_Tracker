import { useState, useMemo, useRef, useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { startOfMonth, endOfMonth, isWithinInterval, format, addMonths, subMonths, startOfYear, endOfYear, addYears, subYears } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { ChevronLeft, ChevronRight, FileDown, TrendingUp, DollarSign, ArrowDown, ArrowUp, Filter } from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import { generateReportPDF } from '../lib/pdfGenerator';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#387908'];

export function Reports() {
    const navigate = useNavigate();
    const { transactions, categories, accounts, mandates, events, eventLogs, reportSortBy, showEventsInReport, showManualInReport, pdfIncludeCharts, pdfIncludeAccountSummary, pdfIncludeTransactions, pdfIncludeEventSummary } = useFinanceStore();

    // View Mode State
    const [viewMode, setViewMode] = useState<'monthly' | 'yearly'>('monthly');

    // Filter State
    const [showMandates, setShowMandates] = useState(false);
    // showEventsInReport is used from store
    const [showTransfers, setShowTransfers] = useState(false);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
    const [selectedCategoryName, setSelectedCategoryName] = useState<string>('all');
    const [selectedEventId, setSelectedEventId] = useState<string>('all');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

    // Close filter menu when clicking outside
    const filterMenuRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
                setIsFilterMenuOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // current date state
    const [currentDate, setCurrentDate] = useState(new Date());

    // Calculate start and end based on view mode
    const periodStart = viewMode === 'monthly' ? startOfMonth(currentDate) : startOfYear(currentDate);
    const periodEnd = viewMode === 'monthly' ? endOfMonth(currentDate) : endOfYear(currentDate);

    // Filter transactions for current period
    const periodTransactions = useMemo(() => {
        const reportAccountIds = new Set(
            accounts
                .filter(a => {
                    const isTypeAllowed = a.isPrimary || a.type === 'credit' || a.type === 'cash' || a.type === 'savings' || a.type === 'fixed-deposit' || a.type === 'loan';
                    return isTypeAllowed && a.includeInReports !== false;
                })
                .map(a => a.id)
        );

        const relevantTransactions = transactions.filter(t => {
            // Check event exclusion
            if (t.eventId) {
                const event = events.find(e => e.id === t.eventId);
                if (event?.includeInReports === false) return false;
            }

            // Account basic inclusion logic
            const isIncluded = t.excludeFromBalance ||
                reportAccountIds.size === 0 ||
                reportAccountIds.has(t.accountId) ||
                (t.toAccountId && reportAccountIds.has(t.toAccountId));

            if (!isIncluded) return false;

            // Specific account filter
            if (selectedAccountId !== 'all') {
                if (!(t.accountId === selectedAccountId || t.toAccountId === selectedAccountId)) return false;
            }

            // Category filter
            if (selectedCategoryName !== 'all') {
                if (t.category !== selectedCategoryName) return false;
            }

            // Event filter
            if (selectedEventId !== 'all') {
                if (t.eventId !== selectedEventId) return false;
            }

            return true;
        });

        return relevantTransactions
            .filter(t => isWithinInterval(new Date(t.date), { start: periodStart, end: periodEnd }))
            .sort((a, b) => {
                if (reportSortBy === 'date') {
                    return new Date(a.date).getTime() - new Date(b.date).getTime();
                }
                return b.amount - a.amount;
            });
    }, [transactions, currentDate, accounts, viewMode, selectedAccountId, selectedCategoryName, selectedEventId, periodStart, periodEnd, reportSortBy, events]);

    // Filter event logs for current period
    const periodEventLogs = useMemo(() => {
        if (selectedCategoryName !== 'all') return []; // Logs don't have categories
        return eventLogs.filter(l => {
            const event = events.find(e => e.id === l.eventId);
            if (event?.includeInReports === false) return false;

            // Event filter
            if (selectedEventId !== 'all' && l.eventId !== selectedEventId) return false;

            return isWithinInterval(new Date(l.date), { start: periodStart, end: periodEnd });
        });
    }, [eventLogs, periodStart, periodEnd, events, selectedCategoryName, selectedEventId]);

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
    const { totalIncome, totalExpense, totalInvestment, manualTotalExpense, totalTransferIn, totalTransferOut } = useMemo(() => {
        const transTotals = periodTransactions.reduce((acc, t) => {
            if (t.type === 'income') acc.totalIncome += t.amount;
            else if (t.type === 'expense') {
                if (t.excludeFromBalance) acc.manualTotalExpense += t.amount;
                else acc.totalExpense += t.amount;
            }
            else if (isInvestment(t)) acc.totalInvestment += t.amount;
            else if (t.type === 'transfer') {
                acc.totalTransferIn += t.amount;
                acc.totalTransferOut += t.amount;
            }
            return acc;
        }, { totalIncome: 0, totalExpense: 0, totalInvestment: 0, manualTotalExpense: 0, totalTransferIn: 0, totalTransferOut: 0 });

        // Add event logs to manual totals
        periodEventLogs.forEach(l => {
            if (l.type === 'expense') transTotals.manualTotalExpense += l.amount;
            else if (l.type === 'income') transTotals.totalIncome += l.amount;
        });

        return transTotals;
    }, [periodTransactions, periodEventLogs, accounts]);

    // Prepare chart data (Expense by Category or Account or Event) - Excluding manual
    const chartData = useMemo(() => {
        const itemMap = new Map<string, number>();
        const isCategoryFiltered = selectedCategoryName !== 'all';
        const isEventFiltered = selectedEventId !== 'all';

        periodTransactions
            .forEach(t => {
                if (t.excludeFromBalance) return;

                // Priority for key:
                // 1. If category and event filtered -> Account
                // 2. If only category filtered -> Account
                // 3. If only event filtered -> Category
                // 4. Neither -> Category
                let key = t.category;
                if (isCategoryFiltered) {
                    key = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
                } else if (isEventFiltered) {
                    key = t.category;
                }

                if (t.type === 'expense' || t.type === 'income') {
                    const current = itemMap.get(key) || 0;
                    itemMap.set(key, current + t.amount);
                } else if (!isCategoryFiltered && isInvestment(t)) {
                    const current = itemMap.get('Investment') || 0;
                    itemMap.set('Investment', current + t.amount);
                }
            });

        return Array.from(itemMap.entries())
            .map(([name, value], index) => {
                let color = COLORS[index % COLORS.length];
                if (!isCategoryFiltered) {
                    if (name === 'Investment') color = '#8b5cf6';
                    else {
                        const category = categories.find(c => c.name === name);
                        if (category) color = category.color;
                    }
                } else {
                    const account = accounts.find(a => a.name === name);
                    if (account) color = account.color;
                }

                return { name, value, color };
            })
            .sort((a, b) => b.value - a.value);
    }, [periodTransactions, categories, selectedCategoryName, selectedEventId, accounts]);

    // Prepare manual chart data
    const manualChartData = useMemo(() => {
        const itemMap = new Map<string, number>();
        const isCategoryFiltered = selectedCategoryName !== 'all';
        const isEventFiltered = selectedEventId !== 'all';

        periodTransactions
            .forEach(t => {
                if (!t.excludeFromBalance) return;

                let key = t.category;
                if (isCategoryFiltered) {
                    key = accounts.find(a => a.id === t.accountId)?.name || 'Unknown';
                } else if (isEventFiltered) {
                    key = t.category;
                }

                const current = itemMap.get(key) || 0;
                itemMap.set(key, current + t.amount);
            });

        return Array.from(itemMap.entries())
            .map(([name, value], index) => {
                let color = COLORS[index % COLORS.length];
                if (!isCategoryFiltered) {
                    const category = categories.find(c => c.name === name);
                    if (category) color = category.color;
                } else {
                    const account = accounts.find(a => a.name === name);
                    if (account) color = account.color;
                }
                return { name, value, color };
            })
            .sort((a, b) => b.value - a.value);
    }, [periodTransactions, categories, selectedCategoryName, selectedEventId, accounts]);

    const handleExportPDF = () => {
        let reportTitle = viewMode === 'monthly' ? 'Monthly Financial Report' : 'Yearly Financial Report';
        if (selectedEventId !== 'all') {
            const event = events.find(e => e.id === selectedEventId);
            if (event) reportTitle = `${event.name} - ${reportTitle}`;
        }
        if (selectedCategoryName !== 'all') {
            reportTitle = `${selectedCategoryName} - ${reportTitle}`;
        }

        // Calculate Opening Balances for each account
        // Opening Balance = Current Asset Balance - Net of transactions from periodStart to today
        const openingBalances: Record<string, number> = {};
        accounts.forEach(acc => {
            const isLoan = acc.type === 'loan';
            const currentAssetBalance = isLoan ? -acc.balance : acc.balance;

            const periodAndFutureTransactions = transactions.filter(t =>
                (t.accountId === acc.id || t.toAccountId === acc.id) &&
                !t.excludeFromBalance &&
                new Date(t.date) >= periodStart
            );

            const netChange = periodAndFutureTransactions.reduce((sum, t) => {
                const isSource = t.accountId === acc.id;
                const isDest = t.toAccountId === acc.id;

                if (t.type === 'income' && isSource) return sum + t.amount;
                if (t.type === 'expense' && isSource) return sum - t.amount;
                if (t.type === 'transfer') {
                    if (isSource) return sum - t.amount; // Outflow
                    if (isDest) return sum + t.amount;   // Inflow
                }
                return sum;
            }, 0);

            openingBalances[acc.id] = currentAssetBalance - netChange;
        });

        generateReportPDF({
            title: reportTitle,
            period: format(currentDate, viewMode === 'monthly' ? 'MMMM yyyy' : 'yyyy'),
            totalIncome,
            totalExpense,
            totalInvestment,
            manualTotalExpense,
            totalTransferIn,
            totalTransferOut,
            transactions: periodTransactions,
            eventLogs: periodEventLogs,
            accounts: accounts.filter(a => a.includeInReports !== false),
            allAccounts: accounts,
            categories,
            events: events.filter(e => e.includeInReports !== false),
            chartData,
            manualChartData,
            openingBalances,
            exportOptions: {
                includeCharts: pdfIncludeCharts,
                includeAccountSummary: pdfIncludeAccountSummary,
                includeTransactions: pdfIncludeTransactions,
                includeEventSummary: pdfIncludeEventSummary
            }
        });
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };


    const navigateToTransactions = (filter: 'all' | 'manual' | 'core' | 'transfer' | 'mandate' = 'all') => {
        navigate('/reports/transactions', {
            state: {
                start: periodStart,
                end: periodEnd,
                title: viewMode === 'monthly' ? format(currentDate, 'MMMM yyyy') : format(currentDate, 'yyyy'),
                filter,
                selectedAccountId: selectedAccountId,
                selectedCategory: selectedCategoryName,
                selectedEventId: selectedEventId
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
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleExportPDF}
                            className="flex items-center space-x-2 px-3 py-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all font-semibold text-xs border border-blue-100"
                        >
                            <FileDown size={16} />
                            <span>Export PDF</span>
                        </button>

                        <div className="relative" ref={filterMenuRef}>
                            <button
                                onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
                                className={cn(
                                    "p-2 rounded-xl transition-all border",
                                    isFilterMenuOpen ? "bg-gray-100 text-gray-900 border-gray-300" : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                                )}
                            >
                                <Filter size={18} />
                            </button>

                            {isFilterMenuOpen && (
                                <div className="absolute top-full left-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 p-2 z-50">
                                    <div className="text-xs font-bold text-gray-400 px-2 py-1 uppercase tracking-wider mb-1">View Options</div>
                                    <label className="flex items-center space-x-2 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showMandates}
                                            onChange={(e) => setShowMandates(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Show Mandates</span>
                                    </label>
                                    <label className="flex items-center space-x-2 px-2 py-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={showTransfers}
                                            onChange={(e) => setShowTransfers(e.target.checked)}
                                            className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-700">Show Transfers</span>
                                    </label>

                                    <div className="border-t border-gray-100 my-1 pt-1">
                                        <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Account</div>
                                        <select
                                            value={selectedAccountId}
                                            onChange={(e) => setSelectedAccountId(e.target.value)}
                                            className="w-full mt-1 p-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="all">All Accounts</option>
                                            {accounts.map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="border-t border-gray-100 my-1 pt-1">
                                        <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Event</div>
                                        <select
                                            value={selectedEventId}
                                            onChange={(e) => setSelectedEventId(e.target.value)}
                                            className="w-full mt-1 p-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="all">All Events</option>
                                            {events.map(ev => (
                                                <option key={ev.id} value={ev.id}>{ev.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="border-t border-gray-100 my-1 pt-1">
                                        <div className="text-[10px] font-bold text-gray-400 px-2 py-1 uppercase tracking-wider">Category</div>
                                        <select
                                            value={selectedCategoryName}
                                            onChange={(e) => setSelectedCategoryName(e.target.value)}
                                            className="w-full mt-1 p-2 text-sm bg-gray-50 rounded-lg border border-gray-200 outline-none focus:ring-1 focus:ring-blue-500"
                                        >
                                            <option value="all">All Categories</option>
                                            {Array.from(new Set(categories.map(c => c.name))).sort().map(name => (
                                                <option key={name} value={name}>{name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

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
                        {showManualInReport && manualTotalExpense > 0 && (
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
                    className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform group"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">
                            {selectedCategoryName !== 'all'
                                ? `${selectedCategoryName} Distribution`
                                : (selectedEventId !== 'all'
                                    ? `${events.find(e => e.id === selectedEventId)?.name || 'Event'} Breakdown`
                                    : 'Expense Breakdown')}
                        </h3>
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
                                        cy="40%"
                                        innerRadius="50%"
                                        outerRadius="70%"
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

                {/* Manual Expenses Breakdown (if any and enabled) */}
                {showManualInReport && manualChartData.length > 0 && (
                    <div
                        onClick={() => navigateToTransactions('manual')}
                        className="bg-white p-4 md:p-6 rounded-3xl shadow-sm border border-gray-100 cursor-pointer active:scale-[0.99] transition-transform group"
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
                                        cy="40%"
                                        innerRadius="50%"
                                        outerRadius="70%"
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

                {/* Events Section */}
                {showEventsInReport && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Event/Log Performance</h3>
                            <button
                                onClick={() => navigateToTransactions('all')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800"
                            >
                                View All →
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {(() => {
                                const eventMap = new Map<string, { income: number; expense: number; name: string }>();

                                // Group Event Transactions
                                periodTransactions.forEach(t => {
                                    if (t.eventId) {
                                        const event = events.find(e => e.id === t.eventId);
                                        if (!event) return;

                                        const stats = eventMap.get(t.eventId) || { income: 0, expense: 0, name: event.name };
                                        if (t.type === 'income') stats.income += t.amount;
                                        if (t.type === 'expense') stats.expense += t.amount;
                                        eventMap.set(t.eventId, stats);
                                    }
                                });

                                // Group Event Logs
                                periodEventLogs.forEach(l => {
                                    const key = l.eventId || 'standalone';
                                    const name = l.eventId
                                        ? (events.find(e => e.id === l.eventId)?.name || 'Unknown Event')
                                        : 'Independent Logs';

                                    const stats = eventMap.get(key) || { income: 0, expense: 0, name: name };
                                    if (l.type === 'income') stats.income += l.amount;
                                    if (l.type === 'expense') stats.expense += l.amount;
                                    eventMap.set(key, stats);
                                });

                                if (eventMap.size === 0) {
                                    return <div className="px-5 py-8 text-center text-gray-400 text-sm italic">No event or log entries</div>;
                                }

                                return Array.from(eventMap.entries())
                                    .sort((a, b) => {
                                        if (a[0] === 'standalone') return 1;
                                        if (b[0] === 'standalone') return -1;
                                        return b[1].income + b[1].expense - (a[1].income + a[1].expense);
                                    })
                                    .map(([id, stats]) => (
                                        <div key={id} className="flex items-center justify-between px-5 py-4">
                                            <div className="flex flex-col">
                                                <span className={cn(
                                                    "text-sm font-semibold",
                                                    id === 'standalone' ? "text-orange-600" : (stats.name === 'Unknown Event' ? "text-red-500" : "text-gray-800")
                                                )}>
                                                    {stats.name}
                                                </span>
                                                <div className="flex space-x-2 text-[10px] font-medium">
                                                    <span className="text-green-600">In: {formatCurrency(stats.income)}</span>
                                                    <span className="text-red-500">Out: {formatCurrency(stats.expense)}</span>
                                                </div>
                                            </div>
                                            <span className={cn("text-sm font-bold", (stats.income - stats.expense) >= 0 ? "text-green-600" : "text-red-600")}>
                                                {formatCurrency(stats.income - stats.expense)}
                                            </span>
                                        </div>
                                    ));
                            })()}
                        </div>
                    </div>
                )}

                {/* Mandates Section */}
                {showMandates && (
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Active Mandates</h3>
                            <button
                                onClick={() => navigateToTransactions('mandate')}
                                className="text-xs font-bold text-blue-600 hover:text-blue-800"
                            >
                                View Payments →
                            </button>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {mandates.filter(m => m.isEnabled).length === 0 ? (
                                <div className="px-5 py-8 text-center text-gray-400 text-sm italic">
                                    No active mandates
                                </div>
                            ) : (
                                mandates.filter(m => m.isEnabled).map(m => (
                                    <div key={m.id} className="flex items-center justify-between px-5 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold text-gray-800">{m.description}</span>
                                            <span className="text-[10px] text-gray-500 font-medium">Next: Day {m.dayOfMonth} of month</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-900">{formatCurrency(m.amount)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Transfers Summary */}
                {showTransfers && (
                    <div
                        onClick={() => navigateToTransactions('transfer')}
                        className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden cursor-pointer active:scale-[0.99] transition-transform group"
                    >
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Internal Transfers</h3>
                            <span className="text-xs font-bold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                View Details →
                            </span>
                        </div>
                        <div className="grid grid-cols-2 divide-x divide-gray-50">
                            <div className="px-5 py-6 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total In</span>
                                <span className="text-lg font-bold text-indigo-600">{formatCurrency(totalTransferIn)}</span>
                            </div>
                            <div className="px-5 py-6 flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Total Out</span>
                                <span className="text-lg font-bold text-indigo-600">{formatCurrency(totalTransferOut)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
