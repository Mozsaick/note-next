'use client';

import { useState, useEffect } from 'react';
import { Folder, Note } from '@/types';
import { Plus } from 'lucide-react';
import FolderItem from './FolderItem';

interface FolderSidebarProps {
    folders: Folder[];
    notes: Note[];
    selectedNoteId: string;
    onCreateFolder: (name: string) => void;
    onCreateNote: (title: string, content: string) => void;
    onUpdateFolder: (folderId: string, name: string) => void;
    onDeleteFolder: (folderId: string) => void;
    onSelectNote: (noteId: string, folderId: string) => void;
    onUpdateNote: (folderId: string, title: string, content: string) => void;
    onDeleteNote: (noteId: string) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({ 
    folders,
    notes,
    selectedNoteId,
    onCreateFolder,
    onCreateNote,
    onUpdateFolder,
    onDeleteFolder,
    onSelectNote,
    onUpdateNote,
    onDeleteNote
}) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (newFolderName.trim()) {
                onCreateFolder(newFolderName.trim());
                setNewFolderName('');
                setIsCreating(false);
            }
        } else if (e.key === 'Escape') {
            setIsCreating(false);
            setNewFolderName('');
        }
    };

    return (
        <div className="w-64 p-4 bg-gray-800 text-white rounded-lg shadow-lg h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Folders</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="p-1 hover:bg-gray-700 rounded"
                    title="New Folder"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>
            {isCreating && (
                <div className="mb-4">
                    <input
                        type="text"
                        value={newFolderName}
                        onChange={(e) => setNewFolderName(e.target.value)}
                        onKeyDown={handleKeyPress}
                        placeholder="Folder name"
                        className="w-full p-2 bg-gray-700 rounded text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                    />
                </div>
            )}
            <ul className="space-y-1">
                {folders.map((folder) => (
                    <FolderItem
                        key={folder.id}
                        folder={folder}
                        selectedNoteId={selectedNoteId}
                        notes={notes.filter((note) => note.folder_id === folder.id)}
                        onSelectNote={onSelectNote}
                        onUpdateFolder={onUpdateFolder}
                        onDeleteFolder={onDeleteFolder}
                        onCreateNote={onCreateNote}
                        onUpdateNote={onUpdateNote}
                        onDeleteNote={onDeleteNote}
                    />
                ))}
            </ul>
        </div>
    );
};

export default FolderSidebar;