'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import SpeechToTextTab from '@/components/SpeechToTextTab';
import { supabaseStorage } from '@/utils/supabase-storage';
import { useRouter } from 'next/navigation';

export default function SpeechToTextPage() {
  const router = useRouter();
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);

  // Create script from transcription
  const createScriptFromTranscription = async (transcription: string, filename: string) => {
    setIsLoadingOperation(true);
    try {
      const newScript = await supabaseStorage.addScript({
        name: filename.replace(/\.[^/.]+$/, '') || 'Transcribed Script',
        content: transcription,
        tags: ['transcribed'],
        status: 'draft',
        audioGenerations: [],
        isGenerating: false
      });

      if (newScript) {
        router.push(`/studio/${newScript.id}`);
      }
    } catch (error) {
      console.error('Failed to create script from transcription:', error);
      alert('Failed to create script. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const handleBack = () => {
    router.push('/studio');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab="speech-to-text" onTabChange={(tab) => {
        if (tab === 'home') router.push('/');
        if (tab === 'studio') router.push('/studio');
      }} />
      
      <div className="flex-1">
        <SpeechToTextTab
          onCreateScript={createScriptFromTranscription}
          onBack={handleBack}
        />
      </div>

      {/* Loading overlay for operations */}
      {isLoadingOperation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 flex items-center gap-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-black"></div>
            <span>Creating script...</span>
          </div>
        </div>
      )}
    </div>
  );
} 