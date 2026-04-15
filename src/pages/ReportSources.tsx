import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart, Calendar } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';

export function ReportSources() {
    const navigate = useNavigate();
    const {
        accounts,
        events,
        toggleAccountReportInclusion,
        toggleEventReportInclusion
    } = useFinanceStore();

    const SettingGroupItem = ({ icon: Icon, title, description, children, iconBg = 'bg-gray-100', iconColor = 'text-gray-600' }: any) => (
        <div className="p-4 flex flex-col">
            <div className="flex items-center space-x-3 mb-3">
                <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', iconBg, iconColor)}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{description}</p>
                </div>
            </div>
            <div className="pl-1 w-full">
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
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Configure Report Data Sources</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Accounts Section */}
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Accounts</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        <SettingGroupItem
                            icon={PieChart}
                            title="Included Accounts"
                            description="Toggle which accounts are included in reports and PDF exports"
                            iconBg="bg-pink-50"
                            iconColor="text-pink-600"
                        >
                            {accounts.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No accounts defined</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {accounts.map(acc => {
                                        const isIncluded = acc.includeInReports !== false;
                                        return (
                                            <button
                                                key={acc.id}
                                                onClick={() => toggleAccountReportInclusion(acc.id)}
                                                className={cn(
                                                    'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full transition-all border',
                                                    isIncluded
                                                        ? 'border-2 text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                )}
                                                style={isIncluded ? { backgroundColor: acc.color, borderColor: acc.color } : {}}
                                            >
                                                {acc.name}
                                                <span className="text-[9px] uppercase opacity-70">{acc.type}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </SettingGroupItem>
                    </div>
                </section>

                {/* Events Section */}
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Events / Logs</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        <SettingGroupItem
                            icon={Calendar}
                            title="Included Events"
                            description="Toggle which events are included in reports and PDF exports"
                            iconBg="bg-blue-50"
                            iconColor="text-blue-600"
                        >
                            {events.length === 0 ? (
                                <p className="text-xs text-gray-400 italic">No events defined</p>
                            ) : (
                                <div className="flex flex-wrap gap-2">
                                    {events.map(ev => {
                                        const isIncluded = ev.includeInReports !== false;
                                        return (
                                            <button
                                                key={ev.id}
                                                onClick={() => toggleEventReportInclusion(ev.id)}
                                                className={cn(
                                                    'px-3 py-1.5 text-xs font-medium rounded-full transition-all border',
                                                    isIncluded
                                                        ? 'border-2 text-white shadow-sm'
                                                        : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                                                )}
                                                style={isIncluded ? { backgroundColor: ev.color, borderColor: ev.color } : {}}
                                            >
                                                {ev.name}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </SettingGroupItem>
                    </div>
                </section>

                <p className="px-2 text-[10px] text-gray-500 italic">
                    * These settings control which accounts and events are included in your financial reports and PDF exports.
                </p>
            </div>
        </div>
    );
}
