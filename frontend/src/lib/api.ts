import type { Component, Recipe, ValidationResponse, FormatResponse } from './types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const USE_STATIC_DATA = import.meta.env.VITE_USE_STATIC_DATA === 'true';

export const api = {
  async validateConfig(
    config: string,
    stabilityLevel: string,
    enableCommunityComponents: boolean
  ): Promise<ValidationResponse> {
    // Validation disabled for static deployment
    return {
      valid: true,
      errors: [],
      message: 'Validation is not available in static deployment',
    };
  },

  async formatConfig(config: string): Promise<FormatResponse> {
    // Formatting disabled for static deployment
    return {
      formatted_config: config,
    };
  },

  async getComponents(filters?: {
    category?: string;
    signal?: string;
    stability?: string;
    search?: string;
  }): Promise<Component[]> {
    let components: Component[];

    if (USE_STATIC_DATA) {
      // Fetch from static JSON file
      const response = await fetch('/data/components.json');
      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }
      const data = await response.json();
      components = data.components || data;
    } else {
      // Fetch from API
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.signal) params.append('signal', filters.signal);
      if (filters?.stability) params.append('stability', filters.stability);
      if (filters?.search) params.append('search', filters.search);

      const response = await fetch(`${API_BASE_URL}/api/components?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch components');
      }
      components = await response.json();
    }

    // Apply client-side filtering if needed
    if (filters) {
      if (filters.category) {
        components = components.filter(c => c.category === filters.category);
      }
      if (filters.signal) {
        components = components.filter(c => c.signals.includes(filters.signal as any));
      }
      if (filters.stability) {
        components = components.filter(c => c.stability === filters.stability);
      }
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        components = components.filter(c =>
          c.name.toLowerCase().includes(searchLower) ||
          c.description.toLowerCase().includes(searchLower) ||
          c.displayName.toLowerCase().includes(searchLower)
        );
      }
    }

    return components;
  },

  async getRecipes(filters?: {
    category?: string;
    signal?: string;
    difficulty?: string;
  }): Promise<Recipe[]> {
    let recipes: Recipe[];

    if (USE_STATIC_DATA) {
      // Fetch from static JSON file
      const response = await fetch('/data/recipes.json');
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      const data = await response.json();
      recipes = data.recipes || data;
    } else {
      // Fetch from API
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.signal) params.append('signal', filters.signal);
      if (filters?.difficulty) params.append('difficulty', filters.difficulty);

      const response = await fetch(`${API_BASE_URL}/api/recipes?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch recipes');
      }
      recipes = await response.json();
    }

    // Apply client-side filtering if needed
    if (filters) {
      if (filters.category) {
        recipes = recipes.filter(r => r.category === filters.category);
      }
      if (filters.signal) {
        recipes = recipes.filter(r => r.signals.includes(filters.signal as any));
      }
      if (filters.difficulty) {
        recipes = recipes.filter(r => r.difficulty === filters.difficulty);
      }
    }

    return recipes;
  },
};
