import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft, Layers, ChevronRight, Clock, PieChart,
    Settings2, Info, BookOpen, Shield,
    HardDrive, ListTree
} from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';

export function Settings() {
    const navigate = useNavigate();
    const { showAuditTrail } = useFinanceStore();

    const SettingGroup = ({ title, children }: { title: string, children: React.ReactNode }) => (
        <section>
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">{title}</h2>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">
                {children}
            </div>
        </section>
    );

    const SettingItem = ({ icon: Icon, title, description, path, iconBg, iconColor }: any) => (
        <button
            onClick={() => navigate(path)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50/50 active:bg-gray-100/50 transition-all text-left"
        >
            <div className="flex items-center space-x-4">
                <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm", iconBg, iconColor)}>
                    <Icon size={22} />
                </div>
                <div className="min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 truncate">{description}</p>
                </div>
            </div>
            <ChevronRight size={18} className="text-gray-300" />
        </button>
    );

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white/80 backdrop-blur-md px-4 py-6 flex items-center sticky top-0 z-10 border-b border-gray-100">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="ml-2">
                    <h1 className="text-2xl font-black text-gray-900">Settings</h1>
                    <p className="text-xs text-gray-400 font-medium">Customize your experience</p>
                </div>
            </header>

            <div className="flex-1 p-4 space-y-8 max-w-lg mx-auto w-full">

                <SettingGroup title="Management">
                    <SettingItem
                        icon={Layers}
                        title="Categories"
                        description="Manage income and expense categories"
                        path="/categories"
                        iconBg="bg-purple-50"
                        iconColor="text-purple-600"
                    />
                    <SettingItem
                        icon={Clock}
                        title="Mandates"
                        description="View and run recurring transactions"
                        path="/mandates"
                        iconBg="bg-green-50"
                        iconColor="text-green-600"
                    />
                    {showAuditTrail && (
                        <SettingItem
                            icon={ListTree}
                            title="Audit Trail"
                            description="History of account modifications"
                            path="/settings/audit-trail"
                            iconBg="bg-orange-50"
                            iconColor="text-orange-600"
                        />
                    )}
                </SettingGroup>

                <SettingGroup title="Preferences">
                    <SettingItem
                        icon={Settings2}
                        title="App Preferences"
                        description="Display and report configuration"
                        path="/settings/preferences"
                        iconBg="bg-blue-50"
                        iconColor="text-blue-600"
                    />
                    <SettingItem
                        icon={PieChart}
                        title="Report Sources"
                        description="Choose accounts included in reports"
                        path="/settings/report-sources"
                        iconBg="bg-pink-50"
                        iconColor="text-pink-600"
                    />
                </SettingGroup>

                <SettingGroup title="Security & Data">
                    <SettingItem
                        icon={Shield}
                        title="Security"
                        description="Passcode and biometric settings"
                        path="/settings/security"
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-600"
                    />
                    <SettingItem
                        icon={HardDrive}
                        title="Backup & Restore"
                        description="Import/Export your app data"
                        path="/settings/backup"
                        iconBg="bg-cyan-50"
                        iconColor="text-cyan-600"
                    />
                </SettingGroup>

                <SettingGroup title="Resources">
                    <SettingItem
                        icon={BookOpen}
                        title="User Guide"
                        description="Learn how to use it more efficiently"
                        path="/settings/user-guide"
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-600"
                    />
                    <SettingItem
                        icon={Info}
                        title="About"
                        description="App version and developer info"
                        path="/settings/about"
                        iconBg="bg-gray-100"
                        iconColor="text-gray-600"
                    />
                </SettingGroup>

                <div className="pt-8 text-center">
                    <p className="text-[10px] font-bold text-gray-300 uppercase tracking-[0.3em]">Finance Tracker v2.1.0</p>
                </div>
            </div>
        </div>
    );
}
