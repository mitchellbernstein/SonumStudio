import { Script } from '@/types';

const STORAGE_KEY = 'tts-studio-scripts';

// Storage utilities for managing scripts in localStorage
export const storage = {
  // Get all scripts from localStorage
  getScripts: (): Script[] => {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const scripts = JSON.parse(stored);
      // Convert date strings back to Date objects
      return scripts.map((script: any) => ({
        ...script,
        createdAt: new Date(script.createdAt),
        updatedAt: new Date(script.updatedAt),
        audioGenerations: script.audioGenerations ? script.audioGenerations.map((gen: any) => ({
          ...gen,
          createdAt: new Date(gen.createdAt),
        })) : [],
      }));
    } catch (error) {
      console.error('Error loading scripts from localStorage:', error);
      return [];
    }
  },

  // Save scripts to localStorage
  saveScripts: (scripts: Script[]): void => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(scripts));
    } catch (error) {
      console.error('Error saving scripts to localStorage:', error);
    }
  },

  // Add a new script
  addScript: (script: Script): void => {
    const scripts = storage.getScripts();
    scripts.unshift(script); // Add to beginning of array
    storage.saveScripts(scripts);
  },

  // Update an existing script
  updateScript: (updatedScript: Script): void => {
    const scripts = storage.getScripts();
    const index = scripts.findIndex(s => s.id === updatedScript.id);
    
    if (index !== -1) {
      scripts[index] = updatedScript;
      storage.saveScripts(scripts);
    }
  },

  // Delete a script
  deleteScript: (scriptId: string): void => {
    const scripts = storage.getScripts();
    const filtered = scripts.filter(s => s.id !== scriptId);
    storage.saveScripts(filtered);
  },

  // Get a specific script by ID
  getScript: (scriptId: string): Script | null => {
    const scripts = storage.getScripts();
    return scripts.find(s => s.id === scriptId) || null;
  },
}; 