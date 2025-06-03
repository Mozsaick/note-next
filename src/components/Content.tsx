'use client';

import { useState, useEffect, useRef } from 'react';
import { Note } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentProps {
    note: Note | null;
    onUpdateNote: (noteId: string, title: string, content: string) => void;
}

const SAVE_DEBOUNCE_DELAY = 1500; // 1.5 seconds

type ViewMode = 'edit' | 'preview';

const Content: React.FC<ContentProps> = ({ note, onUpdateNote }) => {
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('edit');
    const [error, setError] = useState<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (note) {
            setNoteTitle(note.title || 'Untitled Note');
            setNoteContent(note.content ?? '');
            setIsLoading(false);
            setError(null);
        } else {
            setNoteTitle('');
            setNoteContent('');
            setIsLoading(true);
            setError(null);
        }
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
    }, [note]);

    useEffect(() => {
        if (!note || isLoading) {
            return;
        }

        const hasTitleChanged = noteTitle !== (note.title || 'Untitled Note');
        const hasContentChanged = noteContent !== (note.content ?? '');

        if (!hasTitleChanged && !hasContentChanged) {
            return;
        }
        
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        debounceTimeoutRef.current = setTimeout(async () => {
            if (!note || !note.id) {
                return;
            }
            try {
                await onUpdateNote(note.id, noteTitle, noteContent);
            } catch (err: any) {
                console.error('Error updating note:', err);
                setError(err.message || 'Failed to update note');
            }
        }, SAVE_DEBOUNCE_DELAY);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [noteTitle, noteContent, note, isLoading, onUpdateNote]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNoteTitle(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteContent(e.target.value);
    };

    if (!note) {
        return (
            <div className="flex items-center justify-center h-full p-4 bg-gray-850 text-white">
                <p className="text-gray-500 text-lg">Select a note to view or edit.</p>
            </div>
        );
    }
    
    if (isLoading && !noteTitle && !noteContent) {
         return (
            <div className="flex flex-col items-center justify-center h-full p-4 bg-gray-850 text-white">
                <LoadingSpinner size={32} />
                <p className="text-gray-500 text-lg mt-4">Loading note...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 bg-gray-850 text-white">
            <input 
                type="text"
                value={noteTitle}
                onChange={handleTitleChange}
                placeholder="Note Title"
                className="text-xl font-bold mb-1 p-2 bg-transparent border-b border-gray-700 focus:outline-none focus:border-blue-500 flex-shrink-0"
            />
            <div className="my-2 flex items-center justify-between flex-shrink-0">
                <div>
                    <button 
                        onClick={() => setViewMode('edit')} 
                        className={`px-3 py-1 text-sm rounded-l-md focus:outline-none ${
                            viewMode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        Edit
                    </button>
                    <button 
                        onClick={() => setViewMode('preview')} 
                        className={`px-3 py-1 text-sm rounded-r-md focus:outline-none ${
                            viewMode === 'preview' ? 'bg-blue-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                    >
                        Preview
                    </button>
                </div>
            </div>

            {viewMode === 'edit' ? (
                <textarea
                    value={noteContent}
                    onChange={handleContentChange}
                    placeholder="Start typing your note here... (Markdown supported)"
                    className="w-full flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-base leading-relaxed font-mono"
                />
            ) : (
                <div className="w-full flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md overflow-y-auto prose prose-sm prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {noteContent} 
                    </ReactMarkdown>
                </div>
            )}
        </div>
    )
};

export default Content;