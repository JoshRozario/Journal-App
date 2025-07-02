// --- File: src/features/Journal/AIGoalSuggestionCard.tsx ---

import { AIGoalSuggestion } from '../../types';
import { LightBulbIcon } from '@heroicons/react/24/solid';

interface AIGoalSuggestionCardProps {
  suggestion: AIGoalSuggestion;
  onConfirm: (goalId: string) => void;
  onDismiss: (goalId: string) => void;
}

export default function AIGoalSuggestionCard({ suggestion, onConfirm, onDismiss }: AIGoalSuggestionCardProps) {
  const { goal, reasoning } = suggestion;

  return (
    <div className="bg-sky-50 border-l-4 border-sky-500 p-4 rounded-r-lg my-6">
      <div className="flex">
        <div className="py-1">
          <LightBulbIcon className="h-6 w-6 text-sky-600" />
        </div>
        <div className="ml-3">
          <h4 className="text-lg font-bold text-sky-800">AI Suggestion</h4>
          <div className="text-sm text-sky-700 space-y-2 mt-2">
            <p>
              This entry seems related to your goal: <strong className="font-semibold">"{goal.title}"</strong>
            </p>
            <p className="p-2 bg-sky-100 rounded-md italic">
              AI reasoning: "{reasoning}"
            </p>
            <p className="font-semibold">Did you make progress on this goal today?</p>
          </div>
          <div className="mt-3 space-x-3">
            <button
              onClick={() => onConfirm(goal.id)}
              className="px-3 py-1.5 bg-sky-600 text-white font-semibold rounded-lg text-sm hover:bg-sky-700"
            >
              Yes, count it!
            </button>
            <button
              onClick={() => onDismiss(goal.id)}
              className="px-3 py-1.5 bg-transparent text-sky-700 font-medium rounded-lg text-sm hover:bg-sky-100"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}