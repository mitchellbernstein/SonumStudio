'use client';

import React, { useState, useEffect } from 'react';
import { Script, AudioGeneration } from '@/types';
import Sidebar from '@/components/Sidebar';
import HomeTab from '@/components/HomeTab';
import StudioTab from '@/components/StudioTab';
import SpeechToTextTab from '@/components/SpeechToTextTab';
import ScriptEditor from '@/components/ScriptEditor';
import AudioPlayer from '@/components/AudioPlayer';
import { ArrowLeft } from 'lucide-react';
import { getPublishedStats, ensureStorageBucket } from '@/utils/supabase';
import { supabaseStorage } from '@/utils/supabase-storage';

// NSDR content templates
const TEMPLATES = {
  'sleep-story': `Welcome to your peaceful sleep journey. Close your eyes and allow yourself to drift into a state of deep relaxation.

[BREAK:2s]

Imagine yourself walking through a serene forest path. The moonlight filters gently through the leaves above, creating a soft, silver glow that guides your way.

[BREAK:3s]

With each step, you feel yourself becoming more and more relaxed. Your breathing slows naturally, and any tension in your body begins to melt away.

[BREAK:2s]

Allow yourself to continue on this peaceful journey, knowing that with each moment, you are drifting closer to a deep, restorative sleep.`,

  'focus-session': `Find a comfortable position and prepare to enhance your focus and concentration.

[BREAK:2s]

Begin by taking three deep breaths. Inhale slowly and deeply... hold for a moment... and exhale completely.

[BREAK:1s]

Now, bring your attention to the present moment. Notice any thoughts that arise, and gently let them pass like clouds in the sky.

[BREAK:2s]

With each breath, your mind becomes clearer and more focused. You feel alert yet calm, ready to engage with whatever task lies ahead.`,

  'relaxation': `Settle into a comfortable position and prepare for deep relaxation.

[BREAK:2s]

Starting with your toes, notice any tension and consciously release it. Feel your feet relaxing completely.

[BREAK:1s]

Move your attention up to your calves and thighs. Let all the muscles in your legs become soft and heavy.

[BREAK:2s]

Continue this journey through your body - your abdomen, chest, shoulders, arms, and finally your neck and head.

[BREAK:1s]

With each area you visit, allow deeper relaxation to wash over you like a gentle wave.`
};

type TabType = 'home' | 'studio' | 'speech-to-text';

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingOperation, setIsLoadingOperation] = useState(false);
  const [publishedStats, setPublishedStats] = useState({ publishedTracks: 0, totalListens: 0 });
  const [scripts, setScripts] = useState<Script[]>([]);

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const [loadedScripts, stats] = await Promise.all([
          supabaseStorage.getScripts(),
          getPublishedStats()
        ]);
        setScripts(loadedScripts);
        setPublishedStats(stats);
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  // Create new script
  const createScript = async (template?: string) => {
    setIsLoadingOperation(true);
    try {
      const newScript = await supabaseStorage.addScript({
        name: 'Untitled Script',
        content: template ? TEMPLATES[template as keyof typeof TEMPLATES] || '' : '',
        tags: template ? [template.replace('-', ' ')] : [],
        status: 'draft',
        audioGenerations: [],
        isGenerating: false
      });

      if (newScript) {
        // Redirect to the script editor
        window.location.href = `/studio/${newScript.id}`;
      }
    } catch (error) {
      console.error('Failed to create script:', error);
      alert('Failed to create script. Please try again.');
    } finally {
      setIsLoadingOperation(false);
    }
  };

  const stats = {
    totalScripts: scripts.length,
    totalAudio: scripts.reduce((acc, script) => acc + script.audioGenerations.length, 0),
    publishedTracks: publishedStats.publishedTracks,
    totalListens: publishedStats.totalListens,
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <HomeTab 
        onCreateScript={createScript}
        onOpenSpeechToText={() => window.location.href = '/speech-to-text'}
        stats={stats}
      />
      
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