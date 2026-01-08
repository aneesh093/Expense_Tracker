import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';
import { generateReportPDF } from '../lib/pdfGenerator';
import { endOfMonth, format, isSameDay, startOfMonth } from 'date-fns';

export function useAutoReport() {
    const { transactions, accounts, categories } = useFinanceStore();

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

                    if (relevantTransactions.length === 0) {
                        // Don't export empty report? Or do? Let's skip if empty to avoid spam, or maybe user wants it. 
                        // Let's print it anyway so they know it worked.
                    }

                    const { totalIncome, totalExpense } = relevantTransactions.reduce((acc, t) => {
                        if (t.type === 'income') acc.totalIncome += t.amount;
                        else if (t.type === 'expense') acc.totalExpense += t.amount;
                        return acc;
                        return acc;
                    }, { totalIncome: 0, totalExpense: 0 });

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

                    generateReportPDF({
                        title: 'Monthly Financial Report',
                        period: currentPeriod,
                        totalIncome,
                        totalExpense,
                        transactions: relevantTransactions,
                        accounts,
                        categories,
                        chartData
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

    }, [transactions, accounts, categories]);
}
