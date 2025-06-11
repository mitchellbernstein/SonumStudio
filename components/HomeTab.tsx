'use client';

import React from 'react';
import { Play, FileText, Mic, Moon, Focus, Heart, Zap, TrendingUp, Clock, Users } from 'lucide-react';

interface HomeTabProps {
  onCreateScript: (template?: string) => void;
  onOpenSpeechToText: () => void;
  stats?: {
    totalScripts: number;
    totalAudio: number;
    publishedTracks: number;
    totalListens: number;
  };
}

export default function HomeTab({ onCreateScript, onOpenSpeechToText, stats }: HomeTabProps) {
  const quickStartCards = [
    {
      id: 'sleep-story',
      title: 'Create Sleep Story',
      description: 'Craft a calming narrative to help users drift off to sleep',
      icon: Moon,
      color: 'bg-indigo-500',
      template: 'sleep-story'
    },
    {
      id: 'meditation',
      title: 'Record Meditation',
      description: 'Transcribe existing guided meditation recordings',
      icon: Mic,
      color: 'bg-green-500',
      onClick: onOpenSpeechToText
    },
    {
      id: 'focus-session',
      title: 'Focus Session',
      description: 'Build concentration and attention training content',
      icon: Focus,
      color: 'bg-blue-500',
      template: 'focus-session'
    },
    {
      id: 'relaxation',
      title: 'Relaxation Script',
      description: 'Design progressive relaxation and body scan sessions',
      icon: Heart,
      color: 'bg-pink-500',
      template: 'relaxation'
    }
  ];

  const contentStats = [
    {
      label: 'Scripts Created',
      value: stats?.totalScripts || 0,
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      label: 'Audio Generated',
      value: stats?.totalAudio || 0,
      icon: Play,
      color: 'text-green-600'
    },
    {
      label: 'Published Tracks',
      value: stats?.publishedTracks || 0,
      icon: TrendingUp,
      color: 'text-purple-600'
    },
    {
      label: 'Total Listens',
      value: stats?.totalListens || 0,
      icon: Users,
      color: 'text-orange-600'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Good afternoon, Creator
          </h1>
          <p className="text-gray-600">
            Ready to create some calming NSDR content? Choose how you'd like to get started.
          </p>
        </div>

        {/* Quick Start Cards */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {quickStartCards.map((card) => {
              const Icon = card.icon;
              return (
                <button
                  key={card.id}
                  onClick={() => card.onClick ? card.onClick() : onCreateScript(card.template)}
                  className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className={`w-12 h-12 ${card.color} rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-600">{card.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Stats Overview */}
        <div className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Content Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {contentStats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                      <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${stat.color}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Popular Content (Placeholder) */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Most Popular Tracks</h2>
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200 text-center">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Coming Soon</h3>
            <p className="text-gray-600">
              Once you publish content, you'll see your most listened tracks here
            </p>
          </div>
        </div>

        {/* NSDR Content Tips */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
          <div className="flex items-start gap-4">
            <div className="bg-blue-500 rounded-lg p-2 flex-shrink-0">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">NSDR Content Tips</h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Keep sleep stories under 20 minutes for optimal effectiveness</li>
                <li>• Use gentle, consistent pacing with strategic pauses</li>
                <li>• Focus sessions work best with 10-15 minute durations</li>
                <li>• Body scan meditations benefit from slower speech (0.8-0.9x speed)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 