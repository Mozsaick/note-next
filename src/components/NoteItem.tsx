'use client';

import { useState, useRef, useEffect } from 'react';
import { Note } from '@/types';
import { MoreHorizontal, Edit3, Trash2 } from 'lucide-react';

interface NoteItemProps {
    note: Note;
    selectedNoteId: string;
    onSelectNote: (noteId: string, folderId: string) => void;
    onUpdateNote: (folderId: string, title: string, content: string) => void;
    onDeleteNote: (noteId: string) => void;
}

const NoteItem: React.FC<NoteItemProps> = ({ 
    note,
    selectedNoteId,
    onSelectNote,
    onUpdateNote,
    onDeleteNote
}) => {
    const [isRenaming, setIsRenaming] = useState(false);
    const [newTitle, setNewTitle] = useState(note.title || 'Untitled Note');
    const [showContextMenu, setShowContextMenu] = useState(false);
    const contextMenuRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isRenaming]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
                setShowContextMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleStartRename = (e: React.MouseEvent) => {
        e.stopPropagation();
        setNewTitle(note.title || 'Untitled Note');
        setIsRenaming(true);
        setShowContextMenu(false);
    };

    const submitRename = async () => {
        if (!newTitle.trim() || newTitle === (note.title || 'Untitled Note')) {
            setIsRenaming(false);
            return;
        }
        onUpdateNote(note.id, newTitle, note.content || '');
        setIsRenaming(false);
        setShowContextMenu(false);
        setNewTitle(newTitle);
    };

    const handleRenameKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') submitRename();
        if (e.key === 'Escape') {
            setIsRenaming(false);
            setNewTitle(note.title || 'Untitled Note');
        }
    };

    const handleDelete = async (e: React.MouseEvent) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete note "${note.title || 'Untitled Note'}"?`)) {
            onDeleteNote(note.id);
        }
    };

    const toggleContextMenu = (e: React.MouseEvent) => {
        e.stopPropagation();
        setShowContextMenu(!showContextMenu);
    };

    const handleSelectNote = () => {
        if (!isRenaming) {
            onSelectNote(note.id, note.folder_id);
        }
    };

    return (
        <li className="group relative text-sm">
            <div className={`flex items-center justify-between p-1 rounded hover:bg-gray-600 ${selectedNoteId === note.id ? 'bg-gray-600' : ''}`}>
                {isRenaming ? (
                    <input 
                        ref={inputRef}
                        type="text" 
                        value={newTitle} 
                        onChange={(e) => setNewTitle(e.target.value)}
                        onKeyDown={handleRenameKeyDown} 
                        onBlur={submitRename}
                        className="bg-gray-500 text-white p-0.5 rounded text-sm w-full focus:outline-none focus:ring-1 focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span 
                        onClick={handleSelectNote}
                        className={`text-gray-300 hover:text-white cursor-pointer truncate flex-grow ${
                            selectedNoteId === note.id ? 'text-blue-400 font-semibold' : ''
                        }`}
                        title={note.title || 'Untitled Note'}
                    >
                        {note.title || 'Untitled Note'}
                    </span>
                )}
                {!isRenaming && (
                    <button 
                        onClick={toggleContextMenu}
                        className="p-0.5 rounded opacity-0 group-hover:opacity-100 focus:opacity-100 hover:bg-gray-500 flex-shrink-0"
                        title="Note options">
                        <MoreHorizontal className="w-3 h-3" />
                    </button>
                )}
            </div>
            {showContextMenu && (
                <div ref={contextMenuRef} className="absolute right-0 mt-1 w-32 bg-gray-700 border border-gray-600 rounded shadow-lg z-10">
                    <button onClick={handleStartRename} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-600 flex items-center gap-2"><Edit3 className="w-3 h-3" /> Rename</button>
                    <button onClick={handleDelete} className="w-full text-left px-3 py-1.5 text-sm hover:bg-gray-600 text-red-400 hover:text-red-300 flex items-center gap-2"><Trash2 className="w-3 h-3" /> Delete</button>
                </div>
            )}
        </li>
    );
}

export default NoteItem;
