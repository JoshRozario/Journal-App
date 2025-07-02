// --- File: src/features/Journal/JournalPage.tsx ---

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuthStore } from '../../store/useAuthStore.ts';
import { getEntriesStream, getGoalsStream, incrementGoalProgress } from '../../services/firestoreService.ts';
import { JournalEntry, AIGoalSuggestion, Goal } from '../../types'; // <-- Make sure Goal is imported
import EntryEditor from './EntryEditor.tsx';
import EntryCard from './EntryCard.tsx';
import AIGoalSuggestionCard from './AIGoalSuggestionCard.tsx';
import UpcomingDeadlines from './UpcomingDeadlines.tsx';

const groupEntriesByDay = (entries: JournalEntry[]) => {
  const grouped: { [key: string]: JournalEntry[] } = {};
  entries.forEach((entry) => {
    const entryDate = new Date(entry.createdAt.toDate()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    if (!grouped[entryDate]) grouped[entryDate] = [];
    grouped[entryDate].push(entry);
  });
  return grouped;
};


export default function JournalPage() {
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  // This was the source of the "Cannot find name" error. It was missing.
  const [goalSuggestions, setGoalSuggestions] = useState<AIGoalSuggestion[]>([]);
  const [activeGoals, setActiveGoals] = useState<Goal[]>([]);

  const groupedEntries = useMemo(() => groupEntriesByDay(entries), [entries]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = getEntriesStream(user.uid, (fetchedEntries) => {
      setEntries(fetchedEntries);
    });
    return () => unsubscribe();
  }, [user]);

  const handleGoalProgressDetected = useCallback((newSuggestion: AIGoalSuggestion) => {
    setGoalSuggestions(prev => {
      if (prev.some(s => s.goal.id === newSuggestion.goal.id)) {
        return prev;
      }
      return [...prev, newSuggestion];
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    // We can use the existing real-time stream for goals
    const unsubscribe = getGoalsStream(user.uid, (fetchedGoals) => {
      const inProgress = fetchedGoals
        .filter(g => g.status === 'in_progress')
        .map(g => ({
          ...g,
          description: g.description ?? '', // <- make it a string
        }));
      setActiveGoals(inProgress);
    });
    return () => unsubscribe();
  }, [user]);

  const handleConfirmSuggestion = async (goalId: string) => {
    if (!user) return;
    try {
      await incrementGoalProgress(user.uid, goalId);
      setGoalSuggestions(prev => prev.filter(s => s.goal.id !== goalId));
    } catch (error) {
      console.error("Failed to increment goal progress:", error);
      alert("Could not update your goal. Please try again.");
    }
  };

  const handleDismissSuggestion = (goalId: string) => {
    setGoalSuggestions(prev => prev.filter(s => s.goal.id !== goalId));
  };

  if (!user) return null;

  return (
    <div>
      
      <UpcomingDeadlines />

      <EntryEditor userId={user.uid} onGoalProgressDetected={handleGoalProgressDetected} activeGoals={activeGoals} />

      {goalSuggestions.length > 0 && (
        <div className="mt-8">
           {goalSuggestions.map(suggestion => (
            <AIGoalSuggestionCard 
              key={suggestion.goal.id} 
              suggestion={suggestion}
              onConfirm={handleConfirmSuggestion}
              onDismiss={handleDismissSuggestion}
            />
          ))}
        </div>
      )}

      <div className="mt-12">
        <div className="space-y-8">
          {Object.keys(groupedEntries).length > 0 ? (
            Object.entries(groupedEntries).map(([date, dailyEntries]) => (
              <section key={date}>
                <h2 className="text-xl font-bold text-slate-700 mb-4 sticky top-0 bg-slate-50/90 py-2 backdrop-blur-sm z-10">
                  {date}
                </h2>
                <div className="space-y-6">
                  {dailyEntries.map((entry) => <EntryCard key={entry.id} entry={entry} />)}
                </div>
              </section>
            ))
          ) : (
            <div className="text-center py-10 bg-white rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold text-slate-700 mb-2">Welcome!</h2>
              <p className="text-slate-500">
                Your journal is empty. Write your first entry above to get started.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}