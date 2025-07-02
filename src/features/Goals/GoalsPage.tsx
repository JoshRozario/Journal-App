// --- File: src/features/Goals/GoalsPage.tsx ---
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { getGoalsStream, deleteGoal as fbDeleteGoal } from '../../services/firestoreService.ts';
import { Goal } from '../../types';
import GoalCard from './GoalCard.tsx';
import GoalFormModal from './GoalFormModal.tsx';

export default function GoalsPage() {
  const { user } = useAuthStore();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [goalToEdit, setGoalToEdit] = useState<Goal | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getGoalsStream(user.uid, (fetchedGoals) => {
      setGoals(fetchedGoals);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleOpenCreateModal = () => {
    setGoalToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (goal: Goal) => {
    setGoalToEdit(goal);
    setIsModalOpen(true);
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!user || !window.confirm("Are you sure you want to delete this goal? This action cannot be undone.")) return;
    try {
      await fbDeleteGoal(user.uid, goalId);
    } catch (error) {
      console.error("Failed to delete goal:", error);
      alert("Could not delete goal. Please try again.");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-slate-800">Your Goals</h1>
        <button onClick={handleOpenCreateModal} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
          + New Goal
        </button>
      </div>

      {isLoading ? (
        <p className="text-center text-slate-500 py-8">Loading your goals...</p>
      ) : goals.length > 0 ? (
        <div className="space-y-4">
          {goals.map(goal => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteGoal}
            />
          ))}
        </div>
      ) : (
        <div className="p-8 bg-white rounded-lg shadow text-center text-slate-500">
          <h2 className="text-xl font-bold text-slate-700">Set Your First Goal</h2>
          <p className="mt-2">Click the "+ New Goal" button to define what you want to achieve.</p>
        </div>
      )}

      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        goalToEdit={goalToEdit}
      />
    </div>
  );
}