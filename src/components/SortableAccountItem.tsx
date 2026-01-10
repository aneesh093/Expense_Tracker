import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Account, type AccountType } from '../types';
import { Check, Pencil, Trash2, Building, Banknote, CreditCard, Wallet, TrendingUp, PieChart, MapPin, Shield, PiggyBank, Landmark, Briefcase } from 'lucide-react';

interface SortableAccountItemProps {
    account: Account;
    isSelectMode: boolean;
    isSelected: boolean;
    toggleSelectAccount: (id: string) => void;
    handleEdit: (account: Account) => void;
    setAccountToDelete: (account: Account) => void;
    navigate: (path: string) => void;
    isBalanceHidden: boolean;
    formatCurrency: (amount: number) => string;
    spentAmount: number;
    transactions: any[]; // Or strict type
}

export function SortableAccountItem({
    account,
    isSelectMode,
    isSelected,
    toggleSelectAccount,
    handleEdit,
    setAccountToDelete,
    navigate,
    isBalanceHidden,
    formatCurrency,
    spentAmount
}: SortableAccountItemProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: account.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    const getAccountIcon = (type: AccountType) => {
        const iconProps = { size: 20 };
        switch (type) {
            case 'fixed-deposit': return <Landmark {...iconProps} />;
            case 'savings': return <PiggyBank {...iconProps} />;
            case 'credit': return <CreditCard {...iconProps} />;
            case 'cash': return <Banknote {...iconProps} />;
            case 'loan': return <Wallet {...iconProps} />;
            case 'stock': return <TrendingUp {...iconProps} />;
            case 'mutual-fund': return <PieChart {...iconProps} />;
            case 'other': return <Briefcase {...iconProps} />;
            case 'land': return <MapPin {...iconProps} />;
            case 'insurance': return <Shield {...iconProps} />;
            default: return <Building {...iconProps} />;
        }
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => isSelectMode ? toggleSelectAccount(account.id) : navigate(`/accounts/${account.id}`)}
            className={cn(
                "flex items-center justify-between p-4 bg-white hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0",
                isSelected && "bg-blue-50",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            <div className="flex items-center space-x-4">
                {/* Drag Handle - Only show if not selecting */}
                {!isSelectMode && (
                    <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                        <GripVertical size={16} />
                    </div>
                )}

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
                    account.type === 'credit' ? "bg-purple-100 text-purple-600" :
                        account.type === 'cash' ? "bg-green-100 text-green-600" :
                            account.type === 'loan' ? "bg-orange-100 text-orange-600" :
                                account.type === 'stock' || account.type === 'mutual-fund' || account.type === 'land' || account.type === 'insurance' ? "bg-blue-100 text-blue-600" :
                                    account.type === 'savings' ? "bg-teal-100 text-teal-600" :
                                        "bg-gray-100 text-gray-600"
                )}>
                    {getAccountIcon(account.type)}
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 leading-tight">
                        {account.name}
                    </h3>
                    {account.subName && (
                        <p className="text-sm text-gray-600 mt-0.5">{account.subName}</p>
                    )}
                </div>
            </div>

            <div className="flex items-center space-x-4">
                <div className="text-right flex flex-col items-end min-h-[44px] justify-center">
                    {account.isPrimary && (
                        <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider mb-1">
                            Primary
                        </span>
                    )}
                    {account.type === 'loan' && account.loanDetails && (
                        <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-bold tracking-wide mb-1">
                            {account.loanDetails.emisLeft} EMIs Left
                        </span>
                    )}
                    <p className={cn("font-bold", spentAmount < 0 && account.type !== 'credit' ? "text-red-600" : "text-gray-900")}>
                        {isBalanceHidden && !account.isPrimary ? '•••••' : formatCurrency(spentAmount)}
                    </p>
                </div>

                {!isSelectMode && (
                    <div className="flex items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                handleEdit(account);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors hover:bg-blue-50 rounded-lg"
                        >
                            <Pencil size={18} />
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                setAccountToDelete(account);
                            }}
                            className="p-2 text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 rounded-lg"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
