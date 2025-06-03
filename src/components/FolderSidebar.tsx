'use client';

import { useState, useEffect } from 'react';
import { Folder } from '@/types';
import { Plus } from 'lucide-react';
import FolderItem from './FolderItem';

interface FolderSidebarProps {
    selectedNoteId: string;
    onNoteSelect: (noteId: string, folderId: string) => void;
    onNoteUpdate: (folderId: string) => void;
}

const FolderSidebar: React.FC<FolderSidebarProps> = ({ 
    selectedNoteId,
    onNoteSelect,
    onNoteUpdate
}) => {
    const [folders, setFolders] = useState<Folder[]>([]);
    const [isCreating, setIsCreating] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');

    const fetchFolders = async () => {
        try {
            const response = await fetch('/api/folders');
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `Failed to fetch folders: ${response.statusText}`);
            }
            const data: Folder[] = await response.json();
            setFolders(data);
        } catch (err: any) {
            setFolders([]);
        }
    };

    const createFolder = async () => {
        if (!newFolderName.trim()) return;
        
        try {
            const response = await fetch('/api/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ name: newFolderName }),
            });

            if (!response.ok) {
                throw new Error('Failed to create folder');
            }

            await fetchFolders();
            setNewFolderName('');
            setIsCreating(false);
        } catch (error) {
            console.error('Error creating folder:', error);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            createFolder();
        } else if (e.key === 'Escape') {
            setIsCreating(false);
            setNewFolderName('');
        }
    };

    useEffect(() => {
        fetchFolders();
    }, []);

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
                        onNoteSelect={onNoteSelect}
                        onFolderUpdate={fetchFolders}
                        onNoteUpdateInFolder={onNoteUpdate}
                    />
                ))}
            </ul>
        </div>
    );
};

export default FolderSidebar;