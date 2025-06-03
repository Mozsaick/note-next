'use client';

import { useState, useEffect } from 'react';
import FolderSidebar from '@/components/FolderSidebar';
import Content from '@/components/Content';
import { Folder, Note } from '@/types';

const NotePage = () => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [selectedNoteId, setSelectedNoteId] = useState('');    

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

    const createNote = async (title: string, content: string) => {
        const response = await fetch('/api/notes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content }),
        });
        if (response.ok) {
            await fetchNotes();
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
    };

    const handleNoteUpdate = (folderId: string) => {
        setSelectedNoteId('');
    };

    // Wrapper function to match the expected signature for Content.onUpdateNote
    const handleContentUpdate = async (noteId: string, title: string, content: string) => {
        await updateNote(noteId, title, content);
        // Optionally, refetch notes here if updateNote doesn't update the local state sufficiently
        // or if you want to ensure the note object in Content gets the latest version immediately
        // For now, we assume updateNote handles state update that propagates to Content via props
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <div className="w-72 flex-shrink-0">
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
                />
            </div>
            <div className="flex-grow">
                <Content 
                note={notes.find(note => note.id === selectedNoteId) || null}
                onUpdateNote={handleContentUpdate}
                />
            </div>
        </div>
    )
}

export default NotePage;
