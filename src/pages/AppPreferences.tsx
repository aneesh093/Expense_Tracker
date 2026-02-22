import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, Clock, PieChart, Database, FileText, Layout, FileBarChart } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';
import { useState } from 'react';

type Tab = 'general' | 'reports';

export function AppPreferences() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<Tab>('general');

    const {
        showInvestmentAccounts, setShowInvestmentAccounts,
        showAuditTrail, setShowAuditTrail,
        reportSortBy, setReportSortBy,
        showEventsInReport, setShowEventsInReport,
        showLogsInReport, setShowLogsInReport,
        showManualInReport, setShowManualInReport,
        pdfIncludeCharts, setPdfIncludeCharts,
        pdfIncludeAccountSummary, setPdfIncludeAccountSummary,
        pdfIncludeTransactions, setPdfIncludeTransactions,
        pdfIncludeEventSummary, setPdfIncludeEventSummary
    } = useFinanceStore();

    const Toggle = ({ checked, onChange, color = "bg-blue-600" }: { checked: boolean, onChange: (val: boolean) => void, color?: string }) => (
        <button
            onClick={() => onChange(!checked)}
            className={cn(
                "w-11 h-6 rounded-full transition-colors relative flex-shrink-0",
                checked ? color : "bg-gray-200"
            )}
        >
            <span
                className={cn(
                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                    checked ? "left-6" : "left-1"
                )}
            />
        </button>
    );

    const SettingItem = ({ icon: Icon, title, description, children, iconBg = "bg-gray-100", iconColor = "text-gray-600" }: any) => (
        <div className="p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{description}</p>
                </div>
            </div>
            <div className="ml-4">
                {children}
            </div>
        </div>
    );

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
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-gray-900">App Preferences</h1>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Interface & Reports</p>
                </div>
            </header>

            <div className="p-4">
                {/* Tabs */}
                <div className="flex bg-gray-200/50 p-1 rounded-2xl mb-6">
                    {(['general', 'reports'] as Tab[]).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={cn(
                                "flex-1 py-3 text-xs font-bold rounded-xl transition-all capitalize",
                                activeTab === tab
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="space-y-6">
                    {activeTab === 'general' && (
                        <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Display & Interface</h2>
                            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                <SettingItem
                                    icon={Layout}
                                    title="Investment Accounts"
                                    description="Show investments tab and total net worth"
                                    iconBg="bg-blue-50"
                                    iconColor="text-blue-600"
                                >
                                    <Toggle checked={showInvestmentAccounts} onChange={setShowInvestmentAccounts} />
                                </SettingItem>
                                <SettingItem
                                    icon={Clock}
                                    title="Audit Trail"
                                    description="Track all changes and modifications"
                                    iconBg="bg-orange-50"
                                    iconColor="text-orange-600"
                                >
                                    <Toggle checked={showAuditTrail} onChange={setShowAuditTrail} color="bg-orange-500" />
                                </SettingItem>
                            </div>
                        </section>
                    )}

                    {activeTab === 'reports' && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                            <section>
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Report Logic</h2>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                    <SettingItem
                                        icon={Layers}
                                        title="Transaction Sorting"
                                        description="Order items by date or amount"
                                        iconBg="bg-indigo-50"
                                        iconColor="text-indigo-600"
                                    >
                                        <div className="flex bg-gray-100 p-1 rounded-lg">
                                            {(['date', 'amount'] as const).map((mode) => (
                                                <button
                                                    key={mode}
                                                    onClick={() => setReportSortBy(mode)}
                                                    className={cn(
                                                        "px-3 py-1 text-[10px] font-bold rounded-md transition-all capitalize",
                                                        reportSortBy === mode
                                                            ? "bg-white shadow-sm text-indigo-600"
                                                            : "text-gray-500 hover:text-gray-700"
                                                    )}
                                                >
                                                    {mode}
                                                </button>
                                            ))}
                                        </div>
                                    </SettingItem>
                                    <SettingItem
                                        icon={Clock}
                                        title="Include Events"
                                        description="Show event performance"
                                        iconBg="bg-blue-50"
                                        iconColor="text-blue-600"
                                    >
                                        <Toggle checked={showEventsInReport} onChange={setShowEventsInReport} />
                                    </SettingItem>
                                    <SettingItem
                                        icon={FileText}
                                        title="Log Expenses"
                                        description="Include manual log entries"
                                        iconBg="bg-orange-50"
                                        iconColor="text-orange-600"
                                    >
                                        <Toggle checked={showLogsInReport} onChange={setShowLogsInReport} color="bg-orange-500" />
                                    </SettingItem>
                                    <SettingItem
                                        icon={PieChart}
                                        title="Manual Expenses"
                                        description="Show ad-hoc spend entries"
                                        iconBg="bg-pink-50"
                                        iconColor="text-pink-600"
                                    >
                                        <Toggle checked={showManualInReport} onChange={setShowManualInReport} color="bg-pink-500" />
                                    </SettingItem>
                                </div>
                            </section>

                            <section>
                                <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">PDF Export Settings</h2>
                                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                                    <SettingItem
                                        icon={FileBarChart}
                                        title="Include Charts"
                                        description="Visual spending breakdown"
                                        iconBg="bg-blue-50"
                                        iconColor="text-blue-600"
                                    >
                                        <Toggle checked={pdfIncludeCharts} onChange={setPdfIncludeCharts} />
                                    </SettingItem>
                                    <SettingItem
                                        icon={Database}
                                        title="Account Summary"
                                        description="Balance summary tables"
                                        iconBg="bg-teal-50"
                                        iconColor="text-teal-600"
                                    >
                                        <Toggle checked={pdfIncludeAccountSummary} onChange={setPdfIncludeAccountSummary} color="bg-teal-500" />
                                    </SettingItem>
                                    <SettingItem
                                        icon={Clock}
                                        title="Event Summary"
                                        description="Detailed event breakdown"
                                        iconBg="bg-blue-50"
                                        iconColor="text-blue-600"
                                    >
                                        <Toggle checked={pdfIncludeEventSummary} onChange={setPdfIncludeEventSummary} />
                                    </SettingItem>
                                    <SettingItem
                                        icon={Layers}
                                        title="Transaction List"
                                        description="Full itemized history"
                                        iconBg="bg-violet-50"
                                        iconColor="text-violet-600"
                                    >
                                        <Toggle checked={pdfIncludeTransactions} onChange={setPdfIncludeTransactions} color="bg-violet-500" />
                                    </SettingItem>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
