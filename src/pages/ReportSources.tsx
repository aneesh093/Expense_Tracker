import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Landmark, Calendar } from 'lucide-react';
import { cn } from '../lib/utils';

export function ReportSources() {
    const navigate = useNavigate();
    const {
        accounts,
        events,
        toggleAccountReportInclusion,
        toggleEventReportInclusion
    } = useFinanceStore();

    const MultiSelectToggle = ({ options, onToggle }: { 
        options: { label: string, value: string, isSelected: boolean }[], 
        onToggle: (id: string) => void 
    }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map((option) => (
                <button
                    key={option.value}
                    onClick={() => onToggle(option.value)}
                    className={cn(
                        "px-3 py-1 text-xs font-medium rounded-full transition-all border",
                        option.isSelected
                            ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                            : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                    )}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );

    const SettingGroupItem = ({ icon: Icon, title, description, children, iconBg = "bg-gray-100", iconColor = "text-gray-600" }: any) => (
        <div className="p-4 flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{description}</p>
                </div>
            </div>
            <div className="pl-13 w-full">
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
                    <h1 className="text-xl font-bold text-gray-900">Report Sources</h1>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Configure Data Inclusion</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Source Visibility</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        <SettingGroupItem
                            icon={Landmark}
                            title="Financial Accounts"
                            description="Selected accounts are included in reports & net worth"
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                        >
                            <MultiSelectToggle
                                options={accounts.map(acc => ({
                                    label: acc.name,
                                    value: acc.id,
                                    isSelected: acc.includeInReports !== false
                                }))}
                                onToggle={toggleAccountReportInclusion}
                            />
                        </SettingGroupItem>

                        <SettingGroupItem
                            icon={Calendar}
                            title="Events & Logs"
                            description="Selected items appear in event summaries"
                            iconBg="bg-pink-50"
                            iconColor="text-pink-600"
                        >
                            <MultiSelectToggle
                                options={events.map(ev => ({
                                    label: ev.name,
                                    value: ev.id,
                                    isSelected: ev.includeInReports !== false
                                }))}
                                onToggle={toggleEventReportInclusion}
                            />
                            {events.length === 0 && (
                                <p className="text-[10px] text-gray-400 italic mt-1">No events defined</p>
                            )}
                        </SettingGroupItem>
                    </div>
                    <p className="mt-3 px-2 text-[10px] text-gray-500 italic">
                        * Note: These settings control which data sources contribute to your financial summaries. 
                        Disabling a source will hide its transactions from all reports.
                    </p>
                </section>
            </div>
        </div>
    );
}
