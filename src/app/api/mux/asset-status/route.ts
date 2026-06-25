import { NextResponse } from 'next/server';
import Mux from '@mux/mux-node';

export const dynamic = 'force-dynamic'

interface AssetStatusResponse {
  status: string;
  asset_id?: string;
  playback_id?: string;
  public_playback_id?: string;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('upload_id');
    const isFree = searchParams.get('is_free') === 'true';
    
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
      let publicPlaybackId: string | undefined;

      // For free lessons, create a public playback ID if it doesn't exist
      if (isFree && playbackId && asset.playback_ids?.length === 1) {
        const existingPublic = asset.playback_ids.find(p => p.policy === 'public');
        if (!existingPublic) {
          try {
            const publicPid = await mux.video.assets.createPlaybackId(asset.id, { policy: 'public' });
            publicPlaybackId = publicPid.id;
            console.log('[asset-status] Created public playback ID for free lesson:', publicPlaybackId);
          } catch (err) {
            console.error('[asset-status] Failed to create public playback ID:', err);
            // Don't fail the whole request if public ID creation fails
          }
        } else {
          publicPlaybackId = existingPublic.id;
        }
      }

      const response: AssetStatusResponse = {
        status: asset.status,
        asset_id: asset.id,
        playback_id: playbackId,
      };

      if (publicPlaybackId) {
        response.public_playback_id = publicPlaybackId;
      }
      
      return NextResponse.json(response);
    }
    
    return NextResponse.json({ status: 'uploading' });
  } catch (error) {
    console.error('Error checking Mux asset status:', error);
    return NextResponse.json({ 
      error: 'Failed to check status' 
    }, { status: 500 });
  }
}