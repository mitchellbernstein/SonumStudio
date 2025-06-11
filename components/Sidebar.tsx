'use client';

import React from 'react';
import { Home, FileText, Mic } from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'studio' | 'speech-to-text';
  onTabChange: (tab: 'home' | 'studio' | 'speech-to-text') => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const navItems = [
    {
      id: 'home' as const,
      label: 'Home',
      icon: Home,
    },
    {
      id: 'studio' as const,
      label: 'Studio',
      icon: FileText,
    },
    {
      id: 'speech-to-text' as const,
      label: 'Speech to Text',
      icon: Mic,
    },
  ];

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Logo/Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-semibold text-gray-900">Sonum Studio</h1>
        <p className="text-sm text-gray-500 mt-1">NSDR Content Creation</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                  isActive
                    ? 'bg-black text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>v1.0.0</p>
        </div>
      </div>
    </div>
  );
} 