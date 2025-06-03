'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Folder, Note, NotePostBody, NoteUpdateBody } from '@/types';

interface FolderUpdateBody {
  name: string;
}

// --- スタイル定義 ---
const baseTextStyle = { color: '#e0e0e0' };
const inputStyle = { marginRight: '10px', padding: '8px', backgroundColor: '#333', color: '#fff', border: '1px solid #555' };
const buttonStyle = { padding: '8px 12px', backgroundColor: '#444', color: '#fff', border: '1px solid #666', cursor: 'pointer' };
const disabledButtonStyle = { ...buttonStyle, backgroundColor: '#222', color: '#777', cursor: 'not-allowed' };
const sectionBoxStyle = { marginBottom: '20px', padding: '15px', border: '1px solid #444', backgroundColor: '#1e1e1e' };
const listItemStyle = { marginBottom: '8px', padding: '8px', border: '1px solid #333', backgroundColor: '#2a2a2a' };
const errorStyle = { color: '#ff7b7b', fontWeight: 'bold', fontSize: '0.9em' as '0.9em'};
const successStyle = { color: '#7bff7b', fontWeight: 'bold', fontSize: '0.9em' as '0.9em'};


export default function FoldersPage() {
  // ... (既存のフォルダ関連ステートはそのまま) ...
  const [folders, setFolders] = useState<Folder[]>([]);
  const [newFolderName, setNewFolderName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [targetFolderId, setTargetFolderId] = useState('');
  const [updateFolderNameInput, setUpdateFolderNameInput] = useState('');
  const [singleFolderResult, setSingleFolderResult] = useState<Folder | string | null>(null);
  const [actionStatus, setActionStatus] = useState<string | null>(null);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const [notesForSelectedFolder, setNotesForSelectedFolder] = useState<Note[]>([]);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [notesError, setNotesError] = useState<string | null>(null);

  // --- 特定ノート操作用の新しいステート ---
  const [targetNoteId, setTargetNoteId] = useState(''); // 操作対象のノートID
  const [updateNoteTitleInput, setUpdateNoteTitleInput] = useState(''); // 更新用ノートタイトル
  const [updateNoteContentInput, setUpdateNoteContentInput] = useState(''); // 更新用ノートコンテント
  const [singleNoteResultDisplay, setSingleNoteResultDisplay] = useState<Note | string | null>(null); // 特定ノート取得の結果表示用
  const [noteActionStatus, setNoteActionStatus] = useState<string | null>(null); // ノート個別操作のステータス
  const [isNoteActionLoading, setIsNoteActionLoading] = useState(false); // ノート個別アクションのローディング


  // --- 既存の関数 (fetchFolders, handleCreateFolder, etc.) は変更なし、または微調整 ---
  const fetchFolders = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/folders');
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch folders: ${response.statusText}`);
      }
      const data: Folder[] = await response.json();
      setFolders(data);
    } catch (err: any) {
      setError(err.message);
      setFolders([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newFolderName.trim()) {
      setActionStatus('Folder name cannot be empty for creation.');
      return;
    }
    setIsSubmitting(true);
    setActionStatus(null);
    try {
      const response = await fetch('/api/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create folder: ${response.statusText}`);
      }
      const createdFolder: Folder = await response.json();
      setFolders((prevFolders) => [...prevFolders, createdFolder]);
      setNewFolderName('');
      setActionStatus(`Folder "${createdFolder.name}" created successfully.`);
    } catch (err: any) {
      setActionStatus(`Error creating folder: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGetSingleFolder = async () => {
    if (!targetFolderId.trim()) {
      setActionStatus('Please enter a Folder ID to fetch.');
      return;
    }
    setIsActionLoading(true);
    setActionStatus(null);
    setSingleFolderResult(null);
    setNotesForSelectedFolder([]);
    setNotesError(null);
    setTargetNoteId(''); // 他のノート操作と競合しないようにクリア
    setSingleNoteResultDisplay(null);


    try {
      const response = await fetch(`/api/folders/${targetFolderId.trim()}`);
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to fetch folder: ${response.statusText}`);
      }
      setSingleFolderResult(responseData as Folder);
      setActionStatus(`Folder "${responseData.name}" fetched. Notes below.`);
      await fetchNotesForFolder(targetFolderId.trim());
    } catch (err: any) {
      setSingleFolderResult(null);
      setActionStatus(`Error fetching folder: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };
  
  const handleUpdateFolder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetFolderId.trim() || !updateFolderNameInput.trim()) {
      setActionStatus('Please enter a Folder ID and a new name to update.');
      return;
    }
    setIsActionLoading(true);
    setActionStatus(null);
    try {
      const response = await fetch(`/api/folders/${targetFolderId.trim()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: updateFolderNameInput.trim() } as FolderUpdateBody),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to update folder: ${response.statusText}`);
      }
      setActionStatus(`Folder "${responseData.name}" updated successfully.`);
      setUpdateFolderNameInput('');
      fetchFolders();
      if (singleFolderResult && typeof singleFolderResult !== 'string' && singleFolderResult.id === targetFolderId) {
        setSingleFolderResult(responseData as Folder);
      }
    } catch (err: any) {
      setActionStatus(`Error updating folder: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!targetFolderId.trim()) {
      setActionStatus('Please enter a Folder ID to delete.');
      return;
    }
    if (!confirm(`Are you sure you want to delete folder with ID: ${targetFolderId.trim()}? This might also delete its notes if CASCADE is set.`)) {
        return;
    }
    setIsActionLoading(true);
    setActionStatus(null);
    try {
      const response = await fetch(`/api/folders/${targetFolderId.trim()}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        let errorMsg = `Failed to delete folder: ${response.statusText}`;
        if (response.status !== 204) {
            const errorData = await response.json().catch(() => ({}));
            errorMsg = errorData.error || errorMsg;
        }
        throw new Error(errorMsg);
      }
      setActionStatus(`Folder with ID "${targetFolderId.trim()}" deleted successfully.`);
      if (singleFolderResult && typeof singleFolderResult !== 'string' && singleFolderResult.id === targetFolderId) {
        setSingleFolderResult(null);
        setNotesForSelectedFolder([]);
      }
      setTargetFolderId('');
      setNotesForSelectedFolder([]);
      setSingleNoteResultDisplay(null);
      setTargetNoteId('');
      fetchFolders();
    } catch (err: any) {
      setActionStatus(`Error deleting folder: ${err.message}`);
    } finally {
      setIsActionLoading(false);
    }
  };

  const fetchNotesForFolder = async (folderId: string) => {
    if (!folderId) return;
    setIsLoadingNotes(true);
    setNotesError(null);
    try {
      const response = await fetch(`/api/notes?folder_id=${folderId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch notes for folder ${folderId}: ${response.statusText}`);
      }
      const data: Note[] = await response.json();
      setNotesForSelectedFolder(data);
    } catch (err: any) {
      setNotesError(err.message);
      setNotesForSelectedFolder([]);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const handleCreateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetFolderId.trim()) {
      setNotesError('Cannot create note: No folder selected/targeted.');
      return;
    }
    if (!newNoteTitle.trim() && !newNoteContent.trim()) {
      setNotesError('Note title or content cannot be empty.');
      return;
    }
    setIsSubmittingNote(true);
    setNotesError(null);
    try {
      const notePayload: NotePostBody = {
        folder_id: targetFolderId.trim(),
        title: newNoteTitle.trim() || null, // API側でnullを許容するように変更
        content: newNoteContent.trim() || null, // API側でnullを許容するように変更
      };
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(notePayload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to create note: ${response.statusText}`);
      }
      const createdNote: Note = await response.json();
      // setNotesForSelectedFolder((prevNotes) => [...prevNotes, createdNote]); // リアルタイム更新
      await fetchNotesForFolder(targetFolderId.trim()); // 再取得してリストを確実に更新
      setNewNoteTitle('');
      setNewNoteContent('');
      setNotesError(`Note "${createdNote.title || 'Untitled'}" created successfully.`); // notesError を成功メッセージにも使用
    } catch (err: any) {
      setNotesError(`Error creating note: ${err.message}`);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // --- 特定ノート操作のための新しい関数 ---
  const handleGetSingleNote = async () => {
    if (!targetNoteId.trim()) {
      setNoteActionStatus('Please enter a Note ID to fetch.');
      return;
    }
    setIsNoteActionLoading(true);
    setNoteActionStatus(null);
    setSingleNoteResultDisplay(null);
    try {
      const response = await fetch(`/api/notes/${targetNoteId.trim()}`);
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to fetch note: ${response.statusText}`);
      }
      setSingleNoteResultDisplay(responseData as Note);
      setNoteActionStatus(`Note "${responseData.title || 'Untitled'}" fetched successfully.`);
      // 取得したノートの情報を更新フォームにセット
      setUpdateNoteTitleInput(responseData.title || '');
      setUpdateNoteContentInput(responseData.content || '');
    } catch (err: any) {
      setSingleNoteResultDisplay(null);
      setNoteActionStatus(`Error fetching note: ${err.message}`);
    } finally {
      setIsNoteActionLoading(false);
    }
  };

  const handleUpdateNote = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetNoteId.trim()) {
      setNoteActionStatus('Please enter a Note ID to update.');
      return;
    }
    if (!updateNoteTitleInput.trim() && !updateNoteContentInput.trim()){
        setNoteActionStatus('Note title or content must be provided for update.');
        return;
    }
    setIsNoteActionLoading(true);
    setNoteActionStatus(null);
    try {
      const noteUpdatePayload: NoteUpdateBody = {
        title: updateNoteTitleInput.trim() || undefined,
        content: updateNoteContentInput.trim() || undefined,
      };
      const response = await fetch(`/api/notes/${targetNoteId.trim()}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(noteUpdatePayload),
      });
      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.error || `Failed to update note: ${response.statusText}`);
      }
      setNoteActionStatus(`Note "${responseData.title || 'Untitled'}" updated successfully.`);
      // リストを更新 (もし targetFolderId が設定されていれば)
      if (targetFolderId.trim()) {
        await fetchNotesForFolder(targetFolderId.trim());
      }
      // 更新フォームと表示をクリア/更新
      setUpdateNoteTitleInput('');
      setUpdateNoteContentInput('');
      setSingleNoteResultDisplay(responseData as Note);

    } catch (err: any) {
      setNoteActionStatus(`Error updating note: ${err.message}`);
    } finally {
      setIsNoteActionLoading(false);
    }
  };

  const handleDeleteNote = async () => {
    if (!targetNoteId.trim()) {
      setNoteActionStatus('Please enter a Note ID to delete.');
      return;
    }
    if (!confirm(`Are you sure you want to delete note with ID: ${targetNoteId.trim()}?`)) {
      return;
    }
    setIsNoteActionLoading(true);
    setNoteActionStatus(null);
    try {
      const response = await fetch(`/api/notes/${targetNoteId.trim()}`, {
        method: 'DELETE',
      });
      if (!response.ok && response.status !== 204) { // 204 No Content も成功とみなす
        let errorMsg = `Failed to delete note: ${response.statusText}`;
        const errorData = await response.json().catch(() => ({}));
        errorMsg = errorData.error || errorMsg;
        throw new Error(errorMsg);
      }
      setNoteActionStatus(`Note with ID "${targetNoteId.trim()}" deleted successfully.`);
      // リストを更新 (もし targetFolderId が設定されていれば)
      if (targetFolderId.trim()) {
        await fetchNotesForFolder(targetFolderId.trim());
      }
      // 表示と入力値をクリア
      setSingleNoteResultDisplay(null);
      setTargetNoteId('');
      setUpdateNoteTitleInput('');
      setUpdateNoteContentInput('');

    } catch (err: any) {
      setNoteActionStatus(`Error deleting note: ${err.message}`);
    } finally {
      setIsNoteActionLoading(false);
    }
  };


  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', display: 'flex', gap: '40px', backgroundColor: '#121212', color: '#e0e0e0', minHeight: '100vh' }}>
      {/* 左側: フォルダ一覧と作成 */}
      <section style={{ flex: 1 }}>
        <h1 style={baseTextStyle}>My Folders</h1>
        <div style={sectionBoxStyle}>
          <h2 style={baseTextStyle}>Create New Folder</h2>
          <form onSubmit={handleCreateFolder}>
            <input type="text" value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} placeholder="Enter folder name" disabled={isSubmitting} style={inputStyle} />
            <button type="submit" disabled={isSubmitting} style={isSubmitting ? disabledButtonStyle : buttonStyle}>
              {isSubmitting ? 'Creating...' : 'Create Folder'}
            </button>
          </form>
        </div>
        <div>
          <h2 style={baseTextStyle}>Existing Folders</h2>
          {isLoading && <p style={baseTextStyle}>Loading folders...</p>}
          {error && <p style={errorStyle}>Error fetching folder list: {error}</p>}
          {!isLoading && !error && folders.length === 0 && (<p style={baseTextStyle}>No folders found. Create one!</p>)}
          {!isLoading && !error && folders.length > 0 && (
            <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
              {folders.map((folder) => (
                <li key={folder.id} style={{...listItemStyle, background: '#282828'}}>
                  <strong style={baseTextStyle}>{folder.name}</strong><br />
                  <small style={{color: '#aaa'}}>ID: {folder.id} (Use this ID for actions →)</small><br />
                  <small style={{color: '#aaa'}}>Created: {new Date(folder.created_at).toLocaleString()}</small>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* 中央: 特定フォルダ操作 と そのフォルダのノート一覧・作成 */}
      <section style={{ flex: 1, borderLeft: '2px solid #333', paddingLeft: '30px' }}>
        <h2 style={baseTextStyle}>Operations on Specific Folder & Its Notes</h2>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="targetFolderId" style={{ ...baseTextStyle, marginRight: '10px' }}>Folder ID for Actions:</label>
          <input type="text" id="targetFolderId" value={targetFolderId}
            onChange={(e) => { setTargetFolderId(e.target.value); setActionStatus(null); setSingleFolderResult(null); setNotesForSelectedFolder([]); setNotesError(null); setTargetNoteId(''); setSingleNoteResultDisplay(null);}}
            placeholder="Enter Folder ID" style={{...inputStyle, width: 'calc(100% - 120px)' }}
          />
        </div>

        {actionStatus && <p style={actionStatus.startsWith('Error') ? errorStyle : successStyle}>{actionStatus}</p>}
        {isActionLoading && <p style={baseTextStyle}>Processing folder action...</p>}

        <div style={sectionBoxStyle}>
          <h3 style={baseTextStyle}>1. Get Single Folder (and its Notes)</h3>
          <button onClick={handleGetSingleFolder} disabled={!targetFolderId || isActionLoading} style={(!targetFolderId || isActionLoading) ? disabledButtonStyle : buttonStyle}>Fetch Folder Details & Notes</button>
          {singleFolderResult && typeof singleFolderResult !== 'string' && (
            <div style={{ marginTop: '10px', backgroundColor: '#282828', padding: '10px' }}>
              <h4 style={baseTextStyle}>Fetched Folder: {singleFolderResult.name}</h4>
              <pre style={{color: '#ccc', background: '#111', padding: '5px', whiteSpace: 'pre-wrap'}}>{JSON.stringify(singleFolderResult, null, 2)}</pre>
            </div>
          )}
        </div>
        
        {targetFolderId && singleFolderResult && typeof singleFolderResult !== 'string' && (
        <div style={{ ...sectionBoxStyle, marginTop: '20px', borderColor: '#55599c' }}>
            <h3 style={baseTextStyle}>Notes in "{typeof singleFolderResult === 'string' ? targetFolderId : singleFolderResult.name}"</h3>
            {isLoadingNotes && <p style={baseTextStyle}>Loading notes...</p>}
            {notesError && <p style={notesError.startsWith('Error') ? errorStyle : successStyle}>{notesError}</p>}
            {!isLoadingNotes && !notesError && notesForSelectedFolder.length === 0 && (<p style={baseTextStyle}>No notes in this folder. Create one below.</p>)}
            {!isLoadingNotes && !notesError && notesForSelectedFolder.length > 0 && (
                <ul style={{ listStyle: 'none', paddingLeft: 0, maxHeight: '200px', overflowY: 'auto' }}>
                {notesForSelectedFolder.map(note => (
                    <li key={note.id} style={{...listItemStyle, background: '#303040'}}>
                    <strong style={baseTextStyle}>{note.title || '(Untitled Note)'}</strong>
                    <p style={{ ...baseTextStyle, whiteSpace: 'pre-wrap', fontSize: '0.9em', margin: '5px 0 0 0' }}>{note.content || '(No content)'}</p>
                    <small style={{color: '#aaa'}}>ID: {note.id} | Created: {new Date(note.created_at).toLocaleString()}</small>
                    </li>
                ))}
                </ul>
            )}
            <div style={{ marginTop: '20px', padding: '10px', borderTop: '1px solid #444' }}>
                <h4 style={baseTextStyle}>Create New Note in This Folder</h4>
                <form onSubmit={handleCreateNote}>
                    <div style={{ marginBottom: '10px' }}>
                        <input type="text" placeholder="Note Title (optional)" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} disabled={isSubmittingNote} style={{...inputStyle, width: 'calc(100% - 22px)'}} />
                    </div>
                    <div style={{ marginBottom: '10px' }}>
                        <textarea placeholder="Note Content (optional, Markdown)" value={newNoteContent} onChange={(e) => setNewNoteContent(e.target.value)} rows={3} disabled={isSubmittingNote} style={{...inputStyle, width: 'calc(100% - 22px)', minHeight: '60px'}} />
                    </div>
                    <button type="submit" disabled={isSubmittingNote || !targetFolderId} style={(isSubmittingNote || !targetFolderId) ? disabledButtonStyle : buttonStyle}>
                        {isSubmittingNote ? 'Creating Note...' : 'Create Note'}
                    </button>
                </form>
            </div>
        </div>
        )}

        <div style={{ ...sectionBoxStyle, marginTop:'30px' }}>
          <h3 style={baseTextStyle}>2. Update Selected Folder Name</h3>
          <form onSubmit={handleUpdateFolder}>
            <input type="text" value={updateFolderNameInput} onChange={(e) => setUpdateFolderNameInput(e.target.value)} placeholder="Enter new folder name" disabled={!targetFolderId || isActionLoading} style={inputStyle} />
            <button type="submit" disabled={!targetFolderId || !updateFolderNameInput || isActionLoading} style={(!targetFolderId || !updateFolderNameInput || isActionLoading) ? disabledButtonStyle : buttonStyle}>
              Update Name
            </button>
          </form>
        </div>

        <div style={sectionBoxStyle}>
          <h3 style={baseTextStyle}>3. Delete Selected Folder</h3>
          <button onClick={handleDeleteFolder} disabled={!targetFolderId || isActionLoading} style={(!targetFolderId || isActionLoading) ? disabledButtonStyle : {...buttonStyle, background: '#5a2828', color: '#ffaaaa' }}>
            Delete This Folder
          </button>
        </div>
      </section>

      {/* 右端: 特定ノート操作 */}
      <section style={{ flex: 1, borderLeft: '2px solid #333', paddingLeft: '30px' }}>
        <h2 style={baseTextStyle}>Operations on Specific Note</h2>
        <div style={{ marginBottom: '20px' }}>
            <label htmlFor="targetNoteId" style={{ ...baseTextStyle, marginRight: '10px' }}>Note ID for Actions:</label>
            <input 
                type="text" 
                id="targetNoteId"
                value={targetNoteId}
                onChange={(e) => { setTargetNoteId(e.target.value); setNoteActionStatus(null); setSingleNoteResultDisplay(null); }}
                placeholder="Enter Note ID"
                style={{...inputStyle, width: 'calc(100% - 120px)' }}
            />
        </div>
        {noteActionStatus && <p style={noteActionStatus.startsWith('Error') ? errorStyle : successStyle}>{noteActionStatus}</p>}
        {isNoteActionLoading && <p style={baseTextStyle}>Processing note action...</p>}

        <div style={sectionBoxStyle}>
            <h3 style={baseTextStyle}>1. Get Single Note</h3>
            <button onClick={handleGetSingleNote} disabled={!targetNoteId || isNoteActionLoading} style={(!targetNoteId || isNoteActionLoading) ? disabledButtonStyle : buttonStyle}>Fetch Note Details</button>
            {singleNoteResultDisplay && typeof singleNoteResultDisplay !== 'string' && (
                <div style={{ marginTop: '10px', backgroundColor: '#282828', padding: '10px' }}>
                    <h4 style={baseTextStyle}>Fetched Note: {singleNoteResultDisplay.title || "Untitled"}</h4>
                    <pre style={{color: '#ccc', background: '#111', padding: '5px', whiteSpace: 'pre-wrap'}}>{JSON.stringify(singleNoteResultDisplay, null, 2)}</pre>
                </div>
            )}
        </div>

        <div style={{ ...sectionBoxStyle, marginTop: '20px' }}>
            <h3 style={baseTextStyle}>2. Update Selected Note</h3>
            <form onSubmit={handleUpdateNote}>
                <div style={{ marginBottom: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="New Note Title" 
                        value={updateNoteTitleInput} 
                        onChange={(e) => setUpdateNoteTitleInput(e.target.value)}
                        disabled={!targetNoteId || isNoteActionLoading}
                        style={{...inputStyle, width: 'calc(100% - 22px)'}}
                    />
                </div>
                <div style={{ marginBottom: '10px' }}>
                    <textarea 
                        placeholder="New Note Content (Markdown)" 
                        value={updateNoteContentInput} 
                        onChange={(e) => setUpdateNoteContentInput(e.target.value)}
                        rows={3}
                        disabled={!targetNoteId || isNoteActionLoading}
                        style={{...inputStyle, width: 'calc(100% - 22px)', minHeight: '60px'}}
                    />
                </div>
                <button type="submit" disabled={!targetNoteId || isNoteActionLoading} style={(!targetNoteId || isNoteActionLoading) ? disabledButtonStyle : buttonStyle}>
                    Update Note
                </button>
            </form>
        </div>
        <div style={sectionBoxStyle}>
            <h3 style={baseTextStyle}>3. Delete Selected Note</h3>
            <button onClick={handleDeleteNote} disabled={!targetNoteId || isNoteActionLoading} style={(!targetNoteId || isNoteActionLoading) ? disabledButtonStyle : {...buttonStyle, background: '#5a2828', color: '#ffaaaa' }}>
                Delete This Note
            </button>
        </div>
      </section>
    </div>
  );
}