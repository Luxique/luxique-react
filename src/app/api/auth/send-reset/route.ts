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

  // Generate password recovery link via admin API
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'recovery',
    email,
  })

  if (error) {
    // Don't expose whether email exists or not
    return NextResponse.json({ success: true })
  }

  const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://luxique.nl'}/reset-password?token_hash=${data.properties?.hashed_token}&type=recovery&next=/reset-password`

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: 'LUXIQUE <noreply@luxique.nl>',
      to: email,
      subject: 'Nieuw wachtwoord instellen ✨',
      html: LUXIQUE_EMAIL_DESIGN(`
        <h1 style="font-size:26px;font-weight:400;color:#1a1712;margin:0 0 20px">Nieuw wachtwoord instellen</h1>
        <p style="font-size:16px;line-height:1.7;color:#3a3530;margin:0 0 24px">
          We hebben een verzoek ontvangen om je wachtwoord opnieuw in te stellen. Klik op de onderstaande knop om een nieuw wachtwoord te kiezen.
        </p>
        <div style="text-align:center;margin:32px 0">
          <a href="${resetLink}" style="display:inline-block;background:#c4a265;color:#ffffff;font-size:15px;font-weight:500;padding:14px 28px;border-radius:999px;text-decoration:none">
            Wachtwoord instellen →
          </a>
        </div>
        <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:0">
          Werkt de knop niet? Kopieer deze link naar je browser:<br>
          <a href="${resetLink}" style="color:#b08d4f;word-break:break-all">${resetLink}</a>
        </p>
        <p style="font-size:14px;line-height:1.7;color:#9a9183;margin:16px 0 0">
          Heb je dit niet aangevraagd? Dan kun je deze e-mail veilig negeren — je wachtwoord blijft ongewijzigd.
        </p>
      `),
    })
  } catch {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
