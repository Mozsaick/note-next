'use client';

import { useState, useEffect, useRef } from 'react';
import { Folder, Note } from '@/types';
import { ChevronRight, ChevronDown, MoreHorizontal, Edit3, Trash2, Plus } from 'lucide-react';
import NoteItem from './NoteItem'; // Import NoteItem

interface FolderItemProps {
    folder: Folder;
    selectedNoteId: string;
    onNoteSelect: (noteId: string, folderId: string) => void;
    onFolderUpdate: () => void;
    onNoteUpdateInFolder: (folderId: string) => void; // Renamed for clarity, FolderItem handles its notes directly
}

const FolderItem: React.FC<FolderItemProps> = ({ 
    folder, 
    selectedNoteId,
    onNoteSelect,
    onFolderUpdate,
    onNoteUpdateInFolder
}) => {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    // Folder renaming
    const [isRenamingFolder, setIsRenamingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState(folder.name);
    const [showFolderContextMenu, setShowFolderContextMenu] = useState(false);
    const folderContextMenuRef = useRef<HTMLDivElement>(null);
    const folderNameInputRef = useRef<HTMLInputElement>(null);

    const fetchNotes = async () => {
        try {
            const response = await fetch(`/api/notes?folder_id=${folder.id}`);
            if (!response.ok) throw new Error('Failed to fetch notes for folder');
            const data: Note[] = await response.json();
            setNotes(data);
        } catch (err: any) {
            console.error(`Error fetching notes for folder ${folder.id}:`, err);
            setNotes([]);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchNotes();
        }
    }, [folder.id, isOpen]);

    useEffect(() => {
        if (isRenamingFolder && folderNameInputRef.current) {
            folderNameInputRef.current.focus();
            folderNameInputRef.current.select();
        }
    }, [isRenamingFolder]);

    // Click outside handler for folder context menu
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (folderContextMenuRef.current && !folderContextMenuRef.current.contains(event.target as Node)) {
                setShowFolderContextMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); 

    const handleFolderClick = () => {
        if (!isRenamingFolder) {
            setIsOpen(!isOpen);
        }
    };

    const handleCreateNewNote = async () => {
        try {
            const response = await fetch('/api/notes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Untitled Note', content: '', folder_id: folder.id }),
            });
            if (!response.ok) throw new Error(await response.text() || 'Failed to create note');
            const newNote: Note = await response.json();
            await fetchNotes(); // Refresh this folder's notes
            if (!isOpen) setIsOpen(true); // Ensure folder is open
            onNoteSelect(newNote.id, folder.id); // Select the new note
        } catch (error) {
            console.error('Error creating new note:', error);
        }
    };

    // Folder Actions
    const handleStartRenameFolder = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsRenamingFolder(true);
        setShowFolderContextMenu(false);
    };

    const handleRenameFolder = async () => {
        if (!newFolderName.trim() || newFolderName === folder.name) {
            setIsRenamingFolder(false);
            setNewFolderName(folder.name);
            return;
        }
        try {
            const response = await fetch(`/api/folders/${folder.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newFolderName }),
            });
            if (!response.ok) throw new Error('Failed to rename folder');
            setIsRenamingFolder(false);
            onFolderUpdate(); // Notify sidebar to refresh all folders
        } catch (error) {
            console.error('Error renaming folder:', error);
            setNewFolderName(folder.name); 
            setIsRenamingFolder(false);
        }
    };

    const handleDeleteFolder = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? This will also delete all notes inside.`)) {
            try {
                const response = await fetch(`/api/folders/${folder.id}`, { method: 'DELETE' });
                if (!response.ok) throw new Error('Failed to delete folder');
                setShowFolderContextMenu(false);
                onFolderUpdate(); // Notify sidebar to refresh all folders
            } catch (error) {
                console.error('Error deleting folder:', error);
            }
        }
    };

    const handleFolderRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameFolder();
        if (e.key === 'Escape') {
            setIsRenamingFolder(false);
            setNewFolderName(folder.name);
        }
    };
    
    // Callback for NoteItem when a note is deleted or renamed
    const handleNoteListUpdate = () => {
        fetchNotes(); // Re-fetch notes for this specific folder
        // If a deleted note was the selected one, the parent (page.tsx) should handle clearing selection
        // via the onNoteUpdateInFolder prop if it leads to selectedNoteId becoming invalid.
        // For now, FolderItem just ensures its own list is up-to-date.
        onNoteUpdateInFolder(folder.id);
    };

    return (
        <li className="space-y-0.5 relative">
            {/* Folder Header */}
            <div className="flex items-center gap-1 p-2 rounded hover:bg-gray-700 group">
                <button 
                    onClick={handleFolderClick}
                    className={`flex items-center gap-2 flex-grow min-w-0`}
                >
                    {isOpen ? <ChevronDown className="w-4 h-4 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 flex-shrink-0" />}
                    {isRenamingFolder ? (
                        <input 
                            ref={folderNameInputRef}
                            type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                            onKeyDown={handleFolderRenameKeyDown} onBlur={handleRenameFolder}
                            className="bg-gray-600 text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <span className="truncate text-sm" title={folder.name}>{folder.name}</span>
                    )}
                </button>
                <div className="flex items-center ml-auto flex-shrink-0">
                    {!isRenamingFolder && notes.length > 0 && <span className="text-xs text-gray-400 pr-1">{notes.length}</span>}
                    {!isRenamingFolder && 
                        <button onClick={(e) => { e.stopPropagation(); handleCreateNewNote(); }}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-600"
                            title="New Note in this folder">
                            <Plus className="w-4 h-4" />
                        </button>
                    }
                    {!isRenamingFolder &&
                        <button onClick={(e) => { e.stopPropagation(); setShowFolderContextMenu(!showFolderContextMenu); }}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-600"
                            title="Folder options">
                            <MoreHorizontal className="w-4 h-4" />
                        </button>
                    }
                </div>
            </div>

            {/* Folder Context Menu */}
            {showFolderContextMenu && (
                <div ref={folderContextMenuRef} className="absolute right-0 mt-1 w-40 bg-gray-700 border border-gray-600 rounded shadow-lg z-20">
                    <button onClick={handleStartRenameFolder} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-600 flex items-center gap-2"><Edit3 className="w-4 h-4" /> Rename Folder</button>
                    <button onClick={handleDeleteFolder} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-600 text-red-400 hover:text-red-300 flex items-center gap-2"><Trash2 className="w-4 h-4" /> Delete Folder</button>
                </div>
            )}

            {/* Notes List */}
            {isOpen && !isRenamingFolder && (
                <ul className="ml-3 pl-3 border-l border-gray-600 space-y-0.5">
                    {notes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            isSelected={selectedNoteId === note.id}
                            folderId={folder.id}
                            onSelect={onNoteSelect}
                            onNoteDeleted={handleNoteListUpdate} // For re-fetching notes in this folder
                            onNoteRenamed={handleNoteListUpdate} // For re-fetching notes in this folder
                        />
                    ))}
                    {notes.length === 0 && (
                         <li className="px-2 py-1 text-xs text-gray-500 italic">No notes in this folder.</li>
                    )}
                </ul>
            )}
        </li>
    );
}

export default FolderItem;