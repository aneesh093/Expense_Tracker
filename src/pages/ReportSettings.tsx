import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, Layers, Clock, Database, FileText } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';

export function ReportSettings() {
    const navigate = useNavigate();
    const {
        reportSortBy, setReportSortBy,
        showEventsInReport, setShowEventsInReport,
        showLogsInReport, setShowLogsInReport,
        showManualInReport, setShowManualInReport,
        pdfIncludeCharts, setPdfIncludeCharts,
        pdfIncludeAccountSummary, setPdfIncludeAccountSummary,
        pdfIncludeTransactions, setPdfIncludeTransactions,
        pdfIncludeEventSummary, setPdfIncludeEventSummary
    } = useFinanceStore();

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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Report Settings</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Display Settings Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Display Settings</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Report Sorting</p>
                                    <p className="text-[10px] text-gray-500">How transactions are ordered in reports</p>
                                </div>
                            </div>
                            <div className="flex bg-gray-100 p-1 rounded-lg">
                                <button
                                    onClick={() => setReportSortBy('date')}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                        reportSortBy === 'date'
                                            ? "bg-white shadow-sm text-indigo-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Date
                                </button>
                                <button
                                    onClick={() => setReportSortBy('amount')}
                                    className={cn(
                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                                        reportSortBy === 'amount'
                                            ? "bg-white shadow-sm text-indigo-600"
                                            : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Amount
                                </button>
                            </div>
                        </div>

                        <div className="mt-6 border-t border-gray-100 pt-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Include Events</p>
                                        <p className="text-[10px] text-gray-500">Show event/log performance in reports</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showEventsInReport}
                                        onChange={(e) => setShowEventsInReport(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                        <PieChart size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Manual Expenses</p>
                                        <p className="text-[10px] text-gray-500">Show manual expenses in reports</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showManualInReport}
                                        onChange={(e) => setShowManualInReport(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-pink-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <FileText size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Log Expenses</p>
                                        <p className="text-[10px] text-gray-500">Show log-based expenses in reports</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={showLogsInReport}
                                        onChange={(e) => setShowLogsInReport(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>

                {/* PDF Export Settings Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">PDF Export Settings</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden p-4">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                        <Clock size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Event Summary</p>
                                        <p className="text-[10px] text-gray-500">Show detailed event/log breakdown in PDF</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={pdfIncludeEventSummary}
                                        onChange={(e) => setPdfIncludeEventSummary(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                        <PieChart size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Include Charts</p>
                                        <p className="text-[10px] text-gray-500">Show visual charts in PDF reports</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={pdfIncludeCharts}
                                        onChange={(e) => setPdfIncludeCharts(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-600">
                                        <Database size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Account Summary</p>
                                        <p className="text-[10px] text-gray-500">Show balance summary table in PDF</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={pdfIncludeAccountSummary}
                                        onChange={(e) => setPdfIncludeAccountSummary(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                                </label>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
                                        <Layers size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold text-gray-800">Include Transactions</p>
                                        <p className="text-[10px] text-gray-500">Show detailed transaction lists in PDF</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={pdfIncludeTransactions}
                                        onChange={(e) => setPdfIncludeTransactions(e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-violet-600"></div>
                                </label>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
