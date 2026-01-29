import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, PieChart } from 'lucide-react';

export function ReportSources() {
    const navigate = useNavigate();
    const {
        accounts,
        events,
        toggleAccountReportInclusion,
        toggleEventReportInclusion
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
                <h1 className="ml-2 text-xl font-bold text-gray-900 flex items-center">
                    <PieChart size={24} className="mr-2 text-pink-600" />
                    Report Sources
                </h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <p className="text-sm text-gray-500 px-1">
                    Select which accounts and events should be included in your financial reports and PDF exports.
                </p>

                {/* Accounts Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Accounts</h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 border border-gray-100">
                        {accounts.map(acc => (
                            <div key={acc.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold"
                                        style={{ backgroundColor: acc.color }}
                                    >
                                        {acc.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{acc.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-medium">{acc.type}</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={acc.includeInReports !== false}
                                        onChange={() => toggleAccountReportInclusion(acc.id)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Events Section */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Events</h2>
                    <div className="bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100 border border-gray-100">
                        {events.map(ev => (
                            <div key={ev.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                        style={{ backgroundColor: ev.color }}
                                    >
                                        <div className="text-lg">Event</div>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-800">{ev.name}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-medium">Event</p>
                                    </div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={ev.includeInReports !== false}
                                        onChange={() => toggleEventReportInclusion(ev.id)}
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                        {events.length === 0 && (
                            <div className="p-8 text-center">
                                <p className="text-sm text-gray-400 italic">No events defined</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}
