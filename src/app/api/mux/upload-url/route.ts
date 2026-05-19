import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function POST() {
  try {
    const tokenId = process.env.MUX_TOKEN_ID;
    const tokenSecret = process.env.MUX_TOKEN_SECRET;
    console.log('Mux env check:', { hasTokenId: !!tokenId, hasTokenSecret: !!tokenSecret });

    if (!tokenId || !tokenSecret) {
      return NextResponse.json({ error: 'Mux credentials not configured' }, { status: 500 });
    }

    const mux = new Mux({ tokenId, tokenSecret });

    let upload;
    try {
      upload = await mux.video.uploads.create({
        new_asset_settings: {
          playback_policy: ['public'],
          mp4_support: 'none',
        },
        cors_origin: process.env.NEXT_PUBLIC_URL || '*',
      });
    } catch (createError) {
      console.error('Mux uploads.create error:', createError);
      return NextResponse.json({
        error: 'Mux create failed',
        details: createError instanceof Error ? createError.message : String(createError),
        stack: createError instanceof Error ? createError.stack : undefined,
      }, { status: 500 });
    }

    console.log('Mux upload created:', { id: upload.id, url: upload.url ? 'present' : 'missing' });

    return NextResponse.json({ 
      upload_url: upload.url, 
      upload_id: upload.id 
    });
  } catch (error) {
    console.error('Error creating Mux upload URL:', error);
    return NextResponse.json({ 
      error: 'Failed to create upload URL',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}