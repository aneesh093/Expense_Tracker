import { useNavigate, useParams } from 'react-router-dom';
import { useFinanceStore } from '../store/useFinanceStore';
import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Event } from '../types';

const EVENT_ICONS = ['✈️', '🎉', '🏖️', '🎓', '💼', '🏥', '🏠', '🎂', '🎄', '🎊', '🚗', '🍽️'];
const EVENT_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

export function EventForm() {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const { events, addEvent, updateEvent } = useFinanceStore();

    const isEditing = !!id;
    const existingEvent = events.find(e => e.id === id);

    const [formData, setFormData] = useState<Omit<Event, 'id'>>({
        name: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        color: EVENT_COLORS[0],
        icon: EVENT_ICONS[0]
    });

    useEffect(() => {
        if (existingEvent) {
            setFormData({
                name: existingEvent.name,
                description: existingEvent.description || '',
                startDate: existingEvent.startDate.split('T')[0],
                endDate: existingEvent.endDate ? existingEvent.endDate.split('T')[0] : '',
                color: existingEvent.color,
                icon: existingEvent.icon
            });
        }
    }, [existingEvent]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            alert('Please enter an event name');
            return;
        }

        const eventData: Event = {
            id: id || crypto.randomUUID(),
            name: formData.name.trim(),
            description: formData.description?.trim(),
            startDate: new Date(formData.startDate).toISOString(),
            endDate: formData.endDate ? new Date(formData.endDate).toISOString() : undefined,
            color: formData.color,
            icon: formData.icon
        };

        if (isEditing) {
            updateEvent(eventData.id, eventData);
        } else {
            addEvent(eventData);
        }

        navigate('/events');
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <header className="flex items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <h1 className="ml-2 text-xl font-bold text-gray-900">
                    {isEditing ? 'Edit Event' : 'New Event'}
                </h1>
            </header>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Name */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Event Name *
                    </label>
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g., Goa Trip"
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                    />
                </div>

                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                    </label>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Optional description"
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Start Date *
                        </label>
                        <input
                            type="date"
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            End Date
                        </label>
                        <input
                            type="date"
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            min={formData.startDate}
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Icon Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Icon
                    </label>
                    <div className="grid grid-cols-6 gap-2">
                        {EVENT_ICONS.map((icon) => (
                            <button
                                key={icon}
                                type="button"
                                onClick={() => setFormData({ ...formData, icon })}
                                className={`p-3 text-2xl rounded-xl border-2 transition-all ${formData.icon === icon
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                    }`}
                            >
                                {icon}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Color Selector */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {EVENT_COLORS.map((color) => (
                            <button
                                key={color}
                                type="button"
                                onClick={() => setFormData({ ...formData, color })}
                                className={`h-12 rounded-xl border-2 transition-all ${formData.color === color
                                        ? 'border-gray-900 scale-105'
                                        : 'border-gray-200'
                                    }`}
                                style={{ backgroundColor: color }}
                            />
                        ))}
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex space-x-3 pt-4">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 active:bg-gray-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-xl font-medium active:bg-blue-700"
                    >
                        {isEditing ? 'Update' : 'Create'}
                    </button>
                </div>
            </form>
        </div>
    );
}
