import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { type Transaction, type TransactionType } from '../types';
import { ArrowLeft, ChevronDown, Check, Trash2 } from 'lucide-react';
import { cn, generateId } from '../lib/utils';

export function TransactionForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { accounts, categories, events, addTransaction, editTransaction, transactions, deleteTransaction } = useFinanceStore();

    const [amount, setAmount] = useState('0');
    const [type, setType] = useState<TransactionType>('expense');
    const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
    const [toAccountId, setToAccountId] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(categories[0]?.id || '');
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [note, setNote] = useState('');
    const [excludeFromBalance, setExcludeFromBalance] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);

    useEffect(() => {
        // Pre-fill eventId from URL parameter (when navigating from event details)
        const eventIdParam = searchParams.get('eventId');
        const accountIdParam = searchParams.get('accountId');

        if (eventIdParam) {
            setSelectedEventId(eventIdParam);
        }

        if (accountIdParam && !id) {
            setSelectedAccountId(accountIdParam);
        }

        if (id) {
            const transaction = transactions.find(t => t.id === id);
            if (transaction) {
                setAmount(transaction.amount.toString());
                setType(transaction.type);
                setSelectedAccountId(transaction.accountId);
                if (transaction.type === 'transfer') {
                    setToAccountId(transaction.toAccountId || '');
                }
                // Handle case where category name is stored but we need ID for select
                // Ideally store should save category ID, but current implementation saves name
                // Let's try to find category by name, else default
                const category = categories.find(c => c.name === transaction.category);
                setSelectedCategory(category ? category.id : (categories[0]?.id || ''));
                setSelectedEventId(transaction.eventId || '');
                setNote(transaction.note || '');
                setExcludeFromBalance(!!transaction.excludeFromBalance);
                setIsEditing(true);
            }
        }
    }, [id, transactions, categories, searchParams]);

    // Keypad logic

    const getVisibleAccounts = (currentType: TransactionType) => {
        return currentType === 'transfer'
            ? accounts
            : accounts.filter(acc => ['fixed-deposit', 'savings', 'credit', 'cash', 'loan'].includes(acc.type));
    };

    const visibleAccounts = getVisibleAccounts(type);

    // Ensure selected account is visible in dropdown (for editing historical data)
    const accountsToList = (selectedAccountId && !visibleAccounts.find(a => a.id === selectedAccountId))
        ? [accounts.find(a => a.id === selectedAccountId)!].concat(visibleAccounts).filter(Boolean)
        : visibleAccounts;

    const handleTypeChange = (newType: TransactionType) => {
        setType(newType);

        // Validate Account
        const newVisible = getVisibleAccounts(newType);
        // If current selected account is not valid for new type, switch it.
        if (selectedAccountId && !newVisible.find(a => a.id === selectedAccountId)) {
            if (newVisible.length > 0) {
                setSelectedAccountId(newVisible[0].id);
            } else {
                setSelectedAccountId('');
            }
        } else if (!selectedAccountId && newVisible.length > 0) {
            setSelectedAccountId(newVisible[0].id);
        }

        // Validate Category
        // Always reset category to valid one for new type unless it matches
        // (Logic from previous effect)
        const currentCategory = categories.find(c => c.id === selectedCategory);
        if (currentCategory && currentCategory.type !== newType) {
            const firstValidCategory = categories.find(c => c.type === newType);
            if (firstValidCategory) {
                setSelectedCategory(firstValidCategory.id);
            } else {
                setSelectedCategory('');
            }
        } else if (!selectedCategory) {
            const firstValidCategory = categories.find(c => c.type === newType);
            if (firstValidCategory) {
                setSelectedCategory(firstValidCategory.id);
            }
        }
    };

    // Keypad logic
    const handleNumberClick = (num: string) => {
        if (amount === '0' && num !== '.') {
            setAmount(num);
        } else {
            if (num === '.' && amount.includes('.')) return;
            // Limit decimal places to 2
            if (amount.includes('.') && amount.split('.')[1].length >= 2) return;
            setAmount(prev => prev + num);
        }
    };

    const handleDelete = () => {
        if (amount.length === 1) {
            setAmount('0');
        } else {
            setAmount(prev => prev.slice(0, -1));
        }
    };

    const [showSuccess, setShowSuccess] = useState(false);

    const handleSubmit = () => {
        const value = parseFloat(amount);
        if (value <= 0) return;
        if (!selectedAccountId) {
            alert("Please create an account first!"); // Simple validation
            return;
        }
        if (type === 'transfer') {
            if (!toAccountId) {
                alert("Please select a destination account!");
                return;
            }
            if (toAccountId === selectedAccountId) {
                alert("Source and destination accounts must be different!");
                return;
            }
        }

        const categoryName = type === 'transfer'
            ? 'Transfer'
            : (categories.find(c => c.id === selectedCategory)?.name || 'Uncategorized');

        const transactionData: Transaction = {
            id: isEditing && id ? id : generateId(),
            accountId: selectedAccountId,
            toAccountId: type === 'transfer' ? toAccountId : undefined,
            amount: value,
            type,
            category: categoryName,
            date: isEditing && id ? (transactions.find(t => t.id === id)?.date || new Date().toISOString()) : new Date().toISOString(),
            note,
            eventId: selectedEventId || undefined,
            excludeFromBalance
        };

        if (isEditing && id) {
            editTransaction(id, transactionData);
        } else {
            addTransaction(transactionData);
            setAmount('0');
        }

        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleDeleteTransaction = () => {
        if (id && confirm('Are you sure you want to delete this transaction?')) {
            deleteTransaction(id);
            navigate(-1);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white pb-20 overflow-y-auto no-scrollbar">
            {/* Header */}
            <header className="flex items-center justify-between p-4 sticky top-0 bg-white z-10">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => handleTypeChange('expense')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", type === 'expense' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                    >
                        Expense
                    </button>
                    <button
                        onClick={() => handleTypeChange('income')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", type === 'income' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                    >
                        Income
                    </button>
                    <button
                        onClick={() => handleTypeChange('transfer')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", type === 'transfer' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                    >
                        Transfer
                    </button>
                </div>
                {isEditing ? (
                    <button onClick={handleDeleteTransaction} className="p-2 -mr-2 text-red-500">
                        <Trash2 size={24} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </header>

            {/* Amount Display */}
            <div className="flex-shrink-0 flex flex-col justify-center items-center p-6">
                <p className="text-gray-400 font-medium mb-2">Amount</p>
                <div
                    onClick={() => setShowKeypad(true)}
                    className="text-5xl font-bold tracking-tight text-gray-900 flex items-center cursor-pointer hover:opacity-80 transition-opacity decoration-blue-500 underline decoration-2 underline-offset-8 decoration-dashed"
                >
                    <span className="text-3xl mr-1 text-gray-400">₹</span>
                    {amount}
                </div>
            </div>

            {/* Form Fields */}
            <div className="px-4 space-y-3 mb-6">
                {/* Account Select */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Account</span>
                    <div className="relative">
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="appearance-none bg-transparent font-medium text-gray-900 pr-8 text-right focus:outline-none"
                        >
                            {accountsToList.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Category Select OR To Account Select */}
                {type === 'transfer' ? (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <span className="text-gray-500 text-sm font-medium">To Account</span>
                        <div className="relative">
                            <select
                                value={toAccountId}
                                onChange={(e) => setToAccountId(e.target.value)}
                                className="appearance-none bg-transparent font-medium text-gray-900 pr-8 text-right focus:outline-none"
                            >
                                <option value="" disabled>Select Account</option>
                                {accounts
                                    .filter(acc => acc.id !== selectedAccountId)
                                    .map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                            </select>
                            <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                        <span className="text-gray-500 text-sm font-medium">Category</span>
                        <div className="relative">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="appearance-none bg-transparent font-medium text-gray-900 pr-8 text-right focus:outline-none"
                            >
                                {categories
                                    .filter(cat => cat.type === type)
                                    .map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                    ))
                                }
                            </select>
                            <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                    </div>
                )}

                {/* Note Input */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Note</span>
                    <input
                        type="text"
                        placeholder="Add a note..."
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="bg-transparent text-right font-medium text-gray-900 placeholder-gray-400 focus:outline-none w-1/2"
                    />
                </div>

                {/* Event Select */}
                <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Event</span>
                    <div className="relative">
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="appearance-none bg-transparent font-medium text-gray-900 pr-8 text-right focus:outline-none"
                        >
                            <option value="">None</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>{event.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Balance Exclusion Toggle */}
                <div className="bg-blue-50/50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col">
                            <span className="text-blue-900 text-sm font-bold">Manual Transaction</span>
                            <span className="text-blue-600 text-[11px] font-medium leading-tight">Does not affect account balance</span>
                        </div>
                        <button
                            onClick={() => setExcludeFromBalance(!excludeFromBalance)}
                            className={cn(
                                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                                excludeFromBalance ? "bg-blue-600" : "bg-gray-200"
                            )}
                        >
                            <span
                                className={cn(
                                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                                    excludeFromBalance ? "translate-x-6" : "translate-x-1"
                                )}
                            />
                        </button>
                    </div>
                    {excludeFromBalance && (
                        <p className="text-[10px] text-blue-500 italic mt-1 leading-tight">
                            * Useful for past transactions, cash expenses already paid, or tracking costs in events without affecting your digital balances.
                        </p>
                    )}
                </div>
            </div>

            {/* Number Pad Popup */}
            {showKeypad && (
                <>
                    <div className="fixed inset-0 bg-black/20 z-40" onClick={() => setShowKeypad(false)} />
                    <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl p-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)] animate-in slide-in-from-bottom duration-200">
                        <div className="flex justify-end mb-2">
                            <button
                                onClick={() => setShowKeypad(false)}
                                className="px-4 py-2 bg-blue-100 text-blue-600 rounded-full font-bold text-sm"
                            >
                                Done
                            </button>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, '.', 0].map((num) => (
                                <button
                                    key={num}
                                    onClick={() => handleNumberClick(num.toString())}
                                    className="h-16 rounded-xl text-2xl font-semibold text-gray-900 bg-gray-50 active:bg-gray-200 transition-colors"
                                >
                                    {num}
                                </button>
                            ))}
                            <button
                                onClick={handleDelete}
                                className="h-16 rounded-xl flex items-center justify-center text-gray-900 bg-gray-50 active:bg-gray-200 transition-colors"
                            >
                                <ArrowLeft size={24} />
                            </button>
                        </div>
                    </div>
                </>
            )}

            <div className="px-4 pb-4 mt-auto space-y-3">
                {showSuccess && (
                    <div className="bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <Check size={16} className="mr-2" />
                        Transaction Saved Successfully!
                    </div>
                )}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-transform flex items-center justify-center space-x-2"
                >
                    <Check size={20} />
                    <span>{isEditing ? 'Update Transaction' : 'Save Transaction'}</span>
                </button>
            </div>

        </div>
    );
}
