'use client';

import React, { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TRANSFORMERS } from '@lexical/markdown';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  $getRoot,
  $getSelection,
  $isRangeSelection,
  EditorState,
  $createParagraphNode,
  $createTextNode,
} from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeNode } from '@lexical/code';
import { LinkNode, AutoLinkNode } from '@lexical/link';

interface LexicalEditorProps {
  data: string | null;
  onChange: (content: string) => void;
  placeholder?: string;
}



// Plugin to handle content changes
function OnChangeHandler({ onChange }: { onChange: (content: string) => void }) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const content = root.getTextContent();
        onChange(content);
      });
    });
  }, [editor, onChange]);

  return null;
}

// Plugin to set initial content
function InitialContentPlugin({ content }: { content: string | null }) {
  const [editor] = useLexicalComposerContext();
  const [hasInitialized, setHasInitialized] = React.useState(false);

  useEffect(() => {
    if (content && !hasInitialized) {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        
        if (content.trim()) {
          // Split content by lines and create paragraphs
          const lines = content.split('\n');
          lines.forEach((line) => {
            const paragraphNode = $createParagraphNode();
            const textNode = $createTextNode(line || ''); // Handle empty lines
            paragraphNode.append(textNode);
            root.append(paragraphNode);
          });
        } else {
          // Create empty paragraph for empty content
          const paragraphNode = $createParagraphNode();
          root.append(paragraphNode);
        }
      });
      setHasInitialized(true);
    }
  }, [editor, content, hasInitialized]);

  return null;
}

// Plugin to insert breaks and sound effects, and handle undo/redo
function BreakInsertPlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const insertBreak = (type: 'time' | 'sound', value: string = '1s') => {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const breakText = type === 'time' ? `[BREAK:${value}]` : `[SOUND: ${value}]`;
          const textNode = $createTextNode(breakText);
          const paragraphNode = $createParagraphNode();
          paragraphNode.append(textNode);
          
          selection.insertNodes([paragraphNode]);
        }
      });
    };

    const setContent = (content: string) => {
      editor.update(() => {
        const root = $getRoot();
        root.clear();
        const paragraphNode = $createParagraphNode();
        const textNode = $createTextNode(content);
        paragraphNode.append(textNode);
        root.append(paragraphNode);
      });
    };

    // Expose methods to parent component
    (editor.getRootElement() as any)?.setAttribute('data-insert-break', 'true');
    (window as any).lexicalInsertBreak = insertBreak;
    (window as any).lexicalSetContent = setContent;

    return () => {
      delete (window as any).lexicalInsertBreak;
      delete (window as any).lexicalSetContent;
    };
  }, [editor]);

  return null;
}

const LexicalEditor: React.FC<LexicalEditorProps> = ({
  data,
  onChange,
  placeholder = 'Start writing your script here...'
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="lexical-editor-container min-h-full p-4">
        <div className="text-gray-500">Loading editor...</div>
      </div>
    );
  }

  const initialConfig = {
    namespace: 'SonumStudioEditor',
    theme: {
      root: 'lexical-editor',
      paragraph: 'lexical-paragraph',
      heading: {
        h1: 'lexical-heading-h1',
        h2: 'lexical-heading-h2',
        h3: 'lexical-heading-h3',
      },
      list: {
        nested: {
          listitem: 'lexical-nested-listitem',
        },
        ol: 'lexical-list-ol',
        ul: 'lexical-list-ul',
        listitem: 'lexical-listitem',
      },
      quote: 'lexical-quote',
      text: {
        bold: 'lexical-text-bold',
        italic: 'lexical-text-italic',
        underline: 'lexical-text-underline',
      },
      code: 'lexical-code',
      link: 'lexical-link',
    },
    onError: (error: Error) => {
      console.error('Lexical Error:', error);
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      LinkNode,
      AutoLinkNode,
    ],
    // Don't set editorState here - we handle it via InitialContentPlugin
  };

  return (
    <div className="lexical-editor-container h-full overflow-hidden">
      <LexicalComposer initialConfig={initialConfig}>
        <div className="lexical-editor-wrapper h-full overflow-y-auto">
          <RichTextPlugin
            contentEditable={
              <ContentEditable 
                className="lexical-content-editable min-h-full p-4 focus:outline-none"
                style={{ minHeight: '100%' }}
              />
            }
            placeholder={
              <div className="lexical-placeholder absolute top-6 left-0 text-gray-400 pointer-events-none">
                {placeholder}
              </div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <OnChangeHandler onChange={onChange} />
          <InitialContentPlugin content={data} />
          <HistoryPlugin />
          <ListPlugin />
          <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
          <BreakInsertPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
};

export default LexicalEditor; 