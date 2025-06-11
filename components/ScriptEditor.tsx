'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Play, RotateCcw, Download, Volume2, Tag, Trash2, Undo, Redo, Music, Plus, Minus, Pause, Clock, X, SkipBack, SkipForward, ArrowLeft } from 'lucide-react';
import { Script, TTSResponse, AudioGeneration } from '@/types';
import LexicalEditor from './LexicalEditor';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';

interface ScriptEditorProps {
  script: Script | null;
  onUpdateScript: (script: Script) => void;
  onDeleteScript: (scriptId: string) => void;
  onGenerateAudio: () => void;
  isGenerating: boolean;
  onBack: () => void;
  speed: number;
  voice: string;
  temperature: number;
  model: string;
  onSpeedChange: (speed: number) => void;
  onVoiceChange: (voice: string) => void;
  onTemperatureChange: (temperature: number) => void;
  onModelChange: (model: string) => void;
  onDeleteGeneration: (generationId: string) => void;
}

// Helper functions for content handling
const convertStringToEditorData = (content: string): any => {
  if (!content || content.trim() === '') {
    return {
      time: Date.now(),
      blocks: [],
      version: '2.28.2'
    };
  }

  // Convert plain text to EditorJS blocks
  const paragraphs = content.split('\n').filter(line => line.trim() !== '');
  const blocks = paragraphs.map((text, index) => ({
    id: `block_${Date.now()}_${index}`,
    type: 'paragraph',
    data: { text: text.trim() }
  }));

  return {
    time: Date.now(),
    blocks,
    version: '2.28.2'
  };
};

const convertEditorDataToString = (data: any): string => {
  if (!data || !data.blocks) return '';
  
  return data.blocks
    .map((block: any) => {
      switch (block.type) {
        case 'paragraph':
          return block.data.text || '';
        case 'header':
          return block.data.text || '';
        case 'list':
          return block.data.items?.join('\n') || '';
        case 'quote':
          return block.data.text || '';
        default:
          return '';
      }
    })
    .filter((text: string) => text.trim() !== '')
    .join('\n\n');
};

const getContentAsEditorData = (content: string | any): any => {
  if (typeof content === 'string') {
    return convertStringToEditorData(content);
  }
  return content;
};

const getContentAsString = (content: string | any): string => {
  if (typeof content === 'string') {
    return content;
  }
  return convertEditorDataToString(content);
};

const isContentEmpty = (content: string | any): boolean => {
  if (typeof content === 'string') {
    return content.trim() === '';
  }
  return !content.blocks || content.blocks.length === 0;
};

