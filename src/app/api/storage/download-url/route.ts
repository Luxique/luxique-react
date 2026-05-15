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

    // Generate signed download URL (60 minutes expiry)
    const { data, error } = await supabase.storage
      .from('course-downloads')
      .createSignedUrl(path, 3600); // 3600 seconds = 60 minutes

    if (error) {
      console.error('Error creating signed download URL:', error);
      return NextResponse.json({ 
        error: 'Failed to create download URL' 
      }, { status: 500 });
    }

    return NextResponse.json({
      signedUrl: data.signedUrl
    });
  } catch (error) {
    console.error('Error in download URL route:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}