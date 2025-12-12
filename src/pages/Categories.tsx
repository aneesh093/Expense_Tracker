import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { cn, generateId } from '../lib/utils';
import { type TransactionType } from '../types';

export function Categories() {
    const navigate = useNavigate();
    const { categories, addCategory, deleteCategory } = useFinanceStore();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
    const [showAddForm, setShowAddForm] = useState(false);

    const openAddModal = (type: TransactionType) => {
        setNewCategoryType(type);
        setShowAddForm(true);
    };

    const incomeCategories = categories.filter(c => c.type === 'income');
    const expenseCategories = categories.filter(c => c.type === 'expense');

    const handleAddCategory = () => {
        if (!newCategoryName.trim()) return;

        addCategory({
            id: generateId(),
            name: newCategoryName.trim(),
            type: newCategoryType,
            icon: newCategoryType === 'income' ? 'banknote' : 'shopping-bag', // Default icons
            color: newCategoryType === 'income' ? '#22c55e' : '#ef4444' // Default colors
        });

        setNewCategoryName('');
        setShowAddForm(false);
    };

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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Manage Categories</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* Income Categories */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Income Categories</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                        {incomeCategories.map(category => (
                            <div key={category.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                </div>
                                <button
                                    onClick={() => deleteCategory(category.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {incomeCategories.length === 0 && (
                            <div className="p-4 text-gray-400 text-sm italic text-center">No income categories</div>
                        )}
                        <button
                            onClick={() => openAddModal('income')}
                            className="w-full p-4 flex items-center space-x-3 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <span className="font-medium">Add Income Category</span>
                        </button>
                    </div>
                </section>

                {/* Expense Categories */}
                <section>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Expense Categories</h2>
                    <div className="bg-white rounded-xl shadow-sm overflow-hidden divide-y divide-gray-100">
                        {expenseCategories.map(category => (
                            <div key={category.id} className="p-4 flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: category.color }}
                                    />
                                    <span className="font-medium text-gray-900">{category.name}</span>
                                </div>
                                <button
                                    onClick={() => deleteCategory(category.id)}
                                    className="text-gray-400 hover:text-red-500 transition-colors p-2"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                        {expenseCategories.length === 0 && (
                            <div className="p-4 text-gray-400 text-sm italic text-center">No expense categories</div>
                        )}
                        <button
                            onClick={() => openAddModal('expense')}
                            className="w-full p-4 flex items-center space-x-3 text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                <Plus size={16} />
                            </div>
                            <span className="font-medium">Add Expense Category</span>
                        </button>
                    </div>
                </section>

            </div>

            {/* Add Category Modal/Overlay - Simple implementation */}
            {showAddForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">New Category</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                <div className="flex bg-gray-100 rounded-lg p-1">
                                    <button
                                        onClick={() => setNewCategoryType('expense')}
                                        className={cn("flex-1 py-2 rounded-md text-sm font-medium transition-colors", newCategoryType === 'expense' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                                    >
                                        Expense
                                    </button>
                                    <button
                                        onClick={() => setNewCategoryType('income')}
                                        className={cn("flex-1 py-2 rounded-md text-sm font-medium transition-colors", newCategoryType === 'income' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}
                                    >
                                        Income
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                <input
                                    type="text"
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    placeholder="e.g. Groceries"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => setShowAddForm(false)}
                                className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddCategory}
                                disabled={!newCategoryName.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
