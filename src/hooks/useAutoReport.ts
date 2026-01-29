import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { generateReportPDF } from '../lib/pdfGenerator';
import { endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';

export function useAutoReport() {
    const { transactions, accounts, categories, events, eventLogs } = useFinanceStore();

    useEffect(() => {
        const checkAndRunAutoReport = async () => {
            // Logic:
            // 1. Check if today is the last day of the month.
            // 2. Or if we missed the last day of previous month (simple check: is it the 1st of new month? - optional but good).
            // 3. Check if we already ran it for "Month YYYY".

            const today = new Date();
            const lastDayOfMonth = endOfMonth(today);
            const isLastDay = isSameDay(today, lastDayOfMonth);

            // Make key like "report-generated-December 2025"
            const currentPeriod = format(today, 'MMMM yyyy');
            const storageKey = `auto-report-${currentPeriod}`;

            if (isLastDay) {
                const alreadyRan = localStorage.getItem(storageKey);

                if (!alreadyRan) {
                    // Generate Report
                    console.log('Running auto-report for', currentPeriod);

                    // Filter data for this month
                    const monthStart = startOfMonth(today);

                    // Helper to filter (similar to Reports.tsx but headless)
                    const primaryAccountIds = new Set(accounts.filter(a => a.isPrimary).map(a => a.id));
                    const relevantTransactions = transactions.filter(t =>
                        primaryAccountIds.size === 0 ||
                        primaryAccountIds.has(t.accountId) ||
                        (t.toAccountId && primaryAccountIds.has(t.toAccountId))
                    ).filter(t => {
                        const d = new Date(t.date);
                        return d >= monthStart && d <= lastDayOfMonth;
                    });

                    const relevantEventLogs = eventLogs.filter(l => {
                        const d = new Date(l.date);
                        return d >= monthStart && d <= lastDayOfMonth;
                    });

                    if (relevantTransactions.length === 0 && relevantEventLogs.length === 0) {
                        // Don't export empty report? Or do? Let's skip if empty to avoid spam, or maybe user wants it. 
                        // Let's print it anyway so they know it worked.
                    }

                    const isInvestment = (t: any) => {
                        if (t.type !== 'transfer' || !t.toAccountId) return false;
                        const toAccount = accounts.find(a => a.id === t.toAccountId);
                        return toAccount?.type === 'stock' || toAccount?.type === 'mutual-fund';
                    };

                    const totals = relevantTransactions.reduce((acc, t) => {
                        if (t.type === 'income') acc.totalIncome += t.amount;
                        else if (t.type === 'expense') {
                            if (t.excludeFromBalance) acc.manualTotalExpense += t.amount;
                            else acc.totalExpense += t.amount;
                        }
                        else if (isInvestment(t)) acc.totalInvestment += t.amount;
                        return acc;
                    }, { totalIncome: 0, totalExpense: 0, totalInvestment: 0, manualTotalExpense: 0 });

                    // Add event logs to manual totals
                    relevantEventLogs.forEach(l => {
                        if (l.type === 'expense') totals.manualTotalExpense += l.amount;
                        else if (l.type === 'income') totals.totalIncome += l.amount;
                    });

                    const { totalIncome, totalExpense, totalInvestment, manualTotalExpense } = totals;

                    // Calculate Chart Data
                    const expenseMap = new Map<string, number>();
                    relevantTransactions
                        .filter(t => t.type === 'expense')
                        .forEach(t => {
                            const current = expenseMap.get(t.category) || 0;
                            expenseMap.set(t.category, current + t.amount);
                        });

                    const chartData = Array.from(expenseMap.entries())
                        .map(([name, value]) => {
                            const category = categories.find(c => c.name === name);
                            return {
                                name,
                                value,
                                color: category?.color || '#9ca3af'
                            };
                        })
                        .sort((a, b) => b.value - a.value);

                    // Manual Chart Data
                    const manualMap = new Map<string, number>();
                    relevantTransactions
                        .filter(t => t.type === 'expense' && t.excludeFromBalance)
                        .forEach(t => {
                            const current = manualMap.get(t.category) || 0;
                            manualMap.set(t.category, current + t.amount);
                        });

                    const manualChartData = Array.from(manualMap.entries())
                        .map(([name, value]) => {
                            const category = categories.find(c => c.name === name);
                            return {
                                name,
                                value,
                                color: category?.color || '#9ca3af'
                            };
                        })
                        .sort((a, b) => b.value - a.value);

                    // Calculate Opening Balances
                    const openingBalances: Record<string, number> = {};
                    accounts.forEach(acc => {
                        const isLoan = acc.type === 'loan';
                        const currentAssetBalance = isLoan ? -acc.balance : acc.balance;

                        const periodAndFutureTransactions = transactions.filter(t =>
                            (t.accountId === acc.id || t.toAccountId === acc.id) &&
                            !t.excludeFromBalance &&
                            new Date(t.date) >= monthStart
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
                        title: 'Monthly Financial Report',
                        period: currentPeriod,
                        totalIncome,
                        totalExpense,
                        totalInvestment,
                        manualTotalExpense,
                        transactions: relevantTransactions,
                        eventLogs: relevantEventLogs,
                        accounts,
                        categories,
                        events,
                        chartData,
                        manualChartData,
                        openingBalances
                    });

                    // Mark as done
                    localStorage.setItem(storageKey, 'true');
                }
            }
        };

        // Don't run immediately on mount to avoid slowing down init? 
        // It's client side, small data, so okay.
        // Needs store to be initialized.
        if (accounts.length > 0) { // Simple check if loaded
            checkAndRunAutoReport();
        }

    }, [transactions, accounts, categories, events, eventLogs]);
}
