import { NextRequest, NextResponse } from 'next/server';
import Replicate from 'replicate';

// Initialize Replicate client
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Model configurations
const MODEL_CONFIGS = {
  'jaaari/kokoro-82m': {
    version: 'f559560eb822dc509045f3921a1921234918b91739db4bf3daab2169b71c7a13',
    params: ['text', 'voice', 'speed', 'temperature']
  },
  'minimax/speech-02-hd': {
    version: null, // Uses latest version
    params: ['text', 'voice', 'speed']
  },
  'lucataco/orpheus-3b-0.1-ft': {
    version: null,
    params: ['text', 'voice', 'emotion_level']
  },
  'x-lance/f5-tts': {
    version: null,
    params: ['text', 'voice']
  }
};

// API route for generating audio using various Replicate TTS models
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { text, speed = 1.0, voice = 'af_nicole', temperature = 0.7, model = 'jaaari/kokoro-82m' } = await request.json();

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Text content is required' },
        { status: 400 }
      );
    }

    // Validate model
    if (!MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS]) {
      return NextResponse.json(
        { success: false, error: 'Unsupported model' },
        { status: 400 }
      );
    }

    // Validate parameters based on model
    if (speed < 0.5 || speed > 2.0) {
      return NextResponse.json(
        { success: false, error: 'Speed must be between 0.5 and 2.0' },
        { status: 400 }
      );
    }

    if (temperature < 0.1 || temperature > 1.0) {
      return NextResponse.json(
        { success: false, error: 'Temperature must be between 0.1 and 1.0' },
        { status: 400 }
      );
    }

    // Check if API token is configured
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { success: false, error: 'Replicate API token not configured' },
        { status: 500 }
      );
    }

    let output;
    const modelConfig = MODEL_CONFIGS[model as keyof typeof MODEL_CONFIGS];

    // Generate audio based on selected model
    switch (model) {
      case 'jaaari/kokoro-82m':
        output = await replicate.run(
          modelConfig.version ? `${model}:${modelConfig.version}` : model,
          {
            input: {
              text: text.trim(),
              speed: speed,
              voice: voice,
              temperature: temperature
            }
          }
        );
        break;

      case 'minimax/speech-02-hd':
        output = await replicate.run(
          model,
          {
            input: {
              text: text.trim(),
              voice: voice,
              speed: speed
            }
          }
        );
        break;

      case 'lucataco/orpheus-3b-0.1-ft':
        output = await replicate.run(
          model,
          {
            input: {
              text: text.trim(),
              voice: voice,
              emotion_level: temperature // Map temperature to emotion level
            }
          }
        );
        break;

      case 'x-lance/f5-tts':
        output = await replicate.run(
          model,
          {
            input: {
              text: text.trim(),
              voice: voice
            }
          }
        );
        break;

      default:
        throw new Error('Unsupported model');
    }

    // Check if generation was successful
    if (!output || typeof output !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Failed to generate audio' },
        { status: 500 }
      );
    }

    // Return the audio URL
    return NextResponse.json({
      success: true,
      audioUrl: output,
    });

  } catch (error) {
    console.error('Audio generation error:', error);
    
    // Handle specific Replicate errors
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 