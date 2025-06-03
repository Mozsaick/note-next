import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../libs/supabase'; // lib/supabase.ts への適切なパス
import type { Note, NoteUpdateBody } from '../../../../types';   // types/index.ts への適切なパス

interface RouteParams {
  params: Promise<{
    noteId: string;
  }>;
}

/**
 * 特定のノートを取得 (GET /api/notes/[noteId])
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { noteId } = resolvedParams;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('notes')
      .select('*')
      .eq('id', noteId)
      .single();

    if (error && status !== 406) {
      console.error('Supabase GET single note error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch note' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('API GET single note error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 特定のノートを更新 (PUT /api/notes/[noteId])
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { noteId } = resolvedParams;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const body = await request.json();
    const { title, content, folder_id } = body as NoteUpdateBody;

    // 更新するデータオブジェクトを動的に作成
    const updateData: Partial<NoteUpdateBody & { updated_at: string }> = { updated_at: new Date().toISOString() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (folder_id !== undefined) updateData.folder_id = folder_id;

    if (Object.keys(updateData).length === 1 && 'updated_at' in updateData) { // updated_at のみの場合は更新対象がないとみなす
      return NextResponse.json({ error: 'No fields to update provided' }, { status: 400 });
    }
    
    const { data, error, status } = await supabase
      .from('notes')
      .update(updateData)
      .eq('id', noteId)
      .select()
      .single();

    if (error && status !== 406) {
      console.error('Supabase PUT note error:', error);
      return NextResponse.json({ error: error.message || 'Failed to update note' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Note not found or not updated' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
        return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    console.error('API PUT note error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}
 
/**
 * 特定のノートを削除 (DELETE /api/notes/[noteId])
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const resolvedParams = await params;
    const { noteId } = resolvedParams;

    if (!noteId) {
      return NextResponse.json({ error: 'Note ID is required' }, { status: 400 });
    }

    const { error, count, status } = await supabase
      .from('notes')
      .delete()
      .eq('id', noteId);

    if (error) {
      console.error('Supabase DELETE note error:', error);
      // RLS等で対象が見つからない場合もエラーになることがあるため、countも考慮
      if (count === 0 && status !== 406) { // 406はRLSで該当なしでも返るので、それ以外でcount 0なら純粋にNot Found
        return NextResponse.json({ error: 'Note not found or already deleted' }, { status: 404 });
      }
      return NextResponse.json({ error: error.message || 'Failed to delete note' }, { status: 500 });
    }

    if (count === 0) {
      return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    }

    return new NextResponse(null, { status: 204 });
  } catch (err: any) {
    console.error('API DELETE note error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}