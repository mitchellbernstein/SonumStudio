'use client';

import React, { useState, useEffect } from 'react';
import { Script } from '@/types';
import ScriptEditor from '@/components/ScriptEditor';
import { supabaseStorage } from '@/utils/supabase-storage';
import { useRouter, useParams } from 'next/navigation';

export default function ScriptEditorPage() {
  const router = useRouter();
  const params = useParams();
  const scriptId = params.scriptId as string;
  
  const [script, setScript] = useState<Script | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // TTS settings
  const [speed, setSpeed] = useState(1.0);
  const [voice, setVoice] = useState('af_nicole');
  const [temperature, setTemperature] = useState(0.7);
  const [model, setModel] = useState('jaaari/kokoro-82m');

  // Load script on mount
  useEffect(() => {
    const loadScript = async () => {
      if (!scriptId) return;
      
      setIsLoading(true);
      try {
        const scripts = await supabaseStorage.getScripts();
        const foundScript = scripts.find(s => s.id === scriptId);
        
        if (foundScript) {
          setScript(foundScript);
        } else {
          alert('Script not found');
          router.push('/studio');
        }
      } catch (error) {
        console.error('Failed to load script:', error);
        alert('Failed to load script');
        router.push('/studio');
      } finally {
        setIsLoading(false);
      }
    };

    loadScript();
  }, [scriptId, router]);

  // Update voice when model changes to ensure compatibility
  const handleModelChange = (newModel: string) => {
    setModel(newModel);
    
    // Reset voice to first option for new model
    const voiceOptions = getVoiceOptionsForModel(newModel);
    if (voiceOptions.length > 0) {
      setVoice(voiceOptions[0].value);
    }
  };

  // Get voice options for model
  const getVoiceOptionsForModel = (selectedModel: string) => {
    switch (selectedModel) {
      case 'minimax/speech-02-hd':
        return [
          { value: 'English_Trustworth_Man', label: 'Trustworthy Man (English)' },
          { value: 'English_CalmWoman', label: 'Calm Woman (English)' },
          { value: 'English_Gentle-voiced_man', label: 'Gentle-voiced Man (English)' },
        ];
      case 'lucataco/orpheus-3b-0.1-ft':
        return [
          { value: 'female_calm', label: 'Female - Calm & Soothing' },
          { value: 'male_warm', label: 'Male - Warm & Friendly' },
        ];
      case 'jaaari/kokoro-82m':
        return [
          { value: 'af_nicole', label: 'Nicole (Female, Warm)' },
          { value: 'af_sarah', label: 'Sarah (Female, Clear)' },
        ];
      case 'x-lance/f5-tts':
        return [
          { value: 'default', label: 'Default Voice' },
          { value: 'female_young', label: 'Female - Young & Clear' },
        ];
      default:
        return [{ value: 'default', label: 'Default Voice' }];
    }
  };

  // Update script
  const updateScript = async (scriptId: string, updates: Partial<Script>) => {
    try {
      const updatedScript = await supabaseStorage.updateScript(scriptId, updates);
      
      if (updatedScript) {
        setScript(updatedScript);
      }
    } catch (error) {
      console.error('Failed to update script:', error);
      alert('Failed to save changes. Please try again.');
    }
  };

  // Delete script
  const deleteScript = async (scriptId: string) => {
    try {
      const success = await supabaseStorage.deleteScript(scriptId);
      
      if (success) {
        router.push('/studio');
      } else {
        alert('Failed to delete script. Please try again.');
      }
    } catch (error) {
      console.error('Failed to delete script:', error);
      alert('Failed to delete script. Please try again.');
    }
  };

  // Generate audio
  const generateAudio = async () => {
    if (!script || isGenerating) return;

    setIsGenerating(true);
    updateScript(script.id, { isGenerating: true });

    const textContent = script.content;

    try {
      const response = await fetch('/api/generate-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textContent,
          voice,
          speed,
          temperature,
          model
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate audio');
      }

      const data = await response.json();
      
      if (!data.success || !data.audioUrl) {
        throw new Error(data.error || 'Failed to generate audio');
      }

      // Fetch the actual audio file from the returned URL
      const audioResponse = await fetch(data.audioUrl);
      if (!audioResponse.ok) {
        throw new Error('Failed to fetch generated audio');
      }

      const blob = await audioResponse.blob();
      const audioUrl = URL.createObjectURL(blob);
      
      // Save audio generation to Supabase
      const newGeneration = await supabaseStorage.addAudioGeneration(
        script.id,
        {
          url: audioUrl,
          size: blob.size
        },
        { voice, speed, temperature, model }
      );

      if (newGeneration) {
        const updatedAudioGenerations = [newGeneration, ...script.audioGenerations];
        const updatedScript = {
          ...script,
          audioGenerations: updatedAudioGenerations,
          isGenerating: false
        };
        
        setScript(updatedScript);
      }
    } catch (error) {
      console.error('Error generating audio:', error);
      alert('Failed to generate audio. Please try again.');
      updateScript(script.id, { isGenerating: false });
    } finally {
      setIsGenerating(false);
    }
  };

  // Delete audio generation
  const deleteGeneration = async (generationId: string) => {
    if (!script) return;

    try {
      const success = await supabaseStorage.deleteAudioGeneration(generationId);
      
      if (success) {
        // Revoke the blob URL
        const generation = script.audioGenerations.find(g => g.id === generationId);
        if (generation?.url.startsWith('blob:')) {
          URL.revokeObjectURL(generation.url);
        }

        const updatedAudioGenerations = script.audioGenerations.filter(g => g.id !== generationId);
        const updatedScript = {
          ...script,
          audioGenerations: updatedAudioGenerations
        };
        
        setScript(updatedScript);
      }
    } catch (error) {
      console.error('Failed to delete audio generation:', error);
      alert('Failed to delete audio. Please try again.');
    }
  };

  // Handle back from script editor
  const handleBackToStudio = () => {
    router.push('/studio');
  };

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading script...</p>
        </div>
      </div>
    );
  }

  if (!script) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Script not found</p>
          <button 
            onClick={() => router.push('/studio')}
            className="mt-4 px-4 py-2 bg-black text-white rounded-md hover:bg-gray-800 transition-colors"
          >
            Back to Studio
          </button>
        </div>
      </div>
    );
  }

  return (
    <ScriptEditor
      script={script}
      onUpdateScript={(updatedScript) => {
        updateScript(updatedScript.id, updatedScript);
      }}
      onDeleteScript={deleteScript}
      onGenerateAudio={generateAudio}
      isGenerating={isGenerating}
      onBack={handleBackToStudio}
      speed={speed}
      voice={voice}
      temperature={temperature}
      model={model}
      onSpeedChange={setSpeed}
      onVoiceChange={setVoice}
      onTemperatureChange={setTemperature}
      onModelChange={handleModelChange}
      onDeleteGeneration={deleteGeneration}
    />
  );
} 