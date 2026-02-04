import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Plus, CirclePlus, X, Pencil, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { cn, generateId } from '../lib/utils';
import { type Holding } from '../types';


function InvestmentLogsSection({ accountId }: { accountId: string }) {
    const { investmentLogs, addInvestmentLog, deleteInvestmentLog } = useFinanceStore();
    // Sort logs by date descending
    const logs = investmentLogs.filter(l => l.accountId === accountId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const [isAdding, setIsAdding] = useState(false);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [type, setType] = useState<'value' | 'profit'>('profit');
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');

    // Deletion State
    const [deletingLogId, setDeletingLogId] = useState<string | null>(null);
    const [deleteReason, setDeleteReason] = useState('');

    const handleAdd = () => {
        if (!amount || !date) return;

        addInvestmentLog({
            id: generateId(),
            accountId,
            date,
            type,
            amount: parseFloat(amount),
            note
        });

        setIsAdding(false);
        setAmount('');
        setNote('');
        setDate(new Date().toISOString().split('T')[0]);
    };

    const handleDelete = () => {
        if (deletingLogId) {
            deleteInvestmentLog(deletingLogId, deleteReason);
            setDeletingLogId(null);
            setDeleteReason('');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    return (
        <div className="flex-1 p-4 pb-0 overflow-y-auto max-h-64 border-b border-gray-100">
            <div className="flex justify-between items-center mb-3 ml-1">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Performance Logs</h3>
                {!isAdding && (
                    <button
                        onClick={() => setIsAdding(true)}
                        className="text-sm text-blue-600 font-bold hover:text-blue-800 flex items-center"
                    >
                        <Plus size={16} className="mr-1" /> Add Log
                    </button>
                )}
            </div>

            {/* Deletion Modal */}
            {deletingLogId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl scale-100 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Delete Log Entry?</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            This action cannot be undone. Please provide a reason for the audit trail.
                        </p>

                        <textarea
                            placeholder="Reason for deletion (optional)"
                            value={deleteReason}
                            onChange={(e) => setDeleteReason(e.target.value)}
                            className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-red-500 outline-none min-h-[80px] mb-4 resize-none"
                            autoFocus
                        />

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setDeletingLogId(null); setDeleteReason(''); }}
                                className="flex-1 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm shadow-red-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isAdding && (
                <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl mb-4 animate-in fade-in zoom-in duration-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Add Performance Log</h3>
                    <div className="space-y-3">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                        <div className="flex gap-2">
                            <button
                                onClick={() => setType('profit')}
                                className={cn("flex-1 py-2 text-sm font-medium rounded-lg border transition-colors", type === 'profit' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                            >
                                Profit/Loss
                            </button>
                            <button
                                onClick={() => setType('value')}
                                className={cn("flex-1 py-2 text-sm font-medium rounded-lg border transition-colors", type === 'value' ? "bg-blue-50 border-blue-200 text-blue-700" : "border-gray-200 text-gray-600 hover:bg-gray-50")}
                            >
                                Total Value
                            </button>
                        </div>
                        <input
                            type="number"
                            placeholder="Amount"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                            autoFocus
                        />
                        <input
                            type="text"
                            placeholder="Note (Optional)"
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />

                        <div className="flex items-center justify-between pt-1">
                            <button
                                onClick={() => setIsAdding(false)}
                                className="text-gray-500 text-sm font-medium hover:text-gray-700"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAdd}
                                disabled={!amount}
                                className="px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-2">
                {logs.length > 0 ? (
                    logs.map((log) => (
                        <div key={log.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between">
                            <div>
                                <div className="flex items-center space-x-2">
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-md uppercase", log.type === 'profit' ? (log.amount >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700") : "bg-blue-100 text-blue-700")}>
                                        {log.type === 'profit' ? 'P/L' : 'VAL'}
                                    </span>
                                    <span className="text-xs text-gray-500">{format(new Date(log.date), 'MMM dd, yyyy')}</span>
                                </div>
                                {log.note && <p className="text-xs text-gray-600 mt-1">{log.note}</p>}
                            </div>
                            <div className="flex items-center space-x-3">
                                <span className={cn("font-bold text-sm", log.type === 'profit' ? (log.amount >= 0 ? "text-green-600" : "text-red-600") : "text-gray-900")}>
                                    {log.type === 'profit' && log.amount > 0 ? '+' : ''}{formatCurrency(log.amount)}
                                </span>
                                <button
                                    onClick={() => setDeletingLogId(log.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors"
                                >
                                    <X size={14} />
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    !isAdding && <p className="text-gray-400 text-sm italic text-center py-4">No logs yet</p>
                )}
            </div>
        </div>
    );
}

export function AccountDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { accounts, transactions, investmentLogs, updateAccount, deleteAccount } = useFinanceStore();

    const account = accounts.find(a => a.id === id);

    const [activeTab, setActiveTab] = useState<'transactions' | 'logs' | 'holdings'>('transactions');

    // Holding Form State
    const [isAddingHolding, setIsAddingHolding] = useState(false);
    const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
    const [holdingName, setHoldingName] = useState('');
    const [holdingQty, setHoldingQty] = useState('');
    const [holdingRate, setHoldingRate] = useState('');
    const [isDeletingAccount, setIsDeletingAccount] = useState(false);

    const handleAddHolding = () => {
        if (!account || !holdingName || !holdingQty || !holdingRate) return;

        const qty = parseFloat(holdingQty);
        const rate = parseFloat(holdingRate);
        const price = qty * rate;

        const newHolding: Holding = {
            id: generateId(),
            name: holdingName,
            quantity: qty,
            purchaseRate: rate,
            purchasePrice: price
        };

        const currentHoldings = account.holdings || [];
        const updatedHoldings = [...currentHoldings, newHolding];

        const newBalance = updatedHoldings.reduce((sum, h) => sum + h.purchasePrice, 0);

        updateAccount(account.id, {
            holdings: updatedHoldings,
            balance: newBalance
        });

        setIsAddingHolding(false);
        setHoldingName('');
        setHoldingQty('');
        setHoldingRate('');
    };

    const handleEditHolding = (holding: Holding) => {
        setEditingHoldingId(holding.id);
        setHoldingName(holding.name);
        setHoldingQty(holding.quantity.toString());
        setHoldingRate(holding.purchaseRate.toString());
        setIsAddingHolding(true);
    };

    const handleSaveHolding = () => {
        if (!account || !holdingName || !holdingQty || !holdingRate) return;

        const qty = parseFloat(holdingQty);
        const rate = parseFloat(holdingRate);
        const price = qty * rate;

        if (editingHoldingId) {
            // Edit existing holding
            const updatedHoldings = (account.holdings || []).map(h =>
                h.id === editingHoldingId
                    ? { ...h, name: holdingName, quantity: qty, purchaseRate: rate, purchasePrice: price }
                    : h
            );

            const newBalance = updatedHoldings.reduce((sum, h) => sum + h.purchasePrice, 0);

            updateAccount(account.id, {
                holdings: updatedHoldings,
                balance: newBalance
            });
        } else {
            // Add new holding
            handleAddHolding();
            return;
        }

        setIsAddingHolding(false);
        setEditingHoldingId(null);
        setHoldingName('');
        setHoldingQty('');
        setHoldingRate('');
    };

    const handleRemoveHolding = (holdingId: string) => {
        if (!account || !account.holdings) return;

        const updatedHoldings = account.holdings.filter(h => h.id !== holdingId);
        const newBalance = updatedHoldings.reduce((sum, h) => sum + h.purchasePrice, 0);

        updateAccount(account.id, {
            holdings: updatedHoldings,
            balance: newBalance
        });
    };

    const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');

    const accountTransactions = useMemo(() => {
        if (!id) return [];
        const baseTransactions = transactions
            .filter(t => t.accountId === id || t.toAccountId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        if (filterType === 'all') return baseTransactions;

        return baseTransactions.filter(t => {
            const isTransfer = t.type === 'transfer';
            const isIncomingTransfer = isTransfer && t.toAccountId === id;
            const effectiveType = isTransfer
                ? (isIncomingTransfer ? 'income' : 'expense')
                : t.type;
            return effectiveType === filterType;
        });
    }, [id, transactions, filterType]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    if (!account) {
        return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500">Account not found</p>
                <button onClick={() => navigate('/accounts')} className="mt-4 text-blue-600 font-medium">
                    Back to Accounts
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 pb-20">
            {/* Header */}
            <header className="bg-white p-4 sticky top-0 z-10 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => navigate('/accounts')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <ArrowLeft size={24} />
                        </button>
                        <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => navigate(`/add?accountId=${account.id}`)}
                            className="p-2 text-blue-600 bg-blue-50 border border-blue-100 rounded-xl hover:bg-blue-100 transition-all shadow-sm active:scale-95"
                            title="Add Transaction"
                        >
                            <CirclePlus size={20} strokeWidth={2.5} />
                        </button>
                        <button
                            onClick={() => navigate(`/accounts?editAccountId=${account.id}`)}
                            className="p-2 text-gray-600 bg-gray-50 border border-gray-100 rounded-xl hover:bg-gray-100 transition-all shadow-sm active:scale-95"
                            title="Edit Account"
                        >
                            <Pencil size={20} />
                        </button>
                        <button
                            onClick={() => setIsDeletingAccount(true)}
                            className="p-2 text-red-600 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-all shadow-sm active:scale-95"
                            title="Delete Account"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                </div>
                <div className="flex flex-col items-center py-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl text-white shadow-lg">
                    <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">
                        {account.type === 'credit' ? 'Amount Spent' : 'Current Balance'}
                    </p>
                    <h2 className="text-4xl font-bold tracking-tight">
                        {formatCurrency(
                            account.type === 'credit'
                                ? transactions
                                    .filter(t => t.accountId === account.id || t.toAccountId === account.id)
                                    .reduce((sum, t) => {
                                        if (t.accountId === account.id) {
                                            return sum + (t.type === 'income' ? -t.amount : t.amount);
                                        }
                                        if (t.toAccountId === account.id) {
                                            return sum + (t.type === 'transfer' ? -t.amount : 0);
                                        }
                                        return sum;
                                    }, 0)
                                : account.balance
                        )}
                    </h2>
                    <p className="text-blue-200 text-sm mt-1 capitalize">{account.type === 'fixed-deposit' ? 'Fixed Deposit' : account.type}</p>

                    {/* Account Specific Details */}
                    <div className="mt-4 flex flex-wrap gap-3 justify-center text-xs text-blue-200 opacity-90">
                        {account.accountNumber && (
                            <span className="bg-blue-700/50 px-2 py-1 rounded-lg">Acc: {account.accountNumber}</span>
                        )}
                        {account.customerId && (
                            <span className="bg-blue-700/50 px-2 py-1 rounded-lg">Cust ID: {account.customerId}</span>
                        )}
                        {account.dmatId && (
                            <span className="bg-blue-700/50 px-2 py-1 rounded-lg">DMAT: {account.dmatId}</span>
                        )}
                    </div>
                </div>

                {/* Account Tabs */}
                <div className="flex p-1 bg-gray-100/50 rounded-xl mt-4">
                    <button
                        onClick={() => setActiveTab('transactions')}
                        className={cn(
                            "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                            activeTab === 'transactions' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Transactions
                    </button>
                    {(account.type === 'stock' || account.type === 'mutual-fund') && (
                        <button
                            onClick={() => setActiveTab('holdings')}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                activeTab === 'holdings' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Holdings
                        </button>
                    )}
                    {(account.logsRequired || account.type === 'stock' || account.type === 'mutual-fund' || account.type === 'land' || account.type === 'insurance' || account.type === 'fixed-deposit' || account.group === 'investment') && (
                        <button
                            onClick={() => setActiveTab('logs')}
                            className={cn(
                                "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                                activeTab === 'logs' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            Logs
                        </button>
                    )}
                </div>
            </header>

            {/* Holdings Section (Only for Stock and Mutual Fund Accounts) */}
            {activeTab === 'holdings' && (account.type === 'stock' || account.type === 'mutual-fund') && (
                <div className="flex-1 p-4 pb-0 overflow-y-auto border-b border-gray-100">
                    {/* Holdings Content (Keep existing content inside) */}
                    <div className="flex justify-between items-center mb-3 ml-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Holdings</h3>
                        {!isAddingHolding && (
                            <button
                                onClick={() => setIsAddingHolding(true)}
                                className="text-sm text-blue-600 font-bold hover:text-blue-800 flex items-center"
                            >
                                <Plus size={16} className="mr-1" /> Add Stock
                            </button>
                        )}
                    </div>

                    {isAddingHolding && (
                        <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                            <h3 className="text-lg font-bold text-gray-900 mb-4">{editingHoldingId ? 'Edit Stock' : 'Add Stock'}</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Stock/Fund Name"
                                    value={holdingName}
                                    onChange={(e) => setHoldingName(e.target.value)}
                                    className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    autoFocus
                                />
                                <div className="grid grid-cols-2 gap-2">
                                    <input
                                        type="number"
                                        placeholder="Rate"
                                        value={holdingRate}
                                        onChange={(e) => setHoldingRate(e.target.value)}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                    <input
                                        type="number"
                                        placeholder="Qty"
                                        value={holdingQty}
                                        onChange={(e) => setHoldingQty(e.target.value)}
                                        className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                                    />
                                </div>
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        onClick={() => { setIsAddingHolding(false); setEditingHoldingId(null); setHoldingName(''); setHoldingQty(''); setHoldingRate(''); }}
                                        className="text-gray-500 text-sm font-medium hover:text-gray-700"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveHolding}
                                        disabled={!holdingName || !holdingQty || !holdingRate}
                                        className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {editingHoldingId ? 'Save Changes' : 'Add Stock'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {account.holdings && account.holdings.length > 0 ? (
                            account.holdings.map((holding) => (
                                <div key={holding.id} className="p-4 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <h4 className="font-medium text-gray-900">{holding.name}</h4>
                                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                                                <span>Qty: {holding.quantity}</span>
                                                <span>Rate: {formatCurrency(holding.purchaseRate)}</span>
                                                <span className="font-medium text-gray-900">Total: {formatCurrency(holding.purchasePrice)}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <button
                                                onClick={() => handleEditHolding(holding)}
                                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors hover:bg-blue-50 rounded-lg"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveHolding(holding.id)}
                                                className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                                            >
                                                <X size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            !isAddingHolding && <p className="text-gray-400 text-sm italic text-center py-4">No holdings yet</p>
                        )}
                    </div>
                </div>
            )}

            {/* Investment Performance Logs Section */}
            {activeTab === 'logs' && (account.logsRequired || account.type === 'stock' || account.type === 'mutual-fund' || account.type === 'land' || account.type === 'insurance' || account.type === 'fixed-deposit' || account.group === 'investment') && (
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                        <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Total Logged Value</p>
                            <h3 className="text-xl font-bold text-gray-900">
                                {formatCurrency(investmentLogs.filter(l => l.accountId === account.id).reduce((sum, l) => sum + l.amount, 0))}
                            </h3>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter mb-1">Entries</p>
                            <p className="font-bold text-gray-700">{investmentLogs.filter(l => l.accountId === account.id).length}</p>
                        </div>
                    </div>
                    <InvestmentLogsSection accountId={account.id} />
                </div>
            )}

            {/* Transactions List */}
            {activeTab === 'transactions' && (
                <div className="flex-1 p-4 overflow-y-auto">
                    <div className="flex items-center justify-between mb-3 ml-1">
                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Transactions</h3>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setFilterType('all')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    filterType === 'all' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setFilterType('income')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    filterType === 'income' ? "bg-white text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Credit
                            </button>
                            <button
                                onClick={() => setFilterType('expense')}
                                className={cn(
                                    "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                                    filterType === 'expense' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                )}
                            >
                                Debit
                            </button>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {accountTransactions.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 text-sm">No transactions found.</p>
                            </div>
                        ) : (
                            accountTransactions.map((t) => {
                                const isTransfer = t.type === 'transfer';
                                const isIncomingTransfer = isTransfer && t.toAccountId === id;
                                // Effective type for this account view
                                const effectiveType = isTransfer
                                    ? (isIncomingTransfer ? 'income' : 'expense')
                                    : t.type;

                                // For incoming transfer, show as income with 'Transfer' label
                                // For outgoing transfer, show as expense with 'Transfer' label or To Account name logic?

                                return (
                                    <div
                                        key={t.id}
                                        onClick={() => navigate(`/edit/${t.id}`)}
                                        className={cn(
                                            "bg-white p-4 rounded-xl shadow-sm flex items-center justify-between border cursor-pointer active:bg-gray-50 transition-colors",
                                            isTransfer ? "border-indigo-100 bg-indigo-50/30" : "border-gray-100"
                                        )}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                isTransfer ? "bg-indigo-100 text-indigo-600" :
                                                    t.type === 'expense' ? "bg-red-50 text-red-500" : "bg-green-50 text-green-500"
                                            )}>
                                                {isTransfer ? <ArrowRightLeft size={20} /> :
                                                    t.type === 'expense' ? <ArrowDownRight size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900 text-sm">
                                                    {t.note || (isTransfer ? (isIncomingTransfer ? "Transfer In" : "Transfer Out") : t.category)}
                                                </p>
                                                <p className="text-xs text-gray-500">{format(new Date(t.date), 'MMM dd, h:mm a')}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "font-bold text-sm",
                                            effectiveType === 'expense' ? "text-gray-900" : "text-green-600"
                                        )}>
                                            {effectiveType === 'expense' ? '-' : '+'}{formatCurrency(t.amount)}
                                        </span>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Account Deletion Modal */}
            {isDeletingAccount && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl scale-100 animate-in zoom-in-95 duration-200 border border-gray-100">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4 mx-auto">
                            <Trash2 size={32} className="text-red-600" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2 text-center">Delete Account?</h3>
                        <p className="text-sm text-gray-500 mb-6 text-center leading-relaxed">
                            Are you sure you want to delete <span className="font-bold text-gray-700">"{account.name}"</span>? This will also remove all associated transactions and cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeletingAccount(false)}
                                className="flex-1 py-3 text-sm font-bold text-gray-600 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-all active:scale-95"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => {
                                    deleteAccount(account.id);
                                    navigate('/accounts');
                                }}
                                className="flex-1 py-3 text-sm font-bold text-white bg-red-600 rounded-2xl hover:bg-red-700 transition-all shadow-lg shadow-red-200 active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
