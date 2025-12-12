import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, ArrowUpRight, ArrowDownRight, ArrowRightLeft, Plus, X } from 'lucide-react';
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

        // Recalculate balance based on holdings
        // Note: For investment accounts, we might want the balance to purely reflect holdings value
        // plus any uninvested cash (if we tracked that separately). For now, assuming balance = total holdings value.
        // Or should we just ADD to the existing balance?
        // The previous implementation in Accounts.tsx set balance = totalValue.
        // So we should stick to that consistency: Investment Account Balance = Sum of Holdings Value.

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
                    <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-wider">Current Balance</p>
                    <h2 className="text-4xl font-bold tracking-tight">{formatCurrency(account.balance)}</h2>
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
                        <div className="bg-white p-3 rounded-xl border border-blue-100 shadow-sm mb-3 space-y-3 animate-in slide-in-from-top-2">
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
                                    onClick={() => setIsAddingHolding(false)}
                                    className="text-gray-500 text-sm font-medium hover:text-gray-700"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleAddHolding}
                                    className="px-4 py-1.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        {account.holdings && account.holdings.length > 0 ? (
                            account.holdings.map((h, i) => (
                                <div key={i} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 group">
                                    <div>
                                        <p className="font-semibold text-gray-900">{h.name}</p>
                                        <p className="text-xs text-gray-500">{h.quantity} units @ {formatCurrency(h.purchaseRate)}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <p className="font-bold text-gray-900">{formatCurrency(h.purchasePrice)}</p>
                                        <button
                                            onClick={() => handleRemoveHolding(h.id)}
                                            className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                        >
                                            <X size={16} />
                                        </button>
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
