// --- File: src/features/Journal/EntryEditor.tsx ---

import { useState } from 'react';
import { useSettingsStore } from '../../store/useSettingsStore.ts';
import {
  createEntry,
  updateEntryFeedback,
  getActiveWeeklyGoals,
  saveAttribute
} from '../../services/firestoreService.ts';
import {
  generateAllFeedback,
  checkGoalProgress,
  extractAttributeFromEntry
} from '../../services/llmService.ts';
import { AIGoalSuggestion, Goal } from '../../types/index.ts';
import { PlusCircleIcon } from '@heroicons/react/24/solid';

interface EntryEditorProps {
  userId: string;
  onGoalProgressDetected: (suggestion: AIGoalSuggestion) => void;
  activeGoals: Goal[];
}

export default function EntryEditor({ userId, onGoalProgressDetected, activeGoals }: EntryEditorProps) {
  const [entryText, setEntryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    apiKey,
    primaryModel,
    utilityModel,
    enabledAdvisors,
  } = useSettingsStore();

  const handleGoalChipClick = (goalTitle: string) => {
    const prefix = entryText ? entryText + '\n\n' : '';
    const newText = prefix + `- Regarding my goal "${goalTitle}": `;
    setEntryText(newText);
  };

  const handleAddAllClick = () => {
    let template = "Here's my progress on my goals today:\n";
    activeGoals.forEach(goal => {
      template += `\n- Regarding my goal "${goal.title}": `;
    });
    setEntryText(template);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!entryText.trim() || isLoading) return;

    if (!apiKey) {
      setError("Please add your OpenRouter API key in Settings before submitting.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const newEntryId = await createEntry(userId, entryText);
      console.log(`--- Entry created with ID: ${newEntryId} ---`);
      console.log("--- Starting all background AI tasks ---");

      const feedbackPromise = generateAllFeedback(
        userId,
        entryText,
        apiKey,
        primaryModel,
        utilityModel,
        enabledAdvisors
      );

      const activeGoals = await getActiveWeeklyGoals(userId);
      if (activeGoals.length > 0) {
        activeGoals.forEach(async (goal) => {
          const result = await checkGoalProgress(
            entryText,
            { title: goal.title, description: goal.description || '' },
            apiKey,
            utilityModel
          );
          if (result && result.progressMade) {
            console.log(`AI suggested progress for goal: "${goal.title}".`);
            onGoalProgressDetected({
              goal: { ...goal, description: goal.description ?? '' },
              reasoning: result.reasoning,
            });
          }
        });
      }

      extractAttributeFromEntry(entryText, apiKey, utilityModel).then(newAttribute => {
        if (newAttribute) {
          console.log("New attribute detected:", newAttribute);
          saveAttribute(userId, newAttribute, newEntryId);
        }
      });

      const feedback = await feedbackPromise;
      await updateEntryFeedback(userId, newEntryId, feedback);
      console.log("Advisor feedback saved to Firestore.");

      setEntryText('');
    } catch (err: any) {
      console.error("An error occurred during submission:", err);
      setError(`An error occurred: ${err.message}. Check your API key and model names in settings.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-lg">
      <h2 className="text-xl font-bold text-slate-800 mb-1">Today's Entry</h2>
      <p className="text-slate-500 mb-4">What's on your mind? The advisors are listening.</p>

      {activeGoals.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm text-slate-600">Add a goal to your entry:</p>
            <button
              onClick={handleAddAllClick}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Add all as template
            </button>
          </div>

          <div className="border-t border-b border-slate-200 divide-y divide-slate-200">
            {activeGoals.map(goal => (
              <div
                key={goal.id}
                className="flex items-center justify-between py-2.5"
              >
                <span className="text-sm text-slate-800">{goal.title}</span>
                <button
                  type="button"
                  onClick={() => handleGoalChipClick(goal.title)}
                  title={`Add "${goal.title}" to your entry`}
                  className="flex-shrink-0 ml-4 flex items-center gap-1 px-2.5 py-1 text-sm font-semibold text-blue-700 bg-blue-100 rounded-full hover:bg-blue-200/75 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  <PlusCircleIcon className="h-5 w-5 text-blue-500" />
                  <span>Add</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <textarea
          value={entryText}
          onChange={(e) => setEntryText(e.target.value)}
          placeholder="I felt a strong sense of accomplishment today when..."
          className="w-full h-40 p-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
          disabled={isLoading}
        />

        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !entryText.trim()}
            className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-all flex items-center"
          >
            {isLoading && (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isLoading ? 'Processing...' : 'Submit to Advisors'}
          </button>
        </div>
      </form>
    </div>
  );
}