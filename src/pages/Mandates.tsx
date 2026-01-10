import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, TouchSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { SortableMandateItem } from '../components/SortableMandateItem';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft, Plus, Calendar } from 'lucide-react';
import type { Mandate } from '../types';

export function Mandates() {
    const navigate = useNavigate();
    const {
        mandates,
        accounts,
        addMandate,
        updateMandate,
        deleteMandate,
        runMandate,
        skipMandate,
        reorderList
    } = useFinanceStore();

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
            const items = [...mandates].sort((a, b) => (a.order || 0) - (b.order || 0));
            const oldIndex = items.findIndex(item => item.id === active.id);
            const newIndex = items.findIndex(item => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(items, oldIndex, newIndex).map(item => item.id);
                reorderList('mandates', newOrder);
            }
        }
    };

    const isDoneThisMonth = (mandate: Mandate) => {
        const currentMonthYear = new Date().toISOString().substring(0, 7);
        const lastRunMonthYear = mandate.lastRunDate?.substring(0, 7);
        const lastSkippedMonthYear = mandate.lastSkippedDate?.substring(0, 7);
        return lastRunMonthYear === currentMonthYear || lastSkippedMonthYear === currentMonthYear;
    };

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [sourceAccountId, setSourceAccountId] = useState('');
    const [destinationAccountId, setDestinationAccountId] = useState('');
    const [amount, setAmount] = useState('');
    const [dayOfMonth, setDayOfMonth] = useState('1');
    const [description, setDescription] = useState('');

    const resetForm = () => {
        setSourceAccountId('');
        setDestinationAccountId('');
        setAmount('');
        setDayOfMonth('1');
        setDescription('');
        setEditingId(null);
        setIsFormOpen(false);
    };

    const handleEdit = (mandate: Mandate) => {
        setSourceAccountId(mandate.sourceAccountId);
        setDestinationAccountId(mandate.destinationAccountId);
        setAmount(mandate.amount.toString());
        setDayOfMonth(mandate.dayOfMonth.toString());
        setDescription(mandate.description);
        setEditingId(mandate.id);
        setIsFormOpen(true);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!sourceAccountId || !destinationAccountId || !amount || !description) {
            alert('Please fill in all fields');
            return;
        }

        if (sourceAccountId === destinationAccountId) {
            alert('Source and destination accounts must be different');
            return;
        }

        const mandateData = {
            sourceAccountId,
            destinationAccountId,
            amount: parseFloat(amount),
            dayOfMonth: parseInt(dayOfMonth),
            description,
            isEnabled: true
        };

        if (editingId) {
            updateMandate(editingId, mandateData);
        } else {
            addMandate({
                id: crypto.randomUUID(),
                ...mandateData
            });
        }

        resetForm();
    };

    const handleRunNow = async (mandateId: string) => {
        if (window.confirm('Execute this mandate now?')) {
            await runMandate(mandateId);
        }
    };

    const handleSkip = async (mandateId: string) => {
        if (window.confirm('Skip this mandate for the current month?')) {
            await skipMandate(mandateId);
        }
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
                <h1 className="ml-2 text-xl font-bold text-gray-900">Manage Mandates</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Add Mandate Button */}
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full py-3 bg-blue-600 text-white rounded-xl shadow-sm hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                    >
                        <Plus size={20} />
                        <span className="font-medium">Create New Mandate</span>
                    </button>
                )}

                {/* Form */}
                {isFormOpen && (
                    <div className="bg-white p-4 rounded-xl shadow-sm space-y-4 border border-gray-100">
                        <h2 className="font-semibold text-gray-800">
                            {editingId ? 'Edit Mandate' : 'New Mandate'}
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                    type="text"
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="e.g., Monthly Savings"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">From Account</label>
                                    <select
                                        value={sourceAccountId}
                                        onChange={(e) => setSourceAccountId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">To Account</label>
                                    <select
                                        value={destinationAccountId}
                                        onChange={(e) => setDestinationAccountId(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="">Select Account</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Day of Month</label>
                                    <select
                                        value={dayOfMonth}
                                        onChange={(e) => setDayOfMonth(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                                            <option key={day} value={day}>{day}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex space-x-3 pt-2">
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    Save Mandate
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Mandates List */}
                <div className="space-y-3">
                    {mandates.length === 0 && !isFormOpen && (
                        <div className="text-center py-10 text-gray-500">
                            <Calendar size={48} className="mx-auto mb-2 text-gray-300" />
                            <p>No mandates set up yet.</p>
                        </div>
                    )}

                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={mandates} strategy={verticalListSortingStrategy}>
                            {[...mandates].sort((a, b) => (a.order || 0) - (b.order || 0)).map(mandate => (
                                <SortableMandateItem
                                    key={mandate.id}
                                    mandate={mandate}
                                    accounts={accounts}
                                    updateMandate={updateMandate}
                                    deleteMandate={deleteMandate}
                                    handleEdit={handleEdit}
                                    handleSkip={handleSkip}
                                    handleRunNow={handleRunNow}
                                    isDoneThisMonth={isDoneThisMonth}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </div>
        </div>
    );
}
