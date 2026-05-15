import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    const { path } = await request.json();
    
    if (!path) {
      return NextResponse.json({ error: 'path is required' }, { status: 400 });
    }

    // Lazy initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Generate signed upload URL for course-downloads bucket
    const { data, error } = await supabase.storage
      .from('course-downloads')
      .createSignedUploadUrl(path);

    if (error) {
      console.error('Error creating signed upload URL:', error);
      return NextResponse.json({ 
        error: 'Failed to create upload URL' 
      }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl,
      path: path,
      token: data.token
    });
  } catch (error) {
    console.error('Error in upload URL route:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}