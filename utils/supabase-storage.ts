import { createClient } from '@supabase/supabase-js';
import { Script, AudioGeneration, ScriptRow, AudioGenerationRow } from '@/types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions to convert between database rows and app types
const convertScriptRowToScript = (row: ScriptRow, audioGenerations: AudioGeneration[] = []): Script => ({
  id: row.id,
  name: row.name,
  content: row.content,
  tags: row.tags,
  status: row.status,
  createdAt: new Date(row.created_at),
  updatedAt: new Date(row.updated_at),
  audioGenerations,
  isGenerating: false
});

const convertAudioRowToGeneration = (row: AudioGenerationRow): AudioGeneration => ({
  id: row.id,
  url: row.file_url,
  createdAt: new Date(row.created_at),
  size: row.file_size || undefined,
  duration: row.duration || undefined,
  voice_used: row.voice_used,
  speed: row.speed,
  temperature: row.temperature,
  model_used: row.model_used
});

// Supabase storage utilities for managing scripts
export const supabaseStorage = {
  // Get all scripts with their audio generations
  getScripts: async (): Promise<Script[]> => {
    try {
      // Get scripts
      const { data: scripts, error: scriptsError } = await supabase
        .from('scripts')
        .select('*')
        .order('updated_at', { ascending: false });

      if (scriptsError) throw scriptsError;

      if (!scripts || scripts.length === 0) return [];

      // Get all audio generations for these scripts
      const scriptIds = scripts.map(s => s.id);
      const { data: audioGens, error: audioError } = await supabase
        .from('audio_generations')
        .select('*')
        .in('script_id', scriptIds)
        .order('created_at', { ascending: false });

      if (audioError) throw audioError;

      // Group audio generations by script_id
      const audioGensByScript = (audioGens || []).reduce((acc, gen) => {
        if (!acc[gen.script_id]) acc[gen.script_id] = [];
        acc[gen.script_id].push(convertAudioRowToGeneration(gen));
        return acc;
      }, {} as Record<string, AudioGeneration[]>);

      // Combine scripts with their audio generations
      return scripts.map(script => 
        convertScriptRowToScript(script, audioGensByScript[script.id] || [])
      );
    } catch (error) {
      console.error('Error loading scripts from Supabase:', error);
      return [];
    }
  },

  // Add a new script
  addScript: async (script: Omit<Script, 'id' | 'createdAt' | 'updatedAt'>): Promise<Script | null> => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .insert({
          name: script.name,
          content: script.content,
          tags: script.tags,
          status: script.status || 'draft'
        })
        .select()
        .single();

      if (error) throw error;

      return convertScriptRowToScript(data);
    } catch (error) {
      console.error('Error adding script to Supabase:', error);
      return null;
    }
  },

  // Update an existing script
  updateScript: async (scriptId: string, updates: Partial<Script>): Promise<Script | null> => {
    try {
      const updateData: Partial<ScriptRow> = {};
      
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.content !== undefined) updateData.content = updates.content;
      if (updates.tags !== undefined) updateData.tags = updates.tags;
      if (updates.status !== undefined) updateData.status = updates.status;

      const { data, error } = await supabase
        .from('scripts')
        .update(updateData)
        .eq('id', scriptId)
        .select()
        .single();

      if (error) throw error;

      // Get updated audio generations
      const { data: audioGens } = await supabase
        .from('audio_generations')
        .select('*')
        .eq('script_id', scriptId)
        .order('created_at', { ascending: false });

      const audioGenerations = (audioGens || []).map(convertAudioRowToGeneration);
      
      return convertScriptRowToScript(data, audioGenerations);
    } catch (error) {
      console.error('Error updating script in Supabase:', error);
      return null;
    }
  },

  // Delete a script and its audio generations
  deleteScript: async (scriptId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('scripts')
        .delete()
        .eq('id', scriptId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting script from Supabase:', error);
      return false;
    }
  },

  // Get a specific script by ID
  getScript: async (scriptId: string): Promise<Script | null> => {
    try {
      const { data: script, error: scriptError } = await supabase
        .from('scripts')
        .select('*')
        .eq('id', scriptId)
        .single();

      if (scriptError) throw scriptError;

      const { data: audioGens, error: audioError } = await supabase
        .from('audio_generations')
        .select('*')
        .eq('script_id', scriptId)
        .order('created_at', { ascending: false });

      if (audioError) throw audioError;

      const audioGenerations = (audioGens || []).map(convertAudioRowToGeneration);
      
      return convertScriptRowToScript(script, audioGenerations);
    } catch (error) {
      console.error('Error loading script from Supabase:', error);
      return null;
    }
  },

  // Add audio generation to a script
  addAudioGeneration: async (
    scriptId: string, 
    generation: Omit<AudioGeneration, 'id' | 'createdAt'>,
    generationParams: {
      voice: string;
      speed: number;
      temperature: number;
      model: string;
    }
  ): Promise<AudioGeneration | null> => {
    try {
      const { data, error } = await supabase
        .from('audio_generations')
        .insert({
          script_id: scriptId,
          file_url: generation.url,
          file_size: generation.size || null,
          duration: generation.duration || null,
          voice_used: generationParams.voice,
          speed: generationParams.speed,
          temperature: generationParams.temperature,
          model_used: generationParams.model
        })
        .select()
        .single();

      if (error) throw error;

      return convertAudioRowToGeneration(data);
    } catch (error) {
      console.error('Error adding audio generation to Supabase:', error);
      return null;
    }
  },

  // Delete an audio generation
  deleteAudioGeneration: async (generationId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('audio_generations')
        .delete()
        .eq('id', generationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting audio generation from Supabase:', error);
      return false;
    }
  },

  // Publish a script (change status to published)
  publishScript: async (scriptId: string): Promise<Script | null> => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .update({ status: 'published' })
        .eq('id', scriptId)
        .select()
        .single();

      if (error) throw error;

      // Get audio generations
      const { data: audioGens } = await supabase
        .from('audio_generations')
        .select('*')
        .eq('script_id', scriptId)
        .order('created_at', { ascending: false });

      const audioGenerations = (audioGens || []).map(convertAudioRowToGeneration);
      
      return convertScriptRowToScript(data, audioGenerations);
    } catch (error) {
      console.error('Error publishing script in Supabase:', error);
      return null;
    }
  },

  // Get published scripts only (for iOS app consumption)
  getPublishedScripts: async (): Promise<Script[]> => {
    try {
      const { data: scripts, error: scriptsError } = await supabase
        .from('scripts')
        .select('*')
        .eq('status', 'published')
        .order('updated_at', { ascending: false });

      if (scriptsError) throw scriptsError;

      if (!scripts || scripts.length === 0) return [];

      const scriptIds = scripts.map(s => s.id);
      const { data: audioGens, error: audioError } = await supabase
        .from('audio_generations')
        .select('*')
        .in('script_id', scriptIds)
        .order('created_at', { ascending: false });

      if (audioError) throw audioError;

      const audioGensByScript = (audioGens || []).reduce((acc, gen) => {
        if (!acc[gen.script_id]) acc[gen.script_id] = [];
        acc[gen.script_id].push(convertAudioRowToGeneration(gen));
        return acc;
      }, {} as Record<string, AudioGeneration[]>);

      return scripts.map(script => 
        convertScriptRowToScript(script, audioGensByScript[script.id] || [])
      );
    } catch (error) {
      console.error('Error loading published scripts from Supabase:', error);
      return [];
    }
  }
}; 