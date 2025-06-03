'use client';

import { useState, useEffect } from 'react';
import { Note } from '@/types';

interface ContentProps {
    selectedNoteId: string;
    onNoteSelect: (noteId: string) => void;
}

const Content: React.FC<ContentProps> = ({ selectedNoteId, onNoteSelect }) => {
    const [noteContent, setNoteContent] = useState('');

    const fetchNote = async () => {
        try {
            const response = await fetch(`/api/notes/${selectedNoteId}`);
            if (!response.ok) {
                throw new Error('Failed to fetch note');
            }
            const data: Note = await response.json();
            setNoteContent(data.content ?? '');
        } catch (err: any) {
            console.error('Error fetching note:', err);
        }
    }

    useEffect(() => {
        if (selectedNoteId) {
            fetchNote();
        } else {
            setNoteContent('');
        }
    }, [selectedNoteId]);

    return (
        <div className="flex-1 p-4">
            <h2 className="text-lg font-bold mb-4">Notes</h2>
            <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                className="w-full h-64 p-2 border rounded-md"
            />
        </div>
    )
};

export default Content;
