import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for published audio
export interface PublishedAudio {
  id: string;
  title: string;
  description?: string;
  script_content: string;
  file_url: string;
  file_size?: number;
  duration?: number;
  voice_used: string;
  speed: number;
  temperature: number;
  session_type?: 'sleep' | 'meditation' | 'focus' | 'relaxation';
  duration_category?: 'short' | 'medium' | 'long';
  intensity_level?: 'gentle' | 'moderate' | 'deep';
  version_number: number;
  status: 'published' | 'archived' | 'deleted';
  original_id?: string;
  tags?: string[];
  category?: string;
  created_at: string;
  updated_at: string;
  published_at: string;
  replaced_at?: string;
  deleted_at?: string;
  replacement_reason?: string;
  play_count: number;
  download_count: number;
}

// Function to publish audio to Supabase
export async function publishAudio(audioData: {
  title: string;
  description?: string;
  script_content: string;
  audioBlob: Blob;
  voice_used: string;
  speed: number;
  temperature: number;
  session_type?: string;
  duration_category?: string;
  intensity_level?: string;
  tags?: string[];
  category?: string;
}): Promise<{ success: boolean; data?: PublishedAudio; error?: string }> {
  try {
    // Upload audio file to Supabase Storage
    const fileName = `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('audio-files')
      .upload(fileName, audioData.audioBlob, {
        contentType: 'audio/mpeg',
        upsert: false
      });

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`);
    }

    // Get public URL for the uploaded file
    const { data: { publicUrl } } = supabase.storage
      .from('audio-files')
      .getPublicUrl(fileName);

    // Insert metadata into published_audio table
    const { data, error } = await supabase
      .from('published_audio')
      .insert({
        title: audioData.title,
        description: audioData.description,
        script_content: audioData.script_content,
        file_url: publicUrl,
        file_size: audioData.audioBlob.size,
        voice_used: audioData.voice_used,
        speed: audioData.speed,
        temperature: audioData.temperature,
        session_type: audioData.session_type,
        duration_category: audioData.duration_category,
        intensity_level: audioData.intensity_level,
        tags: audioData.tags,
        category: audioData.category,
        version_number: 1,
        status: 'published',
        play_count: 0,
        download_count: 0
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database insert failed: ${error.message}`);
    }

    return { success: true, data };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return { success: false, error: errorMessage };
  }
}

// Ensure storage bucket exists for uploaded audio files
export const ensureStorageBucket = async () => {
  try {
    const { error } = await supabase.storage.getBucket('audio-files');
    
    if (error && error.message.includes('not found')) {
      // Create bucket if it doesn't exist
      const { error: createError } = await supabase.storage.createBucket('audio-files', {
        public: true,
        allowedMimeTypes: ['audio/*'],
        fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
      });
      
      if (createError) {
        console.error('Failed to create storage bucket:', createError);
      }
    }
  } catch (error) {
    console.error('Error checking storage bucket:', error);
  }
};

// Get published content stats for home dashboard
export const getPublishedStats = async () => {
  try {
    // Get published audio count
    const { count: publishedCount, error: publishedError } = await supabase
      .from('published_audio')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (publishedError) throw publishedError;

    // Get total play count
    const { data: playStats, error: playError } = await supabase
      .from('published_audio')
      .select('play_count')
      .eq('status', 'published');

    if (playError) throw playError;

    const totalListens = playStats?.reduce((sum, track) => sum + (track.play_count || 0), 0) || 0;

    return {
      publishedTracks: publishedCount || 0,
      totalListens
    };
  } catch (error) {
    console.error('Error fetching published stats:', error);
    return {
      publishedTracks: 0,
      totalListens: 0
    };
  }
}; 