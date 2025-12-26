import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Download, Upload, Layers, ChevronRight, Clock, EyeOff } from 'lucide-react';

export function Settings() {
    const navigate = useNavigate();
    const {
        categories,
        accounts,
        transactions,
        events,
        importData,
        isBalanceHidden,
        setBalanceHidden
    } = useFinanceStore();

    const handleExportBackup = () => {
        const data = {
            accounts,
            transactions,
            categories,
            events
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `finance_backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };



    const handleImportBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const content = e.target?.result as string;
                const data = JSON.parse(content);

                if (data.accounts && data.transactions && data.categories) {
                    if (window.confirm('This will overwrite your current data. Are you sure?')) {
                        importData(data);
                        alert('Data restored successfully!');
                    }
                } else {
                    alert('Invalid backup file format');
                }
            } catch (error) {
                alert('Error parsing backup file');
                console.error(error);
            }
        };
        reader.readAsText(file);
        // Reset input
        event.target.value = '';
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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Settings</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* General Section */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">General</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                        <button
                            onClick={() => navigate('/events')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Clock size={20} />
                                </div>
                                <span className="font-medium text-gray-900">Manage Events</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/categories')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                                    <Layers size={20} />
                                </div>
                                <span className="font-medium text-gray-900">Manage Categories</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/mandates')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                                    <Clock size={20} />
                                </div>
                                <span className="font-medium text-gray-900">Manage Mandates</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </section>

                {/* Privacy Section */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Privacy</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                                        <EyeOff size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">Hide Balances</h3>
                                        <p className="text-sm text-gray-500 mt-1">Hide account balances by default on startup</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={isBalanceHidden}
                                        onChange={(e) => setBalanceHidden(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Auto Backup Section */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Auto Backup</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                        <div className="p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                                        <Clock size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-medium text-gray-900">Daily Backup</h3>
                                        <p className="text-sm text-gray-500 mt-1">Automatic backup at 9:00 PM IST</p>
                                        {(() => {
                                            const lastBackup = localStorage.getItem('last-auto-backup');
                                            if (lastBackup) {
                                                return (
                                                    <p className="text-xs text-gray-400 mt-2">
                                                        Last backup: {lastBackup}
                                                    </p>
                                                );
                                            }
                                            return (
                                                <p className="text-xs text-gray-400 mt-2">
                                                    No backups yet
                                                </p>
                                            );
                                        })()}
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        defaultChecked={localStorage.getItem('auto-backup-enabled') !== 'false'}
                                        onChange={(e) => {
                                            localStorage.setItem('auto-backup-enabled', e.target.checked.toString());
                                        }}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Data Management Section */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Data Management</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                        <button
                            onClick={handleExportBackup}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Download size={20} />
                                </div>
                                <div>
                                    <h3 className="font-medium text-gray-900">Backup Data</h3>
                                    <p className="text-sm text-gray-500">Download a JSON backup of your data</p>
                                </div>
                            </div>
                        </button>

                        <div className="relative w-full">
                            <input
                                type="file"
                                accept=".json"
                                onChange={handleImportBackup}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <Upload size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-gray-900">Restore Data</h3>
                                        <p className="text-sm text-gray-500">Import data from a JSON backup</p>
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
