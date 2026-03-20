import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Download, Upload, Clock, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { exportDB, importInto } from 'dexie-export-import';
import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate';
import { db } from '../lib/db';

export function BackupConfiguration() {
    const navigate = useNavigate();
    const { importData, initialize } = useFinanceStore();

    const [isAutoBackupEnabled, setIsAutoBackupEnabled] = useState(
        localStorage.getItem('auto-backup-enabled') !== 'false'
    );
    const [isOperating, setIsOperating] = useState(false);

    const handleExportBackup = async () => {
        try {
            setIsOperating(true);
            const settings = {
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
                showInvestmentAccounts: localStorage.getItem('finance-show-investment-accounts') !== 'false',
            };

            // 1. Export indexeddb directly to Blob
            const dbBlob = await exportDB(db, { prettyJson: false });
            const dbBuffer = await dbBlob.arrayBuffer();

            // 2. Prepare Settings
            const settingsStr = JSON.stringify(settings);
            const settingsBuffer = strToU8(settingsStr);

            // 3. Zip them together saving memory using fflate
            const zipped = zipSync({
                'database.json': new Uint8Array(dbBuffer),
                'settings.json': settingsBuffer
            });

            // 4. Download compressed blob
            const blob = new Blob([zipped as unknown as BlobPart], { type: 'application/zip' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export failed:', error);
            alert('Failed to export backup. Please try again.');
        } finally {
            setIsOperating(false);
        }
    };

    const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setIsOperating(true);
            const fileBuffer = await file.arrayBuffer();

            // Check if it's a ZIP file (starts with PK)
            const arr = new Uint8Array(fileBuffer);
            const isZip = arr.length > 2 && arr[0] === 0x50 && arr[1] === 0x4B;

            if (isZip) {
                const unzipped = unzipSync(arr);
                if (!unzipped['database.json']) {
                    alert('Invalid backup file format. Database missing.');
                    return;
                }

                if (window.confirm('This will overwrite all your current data. Are you sure?')) {
                    // Restore settings if present
                    if (unzipped['settings.json']) {
                        const settingsStr = strFromU8(unzipped['settings.json']);
                        const settings = JSON.parse(settingsStr);
                        if (settings.isBalanceHidden !== undefined) localStorage.setItem('finance-privacy-mode', settings.isBalanceHidden.toString());
                        if (settings.isAccountsBalanceHidden !== undefined) localStorage.setItem('finance-accounts-privacy-mode', settings.isAccountsBalanceHidden.toString());
                        if (settings.hiddenAccountTypes !== undefined) localStorage.setItem('finance-hidden-account-types', JSON.stringify(settings.hiddenAccountTypes));
                        if (settings.reportSortBy !== undefined) localStorage.setItem('finance-report-sort-by', settings.reportSortBy);
                        if (settings.showEventsInReport !== undefined) localStorage.setItem('finance-show-events-in-report', String(settings.showEventsInReport));
                        if (settings.showLogsInReport !== undefined) localStorage.setItem('finance-show-logs-in-report', String(settings.showLogsInReport));
                        if (settings.showManualInReport !== undefined) localStorage.setItem('finance-show-manual-in-report', String(settings.showManualInReport));
                        if (settings.pdfIncludeCharts !== undefined) localStorage.setItem('finance-pdf-include-charts', String(settings.pdfIncludeCharts));
                        if (settings.pdfIncludeAccountSummary !== undefined) localStorage.setItem('finance-pdf-include-account-summary', String(settings.pdfIncludeAccountSummary));
                        if (settings.pdfIncludeTransactions !== undefined) localStorage.setItem('finance-pdf-include-transactions', String(settings.pdfIncludeTransactions));
                        if (settings.pdfIncludeEventSummary !== undefined) localStorage.setItem('finance-pdf-include-event-summary', String(settings.pdfIncludeEventSummary));
                        if (settings.autoBackupEnabled !== undefined) localStorage.setItem('auto-backup-enabled', String(settings.autoBackupEnabled));
                        if (settings.showInvestmentAccounts !== undefined) localStorage.setItem('finance-show-investment-accounts', String(settings.showInvestmentAccounts));
                    }

                    // Import Database
                    const dbBlob = new Blob([unzipped['database.json'] as unknown as BlobPart], { type: 'application/json' });
                    await importInto(db, dbBlob, { clearTablesBeforeImport: true });

                    // Refresh application state
                    await initialize();
                    alert('Data restored successfully!');
                }
            } else {
                // Fallback to old JSON format import
                const textDecoder = new TextDecoder();
                const content = textDecoder.decode(fileBuffer);
                const data = JSON.parse(content);

                if (data.accounts && data.transactions && data.categories) {
                    if (window.confirm('This will overwrite your current data. Are you sure?')) {
                        await importData(data);
                        alert('Data restored successfully!');
                    }
                } else {
                    alert('Invalid backup file format');
                }
            }
        } catch (error) {
            console.error('Import failed:', error);
            alert('Error parsing backup file. It might be corrupt or an unsupported format.');
        } finally {
            setIsOperating(false);
            event.target.value = ''; // Reset input
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-xl font-bold text-gray-900">Backup Configuration</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Auto Backup Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Auto Backup</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">Daily Backup</h3>
                                        <p className="text-[10px] text-gray-500">Automatic backup at 9:00 PM IST</p>
                                        {(() => {
                                            const lastBackup = localStorage.getItem('last-auto-backup');
                                            if (lastBackup) {
                                                return (
                                                    <p className="text-[11px] text-gray-400 mt-2 font-medium">
                                                        Last backup: {lastBackup}
                                                    </p>
                                                );
                                            }
                                            return (
                                                <p className="text-[11px] text-gray-400 mt-2 font-medium">
                                                    No backups yet
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 scale-110">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isAutoBackupEnabled}
                                        onChange={(e) => {
                                            const enabled = e.target.checked;
                                            setIsAutoBackupEnabled(enabled);
                                            localStorage.setItem('auto-backup-enabled', enabled.toString());
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Management Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Data Management</h2>
                    <div className={isOperating ? "pointer-events-none bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50" : "bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50"}>
                        <button
                            onClick={handleExportBackup}
                            disabled={isOperating}
                            className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left ${isOperating ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                    {isOperating ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                                </div>
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-800">{isOperating ? 'Exporting...' : 'Backup Data'}</h3>
                                    <p className="text-[10px] text-gray-500">Download a secure & compressed ZIP backup</p>
                                </div>
                            </div>
                        </button>

                        <div className="relative w-full">
                            <input
                                type="file"
                                accept=".zip,.json"
                                onChange={handleImportBackup}
                                disabled={isOperating}
                                className={`absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10 ${isOperating ? 'hidden' : ''}`}
                            />
                            <div className={`w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors ${isOperating ? 'opacity-50' : ''}`}>
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                        {isOperating ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-semibold text-gray-800">{isOperating ? 'Restoring...' : 'Restore Data'}</h3>
                                        <p className="text-[10px] text-gray-500">Import data from a ZIP or JSON backup</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
