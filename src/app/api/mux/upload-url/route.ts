import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function POST() {
  try {
    // Lazy initialize Mux client
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const upload = await mux.video.uploads.create({
      new_asset_settings: {
        playback_policy: ['public'],  // TODO: switch to signed for student view
        mp4_support: 'none',
      },
      cors_origin: process.env.NEXT_PUBLIC_URL || '*',
    });

    return NextResponse.json({ 
      upload_url: upload.url, 
      upload_id: upload.id 
    });
  } catch (error) {
    console.error('Error creating Mux upload URL:', error);
    return NextResponse.json({ 
      error: 'Failed to create upload URL' 
    }, { status: 500 });
  }
}