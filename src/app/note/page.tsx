'use client';

import { useState, useEffect } from 'react';
import FolderSidebar from '@/components/FolderSidebar';
import Content from '@/components/Content';

const NotePage = () => {
    const [selectedNoteId, setSelectedNoteId] = useState('');

    const handleNoteSelect = (noteId: string) => {
        setSelectedNoteId(noteId);
    };

    const handleNoteUpdate = (folderId: string) => {
        setSelectedNoteId('');
    };

    return (
        <div className="flex h-screen bg-gray-900 text-white">
            <div className="w-72 flex-shrink-0">
                <FolderSidebar 
                selectedNoteId={selectedNoteId} 
                onNoteSelect={handleNoteSelect}
                onNoteUpdate={handleNoteUpdate}
                />
            </div>
            <div className="flex-grow">
                <Content 
                selectedNoteId={selectedNoteId} 
                onNoteSelect={handleNoteSelect} 
                />
            </div>
        </div>
    )
}

export default NotePage;
