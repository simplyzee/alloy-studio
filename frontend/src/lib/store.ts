import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Component, Recipe } from './types';
import { generateComponentConfig } from './configGenerator';

interface AppStore extends AppState {
  setMode: (mode: AppState['mode']) => void;
  setConfig: (config: string) => void;
  addComponent: (component: Component) => void;
  removeComponent: (componentId: string) => void;
  setRecipe: (recipe: Recipe | null) => void;
  updateSettings: (settings: Partial<AppState['settings']>) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      mode: 'builder',
      currentConfig: '',
      selectedComponents: [],
      selectedRecipe: null,
      settings: {
        stabilityLevel: 'stable',
        enableCommunityComponents: false,
        outputFormat: 'alloy',
        theme: 'dark',
        autoFormatOnSave: true,
        showPipelineVisualization: true,
      },

      setMode: (mode) => set({ mode }),
      setConfig: (currentConfig) => set({ currentConfig }),
      addComponent: (component) =>
        set((state) => {
          // Generate Alloy config for this component
          const newConfig = generateComponentConfig(component);

          // Append to existing config or set as first config
          const updatedConfig = state.currentConfig
            ? `${state.currentConfig}\n\n${newConfig}`
            : newConfig;

          return {
            selectedComponents: [...state.selectedComponents, component],
            currentConfig: updatedConfig,
          };
        }),
      removeComponent: (componentId) =>
        set((state) => ({
          selectedComponents: state.selectedComponents.filter(
            (c) => c.id !== componentId
          ),
        })),
      setRecipe: (selectedRecipe) => set({ selectedRecipe }),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
    }),
    {
      name: 'alloy-studio-storage',
      partialize: (state) => ({
        // Only persist settings, not config or components
        settings: state.settings,
      }),
    }
  )
);
