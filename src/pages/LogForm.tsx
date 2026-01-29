import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { type EventLog } from '../types';
import { ArrowLeft, Check, Trash2, Calendar } from 'lucide-react';
import { cn, generateId } from '../lib/utils';
import { format } from 'date-fns';

export function LogForm() {
    const navigate = useNavigate();
    const { id } = useParams();
    const [searchParams] = useSearchParams();
    const { events, eventLogs, addEventLog, updateEventLog, deleteEventLog } = useFinanceStore();

    const [amount, setAmount] = useState('0');
    const [type, setType] = useState<'expense' | 'income'>('expense');
    const [selectedEventId, setSelectedEventId] = useState<string>('');
    const [description, setDescription] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [isEditing, setIsEditing] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);

    useEffect(() => {
        const eventIdParam = searchParams.get('eventId');
        if (eventIdParam) {
            setSelectedEventId(eventIdParam);
        }

        if (id) {
            const log = eventLogs.find(l => l.id === id);
            if (log) {
                setAmount(log.amount.toString());
                setType(log.type);
                setSelectedEventId(log.eventId);
                setDescription(log.description);
                setDate(log.date.split('T')[0]);
                setIsEditing(true);
            }
        }
    }, [id, eventLogs, searchParams]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const value = parseFloat(amount);
        if (value <= 0) return;
        if (!selectedEventId) {
            alert("Please select an event for this log.");
            return;
        }

        const logData: EventLog = {
            id: isEditing && id ? id : generateId(),
            eventId: selectedEventId,
            amount: value,
            type,
            description,
            date: new Date(date).toISOString(),
        };

        if (isEditing && id) {
            updateEventLog(id, logData);
        } else {
            addEventLog(logData);
        }

        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
            navigate(-1);
        }, 1500);
    };

    const handleDelete = () => {
        if (id && confirm('Are you sure you want to delete this log?')) {
            deleteEventLog(id);
            navigate(-1);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-gray-50 pb-20 overflow-y-auto">
            {/* Header */}
            <header className="flex items-center justify-between p-4 bg-white sticky top-0 z-10 shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <h1 className="text-xl font-bold text-gray-900">
                    {isEditing ? 'Edit Log' : 'New Log'}
                </h1>
                {isEditing ? (
                    <button onClick={handleDelete} className="p-2 -mr-2 text-red-500 hover:bg-red-50 rounded-full transition-colors">
                        <Trash2 size={24} />
                    </button>
                ) : (
                    <div className="w-10" />
                )}
            </header>

            <form onSubmit={handleSubmit} className="p-4 space-y-6">
                {/* Type Selection */}
                <div className="flex bg-white rounded-xl p-1 shadow-sm border border-gray-100">
                    <button
                        type="button"
                        onClick={() => setType('expense')}
                        className={cn(
                            "flex-1 py-3 rounded-lg text-sm font-bold transition-all",
                            type === 'expense' ? "bg-red-50 text-red-600 shadow-sm" : "text-gray-500"
                        )}
                    >
                        Expense Log
                    </button>
                    <button
                        type="button"
                        onClick={() => setType('income')}
                        className={cn(
                            "flex-1 py-3 rounded-lg text-sm font-bold transition-all",
                            type === 'income' ? "bg-green-50 text-green-600 shadow-sm" : "text-gray-500"
                        )}
                    >
                        Income Log
                    </button>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                    {/* Amount */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Amount</label>
                        <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-400">₹</span>
                            <input
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                className="w-full pl-10 pr-4 py-4 bg-gray-50 border-none rounded-xl text-3xl font-bold focus:ring-2 focus:ring-blue-500/20"
                                placeholder="0"
                                required
                            />
                        </div>
                    </div>

                    {/* Event Select */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Event</label>
                        <select
                            value={selectedEventId}
                            onChange={(e) => setSelectedEventId(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                            required
                        >
                            <option value="">Select an Event</option>
                            {events.map(event => (
                                <option key={event.id} value={event.id}>{event.icon} {event.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Description</label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                            placeholder="e.g., Past Credit Card Bill"
                            required
                        />
                    </div>

                    {/* Date */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Date</label>
                        <div className="relative">
                            <Calendar size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full pl-12 pr-4 py-4 bg-gray-50 border-none rounded-xl font-medium focus:ring-2 focus:ring-blue-500/20"
                                required
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    {showSuccess && (
                        <div className="bg-green-100 text-green-700 px-4 py-3 rounded-xl text-sm font-bold flex items-center justify-center mb-4 animate-in fade-in slide-in-from-bottom-2">
                            <Check size={18} className="mr-2" />
                            Log Saved Successfully!
                        </div>
                    )}
                    <button
                        type="submit"
                        className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
                    >
                        <Check size={20} />
                        <span>{isEditing ? 'Update Log' : 'Save Log'}</span>
                    </button>
                    <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed px-6">
                        * Logs are used for historical or manual tracking within events and **do not** affect your account balances.
                    </p>
                </div>
            </form>
        </div>
    );
}
