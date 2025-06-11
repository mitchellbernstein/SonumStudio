// Type definitions for the TTS Studio app

export interface AudioGeneration {
  id: string;
  url: string;
  createdAt: Date;
  size?: number;
  duration?: number;
  voice_used?: string;
  speed?: number;
  temperature?: number;
  model_used?: string;
}

export interface Script {
  id: string;
  name: string;
  content: string; // Text content for Lexical editor
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  audioGenerations: AudioGeneration[];
  isGenerating?: boolean;
}

export interface TTSResponse {
  success: boolean;
  audioUrl?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status?: number;
}

// Database row types (matching Supabase schema)
export interface ScriptRow {
  id: string;
  name: string;
  content: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface AudioGenerationRow {
  id: string;
  script_id: string;
  file_url: string;
  file_size: number | null;
  duration: number | null;
  voice_used: string;
  speed: number;
  temperature: number;
  model_used: string;
  created_at: string;
} 