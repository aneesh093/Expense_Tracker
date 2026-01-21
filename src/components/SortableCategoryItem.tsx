import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Edit2, Check, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Category } from '../types';
import { useState } from 'react';

interface SortableCategoryItemProps {
    category: Category;
    deleteCategory: (id: string) => void;
    updateCategory: (id: string, updates: Partial<Category>) => void;
}

export function SortableCategoryItem({ category, deleteCategory, updateCategory }: SortableCategoryItemProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(category.name);
    const [editColor, setEditColor] = useState(category.color);

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
                color: editColor
            });
            setIsEditing(false);
        }
    };

    const handleCancel = () => {
        setEditName(category.name);
        setEditColor(category.color);
        setIsEditing(false);
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "p-4 flex items-center justify-between hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            {isEditing ? (
                <>
                    <div className="flex items-center space-x-3 flex-1">
                        <input
                            type="color"
                            value={editColor}
                            onChange={(e) => setEditColor(e.target.value)}
                            className="w-8 h-8 rounded cursor-pointer"
                        />
                        <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="flex-1 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSave();
                                if (e.key === 'Escape') handleCancel();
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-1">
                        <button
                            onClick={handleSave}
                            className="text-green-600 hover:text-green-700 transition-colors p-2"
                            title="Save"
                        >
                            <Check size={18} />
                        </button>
                        <button
                            onClick={handleCancel}
                            className="text-gray-400 hover:text-gray-600 transition-colors p-2"
                            title="Cancel"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </>
            ) : (
                <>
                    <div className="flex items-center space-x-3">
                        <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                            <GripVertical size={16} />
                        </div>
                        <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: category.color }}
                        />
                        <span className="text-sm font-semibold text-gray-800">{category.name}</span>
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
                </>
            )}
        </div>
    );
}
