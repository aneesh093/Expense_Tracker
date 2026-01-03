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
    const [isEditing, setIsEditing] = useState(false);
    const [showKeypad, setShowKeypad] = useState(false);

    useEffect(() => {
        // Pre-fill eventId from URL parameter (when navigating from event details)
        const eventIdParam = searchParams.get('eventId');
        if (eventIdParam) {
            setSelectedEventId(eventIdParam);
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
                setIsEditing(true);
            }
        }
    }, [id, transactions, categories, searchParams]);

    // Keypad logic

    const visibleAccounts = type === 'transfer'
        ? accounts
        : accounts.filter(acc => ['fixed-deposit', 'savings', 'credit', 'cash', 'loan'].includes(acc.type));

    // Update selected category and account validation when type changes
    useEffect(() => {
        // Validation for Account
        // If current selected account is not in visible list, pick the first one
        if (selectedAccountId && !visibleAccounts.find(a => a.id === selectedAccountId)) {
            if (visibleAccounts.length > 0) {
                setSelectedAccountId(visibleAccounts[0].id);
            } else {
                setSelectedAccountId('');
            }
        }
        // If no account selected but we have visible ones, pick first
        else if (!selectedAccountId && visibleAccounts.length > 0) {
            setSelectedAccountId(visibleAccounts[0].id);
        }

        // Validation for Category
        const currentCategory = categories.find(c => c.id === selectedCategory);
        if (currentCategory && currentCategory.type !== type) {
            const firstValidCategory = categories.find(c => c.type === type);
            if (firstValidCategory) {
                setSelectedCategory(firstValidCategory.id);
            } else {
                setSelectedCategory('');
            }
        } else if (!selectedCategory) {
            const firstValidCategory = categories.find(c => c.type === type);
            if (firstValidCategory) {
                setSelectedCategory(firstValidCategory.id);
            }
        }
    }, [type, categories, selectedCategory, visibleAccounts, selectedAccountId]);

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

        const categoryName = categories.find(c => c.id === selectedCategory)?.name || 'Uncategorized';

        const transactionData: Transaction = {
            id: isEditing && id ? id : generateId(),
            accountId: selectedAccountId,
            toAccountId: type === 'transfer' ? toAccountId : undefined,
            amount: value,
            type,
            category: categoryName,
            date: isEditing && id ? (transactions.find(t => t.id === id)?.date || new Date().toISOString()) : new Date().toISOString(),
            note,
            eventId: selectedEventId || undefined
        };

        if (isEditing && id) {
            editTransaction(id, transactionData);
        } else {
            addTransaction(transactionData);
        }
        navigate('/');
    };

    const handleDeleteTransaction = () => {
        if (id && confirm('Are you sure you want to delete this transaction?')) {
            deleteTransaction(id);
            navigate('/');
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white pb-20">
            {/* Header */}
            <header className="flex items-center justify-between p-4">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => setType('expense')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", type === 'expense' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                    >
                        Expense
                    </button>
                    <button
                        onClick={() => setType('income')}
                        className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", type === 'income' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                    >
                        Income
                    </button>
                    <button
                        onClick={() => setType('transfer')}
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
            <div className="flex-1 flex flex-col justify-center items-center p-6">
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
            <div className="px-4 space-y-3 mb-4">
                {/* Account Select */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
                    <span className="text-gray-500 text-sm font-medium">Account</span>
                    <div className="relative">
                        <select
                            value={selectedAccountId}
                            onChange={(e) => setSelectedAccountId(e.target.value)}
                            className="appearance-none bg-transparent font-medium text-gray-900 pr-8 text-right focus:outline-none"
                        >
                            {visibleAccounts.map(acc => (
                                <option key={acc.id} value={acc.id}>{acc.name}</option>
                            ))}
                        </select>
                        <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* Category Select OR To Account Select */}
                {type === 'transfer' ? (
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
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
                    <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
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
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
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
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-xl">
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

            <div className="px-4 pb-2">
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
