import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Plus, X, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { cn, generateId } from '../lib/utils';
import { useMemo, useState } from 'react';
import { type Holding } from '../types';

export function AccountDetails() {
    const navigate = useNavigate();
    const { id } = useParams();
    const { accounts, transactions, updateAccount } = useFinanceStore();

    const account = accounts.find(a => a.id === id);

    // Holding Form State
    const [isAddingHolding, setIsAddingHolding] = useState(false);
    const [editingHoldingId, setEditingHoldingId] = useState<string | null>(null);
    const [holdingName, setHoldingName] = useState('');
    const [holdingQty, setHoldingQty] = useState('');
    const [holdingRate, setHoldingRate] = useState('');

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

    const accountTransactions = useMemo(() => {
        if (!id) return [];
        return transactions
            .filter(t => t.accountId === id || t.toAccountId === id)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [id, transactions]);

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
                <div className="flex items-center space-x-3 mb-4">
                    <button onClick={() => navigate('/accounts')} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-900">{account.name}</h1>
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
            </header>

            {/* Holdings Section (Only for Stock and Mutual Fund Accounts) */}
            {(account.type === 'stock' || account.type === 'mutual-fund') && (
                <div className="flex-1 p-4 pb-0 overflow-y-auto max-h-64 border-b border-gray-100">
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

            {/* Transactions List */}
            <div className="flex-1 p-4 overflow-y-auto">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3 ml-1">Transactions</h3>
                <div className="space-y-3">
                    {accountTransactions.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                            <p className="text-gray-500 text-sm">No transactions yet.</p>
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
        </div>
    );
}
