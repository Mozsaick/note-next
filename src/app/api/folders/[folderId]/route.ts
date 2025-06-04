import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '../../../../libs/supabase';
import type { FolderPostBody } from '../../../../types';

interface RouteParams {
  params: {
    folderId: string;
  };
}

/**
 * 特定のフォルダを取得 (GET /api/folders/[folderId])
 */
export async function GET({ params }: RouteParams) {
  try {
    const { folderId } = params;

    if (!folderId) {
      return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
    }

    const { data, error, status } = await supabase
      .from('folders')
      .select('*')
      .eq('id', folderId) // 'id'カラムがfolderIdと一致するものを検索
      .single();

    // Supabaseからのエラーハンドリング (status 406 は RLS関連で発生しうるので、それ以外をここでエラーとする)
    if (error && status !== 406) {
      console.error('Supabase GET single folder error:', error);
      return NextResponse.json({ error: error.message || 'Failed to fetch folder' }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: any) {
    console.error('API GET single folder error:', err);
    return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
  }
}

/**
 * 特定のフォルダを更新 (PUT /api/folders/[folderId])
 * 主に名前の変更を想定
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
      const { folderId } = params;
  
      if (!folderId) {
        return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
      }
  
      const body = await request.json();
      const { name } = body as FolderPostBody;
  
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return NextResponse.json({ error: 'New folder name is required and must be a non-empty string' }, { status: 400 });
      }
  
      const { data, error, status } = await supabase
        .from('folders')
        .update({ name: name.trim(), updated_at: new Date().toISOString() }) // updated_at も更新
        .eq('id', folderId)
        .select()
        .single();
  
      if (error && status !== 406) {
        console.error('Supabase PUT folder error:', error);
        return NextResponse.json({ error: error.message || 'Failed to update folder' }, { status: 500 });
      }
  
      if (!data) {
        return NextResponse.json({ error: 'Folder not found or not updated' }, { status: 404 });
      }
  
      return NextResponse.json(data, { status: 200 });
    } catch (err: any) {
      if (err instanceof SyntaxError) {
          return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
      }
      console.error('API PUT folder error:', err);
      return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
    }
  }
  
  /**
   * 特定のフォルダを削除 (DELETE /api/folders/[folderId])
   */
  export async function DELETE({ params }: RouteParams) {
    try {
      const { folderId } = params;
  
      if (!folderId) {
        return NextResponse.json({ error: 'Folder ID is required' }, { status: 400 });
      }
  
      // 削除操作を行い、影響を受けた行の数を取得
      const { error, count } = await supabase
        .from('folders')
        .delete()
        .eq('id', folderId);
  
      if (error) {
        console.error('Supabase DELETE folder error:', error);
        // RLS等で対象が見つからない場合もエラーになることがあるため、countも考慮
        if (count === 0) {
          return NextResponse.json({ error: 'Folder not found or already deleted' }, { status: 404 });
        }
        return NextResponse.json({ error: error.message || 'Failed to delete folder' }, { status: 500 });
      }
  
      if (count === 0) {
        // エラーはないが、どの行も削除されなかった場合 (対象が存在しなかった)
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
      }
  
      return new NextResponse(null, { status: 204 });
    } catch (err: any) {
      console.error('API DELETE folder error:', err);
      return NextResponse.json({ error: err.message || 'An unexpected error occurred' }, { status: 500 });
    }
  }