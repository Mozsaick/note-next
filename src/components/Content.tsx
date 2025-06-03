'use client';

import { useState, useEffect, useRef } from 'react';
import { Note } from '@/types';

interface ContentProps {
    selectedNoteId: string;
    onNoteSelect: (noteId: string) => void;
}

const SAVE_DEBOUNCE_DELAY = 1500; // 1.5 seconds

const Content: React.FC<ContentProps> = ({ selectedNoteId, onNoteSelect }) => {
    const [noteTitle, setNoteTitle] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    // Refs to store the fetched state to compare against for saving
    const fetchedTitleRef = useRef<string | null>(null);
    const fetchedContentRef = useRef<string | null>(null);

    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        const fetchNote = async () => {
            if (selectedNoteId) {
                setIsLoading(true);
                setError(null);
                setSaveStatus('idle');
                try {
                    const response = await fetch(`/api/notes/${selectedNoteId}`);
                    if (!response.ok) {
                        const errText = await response.text();
                        setNoteTitle('Note not found');
                        setNoteContent('');
                        fetchedTitleRef.current = null;
                        fetchedContentRef.current = null;
                        throw new Error(errText || 'Failed to fetch note');
                    }
                    const data: Note = await response.json();
                    setNoteTitle(data.title || 'Untitled Note');
                    setNoteContent(data.content ?? '');
                    fetchedTitleRef.current = data.title || 'Untitled Note';
                    fetchedContentRef.current = data.content ?? '';
                } catch (err: any) {
                    console.error('Error fetching note:', err);
                    setError(err.message);
                    setNoteTitle('Error loading note');
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
                setSaveStatus('idle');
                fetchedTitleRef.current = null;
                fetchedContentRef.current = null;
                setIsLoading(false);
            }
        };
        fetchNote();
        // Clear any pending save when note changes
        if (debounceTimeoutRef.current) {
            clearTimeout(debounceTimeoutRef.current);
        }
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
                // Update fetched refs to current saved state
                fetchedTitleRef.current = noteTitle;
                fetchedContentRef.current = noteContent;
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000); // Revert to idle after a bit
            } catch (err: any) {
                console.error('Error saving note:', err);
                setError(err.message);
                setSaveStatus('error');
            }
        }, SAVE_DEBOUNCE_DELAY);

    }, [noteTitle, noteContent, selectedNoteId, isLoading]); // Add isLoading here

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNoteTitle(e.target.value);
        // setSaveStatus('idle'); // Handled by useEffect now
    };

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNoteContent(e.target.value);
        // setSaveStatus('idle'); // Handled by useEffect now
    };

    let statusMessage = '';
    if (saveStatus === 'saving') statusMessage = 'Saving...';
    else if (saveStatus === 'saved') statusMessage = 'Saved!';
    else if (saveStatus === 'error') statusMessage = `Error: ${error || 'Could not save'}`;

    return (
        <div className="flex flex-col h-full p-4 bg-gray-850 text-white">
            {selectedNoteId ? (
                <>
                    <input 
                        type="text"
                        value={noteTitle}
                        onChange={handleTitleChange}
                        placeholder="Note Title"
                        className="text-xl font-bold mb-1 p-2 bg-transparent border-b border-gray-700 focus:outline-none focus:border-blue-500 flex-shrink-0"
                        disabled={isLoading}
                    />
                    <div className="text-xs text-gray-500 mb-2 h-4 pl-2">
                        {statusMessage}
                    </div>
                    <textarea
                        value={noteContent}
                        onChange={handleContentChange}
                        placeholder="Start typing your note here..."
                        className="w-full flex-grow p-2 bg-gray-800 border border-gray-700 rounded-md resize-none focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={isLoading}
                    />
                </>
            ) : (
                <div className="flex items-center justify-center h-full">
                    <p className="text-gray-500 text-lg">
                        {isLoading ? 'Loading note...' : 'Select a note to view or edit.'}
                    </p>
                </div>
            )}
        </div>
    )
};

export default Content;
