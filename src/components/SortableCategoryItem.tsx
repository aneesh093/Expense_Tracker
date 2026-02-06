import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Category } from '../types';
import { useState } from 'react';

interface SortableCategoryItemProps {
    category: Category;
    deleteCategory: (id: string) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ff7300', '#387908'];

export function SortableCategoryItem({ category, deleteCategory, updateCategory }: SortableCategoryItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [editColor, setEditColor] = useState(category.color);
    const [editLimit, setEditLimit] = useState(category.limit?.toString() || '');
    const [editCCLimit, setEditCCLimit] = useState(category.ccLimit?.toString() || '');

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: category.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : 'auto',
        position: isDragging ? 'relative' as const : undefined,
    };

    const handleSave = () => {
        if (editName.trim()) {
            updateCategory(category.id, {
                name: editName.trim(),
                color: editColor,
                limit: editLimit ? parseFloat(editLimit) : undefined,
                ccLimit: editCCLimit ? parseFloat(editCCLimit) : undefined
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditName(category.name);
        setEditColor(category.color);
        setEditLimit(category.limit?.toString() || '');
        setEditCCLimit(category.ccLimit?.toString() || '');
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "group relative bg-white border border-gray-100 rounded-2xl p-4 transition-all duration-200",
                isDragging ? "shadow-xl ring-2 ring-blue-500/20 z-50 opacity-90 scale-105" : "hover:shadow-md hover:border-gray-200"
            )}
        >
            {isEditing ? (
                <div className="space-y-4">
                    <div className="flex space-x-3">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${editColor}15`, color: editColor }}
                        >
                            <span className="text-lg">#</span>
                        </div>
                        <div className="flex-1 space-y-3">
                            <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                placeholder="Category name"
                            />
                            {category.type === 'expense' && (
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Global Limit</label>
                                        <input
                                            type="number"
                                            value={editLimit}
                                            onChange={(e) => setEditLimit(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                            placeholder="Limit (₹)"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">CC Limit</label>
                                        <input
                                            type="number"
                                            value={editCCLimit}
                                            onChange={(e) => setEditCCLimit(e.target.value)}
                                            className="w-full bg-gray-50 border-none rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500"
                                            placeholder="CC Limit (₹)"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {COLORS.map((c) => (
                            <button
                                key={c}
                                onClick={() => setEditColor(c)}
                                className={cn(
                                    "w-6 h-6 rounded-full transition-transform hover:scale-110",
                                    editColor === c ? "ring-2 ring-offset-2 ring-blue-500" : ""
                                )}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>

                    <div className="flex space-x-2 pt-2">
                        <button
                            onClick={handleSave}
                            className="flex-1 bg-blue-600 text-white text-xs font-bold py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Save Changes
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex-1 bg-gray-100 text-gray-600 text-xs font-bold py-2 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {/* Drag Handle */}
                        <div
                            {...attributes}
                            {...listeners}
                            className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 transition-colors"
                        >
                            <GripVertical size={18} />
                        </div>

                        {/* Category Info */}
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                            style={{ backgroundColor: `${category.color}15`, color: category.color }}
                        >
                            <span className="text-lg">#</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-bold text-gray-900">{category.name}</span>
                            <div className="flex flex-wrap gap-x-2 gap-y-0.5">
                                {category.limit && (
                                    <span className="text-[9px] font-black text-orange-500 uppercase tracking-tight">
                                        Limit: ₹{new Intl.NumberFormat('en-IN').format(category.limit)}
                                    </span>
                                )}
                                {category.ccLimit && (
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-tight">
                                        CC Limit: ₹{new Intl.NumberFormat('en-IN').format(category.ccLimit)}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-gray-400 hover:text-blue-500 transition-colors p-2"
                            title="Edit"
                        >
                            <Edit2 size={18} />
                        </button>
                        <button
                            onClick={() => deleteCategory(category.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 flex-shrink-0"
                            title="Delete"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
