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
        <div className="flex">
            <FolderSidebar
                selectedNoteId={selectedNoteId}
                onNoteSelect={handleNoteSelect}
                onNoteUpdate={handleNoteUpdate}
            />
        <Content
            selectedNoteId={selectedNoteId}
            onNoteSelect={handleNoteSelect}
        />
    </div>
    )
}

export default NotePage;
