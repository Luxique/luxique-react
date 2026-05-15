import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('upload_id');
    
    if (!uploadId) {
      return NextResponse.json({ error: 'upload_id required' }, { status: 400 });
    }

    // Lazy initialize Mux client
    const mux = new Mux({
      tokenId: process.env.MUX_TOKEN_ID!,
      tokenSecret: process.env.MUX_TOKEN_SECRET!,
    });

    const upload = await mux.video.uploads.retrieve(uploadId);
    
    if (upload.asset_id) {
      const asset = await mux.video.assets.retrieve(upload.asset_id);
      const playbackId = asset.playback_ids?.[0]?.id;
      
      return NextResponse.json({ 
        status: asset.status, 
        asset_id: asset.id, 
        playback_id: playbackId 
      });
    }
    
    return NextResponse.json({ status: 'uploading' });
  } catch (error) {
    console.error('Error checking Mux asset status:', error);
    return NextResponse.json({ 
      error: 'Failed to check status' 
    }, { status: 500 });
  }
}