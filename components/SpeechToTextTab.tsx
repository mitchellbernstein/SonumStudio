'use client';

import React, { useState, useCallback } from 'react';
import { Upload, Mic, Link, Play, Pause, Download, FileText, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';

interface TranscriptionJob {
  id: string;
  filename: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress?: number;
  transcription?: string;
  duration?: number;
  createdAt: Date;
  error?: string;
}

interface SpeechToTextTabProps {
  onCreateScript: (transcription: string, filename: string) => void;
  onBack: () => void;
}

export default function SpeechToTextTab({ onCreateScript, onBack }: SpeechToTextTabProps) {
  const [jobs, setJobs] = useState<TranscriptionJob[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [selectedJob, setSelectedJob] = useState<string | null>(null);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList | File[]) => {
    const fileArray = Array.from(files);
    
    fileArray.forEach((file) => {
      if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
        alert('Please upload audio or video files only.');
        return;
      }

      const jobId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      const newJob: TranscriptionJob = {
        id: jobId,
        filename: file.name,
        status: 'uploading',
        progress: 0,
        createdAt: new Date(),
      };

      setJobs(prev => [newJob, ...prev]);

      // Simulate upload and transcription process
      // In real implementation, this would call Replicate API
      simulateTranscription(jobId, file);
    });
  }, []);

  // Simulate transcription process (replace with actual Replicate API call)
  const simulateTranscription = async (jobId: string, file: File) => {
    try {
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        setJobs(prev => prev.map(job => 
          job.id === jobId ? { ...job, progress: i } : job
        ));
      }

      // Switch to processing
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, status: 'processing', progress: undefined } : job
      ));

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Complete with sample transcription
      const sampleTranscription = `This is a sample transcription of ${file.name}. In a real implementation, this would be the actual transcribed text from your audio file using a speech-to-text model like Whisper via Replicate.

The transcription would capture all spoken words, including natural pauses and speech patterns that are perfect for NSDR content creation.

You can now edit this text and use it to create a new script for your NSDR content library.`;

      setJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'completed',
          transcription: sampleTranscription,
          duration: Math.floor(Math.random() * 600) + 60 // Random duration 1-10 mins
        } : job
      ));
    } catch (error) {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { 
          ...job, 
          status: 'error',
          error: 'Failed to transcribe audio. Please try again.'
        } : job
      ));
    }
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Delete job
  const deleteJob = (jobId: string) => {
    setJobs(prev => prev.filter(job => job.id !== jobId));
    if (selectedJob === jobId) {
      setSelectedJob(null);
    }
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Get status icon
  const getStatusIcon = (status: TranscriptionJob['status']) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const selectedJobData = jobs.find(job => job.id === selectedJob);

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Speech to Text</h1>
          <p className="text-gray-600">
            Transcribe audio and video files with AI-powered speech recognition
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Upload and Jobs */}
          <div className="space-y-6">
            {/* Upload Zone */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Upload Audio</h2>
              
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  dragActive
                    ? 'border-black bg-gray-50'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Drop audio files here
                </h3>
                <p className="text-gray-600 mb-4">
                  or click to browse your files
                </p>
                <input
                  type="file"
                  multiple
                  accept="audio/*,video/*"
                  onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                >
                  <Upload className="w-4 h-4" />
                  Choose Files
                </label>
                <p className="text-xs text-gray-500 mt-4">
                  Supports MP3, WAV, M4A, MP4, and more
                </p>
              </div>

              {/* Quick Options */}
              <div className="grid grid-cols-2 gap-4 mt-4">
                <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Mic className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">Record Audio</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Link className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium">From URL</span>
                </button>
              </div>
            </div>

            {/* Jobs List */}
            <div className="bg-white rounded-xl border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Transcription Jobs</h2>
              </div>
              
              <div className="divide-y divide-gray-100">
                {jobs.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p>No transcriptions yet</p>
                  </div>
                ) : (
                  jobs.map((job) => (
                    <div
                      key={job.id}
                      onClick={() => setSelectedJob(job.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        selectedJob === job.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1">
                          {getStatusIcon(job.status)}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {job.filename}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{formatDate(job.createdAt)}</span>
                              {job.duration && <span>{formatDuration(job.duration)}</span>}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {job.status === 'uploading' && job.progress !== undefined && (
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-500 h-2 rounded-full transition-all"
                                style={{ width: `${job.progress}%` }}
                              />
                            </div>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteJob(job.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      
                      {job.status === 'error' && job.error && (
                        <p className="text-sm text-red-600 mt-2">{job.error}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Transcription Viewer */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Transcription</h2>
            </div>
            
            <div className="p-6">
              {!selectedJobData ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Select a transcription job to view results</p>
                </div>
              ) : selectedJobData.status === 'completed' && selectedJobData.transcription ? (
                <div>
                  <div className="mb-4">
                    <h3 className="font-medium text-gray-900 mb-2">{selectedJobData.filename}</h3>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <span>Duration: {selectedJobData.duration ? formatDuration(selectedJobData.duration) : 'Unknown'}</span>
                      <span>Completed: {formatDate(selectedJobData.createdAt)}</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                    <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                      {selectedJobData.transcription}
                    </p>
                  </div>
                  
                  <div className="flex gap-3">
                    <button
                      onClick={() => onCreateScript(
                        selectedJobData.transcription!,
                        selectedJobData.filename
                      )}
                      className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Create Script
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="mb-4">
                    {selectedJobData.status === 'uploading' && <Clock className="w-12 h-12 text-blue-500 mx-auto animate-spin" />}
                    {selectedJobData.status === 'processing' && <Clock className="w-12 h-12 text-blue-500 mx-auto animate-pulse" />}
                    {selectedJobData.status === 'error' && <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />}
                  </div>
                  <p className="text-gray-600">
                    {selectedJobData.status === 'uploading' && 'Uploading file...'}
                    {selectedJobData.status === 'processing' && 'Transcribing audio...'}
                    {selectedJobData.status === 'error' && selectedJobData.error}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 