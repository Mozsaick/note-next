'use client';

import { useState, useEffect, useRef } from 'react';
import { Note } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ContentProps {
    selectedNoteId: string;
    onNoteSelect: (noteId: string) => void;
}

const SAVE_DEBOUNCE_DELAY = 1500; // 1.5 seconds

type ViewMode = 'edit' | 'preview';

const Content: React.FC<ContentProps> = ({ selectedNoteId, onNoteSelect }) => {
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const [viewMode, setViewMode] = useState<ViewMode>('edit');

    // Refs to store the fetched state to compare against for saving
    const fetchedTitleRef = useRef<string | null>(null);
    const fetchedContentRef = useRef<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        // Clear pending save and reset save status when note changes or unmounts
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
        setSaveStatus('idle');
        setViewMode('edit'); // Default to edit mode when note changes

        const fetchNote = async () => {
            if (selectedNoteId) {
                setIsLoading(true);
                setError(null);
                try {
                    const response = await fetch(`/api/notes/${selectedNoteId}`);
                    if (!response.ok) {
                        const errText = await response.text();
                        setNoteTitle(''); // Clear title on not found
                        setNoteContent('');
                        fetchedTitleRef.current = null;
                        fetchedContentRef.current = null;
                        setError(errText || 'Note not found');
                        throw new Error(errText || 'Note not found');
                    }
                    const data: Note = await response.json();
                    const title = data.title || 'Untitled Note';
                    const content = data.content ?? '';
                    setNoteTitle(title);
                    setNoteContent(content);
                    fetchedTitleRef.current = title;
                    fetchedContentRef.current = content;
                } catch (err: any) {
                    console.error('Error fetching note:', err);
                    setError(err.message || 'Error loading note');
                    setNoteTitle(''); // Clear title on error
                    setNoteContent('');
                    fetchedTitleRef.current = null;
                    fetchedContentRef.current = null;
                } finally {
                    setIsLoading(false);
                }
            } else {
                setNoteTitle('');
                setNoteContent('');
                setError(null);
                fetchedTitleRef.current = null;
                fetchedContentRef.current = null;
                setIsLoading(false);
            }
        };

        fetchNote();

        return () => {
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }
        };
    }, [selectedNoteId]);

    // Debounced save effect
    useEffect(() => {
        if (!selectedNoteId || isLoading) {
            // Don't save if no note is selected or if it's currently loading initial data
            // or if the title/content are the same as fetched
            return;
        }

        const hasTitleChanged = noteTitle !== fetchedTitleRef.current;
        const hasContentChanged = noteContent !== fetchedContentRef.current;

        if (!hasTitleChanged && !hasContentChanged) {
            // If content hasn't actually changed from what was fetched, don't trigger save logic
            // This might happen if fetchNote sets state, triggering this effect, but values are same.
            if (saveStatus !== 'idle') setSaveStatus('idle');
            return;
        }

        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }

        setSaveStatus('idle'); // Reset to idle if user continues typing

        debounceTimeoutRef.current = setTimeout(async () => {
            if (!selectedNoteId) return; // Check again, in case it changed during timeout

            // Double check for changes right before saving
            const currentFetchedTitle = fetchedTitleRef.current;
            const currentFetchedContent = fetchedContentRef.current;
            const titleChangedForSave = noteTitle !== currentFetchedTitle;
            const contentChangedForSave = noteContent !== currentFetchedContent;

            if (!titleChangedForSave && !contentChangedForSave) {
                setSaveStatus('idle');
                return; // No actual changes to save
            }

            setSaveStatus('saving');
            setError(null);

            const payload: { title?: string; content?: string } = {};
            if (titleChangedForSave) payload.title = noteTitle;
            if (contentChangedForSave) payload.content = noteContent;

            try {
                const response = await fetch(`/api/notes/${selectedNoteId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });
                if (!response.ok) {
                    const errText = await response.text();
                    throw new Error(errText || 'Failed to save note');
                }
                const updatedNote: Note = await response.json(); // Get the saved note
                // Update fetched refs to current saved state
                fetchedTitleRef.current = updatedNote.title || 'Untitled Note';
                fetchedContentRef.current = updatedNote.content ?? '';
                // Optionally update state if API returns slightly different values (e.g. trimmed)
                setNoteTitle(updatedNote.title || 'Untitled Note');
                setNoteContent(updatedNote.content ?? '');
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000); // Revert to idle after a bit
            } catch (err: any) {
                console.error('Error saving note:', err);
                setError(err.message);
                setSaveStatus('error');
            }
        }, SAVE_DEBOUNCE_DELAY);

    }, [noteTitle, noteContent, selectedNoteId, isLoading]);

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNoteTitle(e.target.value);
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteContent(e.target.value);
    };

    let statusMessage = '';
    // if (isLoading && selectedNoteId) statusMessage = 'Loading note...'; // Prioritize loading message
    // else if (saveStatus === 'saving') statusMessage = 'Saving...';
    // else if (saveStatus === 'saved') statusMessage = 'Saved!';
    // else if (saveStatus === 'error') statusMessage = `Error: ${error || 'Could not save'}`;
    // else if (error && !isLoading) statusMessage = `Error: ${error}` // Show general fetch error
    if (saveStatus === 'error') statusMessage = `Error: ${error || 'Could not save'}`;
    
    if (!selectedNoteId && !isLoading) { //isLoading check for initial app load case
        return (
            <div className="flex items-center justify-center h-full p-4 bg-gray-850 text-white">
                <p className="text-gray-500 text-lg">Select a note to view or edit.</p>
            </div>
        );
    }
    
    if (isLoading && selectedNoteId) {
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
                disabled={isLoading || saveStatus === 'saving'}
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
                <div className="text-xs text-gray-500 h-4 pl-2">
                    {statusMessage}
                </div>
            </div>

            {viewMode === 'edit' ? (
                <textarea
                    value={noteContent}
                    onChange={handleContentChange}
                    placeholder="Start typing your note here... (Markdown supported)"
                    className="w-full flex-grow p-3 bg-gray-800 border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 text-base leading-relaxed font-mono"
                    disabled={isLoading || saveStatus === 'saving'}
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