import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    TouchSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    ArrowLeft,
    GripVertical,
    RotateCcw,
    Layers,
    Building,
    Banknote,
    CreditCard,
    Wallet,
    TrendingUp,
    PieChart,
    MapPin,
    Shield,
    PiggyBank,
    Landmark,
    Briefcase,
    Smartphone,
    Check,
    ArrowDownAZ,
    ArrowUpAZ,
    ArrowDownWideNarrow,
    ArrowUpNarrowWide,
    SlidersHorizontal
} from 'lucide-react';
import { useFinanceStore, DEFAULT_ACCOUNT_TYPE_ORDER } from '../store/useFinanceStore';
import { cn } from '../lib/utils';
import { type Account, type AccountType, type AccountOrderMode } from '../types';

interface SortableTypeItemProps {
    typeKey: AccountType;
    accountsCount: number;
    getTypeDisplayName: (type: AccountType) => string;
    getTypeIcon: (type: AccountType) => React.ReactNode;
}

function SortableTypeItem({ typeKey, accountsCount, getTypeDisplayName, getTypeIcon }: SortableTypeItemProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: typeKey });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl transition-all shadow-sm",
                isDragging && "shadow-lg bg-blue-50/70 border-blue-200 scale-[1.02] z-50"
            )}
        >
            <div className="flex items-center space-x-3">
                <div
                    {...attributes}
                    {...listeners}
                    className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 p-1 rounded transition-colors"
                >
                    <GripVertical size={18} />
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600">
                    {getTypeIcon(typeKey)}
                </div>
                <div>
                    <p className="text-sm font-bold text-gray-900">{getTypeDisplayName(typeKey)}</p>
                    <p className="text-[11px] text-gray-400 font-medium">
                        {accountsCount} {accountsCount === 1 ? 'account' : 'accounts'}
                    </p>
                </div>
            </div>
            <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                    Group
                </span>
            </div>
        </div>
    );
}

interface SortableAccountRowProps {
    account: Account;
    getTypeIcon: (type: AccountType) => React.ReactNode;
    formatCurrency: (amount: number) => string;
}

function SortableAccountRow({ account, getTypeIcon, formatCurrency }: SortableAccountRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: account.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-xl transition-all shadow-sm",
                isDragging && "shadow-lg bg-blue-50/70 border-blue-200 scale-[1.02] z-50"
            )}
        >
            <div className="flex items-center space-x-3 min-w-0">
                <div
                    {...attributes}
                    {...listeners}
                    className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-600 p-1 rounded transition-colors"
                >
                    <GripVertical size={18} />
                </div>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gray-50 text-gray-600 shrink-0">
                    {getTypeIcon(account.type)}
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{account.name}</p>
                    {account.subName && (
                        <p className="text-[11px] text-gray-400 truncate">{account.subName}</p>
                    )}
                </div>
            </div>
            <div className="text-right shrink-0 ml-3">
                <p className="text-xs font-bold text-gray-800">
                    {formatCurrency(account.balance)}
                </p>
                <span className="text-[10px] text-gray-400 capitalize">
                    {account.type.replace('-', ' ')}
                </span>
            </div>
        </div>
    );
}

