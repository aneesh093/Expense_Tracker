import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';

export function DisplaySettings() {
    const navigate = useNavigate();
    const { showInvestmentAccounts, setShowInvestmentAccounts, showAuditTrail, setShowAuditTrail } = useFinanceStore();

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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Display Settings</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                    <div className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-medium text-gray-900">Show Investment Accounts</h3>
                            <p className="text-sm text-gray-500">
                                Display the "Investments" tab in the Accounts page and include investment accounts in relevant views.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowInvestmentAccounts(!showInvestmentAccounts)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                                showInvestmentAccounts ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                    showInvestmentAccounts ? "left-6" : "left-1"
                                )}
                            />
                        </button>
                    </div>
                    <div className="p-6 flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-medium text-gray-900">Show Audit Trail</h3>
                            <p className="text-sm text-gray-500">
                                Display the "View Audit Trail" button in the Settings menu.
                            </p>
                        </div>
                        <button
                            onClick={() => setShowAuditTrail(!showAuditTrail)}
                            className={cn(
                                "w-11 h-6 rounded-full transition-colors relative flex-shrink-0 ml-4",
                                showAuditTrail ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "absolute top-1 w-4 h-4 rounded-full bg-white transition-transform",
                                    showAuditTrail ? "left-6" : "left-1"
                                )}
                            />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
