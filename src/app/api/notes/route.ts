import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../libs/supabase';
import type { NotePostBody } from '../../../types';

/**
 * ノート一覧を取得 (GET /api/notes)
 */
export async function GET() {
  try {
    const { data, error, status } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });

    if (error && status !== 406) {
      console.error('Supabase GET notes error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch notes' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err: any) {
    console.error('API GET (notes) error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 新規ノート作成 (POST /api/notes)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { folder_id, title, content } = body as NotePostBody;

    if (!folder_id) {
      return NextResponse.json({ error: 'folder_id is required' }, { status: 400 });
    }

    const noteToInsert = {
      folder_id,
      title: title || null,
      content: content || null,
    };

    const { data, error, status } = await supabase
      .from('notes')
      .insert(noteToInsert)
      .select()
      .single();

    if (error && status !== 406) {
      console.error('Supabase POST note error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create note' }, { status: 500 });
    }

    if (!data) {
      console.error('Supabase POST note error: No data returned after insert');
      return NextResponse.json({ error: 'Failed to create note or retrieve data after insert' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    console.error('API POST (note) error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}