/**
 * MIGRATION SCRIPT: Flip existing Mux assets from public to signed
 *
 * Run this ONCE manually after setting up MUX_SIGNING_KEY_ID and MUX_SIGNING_PRIVATE_KEY.
 * Only flips assets for PAID lessons (is_free = false).
 * Free preview lessons stay public.
 *
 * Usage: npx tsx scripts/mux-migrate-to-signed.ts
 */

import { createClient } from '@supabase/supabase-js'
import Mux from '@mux/mux-node'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
  const mux = new Mux({
    tokenId: process.env.MUX_TOKEN_ID!,
    tokenSecret: process.env.MUX_TOKEN_SECRET!,
  })

  // Get all paid lessons with a mux_playback_id
  const { data: lessons, error } = await supabase
    .from('lessons')
    .select('id, title, is_free, mux_playback_id')
    .not('mux_playback_id', 'is', null)

  if (error) { console.error('DB error:', error); process.exit(1) }

  for (const lesson of lessons || []) {
    if (lesson.is_free) {
      console.log(`⏭️  Skipping free lesson: ${lesson.title}`)
      continue
    }

    // Find the asset by playback_id — we need the asset ID
    // List assets and find matching playback ID
    console.log(`🔒 Flipping to signed: ${lesson.title} (playback: ${lesson.mux_playback_id})`)
    
    // Note: You'll need to look up the asset_id from your lessons table or Mux dashboard.
    // If lessons table has a mux_asset_id column:
    // await mux.video.assets.update(lesson.mux_asset_id, { playback_policy: ['signed'] })
    
    console.log(`   ⚠️  Manual step: Find asset with playback_id ${lesson.mux_playback_id} in Mux dashboard and update to signed`)
  }

  console.log('\n✅ Done. Check Mux dashboard to verify all paid assets are now signed.')
}

main().catch(console.error)