export function AccountOrderSettings() {
    const navigate = useNavigate();
    const {
        accounts,
        accountOrderMode,
        setAccountOrderMode,
        accountTypeOrder,
        setAccountTypeOrder,
        showInvestmentAccounts,
        reorderList
    } = useFinanceStore();

    const [activeSection, setActiveSection] = useState<'types' | 'accounts'>('types');
    const [activeGroupTab, setActiveGroupTab] = useState<'banking' | 'investments'>('banking');

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
        useSensor(TouchSensor)
    );

    const isInvestment = (type: AccountType) =>
        type === 'stock' || type === 'mutual-fund' || type === 'land' || type === 'insurance' || type === 'other';

    const bankingTypes: AccountType[] = ['savings', 'credit', 'cash', 'fixed-deposit', 'online-wallet', 'loan', 'other'];
    const investmentTypes: AccountType[] = ['stock', 'mutual-fund', 'land', 'insurance', 'other'];

    // Sorted types for the current group tab based on accountTypeOrder
    const currentTypesInOrder = useMemo(() => {
        const allowedTypes = activeGroupTab === 'banking' ? bankingTypes : investmentTypes;
        const ordered = [...accountTypeOrder.filter(t => allowedTypes.includes(t as AccountType))];
        // Append any allowed types not yet in accountTypeOrder
        allowedTypes.forEach(t => {
            if (!ordered.includes(t)) ordered.push(t);
        });
        return ordered as AccountType[];
    }, [accountTypeOrder, activeGroupTab]);

    // Filter accounts for current tab, sorted by custom order
    const currentGroupAccounts = useMemo(() => {
        return accounts
            .filter(acc => {
                if (acc.group) {
                    return (activeGroupTab === 'investments' ? 'investment' : 'banking') === acc.group;
                }
                return activeGroupTab === 'banking' ? !isInvestment(acc.type) : isInvestment(acc.type);
            })
            .sort((a, b) => (a.order || 0) - (b.order || 0));
    }, [accounts, activeGroupTab]);

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
            case 'online-wallet': return 'Online Wallet';
            default: return type;
        }
    };

    const getTypeIcon = (type: AccountType) => {
        const props = { size: 18 };
        switch (type) {
            case 'fixed-deposit': return <Landmark {...props} />;
            case 'savings': return <PiggyBank {...props} />;
            case 'credit': return <CreditCard {...props} />;
            case 'cash': return <Banknote {...props} />;
            case 'loan': return <Wallet {...props} />;
            case 'stock': return <TrendingUp {...props} />;
            case 'mutual-fund': return <PieChart {...props} />;
            case 'other': return <Briefcase {...props} />;
            case 'land': return <MapPin {...props} />;
            case 'insurance': return <Shield {...props} />;
            case 'online-wallet': return <Smartphone {...props} />;
            default: return <Building {...props} />;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleTypeDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = currentTypesInOrder.indexOf(active.id as AccountType);
        const newIndex = currentTypesInOrder.indexOf(over.id as AccountType);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reorderedGroup = arrayMove(currentTypesInOrder, oldIndex, newIndex);
            // Merge back into full accountTypeOrder
            const otherTypes = accountTypeOrder.filter(t => !reorderedGroup.includes(t as AccountType));
            const newFullOrder = activeGroupTab === 'banking'
                ? [...reorderedGroup, ...otherTypes]
                : [...otherTypes, ...reorderedGroup];
            setAccountTypeOrder(newFullOrder);
        }
    };

    const handleAccountDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = currentGroupAccounts.findIndex(a => a.id === active.id);
        const newIndex = currentGroupAccounts.findIndex(a => a.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            const reordered = arrayMove(currentGroupAccounts, oldIndex, newIndex);
            reorderList('accounts', reordered.map(a => a.id));
            if (accountOrderMode !== 'custom') {
                setAccountOrderMode('custom');
            }
        }
    };

    const handleResetTypeOrder = () => {
        setAccountTypeOrder(DEFAULT_ACCOUNT_TYPE_ORDER);
    };

    const sortingOptions: { mode: AccountOrderMode; label: string; icon: any; description: string }[] = [
        {
            mode: 'custom',
            label: 'Custom Order',
            icon: SlidersHorizontal,
            description: 'Order accounts manually using drag & drop'
        },
        {
            mode: 'name',
            label: 'Name (A → Z)',
            icon: ArrowDownAZ,
            description: 'Sort accounts alphabetically from A to Z'
        },
        {
            mode: 'name-desc',
            label: 'Name (Z → A)',
            icon: ArrowUpAZ,
            description: 'Sort accounts in reverse alphabetical order'
        },
        {
            mode: 'balance-desc',
            label: 'Balance (Highest First)',
            icon: ArrowDownWideNarrow,
            description: 'Show accounts with largest balance first'
        },
        {
            mode: 'balance-asc',
            label: 'Balance (Lowest First)',
            icon: ArrowUpNarrowWide,
            description: 'Show accounts with lowest balance first'
        }
    ];

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-4 py-4 flex items-center shadow-sm sticky top-0 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-gray-900">Account Ordering</h1>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">
                        Configure display order on screen
                    </p>
                </div>
            </header>

            <div className="p-4 space-y-6 max-w-lg mx-auto w-full">
                {/* Section Toggle: Sorting Mode vs Group Order vs Accounts Order */}
                <div className="flex bg-gray-200/70 p-1 rounded-2xl">
                    <button
                        onClick={() => setActiveSection('types')}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                            activeSection === 'types'
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Group / Type Order
                    </button>
                    <button
                        onClick={() => setActiveSection('accounts')}
                        className={cn(
                            "flex-1 py-2.5 text-xs font-bold rounded-xl transition-all",
                            activeSection === 'accounts'
                                ? "bg-white text-blue-600 shadow-sm"
                                : "text-gray-500 hover:text-gray-700"
                        )}
                    >
                        Accounts Sorting
                    </button>
                </div>

                {/* Section 1: Account Types Order */}
                {activeSection === 'types' && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center px-1">
                            <div>
                                <h2 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                    Account Groups Display Order
                                </h2>
                                <p className="text-[11px] text-gray-500 mt-0.5">
                                    Drag items to change the order sections appear on the Accounts screen.
                                </p>
                            </div>
                            <button
                                onClick={handleResetTypeOrder}
                                className="flex items-center space-x-1 px-2.5 py-1 text-xs font-medium text-gray-500 hover:text-blue-600 bg-white border border-gray-200 rounded-lg hover:border-blue-200 transition-colors shrink-0 shadow-sm"
                                title="Reset to default order"
                            >
                                <RotateCcw size={12} />
                                <span>Reset</span>
                            </button>
                        </div>

                        {/* Subtabs for Banking / Investments */}
                        {showInvestmentAccounts && (
                            <div className="flex p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                                <button
                                    onClick={() => setActiveGroupTab('banking')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        activeGroupTab === 'banking' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Banking Groups
                                </button>
                                <button
                                    onClick={() => setActiveGroupTab('investments')}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                        activeGroupTab === 'investments' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"
                                    )}
                                >
                                    Investment Groups
                                </button>
                            </div>
                        )}

                        <DndContext
                            sensors={sensors}
                            collisionDetection={closestCenter}
                            onDragEnd={handleTypeDragEnd}
                        >
                            <SortableContext items={currentTypesInOrder} strategy={verticalListSortingStrategy}>
                                <div className="space-y-2">
                                    {currentTypesInOrder.map((typeKey) => {
                                        const count = accounts.filter(a => a.type === typeKey).length;
                                        return (
                                            <SortableTypeItem
                                                key={typeKey}
                                                typeKey={typeKey}
                                                accountsCount={count}
                                                getTypeDisplayName={getTypeDisplayName}
                                                getTypeIcon={getTypeIcon}
                                            />
                                        );
                                    })}
                                </div>
                            </SortableContext>
                        </DndContext>
                    </div>
                )}

                {/* Section 2: Account Sorting & Custom Drag */}
                {activeSection === 'accounts' && (
                    <div className="space-y-5 animate-in fade-in duration-200">
                        {/* Sorting Rule Selection */}
                        <div className="space-y-2">
                            <h2 className="text-xs font-black text-gray-700 uppercase tracking-wider px-1">
                                Sorting Rule
                            </h2>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                                {sortingOptions.map((option) => {
                                    const Icon = option.icon;
                                    const isSelected = accountOrderMode === option.mode;
                                    return (
                                        <button
                                            key={option.mode}
                                            onClick={() => setAccountOrderMode(option.mode)}
                                            className={cn(
                                                "w-full p-3.5 flex items-center justify-between text-left transition-colors",
                                                isSelected ? "bg-blue-50/60" : "hover:bg-gray-50"
                                            )}
                                        >
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className={cn(
                                                    "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                                                    isSelected ? "bg-blue-600 text-white shadow-sm" : "bg-gray-100 text-gray-600"
                                                )}>
                                                    <Icon size={18} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className={cn("text-sm font-bold truncate", isSelected ? "text-blue-900" : "text-gray-900")}>
                                                        {option.label}
                                                    </p>
                                                    <p className="text-[11px] text-gray-500 truncate">{option.description}</p>
                                                </div>
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full flex items-center justify-center border shrink-0 ml-3 transition-all",
                                                isSelected ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300"
                                            )}>
                                                {isSelected && <Check size={12} strokeWidth={3} />}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Custom Drag & Drop List if Custom Order is Active or to Preview */}
                        <div className="space-y-3 pt-2">
                            <div className="flex justify-between items-center px-1">
                                <div>
                                    <h3 className="text-xs font-black text-gray-700 uppercase tracking-wider">
                                        Custom Drag Ordering
                                    </h3>
                                    <p className="text-[11px] text-gray-500">
                                        {accountOrderMode === 'custom'
                                            ? "Drag accounts to set their explicit display order."
                                            : "Dragging any account will switch sorting to Custom mode."}
                                    </p>
                                </div>
                            </div>

                            {/* Banking vs Investments for Accounts */}
                            {showInvestmentAccounts && (
                                <div className="flex p-1 bg-white border border-gray-100 rounded-xl shadow-sm">
                                    <button
                                        onClick={() => setActiveGroupTab('banking')}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            activeGroupTab === 'banking' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        Banking Accounts
                                    </button>
                                    <button
                                        onClick={() => setActiveGroupTab('investments')}
                                        className={cn(
                                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                                            activeGroupTab === 'investments' ? "bg-blue-50 text-blue-700" : "text-gray-500 hover:text-gray-700"
                                        )}
                                    >
                                        Investment Accounts
                                    </button>
                                </div>
                            )}

                            {currentGroupAccounts.length === 0 ? (
                                <div className="text-center py-8 bg-white rounded-xl border border-gray-100">
                                    <Layers size={28} className="mx-auto text-gray-300 mb-2" />
                                    <p className="text-xs font-medium text-gray-500">No accounts in this tab</p>
                                </div>
                            ) : (
                                <DndContext
                                    sensors={sensors}
                                    collisionDetection={closestCenter}
                                    onDragEnd={handleAccountDragEnd}
                                >
                                    <SortableContext
                                        items={currentGroupAccounts.map(a => a.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        <div className="space-y-2">
                                            {currentGroupAccounts.map((account) => (
                                                <SortableAccountRow
                                                    key={account.id}
                                                    account={account}
                                                    getTypeIcon={getTypeIcon}
                                                    formatCurrency={formatCurrency}
                                                />
                                            ))}
                                        </div>
                                    </SortableContext>
                                </DndContext>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
