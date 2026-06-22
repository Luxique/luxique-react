import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const LUXIQUE_EMAIL_DESIGN = (content: string) => `
<div style="font-family:Georgia,'Times New Roman',serif;max-width:560px;margin:0 auto;background:#fffdf8;border:1px solid rgba(176,141,79,0.15);border-radius:16px;overflow:hidden">
  <div style="background:#f6f1e7;padding:28px 32px;text-align:center;border-bottom:1px solid rgba(176,141,79,0.15)">
    <img src="https://osldoolmbpqayxhgmbum.supabase.co/storage/v1/object/public/images/lxq-logo-black.webp" alt="LUXIQUE" style="height:24px;width:auto" />
  </div>
  <div style="padding:36px 32px">
    ${content}
    <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:24px 0 0;padding-top:20px;border-top:1px solid rgba(26,23,18,0.08)">
      LUXIQUE · Venlosingel 166, 6845 JD Arnhem<br>
      <a href="mailto:info@luxique.nl" style="color:#b08d4f">info@luxique.nl</a> ·
      <a href="https://instagram.com/lashedbychiva" style="color:#b08d4f">@lashedbychiva</a>
    </p>
  </div>
</div>`

export async function POST(req: NextRequest) {
  const { email } = await req.json()

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Generate signup confirmation link via admin API
  // Note: signup type requires password, so we use 'magiclink' type to get a verification URL
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })

  if (error) {
    return NextResponse.json({ error: 'Could not generate confirmation link' }, { status: 400 })
  }

  const confirmLink = data.properties?.action_link || ''

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'LUXIQUE <noreply@luxique.nl>',
      to: email,
      subject: 'Welkom bij LUXIQUE — bevestig je account ✨',
      html: LUXIQUE_EMAIL_DESIGN(`
        <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Welkom bij LUXIQUE ✨</h1>
        <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">
          Bedankt voor je aanmelding. Bevestig je e-mailadres om je account te activeren en toegang te krijgen tot de Academy, je cursussen en je persoonlijke dashboard.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${confirmLink}" style="display:inline-block;background:#c4a265;color:#ffffff;font-size:15px;font-weight:500;padding:14px 28px;border-radius:999px;text-decoration:none">
            Account bevestigen →
          </a>
        </div>
        <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0">
          Werkt de knop niet? Kopieer deze link naar je browser:<br>
          <a href="${confirmLink}" style="color:#b08d4f;word-break:break-all">${confirmLink}</a>
        </p>
      `),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
