// src/store/useSettingsStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Provider = 'openai' | 'anthropic';


interface SettingsState {
  provider: Provider;
  apiKey: string;
  primaryModel: string; // For core advisor feedback
  utilityModel: string; // For fast, analytical tasks
  enabledAdvisors: {
    plitt: boolean;
    hudson: boolean;
    self: boolean;
  };
  setProvider: (provider: Provider) => void;
  setApiKey: (key: string) => void;
  setPrimaryModel: (model: string) => void;
  setUtilityModel: (model: string) => void;
  toggleAdvisor: (advisor: keyof SettingsState['enabledAdvisors']) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Default values
      provider: 'openai',
      apiKey: '',
      primaryModel: 'openai/gpt-4o', 
      utilityModel: 'openai/gpt-4o-mini',
      enabledAdvisors: {
        plitt: true,
        hudson: true,
        self: true,
      },
      // Actions to update the state
      setProvider: (provider) => set({ provider }),
      setApiKey: (key) => set({ apiKey: key }),
      setPrimaryModel: (model) => set({ primaryModel: model }),
      setUtilityModel: (model) => set({ utilityModel: model }),
      toggleAdvisor: (advisor) =>
        set((state) => ({
          enabledAdvisors: {
            ...state.enabledAdvisors,
            [advisor]: !state.enabledAdvisors[advisor],
          },
        })),
    }),
    {
      name: 'advisor-journal-settings', // This is the key in localStorage
    }
  )
);