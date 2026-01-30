import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Layers, ChevronRight, Clock, PieChart, Database } from 'lucide-react';

export function Settings() {
    const navigate = useNavigate();

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
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">General</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                        <button
                            onClick={() => navigate('/events')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                    <Clock size={20} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">Manage Event/Log</span>
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
                                <span className="text-sm font-semibold text-gray-800">Manage Categories</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/settings/audit-trail')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                                    <Clock size={20} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">View Audit Trail</span>
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
                                <span className="text-sm font-semibold text-gray-800">Manage Mandates</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/settings/report-sources')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                                    <PieChart size={20} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">Report Sources</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/settings/backup')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center text-cyan-600">
                                    <Database size={20} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">Backup Configuration</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                        <button
                            onClick={() => navigate('/settings/reports')}
                            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors text-left"
                        >
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <Layers size={20} />
                                </div>
                                <span className="text-sm font-semibold text-gray-800">Report Settings</span>
                            </div>
                            <ChevronRight size={20} className="text-gray-400" />
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}
