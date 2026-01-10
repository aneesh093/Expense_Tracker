import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { type Category } from '../types';

interface SortableCategoryItemProps {
    category: Category;
    deleteCategory: (id: string) => void;
}

export function SortableCategoryItem({ category, deleteCategory }: SortableCategoryItemProps) {
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

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={cn(
                "p-4 flex items-center justify-between hover:bg-gray-50 transition-all border-b border-gray-100 last:border-0",
                isDragging && "shadow-lg bg-gray-50 z-50 rounded-lg border-transparent scale-[1.02]"
            )}
        >
            <div className="flex items-center space-x-3">
                <div {...attributes} {...listeners} className="touch-none cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 p-1">
                    <GripVertical size={16} />
                </div>
                <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: category.color }}
                />
                <span className="font-medium text-gray-900">{category.name}</span>
            </div>
            <button
                onClick={() => deleteCategory(category.id)}
                className="text-gray-400 hover:text-red-500 transition-colors p-2 flex-shrink-0"
            >
                <Trash2 size={18} />
            </button>
        </div>
    );
}
