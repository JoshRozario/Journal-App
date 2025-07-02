// --- File: src/features/Goals/DailyProgressTracker.tsx ---
import { useAuthStore } from '../../store/useAuthStore.ts';
import { setGoalCompletionForDay } from '../../services/firestoreService.ts';
import { Goal, GoalCompletionStatus } from '../../types/index.ts';

interface DailyProgressTrackerProps {
  goal: Goal;
}

// --- Helper Functions ---
const getStartOfWeek = (d = new Date()) => {
  const date = new Date(d);
  const day = date.getDay(); // Sunday - 0, Monday - 1, ...
  const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

const formatDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function DailyProgressTracker({ goal }: DailyProgressTrackerProps) {
  const { user } = useAuthStore();
  const weekStart = getStartOfWeek(new Date());

 // in DailyProgressTracker.tsx

  const handleDayClick = (date: Date) => { // <-- 1. REMOVE the status parameter here
    if (!user || date > new Date()) return; // Prevent clicking future dates

    const dateString = formatDate(date);
    // 2. GET the REAL status directly from the goal prop here
    const currentStatus = goal.completionStatus?.[dateString]; 
    let nextStatus: GoalCompletionStatus;
    
    // This toggle logic now works on the correct status
    switch (currentStatus) {
        case 'complete':
            nextStatus = 'missed';
            break;
        case 'missed':
            nextStatus = 'pending';
            break;
        case 'pending':
        default:
            nextStatus = 'complete';
            break;
    }

    setGoalCompletionForDay(user.uid, goal.id, dateString, nextStatus);
  };

 
 const renderDay = (dayIndex: number) => {
    const dayDate = new Date(weekStart);
    dayDate.setDate(weekStart.getDate() + dayIndex);
    const dateString = formatDate(dayDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isFuture = dayDate > today;
    const isPlannedDay = !goal.plannedDays || goal.plannedDays.length === 0 || goal.plannedDays.includes(dayDate.getDay());
    const isToday = dateString === formatDate(new Date());

    let icon = '⚪'; 
    let title = `Status: Pending. Click to change.`;

    if (isFuture) {
      title = 'This day is in the future'; 
    } else {
      const completionStatus = goal.completionStatus?.[dateString];
      if (completionStatus === 'complete') {
          icon = '✅';
          title = 'Status: Complete';
      } else if (completionStatus === 'missed') {
          icon = '❌';
          title = 'Status: Missed';
      }
    }

    // --- Visual Hierarchy for Day Labels ---
    let labelClasses = 'text-xs transition-colors';
    if (isToday) {
        labelClasses += ' text-blue-600 font-bold';
    } else if (isPlannedDay) {
        labelClasses += ' text-slate-800 font-semibold'; // Darker/bolder for planned days
    } else {
        labelClasses += ' text-slate-400 font-medium'; // Lighter for unplanned days
    }
    
    return (
      <div key={dayIndex} className="flex flex-col items-center space-y-2 text-center">
        <span className={labelClasses}>
          {dayLabels[dayIndex]}
        </span>

        <button
          onClick={() => handleDayClick(dayDate)}
          title={title}
          disabled={isFuture}
          className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-all hover:bg-slate-200 disabled:opacity-50 disabled:hover:bg-transparent disabled:cursor-not-allowed`}
        >
          <span>{icon}</span>
        </button>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-7 gap-1 items-center bg-slate-50 p-2 rounded-lg">
      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => renderDay(dayIndex))}
    </div>
  );
}