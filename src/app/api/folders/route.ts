import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../libs/supabase'; // lib/supabase.ts へのパス
import { FolderPostBody } from '../../../types';

/**
 * 全フォルダ一覧を取得 (GET /api/folders)
 */
export async function GET() {
  try {
    const { data, error, status } = await supabase
      .from('folders')
      .select('*')
      .order('created_at', { ascending: true }); // 作成日時の昇順で取得

    // Supabaseからのエラーハンドリング (status 406 は RLS関連で発生しうるので、それ以外をここでエラーとする)
    if (error && status !== 406) {
      console.error('Supabase GET error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch folders' }, { status: 500 });
    }

    return NextResponse.json(data || [], { status: 200 });
  } catch (err: any) {
    console.error('API GET (folders) error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 新規フォルダ作成 (POST /api/folders)
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディをJSONとしてパース
    const body = await request.json();
    const { name } = body as FolderPostBody;

    if (!name) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 });
    }

    // Supabaseにデータを挿入
    const { data, error, status } = await supabase
      .from('folders')
      .insert([{ name: name }])
      .select() // 挿入したデータを返す
      .single(); // 1行だけ挿入し、結果をオブジェクトとして取得

    if (error && status !== 406) {
      console.error('Supabase POST error:', error);
      return NextResponse.json({ error: error.message || 'Failed to create folder' }, { status: 500 });
    }
    
    if (!data) {
      console.error('Supabase POST error: No data returned after insert');
      return NextResponse.json({ error: 'Failed to create folder or retrieve data after insert' }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: any) {
    
    if (err instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }
    console.error('API POST (folders) error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}