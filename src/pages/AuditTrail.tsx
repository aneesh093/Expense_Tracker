import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, History, PlusCircle, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export function AuditTrail() {
    const navigate = useNavigate();
    const { auditTrails, accounts } = useFinanceStore();

    const getAccountName = (id: string) => {
        return accounts.find(a => a.id === id)?.name || 'Unknown Account';
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'create': return <PlusCircle size={18} className="text-green-500" />;
            case 'update': return <Edit2 size={18} className="text-blue-500" />;
            case 'delete': return <Trash2 size={18} className="text-red-500" />;
            default: return <History size={18} className="text-gray-500" />;
        }
    };

    const getActionLabel = (action: string) => {
        switch (action) {
            case 'create': return 'Transaction Created';
            case 'update': return 'Transaction Updated';
            case 'delete': return 'Transaction Deleted';
            default: return action;
        }
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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Audit Trail</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {auditTrails.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                        <History size={48} className="mb-2 opacity-20" />
                        <p>No audit logs found</p>
                    </div>
                ) : (
                    auditTrails.map((log) => (
                        <div key={log.id} className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center space-x-2">
                                    {getActionIcon(log.action)}
                                    <span className="font-semibold text-gray-900">{getActionLabel(log.action)}</span>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {format(new Date(log.timestamp), 'MMM d, h:mm a')}
                                </span>
                            </div>

                            <div className="text-sm text-gray-600 space-y-2">
                                {log.action === 'create' && (
                                    <div className="bg-gray-50 p-2 rounded-lg">
                                        <p><span className="font-medium text-gray-700">Account:</span> {getAccountName(log.details.current.accountId)}</p>
                                        <p><span className="font-medium text-gray-700">Amount:</span> ₹{log.details.current.amount.toLocaleString()}</p>
                                        <p><span className="font-medium text-gray-700">Category:</span> {log.details.current.category}</p>
                                        {log.details.current.note && <p><span className="font-medium text-gray-700">Note:</span> {log.details.current.note}</p>}
                                    </div>
                                )}

                                {log.action === 'update' && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div className="text-gray-400 uppercase font-medium">Field</div>
                                            <div className="text-gray-400 uppercase font-medium">Change</div>
                                        </div>
                                        {Object.keys(log.details.current).map(key => {
                                            if (JSON.stringify(log.details.previous[key]) !== JSON.stringify(log.details.current[key])) {
                                                return (
                                                    <div key={key} className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-1">
                                                        <div className="font-medium text-gray-700 capitalize">{key}</div>
                                                        <div className="flex flex-col">
                                                            <span className="text-red-400 line-through truncate">{String(log.details.previous[key] || 'None')}</span>
                                                            <span className="text-green-600 font-medium truncate">{String(log.details.current[key] || 'None')}</span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })}
                                    </div>
                                )}

                                {log.action === 'delete' && (
                                    <div className="bg-red-50 p-2 rounded-lg">
                                        <p><span className="font-medium text-red-700">Account:</span> {getAccountName(log.details.previous.accountId)}</p>
                                        <p><span className="font-medium text-red-700">Amount:</span> ₹{log.details.previous.amount.toLocaleString()}</p>
                                        <p><span className="font-medium text-red-700">Category:</span> {log.details.previous.category}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
