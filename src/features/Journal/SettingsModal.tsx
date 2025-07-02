// src/features/Journal/SettingsModal.tsx

import { useSettingsStore } from '../../store/useSettingsStore.ts';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// A curated list of popular and effective models available on OpenRouter
const recommendedModels = [
  { id: 'openai/gpt-4o', name: 'OpenAI: GPT-4o (Recommended)' },
  { id: 'anthropic/claude-3-sonnet-20240229', name: 'Anthropic: Claude 3 Sonnet' },
  { id: 'anthropic/claude-3-haiku-20240307', name: 'Anthropic: Claude 3 Haiku (Fast)' },
  { id: 'google/gemini-pro', name: 'Google: Gemini Pro' },
  { id: 'mistralai/mistral-large-latest', name: 'Mistral: Large (Latest)' },
];

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  // If the modal isn't open, render nothing.
  if (!isOpen) return null;

  // Connect to our Zustand store to get and set values.
  const { apiKey, setApiKey, primaryModel, setPrimaryModel } = useSettingsStore();

  return (
    // The modal overlay
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity"
      onClick={onClose} // Close the modal if the overlay is clicked
    >
      {/* The modal content */}
      <div
        className="bg-white rounded-xl shadow-2xl p-6 sm:p-8 w-full max-w-lg space-y-6"
        onClick={(e) => e.stopPropagation()} // Prevent clicks inside the modal from closing it
      >
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-slate-800">Settings</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">×</button>
        </div>

        {/* API Key Input */}
        <div>
          <label htmlFor="apiKey" className="block text-sm font-medium text-slate-700 mb-1">
            API Key (from OpenRouter, OpenAI, etc.)
          </label>
          <input
            id="apiKey"
            type="password"
            placeholder="sk-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
           <p className="text-xs text-slate-500 mt-1">
            Your key is stored locally in your browser and is never sent to our servers.
          </p>
        </div>

        {/* Model Selection Dropdown */}
        <div>
          <label htmlFor="model" className="block text-sm font-medium text-slate-700 mb-1">
            AI Model
          </label>
          <select
            id="model"
            value={primaryModel}
            onChange={(e) => setPrimaryModel(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {recommendedModels.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            Using OpenRouter is recommended for access to all models.
          </p>
        </div>
        
        <div className="pt-4">
           <button
            onClick={onClose}
            className="w-full py-2.5 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            Save and Close
          </button>
        </div>
      </div>
    </div>
  );
}