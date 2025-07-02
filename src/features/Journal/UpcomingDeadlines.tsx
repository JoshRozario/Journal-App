// src/features/Journal/UpcomingDeadlines.tsx
import { useState, useEffect, useMemo } from 'react';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { Deadline } from '../../types/index.ts';
import { getDeadlinesStream, addDeadline, updateDeadlineStatus, deleteDeadline } from '../../services/firestoreService.ts';
import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
// --- CHANGED: Import more functions from date-fns ---
import { formatDistanceToNowStrict, isToday, isTomorrow, format, isPast } from 'date-fns';
import { CheckCircleIcon, ChevronDownIcon } from '@heroicons/react/24/solid';

// --- CHANGED: Helper now handles time awareness ---
const formatDueDate = (date: Date) => {
    if (isPast(date) && !isToday(date)) return 'Past Due';
    // Use strict distance for cleaner output, e.g., "in 5 hours"
    return formatDistanceToNowStrict(date, { addSuffix: true });
};

const DeadlineItem = ({ deadline, onToggle, onDelete }: { deadline: Deadline, onToggle: (id: string, currentStatus: 'pending' | 'completed') => void, onDelete: (id: string) => void }) => {
    const dueDate = deadline.dueDate.toDate();
    const isPastDue = isPast(dueDate) && !isToday(dueDate);

    return (
        <div className="flex items-center space-x-3 py-2">
            <input
                type="checkbox"
                checked={deadline.status === 'completed'}
                onChange={() => onToggle(deadline.id, deadline.status)}
                className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <div className="flex-1">
                <p className={`text-slate-800 ${deadline.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                    {deadline.title}
                </p>
                {/* --- CHANGED: Display now includes the time --- */}
                <p className={`text-sm ${isPastDue ? 'text-red-500 font-semibold' : 'text-slate-500'}`}>
                    <span className="font-medium">{format(dueDate, 'MMM d, h:mm a')}</span>
                    <span className="italic ml-2">({formatDueDate(dueDate)})</span>
                </p>
            </div>
            <button onClick={() => onDelete(deadline.id)} className="p-1 text-slate-400 hover:text-red-500 rounded-full">
                <TrashIcon className="h-4 w-4" />
            </button>
        </div>
    );
};

export default function UpcomingDeadlines() {
    const { user } = useAuthStore();
    const [deadlines, setDeadlines] = useState<Deadline[]>([]);
    const [newTitle, setNewTitle] = useState('');
    const [newDate, setNewDate] = useState('');
    // ---  State for the time input, defaulted to end of day ---
    const [newTime, setNewTime] = useState('23:59');
    const [showInput, setShowInput] = useState(false);
    const [showCompleted, setShowCompleted] = useState(false);

    useEffect(() => {
        if (!user) return;
        const unsubscribe = getDeadlinesStream(user.uid, setDeadlines);
        return () => unsubscribe();
    }, [user]);

    const { visibleDeadlines, recentlyCompletedDeadlines } = useMemo(() => {
        const now = new Date();
        const threeDaysInMs = 3 * 24 * 60 * 60 * 1000;

        const visible = deadlines
            .filter(d => {
                if (d.status === 'pending') return true;
                if (d.status === 'completed' && d.dueDate.toDate() > now) return true;
                return false;
            })
            .sort((a, b) => a.dueDate.toMillis() - b.dueDate.toMillis());

        const recent = deadlines
            .filter(d => {
                const dueDate = d.dueDate.toDate();
                // It must be completed, and its due date must have passed...
                return d.status === 'completed' && dueDate <= now && (now.getTime() - dueDate.getTime()) < threeDaysInMs;
            })
            .sort((a, b) => b.dueDate.toMillis() - a.dueDate.toMillis()); // Show most recently completed first

        return { visibleDeadlines: visible, recentlyCompletedDeadlines: recent };
    }, [deadlines]);


    const handleAddDeadline = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !newTitle || !newDate || !newTime) return;

        // Combine date and time strings into a single valid string for the Date constructor
        const combinedDateTimeString = `${newDate}T${newTime}`;
        const dueDate = new Date(combinedDateTimeString);

        await addDeadline(user.uid, { title: newTitle, dueDate });
        setNewTitle('');
        setNewDate('');
        setNewTime('23:59'); // Reset to default
        setShowInput(false);
    };

    const handleToggle = (id: string, currentStatus: 'pending' | 'completed') => {
        if (!user) return;
        const newStatus = currentStatus === 'pending' ? 'completed' : 'pending';
        updateDeadlineStatus(user.uid, id, newStatus);
    };

    const handleDelete = (id: string) => {
        if (!user || !window.confirm("Delete this deadline?")) return;
        deleteDeadline(user.uid, id);
    };

    if (!user) return null;

    return (
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-bold text-slate-800 mb-3">Upcoming Deadlines</h2>
            {recentlyCompletedDeadlines.length > 0 && (
                <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex items-center space-x-1 text-sm text-slate-500 hover:text-slate-800"
                >
                    <span>{showCompleted ? 'Hide' : 'Show'} Completed</span>
                    <ChevronDownIcon className={`h-4 w-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
                </button>
            )}

            {visibleDeadlines.length > 0 ? (
                <div className="divide-y divide-slate-200">
                    {visibleDeadlines.map(d => (
                        <DeadlineItem key={d.id} deadline={d} onToggle={handleToggle} onDelete={handleDelete} />
                    ))}
                </div>
            ) : (
                !showInput && <p className="text-slate-500 text-sm">No pending deadlines. Add one to get started.</p>
            )}

            {showInput ? (
                // --- CHANGED: Form now includes the time input ---
                <form onSubmit={handleAddDeadline} className="mt-4 space-y-2">
                    <input
                        type="text"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                        placeholder="Finish project proposal..."
                        className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                    />
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="flex-grow px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            required
                            min={new Date().toISOString().split('T')[0]}
                        />
                        <input
                            type="time"
                            value={newTime}
                            onChange={(e) => setNewTime(e.target.value)}
                            className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div className="flex gap-2 pt-2">
                        <button type="submit" className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">Add</button>
                        <button type="button" onClick={() => setShowInput(false)} className="flex-1 px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Cancel</button>
                    </div>
                </form>
            ) : (
                <button
                    onClick={() => setShowInput(true)}
                    className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200/75"
                >
                    <PlusIcon className="h-4 w-4" />
                    Add Deadline
                </button>
            )}

            {showCompleted && (
                <div className="mt-6 pt-4 border-t border-dashed border-slate-200">
                    <h3 className="text-sm font-semibold text-slate-600 flex items-center gap-2 mb-2">
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                        Recently Completed
                    </h3>
                    <div className="divide-y divide-slate-100">
                        {recentlyCompletedDeadlines.map(d => (
                            <DeadlineItem key={d.id} deadline={d} onToggle={handleToggle} onDelete={handleDelete} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}