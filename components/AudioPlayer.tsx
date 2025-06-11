'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Download, Trash2, Clock } from 'lucide-react';
import { AudioGeneration, Script } from '@/types';

interface AudioPlayerProps {
  script: Script | null;
  onDeleteGeneration: (generationId: string) => void;
  onGenerateAudio: () => void;
  isGenerating: boolean;
  speed: number;
  voice: string;
  temperature: number;
  model: string;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voice: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onModelChange: (model: string) => void;
}

// Audio player component for managing and playing generated audio clips
export default function AudioPlayer({ 
  script, 
  onDeleteGeneration, 
  onGenerateAudio, 
  isGenerating, 
  speed,
  voice,
  temperature,
  model,
  onSpeedChange,
  onVoiceChange,
  onTemperatureChange,
  onModelChange
}: AudioPlayerProps) {
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const [activeTab, setActiveTab] = useState<'settings' | 'history' | 'publish'>('settings');
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  // Available TTS models on Replicate
  const modelOptions = [
    {
      value: 'minimax/speech-02-hd',
      label: 'Minimax Speech-02-HD',
      description: 'High-fidelity, 300+ voices, multilingual',
      estimatedTime: '~15-30 seconds',
      cost: '$0.002 per request'
    },
    {
      value: 'lucataco/orpheus-3b-0.1-ft', 
      label: 'Orpheus 3B',
      description: 'Emotive, human-like speech with emotion tags',
      estimatedTime: '~45-60 seconds',
      cost: '$0.055 per request'
    },
    {
      value: 'jaaari/kokoro-82m',
      label: 'Kokoro 82M',
      description: 'Fast, efficient, good quality',
      estimatedTime: '~10-20 seconds', 
      cost: '$0.001 per request'
    },
    {
      value: 'x-lance/f5-tts',
      label: 'F5-TTS',
      description: 'State-of-the-art voice cloning',
      estimatedTime: '~30-45 seconds',
      cost: '$0.005 per request'
    }
  ];

  // Get voice options based on selected model
  const getVoiceOptions = (selectedModel: string) => {
    switch (selectedModel) {
      case 'minimax/speech-02-hd':
        return [
          { value: 'English_Trustworth_Man', label: 'Trustworthy Man (English)' },
          { value: 'English_CalmWoman', label: 'Calm Woman (English)' },
          { value: 'English_Gentle-voiced_man', label: 'Gentle-voiced Man (English)' },
          { value: 'English_Graceful_Lady', label: 'Graceful Lady (English)' },
          { value: 'English_ReservedYoungMan', label: 'Reserved Young Man (English)' },
          { value: 'English_PlayfulGirl', label: 'Playful Girl (English)' },
          { value: 'English_ManWithDeepVoice', label: 'Man with Deep Voice (English)' },
          { value: 'English_MaturePartner', label: 'Mature Partner (English)' },
          { value: 'English_FriendlyPerson', label: 'Friendly Person (English)' },
          { value: 'English_SereneWoman', label: 'Serene Woman (English)' },
          { value: 'English_ConfidentWoman', label: 'Confident Woman (English)' },
          { value: 'English_PatientMan', label: 'Patient Man (English)' },
        ];
      case 'lucataco/orpheus-3b-0.1-ft':
        return [
          { value: 'female_calm', label: 'Female - Calm & Soothing' },
          { value: 'male_warm', label: 'Male - Warm & Friendly' },
          { value: 'female_expressive', label: 'Female - Expressive & Emotive' },
          { value: 'male_deep', label: 'Male - Deep & Resonant' },
          { value: 'female_gentle', label: 'Female - Gentle & Soft' },
          { value: 'male_confident', label: 'Male - Confident & Clear' },
        ];
      case 'jaaari/kokoro-82m':
        return [
          { value: 'af_nicole', label: 'Nicole (Female, Warm)' },
          { value: 'af_sarah', label: 'Sarah (Female, Clear)' },
          { value: 'am_adam', label: 'Adam (Male, Deep)' },
          { value: 'am_michael', label: 'Michael (Male, Friendly)' },
          { value: 'bf_emma', label: 'Emma (Female, British)' },
          { value: 'bf_isabella', label: 'Isabella (Female, British)' },
          { value: 'bm_george', label: 'George (Male, British)' },
          { value: 'bm_lewis', label: 'Lewis (Male, British)' },
        ];
      case 'x-lance/f5-tts':
        return [
          { value: 'default', label: 'Default Voice' },
          { value: 'female_young', label: 'Female - Young & Clear' },
          { value: 'male_mature', label: 'Male - Mature & Steady' },
          { value: 'female_warm', label: 'Female - Warm & Inviting' },
        ];
      default:
        return [{ value: 'default', label: 'Default Voice' }];
    }
  };

  // Get current model info
  const currentModelInfo = modelOptions.find(m => m.value === model) || modelOptions[0];
  const voiceOptions = getVoiceOptions(model);

  // Format time in MM:SS format
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format file size
  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Handle play/pause
  const handlePlayPause = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) {
      console.error('Audio element not found for generation:', generationId);
      return;
    }

    console.log('Audio element:', audio);
    console.log('Audio src:', audio.src);
    console.log('Audio readyState:', audio.readyState);
    console.log('Audio duration:', audio.duration);

    if (currentlyPlaying === generationId) {
      audio.pause();
      setCurrentlyPlaying(null);
    } else {
      // Pause any currently playing audio
      Object.values(audioRefs.current).forEach(a => a.pause());
      setCurrentlyPlaying(generationId);
      
      // Try to play and handle any errors
      audio.play().catch(error => {
        console.error('Error playing audio:', error);
        alert('Failed to play audio. The audio file may be corrupted or incompatible.');
        setCurrentlyPlaying(null);
      });
    }
  };

  // Handle rewind (10 seconds back)
  const handleRewind = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  // Handle fast forward (10 seconds forward)
  const handleFastForward = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

  // Handle download
  const handleDownload = (generation: AudioGeneration) => {
    const link = document.createElement('a');
    link.href = generation.url;
    link.download = `${script?.name || 'audio'}_${formatDate(generation.createdAt).replace(/[^a-z0-9]/gi, '_')}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Audio event handlers
  const handleTimeUpdate = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    
    setCurrentTime(prev => ({
      ...prev,
      [generationId]: audio.currentTime
    }));
  };

  const handleDurationChange = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    
    setDuration(prev => ({
      ...prev,
      [generationId]: audio.duration
    }));
  };

  const handleAudioEnded = (generationId: string) => {
    setCurrentlyPlaying(null);
  };

  const handleAudioError = (generationId: string, error: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    console.error('Audio error for generation:', generationId, error);
    setCurrentlyPlaying(null);
  };

  const handleAudioLoadStart = (generationId: string) => {
    console.log('Audio loading started for generation:', generationId);
  };

  const handleAudioCanPlay = (generationId: string) => {
    console.log('Audio can play for generation:', generationId);
  };

  if (!script) {
    return (
      <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Audio Studio</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Select a script to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full">
      {/* Header with tabs */}
      <div className="border-b border-gray-200">
        <div className="flex">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'settings'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            History
          </button>
          <button
            onClick={() => setActiveTab('publish')}
            className={`flex-1 px-3 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'publish'
                ? 'border-black text-black'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Publish
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'settings' ? (
          /* Settings Tab */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">TTS Settings</h3>
              
              <div className="space-y-4">
                {/* Model Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">TTS Model</label>
                  <select
                    value={model}
                    onChange={(e) => onModelChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    {modelOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="mt-2 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                    <p><strong>{currentModelInfo.label}</strong></p>
                    <p>{currentModelInfo.description}</p>
                    <div className="flex justify-between mt-1">
                      <span>⏱️ {currentModelInfo.estimatedTime}</span>
                      <span>💰 {currentModelInfo.cost}</span>
                    </div>
                  </div>
                </div>

                {/* Voice Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Voice</label>
                  <select
                    value={voice}
                    onChange={(e) => onVoiceChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm"
                  >
                    {voiceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Speed Control - Show for models that support it */}
                {(model === 'jaaari/kokoro-82m' || model === 'minimax/speech-02-hd') && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Speed: {speed.toFixed(1)}x
                    </label>
                    <input
                      type="range"
                      min="0.5"
                      max="2.0"
                      step="0.1"
                      value={speed}
                      onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                    />
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0.5x</span>
                      <span>2.0x</span>
                    </div>
                  </div>
                )}

                {/* Temperature/Expression Control */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {model === 'lucataco/orpheus-3b-0.1-ft' ? 'Emotion' : 'Variation'}: {temperature.toFixed(1)}
                  </label>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => onTemperatureChange(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>{model === 'lucataco/orpheus-3b-0.1-ft' ? 'Calm' : 'Consistent'}</span>
                    <span>{model === 'lucataco/orpheus-3b-0.1-ft' ? 'Emotive' : 'Creative'}</span>
                  </div>
                </div>

                {/* Model-specific settings */}
                {model === 'lucataco/orpheus-3b-0.1-ft' && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-xs font-medium text-blue-900 mb-2">Orpheus Emotion Tags</h4>
                    <p className="text-xs text-blue-700 mb-2">Add emotion tags to your text:</p>
                    <div className="text-xs text-blue-600 space-y-1">
                      <div>&lt;happy&gt;, &lt;sad&gt;, &lt;angry&gt;, &lt;excited&gt;</div>
                      <div>&lt;laugh&gt;, &lt;sigh&gt;, &lt;whisper&gt;, &lt;yawn&gt;</div>
                      <div>&lt;gasp&gt;, &lt;cough&gt;, &lt;chuckle&gt;</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : activeTab === 'history' ? (
          /* History Tab */
          <div className="flex-1 overflow-y-auto">
            {/* Generation Button */}
            <div className="p-4 border-b border-gray-200">
              <button
                onClick={onGenerateAudio}
                disabled={isGenerating || !script.content.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-black text-white rounded-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                <Play className="w-4 h-4" />
                {isGenerating ? 'Generating...' : 'Generate Audio'}
              </button>
              <div className="mt-2 text-xs text-gray-600 text-center">
                <p>{script.audioGenerations.length} generation{script.audioGenerations.length !== 1 ? 's' : ''}</p>
                <p>⏱️ Est. {currentModelInfo.estimatedTime} • 💰 {currentModelInfo.cost}</p>
              </div>
            </div>

            {/* Audio List */}
            {script.audioGenerations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No audio generated yet</p>
                <p className="text-xs mt-1">Click "Generate Audio" to create your first audio</p>
              </div>
            ) : (
              <div className="p-2 space-y-3">
                {script.audioGenerations.map((generation, index) => {
                  const isPlaying = currentlyPlaying === generation.id;
                  const progress = duration[generation.id] 
                    ? (currentTime[generation.id] || 0) / duration[generation.id] * 100 
                    : 0;

                  return (
                    <div
                      key={generation.id}
                      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm"
                    >
                      {/* Audio element */}
                      <audio
                        ref={(el) => {
                          if (el) audioRefs.current[generation.id] = el;
                        }}
                        src={generation.url}
                        onTimeUpdate={() => handleTimeUpdate(generation.id)}
                        onDurationChange={() => handleDurationChange(generation.id)}
                        onEnded={() => handleAudioEnded(generation.id)}
                        onError={(e) => handleAudioError(generation.id, e)}
                        onLoadStart={() => handleAudioLoadStart(generation.id)}
                        onCanPlay={() => handleAudioCanPlay(generation.id)}
                        preload="metadata"
                        crossOrigin="anonymous"
                      />

                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          Generation #{script.audioGenerations.length - index}
                        </span>
                        <button
                          onClick={() => onDeleteGeneration(generation.id)}
                          className="text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete generation"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                        <div 
                          className="bg-black h-2 rounded-full transition-all duration-100"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Controls */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRewind(generation.id)}
                            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Rewind 10s"
                          >
                            <SkipBack className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handlePlayPause(generation.id)}
                            className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                          >
                            {isPlaying ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleFastForward(generation.id)}
                            className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                            title="Fast forward 10s"
                          >
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </div>

                        <button
                          onClick={() => handleDownload(generation)}
                          className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                          title="Download audio"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Time and metadata */}
                      <div className="text-xs text-gray-500 space-y-1">
                        <div className="flex justify-between">
                          <span>
                            {formatTime(currentTime[generation.id] || 0)} / {formatTime(duration[generation.id] || 0)}
                          </span>
                          <span>{formatFileSize(generation.size)}</span>
                        </div>
                        <div>
                          {formatDate(generation.createdAt)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* Publish Tab */
          <div className="flex-1 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Publish to Sonum</h3>
              
              {script.audioGenerations.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">Generate audio first to publish</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Publishing Form */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Content Details</h4>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          placeholder="e.g., Deep Sleep Story: Forest Journey"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                        <textarea
                          rows={3}
                          placeholder="Describe what this audio helps with..."
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Session Type</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm">
                            <option value="sleep">Sleep</option>
                            <option value="meditation">Meditation</option>
                            <option value="focus">Focus</option>
                            <option value="relaxation">Relaxation</option>
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Intensity</label>
                          <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm">
                            <option value="gentle">Gentle</option>
                            <option value="moderate">Moderate</option>
                            <option value="deep">Deep</option>
                          </select>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                        <input
                          type="text"
                          placeholder="e.g., sleep, nature, calming (comma separated)"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-sm"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Audio Selection */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Select Audio to Publish</h4>
                    <div className="space-y-2">
                      {script.audioGenerations.map((generation, index) => (
                        <div key={generation.id} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                          <input 
                            type="checkbox" 
                            id={`publish-${generation.id}`}
                            className="rounded border-gray-300 text-black focus:ring-black"
                          />
                          <label htmlFor={`publish-${generation.id}`} className="flex-1 text-sm">
                            Generation #{script.audioGenerations.length - index} - {formatDate(generation.createdAt)}
                          </label>
                          <span className="text-xs text-gray-500">
                            {formatFileSize(generation.size)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  {/* Publish Button */}
                  <button className="w-full bg-black text-white py-3 rounded-lg hover:bg-gray-800 transition-colors font-medium">
                    Publish to Sonum
                  </button>
                  
                  <div className="text-xs text-gray-600 bg-blue-50 p-3 rounded-lg">
                    <p><strong>Publishing will:</strong></p>
                    <ul className="mt-1 space-y-1">
                      <li>• Upload audio to your Sonum library</li>
                      <li>• Make it available to your iOS app users</li>
                      <li>• Add it to the published content tracking</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 