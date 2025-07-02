import { useState, useEffect, useMemo } from 'react'; //  Import useMemo
import { auth } from '../../services/firebase.ts';
import { useSettingsStore } from '../../store/useSettingsStore.ts';
import { OpenRouterModel } from '../../types';

const formatPrice = (priceString: string, rate = 1_000_000): string => {
  const price = parseFloat(priceString) * rate;
  return price.toFixed(2);
};

export default function SettingsPage() {
  const { 
    apiKey, setApiKey,
    primaryModel, setPrimaryModel,
    utilityModel, setUtilityModel
  } = useSettingsStore();

  const [models, setModels] = useState<OpenRouterModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // State for the "free models only" filter
  const [showFreeModelsOnly, setShowFreeModelsOnly] = useState(false);

  // Effect to fetch models
  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/models');
        if (!response.ok) throw new Error(`Failed to fetch models: ${response.statusText}`);
        const data = await response.json();
        const sortedModels = data.data.sort((a: OpenRouterModel, b: OpenRouterModel) => a.name.localeCompare(b.name));
        setModels(sortedModels);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);

  //  Create a memoized list of models based on the filter.
  // This computation only re-runs when `models` or `showFreeModelsOnly` changes.
  const filteredModels = useMemo(() => {
    if (!showFreeModelsOnly) {
      return models; // If filter is off, return all models
    }
    // If filter is on, return only models where both prices are 0
    return models.filter(model => 
      parseFloat(model.pricing.prompt) === 0 && 
      parseFloat(model.pricing.completion) === 0
    );
  }, [models, showFreeModelsOnly]);

  // The render function now uses the `filteredModels` list
  const renderModelOptions = () => {
    if (isLoading) return <option disabled>Loading models...</option>;
    if (error) return <option disabled>Could not load models</option>;
    if (filteredModels.length === 0 && showFreeModelsOnly) {
      return <option disabled>No free models found</option>;
    }

    return filteredModels.map((model) => (
      <option key={model.id} value={model.id}>
        {`${model.name} (${parseFloat(model.pricing.prompt) === 0 ? "Free" : `~$${formatPrice(model.pricing.prompt)} per 1M tokens`})`}
      </option>
    ));
  };

  return (
    <div>
      <h1 className="text-3xl font-bold text-slate-800 mb-6">Settings</h1>
      <div className="bg-white rounded-lg shadow-md">
        
         <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">API Configuration</h2>
          <div className="mt-4">
            <label htmlFor="apiKey" className="block font-medium text-slate-700">
              OpenRouter API Key
            </label>
            <p className="text-xs text-slate-500 mb-1">
              Your key is stored securely in your browser's local storage.
            </p>
            <input
              id="apiKey"
              type="password"
              placeholder="sk-or-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-800">AI Model Selection</h2>
          <p className="text-sm text-slate-500 mb-4">Choose different models for different tasks to balance cost, speed, and intelligence.</p>

          {/*  Filter Checkbox */}
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="freeModelsFilter"
              checked={showFreeModelsOnly}
              onChange={(e) => setShowFreeModelsOnly(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="freeModelsFilter" className="text-sm font-medium text-slate-700 select-none">
              Show free models only
            </label>
          </div>

          <div className="space-y-4">
            {/* Primary Model Dropdown (now uses filtered list) */}
            <div>
              <label htmlFor="primaryModel" className="block font-medium text-slate-700">Primary Advisor Model</label>
              <p className="text-xs text-slate-500 mb-1">For creative and nuanced advisor feedback.</p>
              <select
                id="primaryModel"
                value={primaryModel}
                onChange={(e) => setPrimaryModel(e.target.value)}
                disabled={isLoading || !!error}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100"
              >
                {renderModelOptions()}
              </select>
            </div>

            {/* Utility Model Dropdown (now uses filtered list) */}
            <div>
              <label htmlFor="utilityModel" className="block font-medium text-slate-700">Utility & Analysis Model</label>
              <p className="text-xs text-slate-500 mb-1">For fast tasks like goal detection.</p>
              <select
                id="utilityModel"
                value={utilityModel}
                onChange={(e) => setUtilityModel(e.target.value)}
                disabled={isLoading || !!error}
                className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500 bg-white disabled:bg-slate-100"
              >
                {renderModelOptions()}
              </select>
            </div>
            {error && <p className="text-sm text-red-500">Could not load model list: {error}</p>}
          </div>
        </div>
        
        <div className="p-6">
           <button onClick={() => auth.signOut()} /* ... */ >Sign Out</button>
        </div>
      </div>
    </div>
  );
}