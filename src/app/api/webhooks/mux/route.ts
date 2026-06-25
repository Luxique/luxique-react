import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
  try {
    // Get the raw body for signature verification
    const body = await request.text();
    const signature = request.headers.get('mux-signature');
    
    // TODO: Verify Mux webhook signature for security
    // For now, we'll log the signature for debugging
    console.log('Mux webhook signature:', signature);

    // TODO: Verify Mux webhook signature for security
    // For now, we'll process all webhooks

    const event = JSON.parse(body);
    
    console.log('Mux webhook received:', event);

    // Handle video.asset.ready event
    if (event.type === 'video.asset.ready' && event.data) {
      const assetId = event.data.id;
      const playbackId = event.data.playback_ids?.[0]?.id;
      
      // Lazy initialize Supabase client
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Update blocks table with the new asset and playback IDs
      const { error } = await supabase
        .from('blocks')
        .update({ 
          content: { 
            mux_asset_id: assetId,
            mux_playback_id: playbackId 
          },
          updated_at: new Date().toISOString()
        })
        .eq('content->>mux_asset_id', null)
        .like('content->>temp_upload_id', `%${assetId}%`);

      if (error) {
        console.error('Error updating blocks table:', error);
      } else {
        console.log('✅ Updated blocks table for asset:', assetId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing Mux webhook:', error);
    return NextResponse.json({ 
      error: 'Failed to process webhook' 
    }, { status: 500 });
  }
}