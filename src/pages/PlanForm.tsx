import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { ArrowLeft } from 'lucide-react';
import { type EventPlan } from '../types';

export function PlanForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [searchParams] = useSearchParams();
    const eventIdFromQuery = searchParams.get('eventId');

    const { events, eventPlans, addEventPlan, updateEventPlan } = useFinanceStore();

    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [selectedEventId, setSelectedEventId] = useState(eventIdFromQuery || '');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (id) {
            const plan = eventPlans.find(p => p.id === id);
            if (plan) {
                setAmount(plan.amount.toString());
                setDescription(plan.description);
                setSelectedEventId(plan.eventId);
                setDate(plan.date.split('T')[0]);
                setIsEditing(true);
            }
        }
    }, [id, eventPlans, eventIdFromQuery]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (value <= 0) return;
        if (!selectedEventId) {
            alert("Please select an event for this plan.");
            return;
        }

        const planData: EventPlan = {
            id: isEditing && id ? id : crypto.randomUUID(),
            eventId: selectedEventId,
            amount: value,
            description,
            date: new Date(date).toISOString(),
        };

        if (isEditing) {
            updateEventPlan(planData.id, planData);
        } else {
            addEventPlan(planData);
        }

        navigate(`/events/${selectedEventId}`);
    };

    return (
        <div className="space-y-6">
            <header className="flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-xl font-bold text-gray-900">
                    {isEditing ? 'Edit Plan' : 'New Trip Plan'}
                </h1>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event *
                    </label>
                    <select
                        value={selectedEventId}
                        onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                        required
                    >
                        <option value="">Select an Event</option>
                        {events.map(event => (
                            <option key={event.id} value={event.id}>{event.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tentative Amount *
                    </label>
                    <input
                        type="number"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl text-2xl font-bold text-gray-900 placeholder:text-gray-300 focus:ring-2 focus:ring-blue-500/20"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tentative Item/Description *
                    </label>
                    <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., Flight Tickets, Hotel Stay"
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plan Date
                    </label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex-1 px-6 py-4 border border-gray-200 rounded-xl font-bold text-gray-600 active:bg-gray-50 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-6 py-4 bg-blue-600 text-white rounded-xl font-bold active:bg-blue-700 transition-colors"
                    >
                        {isEditing ? 'Update Plan' : 'Save Plan'}
                    </button>
                </div>
            </form>
        </div>
    );
}
