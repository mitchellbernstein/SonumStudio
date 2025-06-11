'use client';

import React, { useState } from 'react';
import { Plus, Search, FileText, Play, Calendar, Tag, MoreHorizontal, Trash2, Edit, Copy, Moon, Focus, Heart, Link, Mic } from 'lucide-react';
import { Script } from '@/types';

interface StudioTabProps {
  scripts: Script[];
  onSelectScript: (script: Script) => void;
  onCreateScript: (template?: string) => void;
  onDeleteScript: (scriptId: string) => void;
  selectedScript: Script | null;
  onBack: () => void;
  isLoading?: boolean;
}

export default function StudioTab({ 
  scripts, 
  onSelectScript, 
  onCreateScript, 
  onDeleteScript,
  selectedScript,
  onBack 
}: StudioTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'has-audio' | 'published'>('all');

  // If a script is selected, don't render the table (parent will render editor)
  if (selectedScript) {
    return null;
  }

  // Filter scripts based on search and status
  const filteredScripts = scripts.filter(script => {
    const matchesSearch = script.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      script.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'draft' && script.audioGenerations.length === 0) ||
      (filterStatus === 'has-audio' && script.audioGenerations.length > 0) ||
      (filterStatus === 'published'); // TODO: Add published status to Script type

    return matchesSearch && matchesStatus;
  });

  // Get script status
  const getScriptStatus = (script: Script) => {
    if (script.audioGenerations.length === 0) return 'Draft';
    return 'Has Audio'; // TODO: Add published check
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Draft': return 'bg-gray-100 text-gray-700';
      case 'Has Audio': return 'bg-blue-100 text-blue-700';
      case 'Published': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  // Template options
  const templates = [
    {
      id: 'start-scratch',
      title: 'Start from scratch',
      description: 'Create a blank script',
      icon: FileText,
      template: undefined
    },
    {
      id: 'sleep-story',
      title: 'Create a sleep story',
      description: 'Guided narrative for sleep',
      icon: Moon,
      template: 'sleep-story'
    },
    {
      id: 'focus-session',
      title: 'Focus session',
      description: 'Concentration and clarity',
      icon: Focus,
      template: 'focus-session'
    },
    {
      id: 'relaxation',
      title: 'Relaxation guide',
      description: 'Deep relaxation practice',
      icon: Heart,
      template: 'relaxation'
    }
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Studio</h1>
            <p className="text-gray-600">
              Manage your NSDR scripts and audio content
            </p>
          </div>
          <button
            onClick={() => onCreateScript()}
            className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            New Script
          </button>
        </div>

        {/* Template Options */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {templates.map((template) => {
              const IconComponent = template.icon;
              return (
                <button
                  key={template.id}
                  onClick={() => onCreateScript(template.template)}
                  className="p-6 bg-white rounded-xl border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all duration-200 text-left group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                      <IconComponent className="w-4 h-4 text-gray-600" />
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 mb-1">{template.title}</h3>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search scripts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
            >
              <option value="all">All Scripts</option>
              <option value="draft">Drafts</option>
              <option value="has-audio">Has Audio</option>
              <option value="published">Published</option>
            </select>
          </div>
        </div>

        {/* Scripts Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {filteredScripts.length === 0 ? (
            <div className="p-12 text-center">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No scripts found' : 'No scripts yet'}
              </h3>
              <p className="text-gray-600 mb-6">
                {searchQuery 
                  ? 'Try adjusting your search terms or filters'
                  : 'Get started by creating your first NSDR script'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={() => onCreateScript()}
                  className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium mx-auto"
                >
                  <Plus className="w-4 h-4" />
                  Create First Script
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Name</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Category</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Audio</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Modified</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredScripts.map((script) => {
                    const status = getScriptStatus(script);
                    const category = script.tags.length > 0 ? script.tags[0] : 'General';
                    
                    return (
                      <tr 
                        key={script.id}
                        onClick={() => onSelectScript(script)}
                        className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div>
                              <div className="font-medium text-gray-900">{script.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {script.content.substring(0, 60)}
                                {script.content.length > 60 && '...'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 rounded-md text-xs">
                            <Tag className="w-3 h-3" />
                            {category}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getStatusColor(status)}`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <Play className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-700">
                              {script.audioGenerations.length}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            {formatDate(script.updatedAt)}
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // TODO: Add dropdown menu for actions
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredScripts.length > 0 && (
          <div className="mt-6 text-sm text-gray-500 text-center">
            Showing {filteredScripts.length} of {scripts.length} scripts
          </div>
        )}
      </div>
    </div>
  );
} 