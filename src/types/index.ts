export interface Folder {
    id: string;
    name: string;
    created_at: string;
    updated_at: string;
  }
  
export interface FolderPostBody {
    name: string;
}

export interface Note {
    id: string;
    folder_id: string;
    title: string | null;
    content: string | null;
    created_at: string;
    updated_at: string;
  }
  
export interface NotePostBody {
    folder_id: string;
    title?: string;
    content?: string;
}
  
export interface NoteUpdateBody {
    title?: string;
    content?: string;
    folder_id?: string;
}