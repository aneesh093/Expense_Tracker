import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableCategoryItem } from '../components/SortableCategoryItem';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Plus, List, Edit } from 'lucide-react';
import { cn, generateId } from '../lib/utils';
import { type TransactionType } from '../types';

export function Categories() {
    const navigate = useNavigate();
    const { categories, addCategory, updateCategory, deleteCategory, reorderList } = useFinanceStore();

    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryType, setNewCategoryType] = useState<TransactionType>('expense');
    const [showAddForm, setShowAddForm] = useState(false);
    const [showBulkAdd, setShowBulkAdd] = useState(false);
    const [bulkInput, setBulkInput] = useState('');
    const [bulkType, setBulkType] = useState<TransactionType>('expense');
    const [showBulkEdit, setShowBulkEdit] = useState(false);
    const [bulkEditType, setBulkEditType] = useState<TransactionType>('expense');
    const [bulkEditText, setBulkEditText] = useState('');

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

    const handleDragEnd = (event: any) => {
        const { active, over } = event;

        if (active.id !== over.id) {
            const activeCategory = categories.find(c => c.id === active.id);
            const overCategory = categories.find(c => c.id === over.id);

            // Ensure we are reordering within the same type
            if (activeCategory && overCategory && activeCategory.type === overCategory.type) {
                const groupItems = categories
                    .filter(c => c.type === activeCategory.type)
                    .sort((a, b) => (a.order || 0) - (b.order || 0));

                const oldIndex = groupItems.findIndex(item => item.id === active.id);
                const newIndex = groupItems.findIndex(item => item.id === over.id);

                if (oldIndex !== -1 && newIndex !== -1) {
                    const newOrder = arrayMove(groupItems, oldIndex, newIndex).map(item => item.id);
                    reorderList('categories', newOrder);
                }
            }
        }
    };

    const openAddModal = (type: TransactionType) => {
        setNewCategoryType(type);
        setShowAddForm(true);
    };

    const incomeCategories = categories.filter(c => c.type === 'income').sort((a, b) => (a.order || 0) - (b.order || 0));
    const expenseCategories = categories.filter(c => c.type === 'expense').sort((a, b) => (a.order || 0) - (b.order || 0));

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

    const handleBulkAdd = () => {
        if (!bulkInput.trim()) return;

        // Parse input: one category per line
        const lines = bulkInput.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) return;

        // Get existing category names to prevent duplicates
        const existingNames = categories
            .filter(c => c.type === bulkType)
            .map(c => c.name.toLowerCase());

        // Add each category
        const colors = bulkType === 'income'
            ? ['#22c55e', '#10b981', '#059669', '#047857', '#065f46']
            : ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];

        lines.forEach((name, index) => {
            // Skip if duplicate
            if (existingNames.includes(name.toLowerCase())) return;

            addCategory({
                id: generateId(),
                name: name,
                type: bulkType,
                icon: bulkType === 'income' ? 'banknote' : 'shopping-bag',
                color: colors[index % colors.length]
            });
        });

        setBulkInput('');
        setShowBulkAdd(false);
    };

    const openBulkEdit = (type: TransactionType) => {
        const categoriesToEdit = categories
            .filter(c => c.type === type)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        const text = categoriesToEdit.map(c => c.name).join('\n');
        setBulkEditText(text);
        setBulkEditType(type);
        setShowBulkEdit(true);
    };

    const handleBulkEdit = () => {
        if (!bulkEditText.trim()) return;

        const lines = bulkEditText.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0);

        if (lines.length === 0) return;

        const categoriesToEdit = categories
            .filter(c => c.type === bulkEditType)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

        // Update existing categories with new names
        lines.forEach((name, index) => {
            if (index < categoriesToEdit.length) {
                const category = categoriesToEdit[index];
                if (category.name !== name) {
                    updateCategory(category.id, { name });
                }
            } else {
                // If there are more lines than categories, add new ones
                const colors = bulkEditType === 'income'
                    ? ['#22c55e', '#10b981', '#059669', '#047857', '#065f46']
                    : ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'];

                addCategory({
                    id: generateId(),
                    name: name,
                    type: bulkEditType,
                    icon: bulkEditType === 'income' ? 'banknote' : 'shopping-bag',
                    color: colors[index % colors.length]
                });
            }
        });

        // Delete categories that were removed from the list
        if (lines.length < categoriesToEdit.length) {
            for (let i = lines.length; i < categoriesToEdit.length; i++) {
                deleteCategory(categoriesToEdit[i].id);
            }
        }

        setBulkEditText('');
        setShowBulkEdit(false);
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
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    {/* Income Categories */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Income Categories</h2>
                                <span className="text-xs text-gray-400">{incomeCategories.length}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => openAddModal('income')}
                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Add Income Category"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => { setBulkType('income'); setShowBulkAdd(true); }}
                                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors"
                                    title="Bulk Add Income Categories"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => openBulkEdit('income')}
                                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                    title="Bulk Edit Income Categories"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Scrollable category list */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                <SortableContext items={incomeCategories} strategy={verticalListSortingStrategy}>
                                    {incomeCategories.map(category => (
                                        <SortableCategoryItem
                                            key={category.id}
                                            category={category}
                                            deleteCategory={deleteCategory}
                                            updateCategory={updateCategory}
                                        />
                                    ))}
                                </SortableContext>
                                {incomeCategories.length === 0 && (
                                    <div className="p-8 text-gray-400 text-sm italic text-center">No income categories</div>
                                )}
                            </div>
                        </div>
                    </section>

                    {/* Expense Categories */}
                    <section>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-2">
                                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Expense Categories</h2>
                                <span className="text-xs text-gray-400">{expenseCategories.length}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => openAddModal('expense')}
                                    className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                                    title="Add Expense Category"
                                >
                                    <Plus size={18} />
                                </button>
                                <button
                                    onClick={() => { setBulkType('expense'); setShowBulkAdd(true); }}
                                    className="p-2 bg-orange-100 text-orange-600 rounded-lg hover:bg-orange-200 transition-colors"
                                    title="Bulk Add Expense Categories"
                                >
                                    <List size={18} />
                                </button>
                                <button
                                    onClick={() => openBulkEdit('expense')}
                                    className="p-2 bg-purple-100 text-purple-600 rounded-lg hover:bg-purple-200 transition-colors"
                                    title="Bulk Edit Expense Categories"
                                >
                                    <Edit size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                            {/* Scrollable category list */}
                            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100">
                                <SortableContext items={expenseCategories} strategy={verticalListSortingStrategy}>
                                    {expenseCategories.map(category => (
                                        <SortableCategoryItem
                                            key={category.id}
                                            category={category}
                                            deleteCategory={deleteCategory}
                                            updateCategory={updateCategory}
                                        />
                                    ))}
                                </SortableContext>
                                {expenseCategories.length === 0 && (
                                    <div className="p-8 text-gray-400 text-sm italic text-center">No expense categories</div>
                                )}
                            </div>
                        </div>
                    </section>
                </DndContext>
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

            {/* Bulk Add Modal */}
            {showBulkAdd && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Add {bulkType === 'income' ? 'Income' : 'Expense'} Categories</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Names</label>
                                <p className="text-xs text-gray-500 mb-2">Enter one category per line</p>
                                <textarea
                                    value={bulkInput}
                                    onChange={(e) => setBulkInput(e.target.value)}
                                    placeholder={`Groceries\nRent\nUtilities\nTransportation`}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                                    rows={8}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {bulkInput.split('\n').filter(l => l.trim()).length} categories will be added
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => { setShowBulkAdd(false); setBulkInput(''); }}
                                className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkAdd}
                                disabled={!bulkInput.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Add All
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Edit Modal */}
            {showBulkEdit && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Bulk Edit {bulkEditType === 'income' ? 'Income' : 'Expense'} Categories</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Category Names</label>
                                <p className="text-xs text-gray-500 mb-2">Edit, add, or remove categories (one per line)</p>
                                <textarea
                                    value={bulkEditText}
                                    onChange={(e) => setBulkEditText(e.target.value)}
                                    placeholder={`Groceries\nRent\nUtilities\nTransportation`}
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-sm"
                                    rows={12}
                                    autoFocus
                                />
                                <p className="text-xs text-gray-500 mt-2">
                                    {bulkEditText.split('\n').filter(l => l.trim()).length} categories
                                </p>
                            </div>
                        </div>

                        <div className="flex space-x-3 mt-6">
                            <button
                                onClick={() => { setShowBulkEdit(false); setBulkEditText(''); }}
                                className="flex-1 px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleBulkEdit}
                                disabled={!bulkEditText.trim()}
                                className="flex-1 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
