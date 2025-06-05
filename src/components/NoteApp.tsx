'use client';

import { useState, useEffect } from 'react';
import FolderSidebar from '@/components/FolderSidebar';
import Content from '@/components/Content';
import { Folder, Note } from '@/types';
import { Menu, X } from 'lucide-react';

const NoteApp = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState('');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [dynamicHeight, setDynamicHeight] = useState('100vh');

    useEffect(() => {
        const updateHeight = () => {
            setDynamicHeight(`${window.innerHeight}px`);
        };

        window.addEventListener('resize', updateHeight);
        updateHeight(); // Initial height calculation

        return () => window.removeEventListener('resize', updateHeight);
    }, []);

    useEffect(() => {
        fetchFolders();
        fetchNotes();
    }, []);

    const fetchFolders = async () => {
        const response = await fetch('/api/folders');
        const data = await response.json();
        setFolders(data);
    };

    const createFolder = async (name: string) => {
        const response = await fetch('/api/folders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (response.ok) {
            await fetchFolders(); 
        } else {
            console.error("Failed to create folder");
        }
    };

    const updateFolder = async (folderId: string, name: string) => {
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name }),
        });
        if (response.ok) {
            await fetchFolders();
        } else {
            console.error("Failed to update folder");
        }
    };
    
    const deleteFolder = async (folderId: string) => {
        const response = await fetch(`/api/folders/${folderId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            await fetchFolders();
        } else {
            console.error("Failed to delete folder");
        }
    };
    
    const fetchNotes = async () => {
        try {
            const response = await fetch('/api/notes');
            if (!response.ok) {
                console.error("Failed to fetch notes:", response.statusText);
                setNotes([]);
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setNotes(data as Note[]);
            } else {
                console.error("Fetched notes data is not an array:", data);
                setNotes([]);
            }
        } catch (error) {
            console.error("Error fetching notes:", error);
            setNotes([]);
        }
    };

    const createNote = async (folderId: string, title: string, content: string) => {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ folder_id: folderId, title, content }),
        });
        if (response.ok) {
            const newNote = await response.json(); // Assuming the API returns the created note
            await fetchNotes(); // Refetch all notes to update the list
            if (newNote && newNote.id) {
                handleNoteSelect(newNote.id); // Select the new note
            }
        } else {
            console.error("Failed to create note");
        }
    };

    const updateNote = async (noteId: string, title: string, content: string) => {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
        });
        if (response.ok) {
            await fetchNotes();
        } else {
            console.error("Failed to update note");
        }
    };
    
    const deleteNote = async (noteId: string) => {
        const response = await fetch(`/api/notes/${noteId}`, {
            method: 'DELETE',
        });
        if (response.ok) {
            await fetchNotes();
        } else {
            console.error("Failed to delete note");
        }
    };

    const handleNoteSelect = (noteId: string) => {
        setSelectedNoteId(noteId);
        if (window.innerWidth < 768) {
            setIsSidebarOpen(false);
        }
    };

    const handleNoteUpdate = (folderId: string, title: string, content: string) => {
        updateNote(folderId, title, content);
    };

    // Wrapper function to match the expected signature for Content.onUpdateNote
    const handleContentUpdate = async (noteId: string, title: string, content: string) => {
        await updateNote(noteId, title, content);
        // Optionally, refetch notes here if updateNote doesn't update the local state sufficiently
        // or if you want to ensure the note object in Content gets the latest version immediately
        // For now, we assume updateNote handles state update that propagates to Content via props
    };

    const handleContentTap = (event: React.MouseEvent<HTMLDivElement>) => {
        if (isSidebarOpen && window.innerWidth < 768) { // 768px is a common breakpoint for 'md'
            setIsSidebarOpen(false);
            event.preventDefault(); 
            event.stopPropagation();
            // Blur the active element if it's an HTMLElement (like an input or textarea)
            if (document.activeElement && typeof (document.activeElement as HTMLElement).blur === 'function') {
                (document.activeElement as HTMLElement).blur();
            }
        }
    };

    return (
        <div 
            className="flex flex-col max-w-screen bg-gray-900 text-white overflow-hidden"
            style={{ height: dynamicHeight }}
        >
            {/* Header */}
            <div className="p-2 bg-gray-900 flex-shrink-0 flex items-center">
                <button
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="p-2 hover:bg-gray-700 rounded text-white"
                    title={isSidebarOpen ? "Hide Sidebar" : "Show Sidebar"}
                >
                    {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
                {/* Optional: App title or other header elements can go here */}
            </div>

            {/* Main Area (Sidebar + Content) */}
            <div className="flex flex-grow overflow-hidden min-h-0"> 
                {/* Sidebar Container */}
                <div 
                    className={`flex-shrink-0 bg-gray-900 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'w-72' : 'w-0 p-0 overflow-hidden'}`}
                >
                    <FolderSidebar 
                        folders={folders}
                        notes={notes}
                        selectedNoteId={selectedNoteId} 
                        onCreateFolder={createFolder}
                        onCreateNote={createNote}
                        onUpdateFolder={updateFolder}
                        onDeleteFolder={deleteFolder}
                        onSelectNote={handleNoteSelect}
                        onUpdateNote={handleNoteUpdate}
                        onDeleteNote={deleteNote}
                        isSidebarOpen={isSidebarOpen}
                    />
                </div>
                
                {/* Main content column */}
                <div
                    className="flex-grow flex flex-col overflow-hidden min-w-full md:min-w-0"
                    onClick={handleContentTap}
                >
                    {/* Note content area */}
                    <div className="flex-grow overflow-auto p-4 pt-1">
                        <Content 
                            note={notes.find(note => note.id === selectedNoteId) || null}
                            onUpdateNote={handleContentUpdate}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default NoteApp;
