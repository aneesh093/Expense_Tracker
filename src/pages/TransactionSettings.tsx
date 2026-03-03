import { useNavigate } from 'react-router-dom';
import { ArrowLeft, PieChart } from 'lucide-react';
import { useFinanceStore } from '../store/useFinanceStore';
import { cn } from '../lib/utils';

export function TransactionSettings() {
    const navigate = useNavigate();
    const {
        incomeIncludedAccountTypes,
        setIncomeIncludedAccountTypes,
        expenseIncludedAccountTypes,
        setExpenseIncludedAccountTypes
    } = useFinanceStore();

    const MultiSelectToggle = ({ options, selected, onChange }: { options: { label: string, value: string }[], selected: string[], onChange: (val: string[]) => void }) => (
        <div className="flex flex-wrap gap-2 mt-2">
            {options.map((option) => {
                const isSelected = selected.includes(option.value);
                return (
                    <button
                        key={option.value}
                        onClick={() => {
                            if (isSelected) {
                                onChange(selected.filter(v => v !== option.value));
                            } else {
                                onChange([...selected, option.value]);
                            }
                        }}
                        className={cn(
                            "px-3 py-1 text-xs font-medium rounded-full transition-all border",
                            isSelected
                                ? "bg-blue-50 border-blue-200 text-blue-700 shadow-sm"
                                : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
                        )}
                    >
                        {option.label}
                    </button>
                );
            })}
        </div>
    );

    const SettingGroupItem = ({ icon: Icon, title, description, children, iconBg = "bg-gray-100", iconColor = "text-gray-600" }: any) => (
        <div className="p-4 flex flex-col">
            <div className="flex items-center space-x-3 mb-2">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBg, iconColor)}>
                    <Icon size={20} />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{title}</p>
                    <p className="text-[10px] text-gray-500 line-clamp-1">{description}</p>
                </div>
            </div>
            <div className="pl-13 w-full">
                {children}
            </div>
        </div>
    );

    const accountTypeOptions = [
        { label: 'Savings', value: 'savings' },
        { label: 'Cash', value: 'cash' },
        { label: 'Credit', value: 'credit' },
        { label: 'Fixed Deposit', value: 'fixed-deposit' },
        { label: 'Stock', value: 'stock' },
        { label: 'Mutual Fund', value: 'mutual-fund' },
        { label: 'Online Wallet', value: 'online-wallet' },
        { label: 'Land', value: 'land' },
        { label: 'Insurance', value: 'insurance' },
        { label: 'Loan', value: 'loan' },
        { label: 'Other', value: 'other' }
    ];

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
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-gray-900">Transaction Settings</h1>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">Configure Data Entry Preferences</p>
                </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                <section className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-3 px-1">Account Visibility</h2>
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                        <SettingGroupItem
                            icon={PieChart}
                            title="Income Accounts"
                            description="Selected accounts appear when adding income"
                            iconBg="bg-green-50"
                            iconColor="text-green-600"
                        >
                            <MultiSelectToggle
                                options={accountTypeOptions}
                                selected={incomeIncludedAccountTypes || []}
                                onChange={setIncomeIncludedAccountTypes}
                            />
                        </SettingGroupItem>
                        <SettingGroupItem
                            icon={PieChart}
                            title="Expense Accounts"
                            description="Selected accounts appear when adding expenses"
                            iconBg="bg-red-50"
                            iconColor="text-red-600"
                        >
                            <MultiSelectToggle
                                options={accountTypeOptions}
                                selected={expenseIncludedAccountTypes || []}
                                onChange={setExpenseIncludedAccountTypes}
                            />
                        </SettingGroupItem>
                    </div>
                    <p className="mt-3 px-2 text-[10px] text-gray-500 italic">
                        * Note: These settings only affect the visibility of accounts in the transaction entry form. They do not affect calculations in Dashboard or Reports.
                    </p>
                </section>
            </div>
        </div>
    );
}
