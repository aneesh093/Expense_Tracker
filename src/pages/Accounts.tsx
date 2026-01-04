import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { type Account, type AccountType } from '../types';
import { CreditCard, Plus, X, Wallet, Building, Banknote, Landmark, Trash2, AlertTriangle, Pencil, PiggyBank, TrendingUp, PieChart, Briefcase, Check, MapPin } from 'lucide-react';
import { cn, generateId } from '../lib/utils';

export function Accounts() {
    const navigate = useNavigate();
    const { accounts, addAccount, updateAccount, deleteAccount, isBalanceHidden } = useFinanceStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
    const [isSelectMode, setIsSelectMode] = useState(false);
    const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set());

    // Form State
    const [name, setName] = useState('');
    const [subName, setSubName] = useState('');
    const [type, setType] = useState<AccountType>('fixed-deposit');
    const [balance, setBalance] = useState('');
    const [isPrimary, setIsPrimary] = useState(false);

    // Additional Fields
    const [accountNumber, setAccountNumber] = useState('');
    const [customerId, setCustomerId] = useState('');
    const [dmatId, setDmatId] = useState('');

    // Loan Fields
    const [principalAmount, setPrincipalAmount] = useState('');
    const [interestRate, setInterestRate] = useState('');
    const [monthlyEmi, setMonthlyEmi] = useState('');
    const [emisLeft, setEmisLeft] = useState('');

    const [activeTab, setActiveTab] = useState<'banking' | 'investments'>('banking');
    const [filterType, setFilterType] = useState<AccountType | 'all'>('all');

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
        }).format(amount);
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
            isPrimary
        };

        if (type === 'savings') {
            accountData.accountNumber = accountNumber;
            accountData.customerId = customerId;
        } else if (type === 'stock' || type === 'mutual-fund' || type === 'other' || type === 'land') {
            accountData.dmatId = dmatId;
            accountData.customerId = customerId;
        } else if (type === 'loan') {
            accountData.loanDetails = {
                principalAmount: parseFloat(principalAmount) || 0,
                interestRate: parseFloat(interestRate) || 0,
                monthlyEmi: parseFloat(monthlyEmi) || 0,
                emisLeft: parseFloat(emisLeft) || 0,
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
    };

    const handleDeleteConfirm = () => {
        if (accountToDelete) {
            deleteAccount(accountToDelete.id);
            setAccountToDelete(null);
        }
    };

    const isInvestment = (type: AccountType) => type === 'stock' || type === 'mutual-fund' || type === 'other' || type === 'land';

    const filteredAccounts = accounts.filter(acc => {
        const matchesTab = activeTab === 'banking' ? !isInvestment(acc.type) : isInvestment(acc.type);
        const matchesFilter = filterType === 'all' || acc.type === filterType;
        return matchesTab && matchesFilter;
    });

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
            default: return type;
        }
    };

    // Get icon for account type
    const getAccountIcon = (type: AccountType) => {
        const iconProps = { size: 20 };
        switch (type) {
            case 'fixed-deposit':
                return <Landmark {...iconProps} />;
            case 'savings':
                return <PiggyBank {...iconProps} />;
            case 'credit':
                return <CreditCard {...iconProps} />;
            case 'cash':
                return <Banknote {...iconProps} />;
            case 'loan':
                return <Wallet {...iconProps} />;
            case 'stock':
                return <TrendingUp {...iconProps} />;
            case 'mutual-fund':
                return <PieChart {...iconProps} />;
            case 'other':
                return <Briefcase {...iconProps} />;
            case 'land':
                return <MapPin {...iconProps} />;
            default:
                return <Building {...iconProps} />;
        }
    };

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
                        onClick={() => { setActiveTab('banking'); setFilterType('all'); }}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'banking' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Banking
                    </button>
                    <button
                        onClick={() => { setActiveTab('investments'); setFilterType('all'); }}
                        className={cn(
                            "flex-1 py-2 text-sm font-bold rounded-lg transition-all",
                            activeTab === 'investments' ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Investments
                    </button>
                </div>

                {/* Filter Dropdown */}
                <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as AccountType | 'all')}
                    className="w-full p-3 bg-white rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                    <option value="all">All {activeTab === 'banking' ? 'Banking' : 'Investment'} Accounts</option>
                    {activeTab === 'banking' ? (
                        <>
                            <option value="fixed-deposit">Fixed Deposit</option>
                            <option value="savings">Savings</option>
                            <option value="credit">Credit Card</option>
                            <option value="cash">Cash</option>
                            <option value="loan">Loans</option>
                        </>
                    ) : (
                        <>
                            <option value="stock">Stock</option>
                            <option value="mutual-fund">Mutual Fund</option>
                            <option value="land">Land</option>
                            <option value="other">Other</option>
                        </>
                    )}
                </select>
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
                                        ['fixed-deposit', 'savings', 'credit', 'cash', 'loan'].map((t) => (
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
                                        ['stock', 'mutual-fund', 'land', 'other'].map((t) => (
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

                            {/* Loan Specific Fields */}
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

                            <button
                                onClick={handleSave}
                                className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl mt-4 shadow-lg active:scale-[0.98] transition-transform"
                            >
                                {editingId ? 'Save Changes' : 'Create Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {accountToDelete && (
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
            )}

            {/* Accounts List */}
            <div className="space-y-4">
                {filteredAccounts.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="bg-gray-100 h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Wallet size={32} className="text-gray-400" />
                        </div>
                        <h3 className="text-gray-900 font-medium">No accounts found</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            {accounts.length === 0 ? "Tap + to add your first account" : "Try selecting a different filter"}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {Object.entries(groupedAccounts).map(([type, accountsInGroup]) => {
                            const groupTotal = accountsInGroup.reduce((sum, acc) => sum + acc.balance, 0);
                            return (
                                <div key={type}>
                                    {/* Type Header */}
                                    <div className="flex justify-between items-center mb-3 ml-1">
                                        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                                            {getTypeDisplayName(type as AccountType)}
                                        </h3>
                                        <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-1 rounded-lg">
                                            {isBalanceHidden ? '•••••' : formatCurrency(groupTotal)}
                                        </span>
                                    </div>

                                    {/* Accounts in this type */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        {accountsInGroup.map((acc, index) => {
                                            const isSelected = selectedAccounts.has(acc.id);
                                            return (
                                                <div
                                                    key={acc.id}
                                                    onClick={() => isSelectMode ? toggleSelectAccount(acc.id) : navigate(`/accounts/${acc.id}`)}
                                                    className={cn(
                                                        "flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer active:bg-gray-100",
                                                        index !== accountsInGroup.length - 1 && "border-b border-gray-100",
                                                        isSelected && "bg-blue-50"
                                                    )}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        {isSelectMode && (
                                                            <div
                                                                className={cn(
                                                                    "w-5 h-5 rounded border-2 flex items-center justify-center transition-colors",
                                                                    isSelected ? "bg-blue-600 border-blue-600" : "border-gray-300"
                                                                )}
                                                            >
                                                                {isSelected && <Check size={14} className="text-white" />}
                                                            </div>
                                                        )}
                                                        <div className={cn(
                                                            "p-3 rounded-xl",
                                                            acc.type === 'credit' ? "bg-purple-100 text-purple-600" :
                                                                acc.type === 'cash' ? "bg-green-100 text-green-600" :
                                                                    acc.type === 'loan' ? "bg-orange-100 text-orange-600" :
                                                                        acc.type === 'stock' || acc.type === 'mutual-fund' || acc.type === 'land' ? "bg-blue-100 text-blue-600" :
                                                                            acc.type === 'savings' ? "bg-teal-100 text-teal-600" :
                                                                                "bg-gray-100 text-gray-600"
                                                        )}>
                                                            {getAccountIcon(acc.type)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900 leading-tight">
                                                                {acc.name}
                                                            </h3>
                                                            {acc.subName && (
                                                                <p className="text-sm text-gray-600 mt-0.5">{acc.subName}</p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center space-x-4">
                                                        <div className="text-right flex flex-col items-end min-h-[44px] justify-center">
                                                            {acc.isPrimary && (
                                                                <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider mb-1">
                                                                    Primary
                                                                </span>
                                                            )}
                                                            {acc.type === 'loan' && acc.loanDetails && (
                                                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide mb-1">
                                                                    {acc.loanDetails.emisLeft} EMIs Left
                                                                </span>
                                                            )}
                                                            <p className={cn("font-bold", acc.balance < 0 ? "text-red-600" : "text-gray-900")}>
                                                                {isBalanceHidden && !acc.isPrimary ? '•••••' : formatCurrency(acc.balance)}
                                                            </p>
                                                        </div>

                                                        {!isSelectMode && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        handleEdit(acc);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-blue-500 transition-colors hover:bg-blue-50 rounded-lg"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>

                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        e.preventDefault();
                                                                        setAccountToDelete(acc);
                                                                    }}
                                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )
                }
            </div>

            {/* Bulk Action Bar */}
            {isSelectMode && selectedAccounts.size > 0 && (
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
            )}
        </div>
    );
}
