// --- File: src/features/Goals/GoalCard.tsx ---
import { Goal } from '../../types';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';
import DailyProgressTracker from './DailyProgressTracker.tsx';

interface GoalCardProps {
  goal: Goal;
  onEdit: (goal: Goal) => void;
  onDelete: (goalId: string) => void;
}

export default function GoalCard({ goal, onEdit, onDelete }: GoalCardProps) {
  const completedCount = Object.values(goal.completionStatus || {}).filter(
    status => status === 'complete'
  ).length;

  const progressPercentage = goal.target > 0 ? (completedCount / goal.target) * 100 : 0;

  return (
    <div className="bg-white p-5 rounded-xl shadow-md space-y-4">
      {/* --- Top Section with Title and Actions --- */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-slate-800">{goal.title}</h3>
          {goal.description && <p className="text-sm text-slate-500 mt-1">{goal.description}</p>}
        </div>
        <div className="flex space-x-1 flex-shrink-0 ml-4">
          <button onClick={() => onEdit(goal)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full">
            <PencilIcon className="h-5 w-5" />
          </button>
          <button onClick={() => onDelete(goal.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
            <TrashIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* --- Daily Progress Tracker --- */}
      <DailyProgressTracker goal={goal} />

      {/* --- Progress Bar and Stats --- */}
      <div>
        <div className="flex justify-between items-baseline mb-1">
          <span className="text-sm font-semibold text-blue-700">Weekly Progress</span>
          <span className="text-sm text-slate-600">{completedCount} / {goal.target}</span>
        </div>
        <div className="w-full bg-slate-200 rounded-full h-2.5">
          <div
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}