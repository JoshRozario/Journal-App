// --- File: src/features/Goals/GoalFormModal.tsx ---
import { useState, useEffect } from 'react';
import { Goal } from '../../types';
import { createGoal, updateGoal } from '../../services/firestoreService.ts';
import { useAuthStore } from '../../store/useAuthStore.ts';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalToEdit?: Goal | null;
}

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

// ---  Day Selector Component ---
const DaySelector = ({ selectedDays, onToggleDay }: { selectedDays: number[], onToggleDay: (dayIndex: number) => void }) => {
  return (
    <div className="flex justify-center space-x-2">
      {dayLabels.map((label, index) => {
        const dayIndex = (index + 1) % 7;
        const isSelected = selectedDays.includes(dayIndex);
        return (
          <button
            key={index}
            type="button"
            onClick={() => onToggleDay(dayIndex)}
            className={`w-10 h-10 rounded-full font-bold text-sm transition-colors ${
              isSelected
                ? 'bg-blue-600 text-white'
                : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};


export default function GoalFormModal({ isOpen, onClose, goalToEdit }: GoalFormModalProps) {
  const { user } = useAuthStore();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'weekly' | 'monthly'>('weekly');
  const [target, setTarget] = useState(3); // Default to 3x/week
  const [isSaving, setIsSaving] = useState(false);

  // ---  State for scheduling ---
  const [isScheduled, setIsScheduled] = useState(false);
  const [plannedDays, setPlannedDays] = useState<number[]>([]);

  useEffect(() => {
    if (goalToEdit) {
      setTitle(goalToEdit.title);
      setDescription(goalToEdit.description || '');
      setType(goalToEdit.type as 'weekly' | 'monthly');
      setTarget(goalToEdit.target);
      // ---  Populate scheduling state on edit ---
      const hasSchedule = Array.isArray(goalToEdit.plannedDays) && goalToEdit.plannedDays.length > 0;
      setIsScheduled(hasSchedule);
      setPlannedDays(hasSchedule ? goalToEdit.plannedDays! : []);

    } else {
      // Reset form for new goal
      setTitle('');
      setDescription('');
      setType('weekly');
      setTarget(3);
      setIsScheduled(false);
      setPlannedDays([]);
    }
  }, [goalToEdit, isOpen]);

  if (!isOpen || !user) return null;

  const handleToggleDay = (dayIndex: number) => {
    setPlannedDays(prev =>
      prev.includes(dayIndex) ? prev.filter(d => d !== dayIndex) : [...prev, dayIndex]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSaving) return;
    setIsSaving(true);

    const goalData: any = { 
      title, 
      description, 
      type, 
      target: Number(target) 
    };

    if (isScheduled) {
      goalData.plannedDays = plannedDays;
    } else {
       // Explicitly set to empty array for flexible goals
      goalData.plannedDays = [];
    }
    
    // For scheduled goals, the target is implicitly the number of planned days
    if(isScheduled) {
      goalData.target = plannedDays.length;
    }


    try {
      if (goalToEdit) {
        await updateGoal(user.uid, goalToEdit.id, goalData);
      } else {
        await createGoal(user.uid, goalData);
      }
      onClose();
    } catch (error) {
      console.error("Failed to save goal:", error);
      alert("Could not save the goal. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold text-slate-800">{goalToEdit ? 'Edit Goal' : 'Create a New Goal'}</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700">Title</label>
            <input id="title" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Go to the gym" required className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-slate-700">Description (Optional)</label>
            <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Focus on strength training and cardio." className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md h-20 focus:ring-2 focus:ring-blue-500"/>
          </div>

          {/* ---  Scheduling UI --- */}
          <div className="p-4 bg-slate-50 rounded-lg space-y-4">
              <div className="flex items-center">
                  <input
                      id="isScheduled"
                      type="checkbox"
                      checked={isScheduled}
                      onChange={(e) => setIsScheduled(e.target.checked)}
                      className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <label htmlFor="isScheduled" className="ml-2 block text-sm font-medium text-slate-700">
                      Schedule this goal for specific days?
                  </label>
              </div>

              {isScheduled ? (
                  <div>
                    <DaySelector selectedDays={plannedDays} onToggleDay={handleToggleDay} />
                    <p className="text-xs text-center text-slate-500 mt-2">The goal target will be {plannedDays.length} time(s) per week.</p>
                  </div>
              ) : (
                <div className="flex-1">
                  <label htmlFor="target" className="block text-sm font-medium text-slate-700">How many times per week?</label>
                  <input id="target" type="number" value={target} onChange={(e) => setTarget(parseInt(e.target.value))} min="1" className="mt-1 w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"/>
                </div>
              )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg hover:bg-slate-200">Cancel</button>
            <button type="submit" disabled={isSaving || (isScheduled && plannedDays.length === 0)} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed">
              {isSaving ? 'Saving...' : 'Save Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}