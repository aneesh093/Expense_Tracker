import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableAccountItem } from '../components/SortableAccountItem';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useState, useEffect } from 'react';
import { cn, generateId } from '../lib/utils';
import { type Account, type AccountType } from '../types';
import { Plus, Trash2, Wallet, X, AlertTriangle, ToggleLeft, ToggleRight, Eye, EyeOff } from 'lucide-react';

export function Accounts() {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const { accounts, transactions, addAccount, updateAccount, deleteAccount, isAccountsBalanceHidden, toggleAccountsBalanceHidden, reorderList, toggleAccountTypeVisibility, isAccountTypeHidden } = useFinanceStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

    // Form State
    // Form State
    const [name, setName] = useState('');
    const [subName, setSubName] = useState('');
    const [type, setType] = useState<AccountType>('fixed-deposit');

    const [balance, setBalance] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);
    const [accountNumber, setAccountNumber] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [dmatId, setDmatId] = useState('');

    // Loan Fields
    const [principalAmount, setPrincipalAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyEmi, setMonthlyEmi] = useState('');
    const [emisLeft, setEmisLeft] = useState('');

    // Insurance Fields
    const [policyNumber, setPolicyNumber] = useState('');
    const [premiumAmount, setPremiumAmount] = useState('');
    const [renewalDate, setRenewalDate] = useState('');

    // Credit Card Fields
    const [statementDate, setStatementDate] = useState('');
    const [dueDate, setDueDate] = useState('');

    const [activeTab, setActiveTab] = useState<'banking' | 'investments'>('banking');

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        }),
        useSensor(TouchSensor)
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
    };

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            // Find which group the active item belongs to
            // We can infer the group from the active item's type, but we must use the filtered list logic
            // Actually, we can just find the item in our local 'groupedAccounts' derived state, 
            // but we don't have access to 'groupedAccounts' inside this callback easily unless we define it before,
            // or we re-derive.
            // Better: find the type of the account.
            const activeAccount = accounts.find(a => a.id === active.id);
            const overAccount = accounts.find(a => a.id === over.id);

            if (activeAccount && overAccount && activeAccount.type === overAccount.type) {
                // Get all accounts of this type, sorted by current order
                // IMPORTANT: We must use the same sorting logic as the UI (which is by order)
                const groupItems = accounts
                    .filter(a => a.type === activeAccount.type)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                const oldIndex = groupItems.findIndex(item => item.id === active.id);
                const newIndex = groupItems.findIndex(item => item.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(groupItems, oldIndex, newIndex).map(item => item.id);
                    reorderList('accounts', newOrder);
                }
            }
        }
    };

    const handleSave = () => {
        if (!name.trim()) return;

        // Check for duplicate account name, excluding current account if editing
        const isDuplicate = accounts.some(
            acc => acc.name.toLowerCase() === name.trim().toLowerCase() && acc.id !== editingId
        );

        if (isDuplicate) {
            alert('An account with this name already exists.');
            return;
        }

        const accountData: Partial<Account> = {
            name,
            subName,
            type,
            balance: parseFloat(balance) || 0,
            color: 'blue',
            isPrimary,
            group: activeTab === 'investments' ? 'investment' : 'banking'
        };

        if (type === 'savings') {
            accountData.accountNumber = accountNumber;
            accountData.customerId = customerId;
        } else if (type === 'stock' || type === 'mutual-fund' || type === 'other' || type === 'land') {
            accountData.dmatId = dmatId;
            accountData.customerId = customerId;
        } else if (type === 'insurance') {
            accountData.insuranceDetails = {
                policyNumber,
                premiumAmount: parseFloat(premiumAmount) || 0,
                renewalDate
            };
        } else if (type === 'loan') {
            accountData.loanDetails = {
                principalAmount: parseFloat(principalAmount) || 0,
                interestRate: parseFloat(interestRate) || 0,
                monthlyEmi: parseFloat(monthlyEmi) || 0,
                emisLeft: parseFloat(emisLeft) || 0,
            };
        } else if (type === 'credit') {
            accountData.creditCardDetails = {
                statementDate: parseInt(statementDate) || 1,
                dueDate: parseInt(dueDate) || 1,
            };
        }

        if (editingId) {
            updateAccount(editingId, accountData);
        } else {
            addAccount({
                ...accountData,
                id: generateId(),
            } as Account);
        }

        setIsAdding(false);
        resetForm();
    };

    const handleEdit = (account: Account) => {
        setEditingId(account.id);
        setName(account.name);
        setSubName(account.subName || '');
        setType(account.type);
        setBalance(account.balance.toString());
        setIsPrimary(account.isPrimary || false);

        // Populate specific fields if they exist
        if (account.accountNumber) setAccountNumber(account.accountNumber);
        if (account.customerId) setCustomerId(account.customerId);
        if (account.dmatId) setDmatId(account.dmatId);

        if (account.type === 'loan' && account.loanDetails) {
            setPrincipalAmount(account.loanDetails.principalAmount.toString());
            setInterestRate(account.loanDetails.interestRate.toString());
            setMonthlyEmi(account.loanDetails.monthlyEmi.toString());
            setEmisLeft(account.loanDetails.emisLeft.toString());
        }

        if (account.type === 'insurance' && account.insuranceDetails) {
            setPolicyNumber(account.insuranceDetails.policyNumber);
            setPremiumAmount(account.insuranceDetails.premiumAmount.toString());
            setRenewalDate(account.insuranceDetails.renewalDate);
        }

        if (account.type === 'credit' && account.creditCardDetails) {
            setStatementDate(account.creditCardDetails.statementDate.toString());
            setDueDate(account.creditCardDetails.dueDate.toString());
        }

        setIsAdding(true);
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setSubName('');
        setBalance('');
        setIsPrimary(false);
        setType('fixed-deposit');
        setAccountNumber('');
        setCustomerId('');
        setDmatId('');

        setPrincipalAmount('');
        setInterestRate('');
        setMonthlyEmi('');
        setEmisLeft('');

        setPolicyNumber('');
        setPremiumAmount('');
        setRenewalDate('');
        setStatementDate('');
        setDueDate('');
    };

    const handleDeleteConfirm = () => {
        if (accountToDelete) {
            deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        }
    };

    const isInvestment = (type: AccountType) => type === 'stock' || type === 'mutual-fund' || type === 'land' || type === 'insurance' || type === 'other';

    const filteredAccounts = accounts.filter(acc => {
        // If account has a group, use that to determine tab
        if (acc.group) {
            return (activeTab === 'investments' ? 'investment' : 'banking') === acc.group;
        }

        // Fallback for generic categorization
        return activeTab === 'banking' ? !isInvestment(acc.type) : isInvestment(acc.type);
    }).sort((a, b) => (a.order || 0) - (b.order || 0));

    // Group accounts by type
    const groupedAccounts = filteredAccounts.reduce((groups, account) => {
        const type = account.type;
        if (!groups[type]) {
            groups[type] = [];
        }
        groups[type].push(account);
        return groups;
    }, {} as Record<string, Account[]>);

    // Get type display name
    const getTypeDisplayName = (type: AccountType): string => {
        switch (type) {
            case 'savings': return 'Savings';
            case 'fixed-deposit': return 'Fixed Deposit';
            case 'credit': return 'Credit Card';
            case 'cash': return 'Cash';
            case 'loan': return 'Loans';
            case 'stock': return 'Stock';
            case 'mutual-fund': return 'Mutual Fund';
            case 'other': return 'Other';
            case 'land': return 'Land';
            case 'insurance': return 'Insurance';
            default: return type;
        }
    };

    // getAccountIcon removed as it is in SortableAccountItem or reused if needed.
    // Keeping it if needed for other parts, but SortableAccountItem handles it.
    // Actually, let's keep it for now or remove if unused. It was used in the list mapping.
    // I am replacing the list mapping, so I can remove it if I replace the list code.
    // It's still used in this snippet so I'm not including it here, I cut off before.

    const openAddModal = () => {
        resetForm();
        setIsAdding(true);
        // Default type based on tab
        setType(activeTab === 'banking' ? 'fixed-deposit' : 'stock');
    };

    const toggleSelectAccount = (accountId: string) => {
        const newSelected = new Set(selectedAccounts);
        if (newSelected.has(accountId)) {
            newSelected.delete(accountId);
        } else {
            newSelected.add(accountId);
        }
        setSelectedAccounts(newSelected);
    };

    const handleBulkDelete = () => {
        if (selectedAccounts.size === 0) return;

        const accountNames = Array.from(selectedAccounts)
            .map(id => accounts.find(acc => acc.id === id)?.name)
            .filter(Boolean)
            .join(', ');

        if (confirm(`Delete ${selectedAccounts.size} account(s): ${accountNames}?`)) {
            selectedAccounts.forEach(id => deleteAccount(id));
            setSelectedAccounts(new Set());
            setIsSelectMode(false);
        }
    };

    // Trigger edit mode if editAccountId is present in URL
    useEffect(() => {
        const editId = searchParams.get('editAccountId');
        if (editId && accounts.length > 0) {
            const accountToEdit = accounts.find(a => a.id === editId);
            if (accountToEdit) {
                handleEdit(accountToEdit);
                // Clear the parameter so it doesn't re-trigger
                const newParams = new URLSearchParams(searchParams);
                newParams.delete('editAccountId');
                setSearchParams(newParams, { replace: true });
            }
        }
    }, [searchParams, accounts, handleEdit, setSearchParams]);

    const cancelSelectMode = () => {
        setIsSelectMode(false);
        setSelectedAccounts(new Set());
    };

    return (
        <div className="space-y-6 pb-20">
            <header className="flex flex-col gap-4">
                <div className="flex justify-between items-center w-full">
                    <h1 className="text-2xl font-bold text-gray-900">Accounts</h1>
                    <div className="flex items-center space-x-2">
                        {!isSelectMode ? (
                            <>
                                <button
                                    onClick={() => setIsSelectMode(true)}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                                >
                                    Select
                                </button>
                                <button
                                    onClick={toggleAccountsBalanceHidden}
                                    className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                                    title={isAccountsBalanceHidden ? "Show Balances" : "Hide Balances"}
                                >
                                    {isAccountsBalanceHidden ? <EyeOff size={24} /> : <Eye size={24} />}
                                </button>
                                <button
                                    onClick={openAddModal}
                                    className="p-2 bg-blue-100 text-blue-600 rounded-full hover:bg-blue-200 transition-colors"
                                >
                                    <Plus size={24} />
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={cancelSelectMode}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm"
                            >
                                Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex p-1 bg-gray-100 rounded-xl">
                    <button
                        onClick={() => { setActiveTab('banking'); }}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'banking' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Banking
                    </button>
                    <button
                        onClick={() => { setActiveTab('investments'); }}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'investments' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Investments
                    </button>
                </div>

            </header>

            {/* Add Account Modal */}
            {isAdding && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 animate-in slide-in-from-bottom-10 fade-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold">{editingId ? 'Edit Account' : 'New Account'}</h2>
                            <button onClick={() => { setIsAdding(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g., Main Savings"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Subname (Optional)</label>
                                <input
                                    type="text"
                                    value={subName}
                                    onChange={(e) => setSubName(e.target.value)}
                                    placeholder="e.g., Salary Account"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {activeTab === 'banking' ? (
                                        ['fixed-deposit', 'savings', 'credit', 'cash', 'loan', 'other'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setType(t as AccountType)}
                                                className={cn(
                                                    "p-2 rounded-lg text-sm font-medium capitalize border transition-all",
                                                    type === t
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {t === 'fixed-deposit' ? 'FD' : t}
                                            </button>
                                        ))
                                    ) : (
                                        ['stock', 'mutual-fund', 'land', 'insurance', 'other'].map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setType(t as AccountType)}
                                                className={cn(
                                                    "p-2 rounded-lg text-sm font-medium capitalize border transition-all",
                                                    type === t
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                                                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                                                )}
                                            >
                                                {t === 'mutual-fund' ? 'Mutual Fund' : t}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>

                            {/* Insurance Specific Fields */}
                            {type === 'insurance' && (
                                <div className="space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Policy Number</label>
                                        <input
                                            type="text"
                                            value={policyNumber}
                                            onChange={(e) => setPolicyNumber(e.target.value)}
                                            className="w-full p-3 bg-white rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                                            placeholder="e.g. POL123456789"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Premium Amount</label>
                                            <input
                                                type="number"
                                                value={premiumAmount}
                                                onChange={(e) => setPremiumAmount(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Renewal Date</label>
                                            <input
                                                type="date"
                                                value={renewalDate}
                                                onChange={(e) => setRenewalDate(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'loan' && (
                                <div className="space-y-4 bg-orange-50 p-4 rounded-xl border border-orange-100">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Principal Amount</label>
                                            <input
                                                type="number"
                                                value={principalAmount}
                                                onChange={(e) => setPrincipalAmount(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                                            <input
                                                type="number"
                                                value={interestRate}
                                                onChange={(e) => setInterestRate(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500"
                                                placeholder="e.g. 10.5"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly EMI</label>
                                            <input
                                                type="number"
                                                value={monthlyEmi}
                                                onChange={(e) => setMonthlyEmi(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500"
                                                placeholder="0.00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">EMIs Left</label>
                                            <input
                                                type="number"
                                                value={emisLeft}
                                                onChange={(e) => setEmisLeft(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-orange-200 focus:ring-2 focus:ring-orange-500"
                                                placeholder="e.g. 24"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {type === 'credit' && (
                                <div className="space-y-4 bg-purple-50 p-4 rounded-xl border border-purple-100">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Statement Date</label>
                                            <select
                                                value={statementDate}
                                                onChange={(e) => setStatementDate(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 text-sm"
                                            >
                                                <option value="">Select Day</option>
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                                            <select
                                                value={dueDate}
                                                onChange={(e) => setDueDate(e.target.value)}
                                                className="w-full p-3 bg-white rounded-xl border border-purple-200 focus:ring-2 focus:ring-purple-500 text-sm"
                                            >
                                                <option value="">Select Day</option>
                                                {[...Array(31)].map((_, i) => (
                                                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-purple-600">
                                        These dates help calculate your billed and due amounts based on the monthly cycle.
                                    </p>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {type === 'loan' ? 'Outstanding Balance' : 'Balance'}
                                </label>
                                <input
                                    type="number"
                                    value={balance}
                                    onChange={(e) => setBalance(e.target.value)}
                                    placeholder="0.00"
                                    className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {type === 'savings' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number</label>
                                        <input
                                            type="text"
                                            value={accountNumber}
                                            onChange={(e) => setAccountNumber(e.target.value)}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                                        <input
                                            type="text"
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {(type === 'stock' || type === 'mutual-fund' || type === 'other' || type === 'land') && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">DMAT ID</label>
                                        <input
                                            type="text"
                                            value={dmatId}
                                            onChange={(e) => setDmatId(e.target.value)}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Customer ID</label>
                                        <input
                                            type="text"
                                            value={customerId}
                                            onChange={(e) => setCustomerId(e.target.value)}
                                            className="w-full p-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center space-x-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="isPrimary"
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <label htmlFor="isPrimary" className="text-gray-900 font-medium">
                                    Set as Primary Account
                                </label>
                            </div>

                        </div>

                        <button
                            onClick={handleSave}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg active:scale-[0.98] transition-transform"
                        >
                            {editingId ? 'Save Changes' : 'Create Account'}
                        </button>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {
                accountToDelete && (
                    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                        <div className="bg-white rounded-2xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-4">
                                <AlertTriangle className="text-red-600" size={24} />
                            </div>

                            <h3 className="text-lg font-bold text-center mb-2">Delete Account?</h3>
                            <p className="text-sm text-gray-600 text-center mb-6">
                                Are you sure you want to delete "{accountToDelete.name}"? This action cannot be undone.
                            </p>

                            <div className="flex space-x-3">
                                <button
                                    onClick={() => setAccountToDelete(null)}
                                    className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDeleteConfirm}
                                    className="flex-1 py-3 px-4 bg-red-600 text-white font-semibold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Accounts List */}
            <div className="space-y-4">
                {filteredAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No accounts found</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            Tap + to add your first account
                        </p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="space-y-6">
                            {Object.entries(groupedAccounts).map(([type, accountsInGroup]) => {
                                const groupTotal = accountsInGroup.reduce((sum, acc) => sum + acc.balance, 0);
                                // Determine the group for this account type based on activeTab
                                const group = activeTab === 'investments' ? 'investment' : 'banking';
                                const isHidden = isAccountTypeHidden(type as AccountType, group);

                                return (
                                    <div key={type}>
                                        {/* Type Header */}
                                        <div className="flex justify-between items-center mb-3 ml-1">
                                            <div className="flex items-center space-x-3">
                                                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                                    {getTypeDisplayName(type as AccountType)}
                                                </h3>
                                                <button
                                                    onClick={() => toggleAccountTypeVisibility(type as AccountType, group)}
                                                    className={cn(
                                                        "transition-colors rounded-full p-1",
                                                        isHidden ? "text-gray-400 hover:text-gray-600" : "text-blue-600 hover:text-blue-700"
                                                    )}
                                                    title={isHidden ? "Include in Net Worth" : "Exclude from Net Worth"}
                                                >
                                                    {isHidden ? (
                                                        <ToggleLeft size={24} />
                                                    ) : (
                                                        <ToggleRight size={24} />
                                                    )}
                                                </button>
                                            </div>
                                            <span className={cn(
                                                "text-[15px] font-extrabold px-3 py-1.5 rounded-xl border shadow-sm transition-all",
                                                type === 'credit' ? "text-purple-700 bg-purple-50 border-purple-100" :
                                                    type === 'cash' ? "text-green-700 bg-green-50 border-green-100" :
                                                        type === 'loan' ? "text-orange-700 bg-orange-50 border-orange-100" :
                                                            type === 'savings' ? "text-teal-700 bg-teal-50 border-teal-100" :
                                                                "text-blue-700 bg-blue-50 border-blue-100"
                                            )}>
                                                {isAccountsBalanceHidden
                                                    ? '•••••'
                                                    : formatCurrency(
                                                        type === 'credit'
                                                            ? accountsInGroup.reduce((total, acc) => {
                                                                const spent = transactions
                                                                    .filter(t => t.accountId === acc.id || t.toAccountId === acc.id)
                                                                    .reduce((sum, t) => {
                                                                        if (t.accountId === acc.id) {
                                                                            return sum + (t.type === 'income' ? -t.amount : t.amount);
                                                                        }
                                                                        if (t.toAccountId === acc.id) {
                                                                            return sum + (t.type === 'transfer' ? -t.amount : 0);
                                                                        }
                                                                        return sum;
                                                                    }, 0);
                                                                return total + spent;
                                                            }, 0)
                                                            : groupTotal
                                                    )
                                                }
                                            </span>
                                        </div>

                                        {/* Accounts in this type */}
                                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                            <SortableContext items={accountsInGroup} strategy={verticalListSortingStrategy}>
                                                {accountsInGroup.map((acc) => {
                                                    const isSelected = selectedAccounts.has(acc.id);
                                                    const isCredit = acc.type === 'credit';
                                                    const spentAmount = isCredit
                                                        ? transactions
                                                            .filter(t => t.accountId === acc.id || t.toAccountId === acc.id)
                                                            .reduce((sum, t) => {
                                                                if (t.accountId === acc.id) {
                                                                    return sum + (t.type === 'income' ? -t.amount : t.amount);
                                                                }
                                                                if (t.toAccountId === acc.id) {
                                                                    return sum + (t.type === 'transfer' ? -t.amount : 0);
                                                                }
                                                                return sum;
                                                            }, 0)
                                                        : acc.balance;

                                                    return (
                                                        <SortableAccountItem
                                                            key={acc.id}
                                                            account={acc}
                                                            isSelectMode={isSelectMode}
                                                            isSelected={isSelected}
                                                            toggleSelectAccount={toggleSelectAccount}
                                                            navigate={navigate}
                                                            isBalanceHidden={isAccountsBalanceHidden}
                                                            formatCurrency={formatCurrency}
                                                            spentAmount={spentAmount}
                                                            transactions={transactions}
                                                        />
                                                    );
                                                })}
                                            </SortableContext>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </DndContext>
                )}
            </div>

            {/* Bulk Action Bar */}
            {
                isSelectMode && selectedAccounts.size > 0 && (
                    <div className="fixed bottom-20 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
                        <div className="max-w-2xl mx-auto flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-700">
                                {selectedAccounts.size} account{selectedAccounts.size > 1 ? 's' : ''} selected
                            </p>
                            <button
                                onClick={handleBulkDelete}
                                className="px-6 py-2 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors shadow-md flex items-center space-x-2"
                            >
                                <Trash2 size={18} />
                                <span>Delete Selected</span>
                            </button>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
