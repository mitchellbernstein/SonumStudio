'use client';

import React, { useState, useEffect } from 'react';
import { Script } from '@/types';
import Sidebar from '@/components/Sidebar';
import StudioTab from '@/components/StudioTab';
import { supabaseStorage } from '@/utils/supabase-storage';
import { useRouter } from 'next/navigation';

export default function StudioPage() {
  const router = useRouter();
  const [scripts, setScripts] = useState<Script[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);

  // Load scripts on mount
  useEffect(() => {
    const loadScripts = async () => {
      setIsLoading(true);
      try {
        const loadedScripts = await supabaseStorage.getScripts();
        setScripts(loadedScripts);
      } catch (error) {
        console.error('Failed to load scripts:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadScripts();
  }, []);

  // Create new script
  const createScript = async () => {
    setIsLoadingOperation(true);
    try {
      const newScript = await supabaseStorage.addScript({
        name: 'Untitled Script',
        content: '',
        tags: [],
        status: 'draft',
        audioGenerations: [],
        isGenerating: false
      });

      if (newScript) {
        setScripts(prev => [newScript, ...prev]);
        router.push(`/studio/${newScript.id}`);
      }
    } catch (error) {
      console.error('Failed to create script:', error);
      alert('Failed to create script. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  // Select script
  const selectScript = (script: Script) => {
    router.push(`/studio/${script.id}`);
  };

  // Delete script
  const deleteScript = async (scriptId: string) => {
    setIsLoadingOperation(true);
    try {
      const success = await supabaseStorage.deleteScript(scriptId);
      
      if (success) {
        setScripts(prev => prev.filter(script => script.id !== scriptId));
      } else {
        alert('Failed to delete script. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
      alert('Failed to delete script. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBackToStudio = () => {
    // This function is for consistency with the original component API
    // In the routed version, this is handled by navigation
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab="studio" onTabChange={(tab) => {
        if (tab === 'home') router.push('/');
        if (tab === 'speech-to-text') router.push('/speech-to-text');
      }} />
      
      <div className="flex-1">
        <StudioTab
          scripts={scripts}
          onSelectScript={selectScript}
          onCreateScript={createScript}
          onDeleteScript={deleteScript}
          selectedScript={null}
          onBack={handleBackToStudio}
          isLoading={isLoadingOperation}
        />
      </div>

      {/* Loading overlay for operations */}
      {isLoadingOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            <span>Processing...</span>
          </div>
        </div>
      )}
    </div>
  );
} 