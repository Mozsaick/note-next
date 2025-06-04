'use client';

import { useState, useEffect, useRef } from 'react';
import { Folder, Note } from '@/types';
import { ChevronRight, ChevronDown, MoreHorizontal, Edit3, Trash2, Plus } from 'lucide-react';
import NoteItem from './NoteItem'; // Import NoteItem
import LoadingSpinner from './LoadingSpinner'; // Import spinner

interface FolderItemProps {
    folder: Folder;
    notes: Note[];
    selectedNoteId: string;
    onUpdateFolder: (folderId: string, name: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onSelectNote: (noteId: string, folderId: string) => void;
    onCreateNote: (folderId: string, title: string, content: string) => void;
    onUpdateNote: (noteId: string, title: string, content: string) => void;
    onDeleteNote: (noteId: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ 
    folder, 
    notes,
    selectedNoteId,
    onUpdateFolder,
    onDeleteFolder,
    onSelectNote,
    onCreateNote,
    onUpdateNote,
    onDeleteNote
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isLoadingNotes] = useState(false);
    // Folder renaming
    const [isRenamingFolder, setIsRenamingFolder] = useState(false);
    const [newFolderName, setNewFolderName] = useState(folder.name);
    const [showFolderContextMenu, setShowFolderContextMenu] = useState(false);
    const folderContextMenuRef = useRef<HTMLDivElement>(null);
    const folderNameInputRef = useRef<HTMLInputElement>(null);

    // New note creation states
    const [isCreatingNote, setIsCreatingNote] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const newNoteTitleInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenamingFolder && folderNameInputRef.current) {
            folderNameInputRef.current.focus();
            folderNameInputRef.current.select();
        }
    }, [isRenamingFolder]);

    useEffect(() => {
        if (isCreatingNote && newNoteTitleInputRef.current) {
            newNoteTitleInputRef.current.focus();
        }
    }, [isCreatingNote]);

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
        if (!isRenamingFolder && !isCreatingNote) {
            setIsOpen(!isOpen);
        }
    };

    // Folder Actions
    const handleStartRenameFolder = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewFolderName(folder.name); // Reset to current name before editing
        setIsRenamingFolder(true);
        setShowFolderContextMenu(false);
    };

    const handleRenameFolder = async () => {
        if (!newFolderName.trim() || newFolderName === folder.name) {
            setIsRenamingFolder(false);
            return;
        }
        onUpdateFolder(folder.id, newFolderName.trim());
        setIsRenamingFolder(false);
        setNewFolderName(newFolderName.trim());
    };

    const handleDeleteFolder = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete folder "${folder.name}"? This will also delete all notes inside.`)) {
            onDeleteFolder(folder.id);
        }
        setShowFolderContextMenu(false);
    };

    const handleFolderRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleRenameFolder();
        if (e.key === 'Escape') {
            setIsRenamingFolder(false);
            setNewFolderName(folder.name);
        }
    };

    // New Note Creation Handlers
    const handleStartCreateNewNote = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsOpen(true);
        setIsCreatingNote(true);
        setNewNoteTitle('');
    };

    const handleCreateNewNote = async () => {
        if (!newNoteTitle.trim()) {
            setIsCreatingNote(false);
            return;
        }
        try {
            await onCreateNote(folder.id, newNoteTitle.trim(), '');
            setNewNoteTitle('');
            setIsCreatingNote(false);
        } catch (error) {
            console.error("Failed to create note:", error);
        }
    };

    const handleNewNoteTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') handleCreateNewNote();
        if (e.key === 'Escape') {
            setIsCreatingNote(false);
            setNewNoteTitle('');
        }
    };

    return (
        <li className="space-y-0.5 relative">
            {/* Folder Header */}
            <div className="flex items-center gap-1 p-2 rounded hover:bg-gray-700 group">
                <button 
                    onClick={handleFolderClick}
                    className={`flex items-center gap-2 flex-grow min-w-0`}
                    disabled={isCreatingNote}
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
                    {isLoadingNotes && !isOpen ? (
                        <LoadingSpinner size={16} color="#9CA3AF" />
                    ) : !isRenamingFolder && notes.length > 0 && !isCreatingNote ? (
                        <span className="text-xs text-gray-400 pr-1">{notes.length}</span>
                    ) : null}
                    {!isRenamingFolder && !isCreatingNote &&
                        <button onClick={handleStartCreateNewNote}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-600"
                            title="New Note in this folder">
                            <Plus className="w-4 h-4" />
                        </button>
                    }
                    {!isRenamingFolder && !isCreatingNote &&
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

            {/* New Note Input - Placed inside the folder item, visible when isOpen and isCreatingNote */}
            {isOpen && isCreatingNote && (
                <div className="ml-3 pl-1 pr-2 py-1 flex items-center gap-1">
                    <Plus className="w-4 h-4 text-gray-500 flex-shrink-0 ml-1.5" />
                    <input 
                        ref={newNoteTitleInputRef}
                        type="text" 
                        value={newNoteTitle}
                        onChange={(e) => setNewNoteTitle(e.target.value)}
                        onKeyDown={handleNewNoteTitleKeyDown}
                        placeholder="New note title..."
                        className="bg-gray-600 text-white p-1 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm"
                    />
                </div>
            )}

            {/* Notes List */}
            {isOpen && !isRenamingFolder && (
                <ul className="ml-3 pl-3 border-l border-gray-600 space-y-0.5">
                    {notes.map((note) => (
                        <NoteItem
                            key={note.id}
                            note={note}
                            selectedNoteId={selectedNoteId}
                            onSelectNote={onSelectNote}
                            onUpdateNote={onUpdateNote}
                            onDeleteNote={onDeleteNote}
                        />
                    ))}
                    {!isLoadingNotes && notes.length === 0 && !isCreatingNote && (
                         <li className="px-2 py-1 text-xs text-gray-500 italic">No notes in this folder.</li>
                    )}
                    {isLoadingNotes && <li className="px-2 py-1"><LoadingSpinner size={16}/></li>}
                </ul>
            )}
        </li>
    );
}

export default FolderItem;