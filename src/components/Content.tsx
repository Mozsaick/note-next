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

const SAVE_DEBOUNCE_DELAY = 1000; // 1 second


const Content: React.FC<ContentProps> = ({ note, onUpdateNote }) => {
    const [noteId, setNoteId] = useState('');
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const previousNoteId = noteId;
        const previousNoteTitle = noteTitle;
        const previousNoteContent = noteContent;
        
        if (!note) {
            setNoteId('');
            setNoteTitle('');
            setNoteContent('');
            setIsLoading(true);
            return;
        }

        // First time loading
        if (!previousNoteId) {
            setNoteId(note.id);
            setNoteTitle(note.title || 'Untitled Note');
            setNoteContent(note.content ?? '');
            setIsLoading(false);
            return;
        }

        // Different note selected
        if (previousNoteId !== note.id) {
            setNoteId(note.id);
            setNoteTitle(note.title || 'Untitled Note');
            setNoteContent(note.content ?? '');
            setIsLoading(false);
        
            onUpdateNote(previousNoteId, previousNoteTitle, previousNoteContent);
        }
    }, [note]); 

    useEffect(() => {
        if (!note) return;
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
            }
        }, SAVE_DEBOUNCE_DELAY);

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [noteTitle, noteContent, isLoading]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNoteTitle(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteContent(e.target.value);
    };

    if (!note) {
        return (
            <div className="flex items-center justify-center h-full p-4 pt-0 bg-gray-850 text-white">
                <p className="text-gray-500 text-lg">Select a note to view or edit.</p>
            </div>
        );
    }
    
    if (isLoading && !noteTitle && !noteContent) {
         return (
            <div className="flex flex-col items-center justify-center h-full p-4 pt-0 bg-gray-850 text-white">
                <LoadingSpinner size={32} />
                <p className="text-gray-500 text-lg mt-4">Loading note...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full p-4 pt-0 bg-gray-850 text-white">
            <input 
                type="text"
                value={noteTitle}
                onChange={handleTitleChange}
                placeholder="Note Title"
                className="text-xl font-bold mb-1 p-2 bg-transparent border-b border-gray-700 focus:outline-none flex-shrink-0"
            />
            {/* View mode toggle buttons removed */}
            
            <div className="flex flex-row flex-grow mt-2 space-x-2 h-[calc(100%-theme(space.12))] overflow-hidden"> {/* Parent for split view, ensures it uses remaining height */}
                {/* Left Pane: Editor */}
                <div className="w-1/2 h-full flex flex-col">
                    <textarea
                        value={noteContent}
                        onChange={handleContentChange}
                        placeholder="Start typing your note here... (Markdown supported)"
                        className="w-full h-full p-3 bg-gray-800 border border-gray-700 rounded-md resize-none focus:outline-none text-base leading-relaxed font-mono scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500"
                    />
                </div>
                {/* Right Pane: Preview */}
                <div className="w-1/2 h-full overflow-y-auto overflow-x-hidden p-3 bg-gray-800 border border-gray-700 rounded-md prose prose-sm prose-invert max-w-none scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800 hover:scrollbar-thumb-gray-500">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {noteContent} 
                    </ReactMarkdown>
                </div>
            </div>
        </div>
    )
};

export default Content;