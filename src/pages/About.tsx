import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Code, Database, Globe, Box, Layers, Cpu } from 'lucide-react';

export function About() {
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
                <h1 className="ml-2 text-xl font-bold text-gray-900">About</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Developer Info */}
                <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                        <Code size={40} />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900">Finance App</h2>
                    <p className="text-sm text-gray-500 mb-6">v1.0.0</p>

                    <div className="bg-gray-50 rounded-xl p-4">
                        <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold mb-1">Developed By</p>
                        <p className="text-lg font-medium text-gray-800">Aneesh Mathai</p>
                    </div>
                </section>

                {/* Tech Stack */}
                <section>
                    <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 px-1">Technology Stack</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-cyan-50 flex items-center justify-center text-cyan-600">
                                <Globe size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">React</h3>
                                <p className="text-xs text-gray-500">UI Library</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                                <Code size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">TypeScript</h3>
                                <p className="text-xs text-gray-500">Language</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
                                <Box size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Tailwind CSS</h3>
                                <p className="text-xs text-gray-500">Styling</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center text-yellow-600">
                                <Cpu size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Vite</h3>
                                <p className="text-xs text-gray-500">Build Tool</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-purple-50 flex items-center justify-center text-purple-600">
                                <Layers size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Zustand</h3>
                                <p className="text-xs text-gray-500">State Management</p>
                            </div>
                        </div>
                        <div className="p-4 flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                                <Database size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-bold text-gray-800">Dexie.js</h3>
                                <p className="text-xs text-gray-500">IndexedDB Wrapper</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
