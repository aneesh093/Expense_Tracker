import { useEffect } from 'react';
import { useFinanceStore } from '../store/useFinanceStore';

export function useBackupScheduler() {
    const { accounts, transactions, categories, mandates, events, auditTrails, investmentLogs, eventLogs, eventPlans } = useFinanceStore();

    useEffect(() => {
        // Check if auto-backup is enabled
        const isEnabled = localStorage.getItem('auto-backup-enabled') !== 'false';
        if (!isEnabled) return;

        // Function to check if it's time for backup
        const checkBackupTime = () => {
            const now = new Date();

            // Convert to IST (UTC+5:30)
            const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
            const hours = istTime.getHours();
            const minutes = istTime.getMinutes();

            // Check if it's 9 PM IST (21:00)
            if (hours === 21 && minutes === 0) {
                // Check if we already backed up today
                const lastBackup = localStorage.getItem('last-auto-backup');
                const today = istTime.toDateString();

                if (lastBackup !== today) {
                    performBackup();
                    localStorage.setItem('last-auto-backup', today);
                }
            }
        };

        // Function to perform the backup
        const performBackup = () => {
            try {
                // Create backup data
                const backupData = {
                    accounts,
                    transactions,
                    categories,
                    mandates,
                    events,
                    auditTrails,
                    investmentLogs,
                    eventLogs,
                    eventPlans,
                    settings: {
                        isBalanceHidden: localStorage.getItem('finance-privacy-mode') !== 'false',
                        isAccountsBalanceHidden: localStorage.getItem('finance-accounts-privacy-mode') === 'true',
                        hiddenAccountTypes: JSON.parse(localStorage.getItem('finance-hidden-account-types') || '["credit","land","insurance"]'),
                        reportSortBy: localStorage.getItem('finance-report-sort-by') || 'date',
                        showEventsInReport: localStorage.getItem('finance-show-events-in-report') !== 'false',
                        showLogsInReport: localStorage.getItem('finance-show-logs-in-report') !== 'false',
                        showManualInReport: localStorage.getItem('finance-show-manual-in-report') !== 'false',
                        pdfIncludeCharts: localStorage.getItem('finance-pdf-include-charts') !== 'false',
                        pdfIncludeAccountSummary: localStorage.getItem('finance-pdf-include-account-summary') !== 'false',
                        pdfIncludeTransactions: localStorage.getItem('finance-pdf-include-transactions') !== 'false',
                        pdfIncludeEventSummary: localStorage.getItem('finance-pdf-include-event-summary') !== 'false',
                        autoBackupEnabled: localStorage.getItem('auto-backup-enabled') !== 'false',
                    },
                    exportDate: new Date().toISOString(),
                    version: '1.0'
                };

                // Create JSON blob
                const blob = new Blob([JSON.stringify(backupData, null, 2)], {
                    type: 'application/json'
                });

                // Create download link
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');

                // Format filename with timestamp
                const now = new Date();
                const istTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
                const timestamp = istTime.toISOString()
                    .replace(/T/, '-')
                    .replace(/:/g, '')
                    .slice(0, 15);

                link.href = url;
                link.download = `finance-backup-${timestamp}.json`;

                // Trigger download
                document.body.appendChild(link);
                link.click();

                // Cleanup
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log('Auto-backup completed successfully');
            } catch (error) {
                console.error('Auto-backup failed:', error);
            }
        };

        // Check every minute
        const interval = setInterval(checkBackupTime, 60000);

        // Also check immediately on mount
        checkBackupTime();

        return () => clearInterval(interval);
    }, [accounts, transactions, categories, mandates, events, auditTrails, investmentLogs, eventLogs, eventPlans]);
}