// Main script editor component
export default function ScriptEditor({ 
  script, 
  onUpdateScript, 
  onDeleteScript, 
  onGenerateAudio, 
  isGenerating,
  onBack,
  speed,
  voice,
  temperature,
  model,
  onSpeedChange,
  onVoiceChange,
  onTemperatureChange,
  onModelChange,
  onDeleteGeneration
}: ScriptEditorProps) {
  // UI State
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const editorRef = useRef<HTMLDivElement>(null);
  
  // Audio Player State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<{ [key: string]: number }>({});
  const [duration, setDuration] = useState<{ [key: string]: number }>({});
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
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
  
  // Initialize history when script changes
  useEffect(() => {
    if (script && history.length === 0) {
      setHistory([getContentAsString(script.content)]);
      setHistoryIndex(0);
    }
  }, [script]);

  // Format functions
  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Audio functions
  const handlePlayPause = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) {
      console.error('Audio element not found for generation:', generationId);
      return;
    }

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

  const handleRewind = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
  };

  const handleFastForward = (generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio) return;
    audio.currentTime = Math.min(audio.duration, audio.currentTime + 10);
  };

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

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>, generationId: string) => {
    const audio = audioRefs.current[generationId];
    if (!audio || !duration[generationId]) return;
    
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * duration[generationId];
    audio.currentTime = newTime;
  };

  // Editor functions
  const handleContentChange = (content: string) => {
    if (!script) return;
    const updatedScript = {
      ...script,
      content,
      updatedAt: new Date(),
    };
    onUpdateScript(updatedScript);
  };

  const handleNameChange = (name: string) => {
    if (!script) return;
    const updatedScript = {
      ...script,
      name: name || 'Untitled Script',
      updatedAt: new Date(),
    };
    onUpdateScript(updatedScript);
  };

  const saveToHistory = (content: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(content);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleTextFormat = (format: string) => {
    // EditorJS handles text formatting through its toolbar
    // This function is kept for compatibility but EditorJS will handle formatting
    console.log(`Text format ${format} selected - EditorJS will handle this through its toolbar`);
  };

  const handleUndo = () => {
    if (historyIndex > 0 && script) {
      const newIndex = historyIndex - 1;
      const previousContent = history[newIndex];
      setHistoryIndex(newIndex);
      
      // Update the script content
      const updatedScript = { ...script, content: previousContent };
      onUpdateScript(updatedScript);
      
      // Use Lexical's global method for setting content if available
      if ((window as any).lexicalSetContent) {
        (window as any).lexicalSetContent(previousContent);
      }
    }
  };

  const handleRedo = () => {
    if (historyIndex < history.length - 1 && script) {
      const newIndex = historyIndex + 1;
      const nextContent = history[newIndex];
      setHistoryIndex(newIndex);
      
      // Update the script content
      const updatedScript = { ...script, content: nextContent };
      onUpdateScript(updatedScript);
      
      // Use Lexical's global method for setting content if available
      if ((window as any).lexicalSetContent) {
        (window as any).lexicalSetContent(nextContent);
      }
    }
  };

  const insertTimeBreak = () => {
    if (script) {
      saveToHistory(script.content);
      // Use Lexical's global method for inserting breaks
      if ((window as any).lexicalInsertBreak) {
        (window as any).lexicalInsertBreak('time', '1s');
      }
    }
  };

  const insertSoundEffect = () => {
    if (script) {
      saveToHistory(script.content);
      // Use Lexical's global method for inserting breaks
      if ((window as any).lexicalInsertBreak) {
        (window as any).lexicalInsertBreak('sound', 'effect_name');
      }
    }
  };

  // Update audio source when script changes
  useEffect(() => {
    if (audioRefs.current && script?.audioGenerations && script.audioGenerations.length > 0) {
      const latestAudio = script.audioGenerations[0];
      Object.values(audioRefs.current).forEach(a => {
        a.src = latestAudio.url;
        a.playbackRate = playbackSpeed;
      });
    }
  }, [script?.audioGenerations, playbackSpeed]);

  if (!script) {
    return (
      <div className="flex-1 flex items-center justify-center bg-white">
        <div className="text-center text-gray-500">
          <Volume2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-medium mb-2">Select a script to edit</h2>
          <p>Choose a script from the sidebar or create a new one to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white h-full">
      {/* Top Navigation Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Studio</span>
          </button>

          <input
            type="text"
            value={script.name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="text-xl font-semibold text-gray-900 bg-transparent border-none outline-none focus:ring-0 text-center hover:bg-gray-50 rounded px-2 py-1 transition-colors"
            placeholder="Untitled Script"
          />

          <Button
            onClick={() => setShowPublishModal(true)}
            className="text-sm font-medium"
          >
            Publish
          </Button>
        </div>
      </div>

      {/* Editor Toolbar */}
      <div className="border-b border-gray-200 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Select onValueChange={(value) => value && handleTextFormat(value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Text" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p">Text</SelectItem>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
              </SelectContent>
            </Select>

            <div className="w-px h-6 bg-gray-300"></div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              title="Undo"
              className="p-1.5 h-auto"
            >
              <Undo className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              title="Redo"
              className="p-1.5 h-auto"
            >
              <Redo className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300"></div>

            <Button
              variant="ghost"
              size="sm"
              onClick={insertTimeBreak}
              title="Insert time break"
              className="p-1.5 h-auto"
            >
              <Pause className="w-4 h-4" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={insertSoundEffect}
              title="Insert sound effect"
              className="p-1.5 h-auto"
            >
              <Music className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            {/* AudioPlayer Tabs */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'settings' | 'history')}>
              <TabsList className="grid w-40 grid-cols-2">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex relative min-h-0">
        {/* Left: Editor */}
        <div className={`flex-1 flex flex-col min-h-0 ${isPanelCollapsed ? 'mr-0' : 'mr-80'} transition-all duration-200`}>
          {/* Editor Area */}
          <div className="flex-1 min-h-0">
            <LexicalEditor
              data={script.content}
              onChange={(content) => {
                saveToHistory(script.content);
                handleContentChange(content);
              }}
            />
          </div>
          
          {/* Audio Player - Always visible at bottom */}
          <div className="border-t border-gray-200 bg-gray-50 p-4 shrink-0">
            {script?.audioGenerations && script.audioGenerations.length > 0 ? (
              <div className="flex items-center gap-4">
                {/* Play Controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePlayPause(script.audioGenerations[0].id)}
                    className="p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors"
                  >
                    {currentlyPlaying === script.audioGenerations[0].id ? 
                      <Pause className="w-4 h-4" /> : 
                      <Play className="w-4 h-4" />
                    }
                  </button>
                  
                  <button
                    onClick={() => handleRewind(script.audioGenerations[0].id)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <SkipBack className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleFastForward(script.audioGenerations[0].id)}
                    className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <SkipForward className="w-4 h-4" />
                  </button>
                </div>

                {/* Progress Bar */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                    <span>{formatTime(currentTime[script.audioGenerations[0].id] || 0)}</span>
                    <span>/</span>
                    <span>{formatTime(duration[script.audioGenerations[0].id] || 0)}</span>
                  </div>
                  <div 
                    className="w-full h-2 bg-gray-200 rounded-full cursor-pointer"
                    onClick={(e) => handleProgressClick(e, script.audioGenerations[0].id)}
                  >
                    <div 
                      className="h-full bg-black rounded-full transition-all duration-100"
                      style={{ 
                        width: `${duration[script.audioGenerations[0].id] ? 
                          ((currentTime[script.audioGenerations[0].id] || 0) / duration[script.audioGenerations[0].id]) * 100 : 0}%` 
                      }}
                    />
                  </div>
                </div>

                {/* Speed Control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPlaybackSpeed(Math.max(0.5, playbackSpeed - 0.25))}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs text-gray-700 min-w-[3rem] text-center">
                    {playbackSpeed.toFixed(2)}x
                  </span>
                  <button
                    onClick={() => setPlaybackSpeed(Math.min(2, playbackSpeed + 0.25))}
                    className="p-1 text-gray-600 hover:text-gray-800 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Download */}
                <button
                  onClick={() => handleDownload(script.audioGenerations[0])}
                  className="p-1.5 text-gray-600 hover:text-gray-800 transition-colors"
                  title="Download audio"
                >
                  <Download className="w-4 h-4" />
                </button>

                {/* Hidden audio element */}
                <audio
                  ref={(el) => {
                    if (el) audioRefs.current[script.audioGenerations[0].id] = el;
                  }}
                  src={script.audioGenerations[0].url}
                  onTimeUpdate={() => handleTimeUpdate(script.audioGenerations[0].id)}
                  onDurationChange={() => handleDurationChange(script.audioGenerations[0].id)}
                  onEnded={() => handleAudioEnded(script.audioGenerations[0].id)}
                  onError={(e) => handleAudioError(script.audioGenerations[0].id, e)}
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="text-center text-gray-500 py-4">
                <Volume2 className="w-6 h-6 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No audio generated yet</p>
                <p className="text-xs">Generate audio to see the player controls</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: AudioPlayer Panel */}
        {!isPanelCollapsed && (
          <div className="w-80 bg-gray-50 border-l border-gray-200 flex flex-col h-full absolute right-0 top-0 bottom-0">
            {/* Tab Content */}
            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'settings' | 'history')} className="flex flex-col h-full">
              <TabsContent value="settings" className="flex-1 overflow-y-auto m-0">
                <div className="p-4">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">TTS Settings</h3>
                    
                    <div className="space-y-4">
                      {/* Model Selection */}
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">TTS Model</label>
                        <Select value={model} onValueChange={onModelChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select TTS Model" />
                          </SelectTrigger>
                          <SelectContent>
                            {modelOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                        <Select value={voice} onValueChange={onVoiceChange}>
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select Voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {voiceOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Speed Control - Show for models that support it */}
                      {(model === 'jaaari/kokoro-82m' || model === 'minimax/speech-02-hd') && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">
                            Speed: {speed.toFixed(1)}x
                          </label>
                          <Slider
                            value={[speed]}
                            onValueChange={(value) => onSpeedChange(value[0])}
                            max={2.0}
                            min={0.5}
                            step={0.1}
                            className="w-full py-1"
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
                        <Slider
                          value={[temperature]}
                          onValueChange={(value) => onTemperatureChange(value[0])}
                          max={1.0}
                          min={0.1}
                          step={0.1}
                          className="w-full py-1"
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
                </TabsContent>
                
                <TabsContent value="history" className="flex-1 overflow-y-auto m-0">
                  {/* Generation Button */}
                  <div className="p-4 border-b border-gray-200">
                    <Button
                      onClick={onGenerateAudio}
                      disabled={isGenerating || !script.content || isContentEmpty(script.content)}
                      className="w-full flex items-center justify-center gap-2 py-3 font-medium"
                    >
                      <Play className="w-4 h-4" />
                      {isGenerating ? 'Generating...' : 'Generate Audio'}
                    </Button>
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
                </TabsContent>
              </Tabs>
          </div>
        )}
      </div>

      {/* Publish Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Publish to Sonum</h3>
              <button
                onClick={() => setShowPublishModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              <p>Publishing functionality will be implemented here.</p>
            </div>
            
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowPublishModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button className="flex-1">
                Publish
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 