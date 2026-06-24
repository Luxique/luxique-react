import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

/**
 * M01 — Account confirmation email (branded Resend)
 *
 * Sends a branded LUXIQUE confirmation email with a valid Supabase
 * verification link. Uses admin.generateLink({ type: 'magiclink' }) to
 * obtain a token that confirms the email AND logs the user in.
 *
 * Called from the register page after supabase.auth.signUp().
 * Supabase's own confirm email should be disabled in Dashboard to
 * prevent double emails.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { email } = body

  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )

  // Generate a signup confirmation link — this creates a link that,
  // when clicked, sets email_confirmed_at in auth.users (unlike magiclink
  // which only logs the user in without confirming the email).
  // Type 'signup' requires a password; we pass the password from the request.
  const { password } = body

  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'signup',
    email,
    password: password || undefined,
  })

  if (error) {
    // If signup link fails (e.g. user already exists), fall back to magiclink
    console.warn('M01: signup generateLink failed, trying magiclink:', error.message)
    const { data: mlData, error: mlError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (mlError) {
      console.error('M01: magiclink also failed', mlError)
      return NextResponse.json({ error: 'Could not generate confirmation link' }, { status: 400 })
    }
    var linkData = mlData
  } else {
    var linkData = data
  }

  const confirmationUrl = linkData.properties?.action_link || ''

  if (!confirmationUrl) {
    console.error('M01: no action_link in generateLink response')
    return NextResponse.json({ error: 'No confirmation link generated' }, { status: 500 })
  }

  const html = M01_TEMPLATE(confirmationUrl)

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error: sendError } = await resend.emails.send({
      from: 'LUXIQUE <noreply@luxique.nl>',
      to: email,
      subject: 'Confirm your Luxique account',
      html,
    })

    if (sendError) {
      console.error('M01: Resend send failed', sendError)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }

    console.log(`M01: confirmation email sent to ${email}`)
  } catch (err) {
    console.error('M01: unexpected error', err)
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

// ── M01 Branded HTML Template ──────────────────────────────
function M01_TEMPLATE(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<title>Confirm your account</title>
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0; padding:0; background-color:#e8e6e1; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;">
<div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">One step left — confirm your email to activate your account.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#e8e6e1;">
 <tr><td align="center" style="padding:40px 16px;">
 <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:600px; max-width:600px; background-color:#FAF8F4; border-radius:14px; overflow:hidden;">
 <tr><td align="center" style="background-color:#0C0A07; padding:38px 40px 30px 40px;">
 <img src="https://luxique.nl/lxq-email-logo.png" width="132" alt="LUXIQUE" style="display:block; width:132px; max-width:132px; height:auto; border:0;">
 </td></tr>
 <tr><td style="height:2px; line-height:2px; font-size:0; background-color:#C4A265;">&nbsp;</td></tr>
 <tr><td style="padding:44px 48px 36px 48px;" align="center">
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:11px; letter-spacing:3px; text-transform:uppercase; color:#C4A265; padding-bottom:18px;">One step left</div>
 <div style="font-family:'Cormorant Garamond', Georgia, 'Times New Roman', serif; font-size:34px; line-height:42px; font-weight:500; color:#0C0A07; padding-bottom:20px;">Welcome to Luxique</div>
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:16px; line-height:26px; color:#4a463e; padding-bottom:24px; max-width:440px; margin:0 auto;">Welcome to Luxique. You're one step away — confirm your email address to activate your account.</div>
 <table role="presentation" cellpadding="0" cellspacing="0" style="margin:6px auto 0 auto;">
 <tr>
 <td align="center" bgcolor="#C4A265" style="border-radius:9px; background:linear-gradient(180deg,#D8B978,#C4A265);">
 <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${confirmationUrl}" style="height:52px;v-text-anchor:middle;width:280px;" arcsize="17%" fillcolor="#C4A265" stroke="f"><center style="color:#0C0A07;font-family:Arial,sans-serif;font-size:15px;font-weight:bold;">Confirm my account</center></v:roundrect><![endif]-->
 <!--[if !mso]><!--><a href="${confirmationUrl}" style="display:inline-block; font-family:Arial, Helvetica, sans-serif; font-size:15px; font-weight:bold; letter-spacing:.5px; color:#0C0A07; text-decoration:none; padding:17px 44px; border-radius:9px;">Confirm my account</a><!--<![endif]-->
 </td></tr></table>
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:21px; color:#8a857b; padding-top:6px; max-width:430px; margin:0 auto;">Button not working? Copy this link into your browser:<br><a href="${confirmationUrl}" style="color:#C4A265; word-break:break-all;">${confirmationUrl}</a></div>
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:13px; line-height:21px; color:#8a857b; padding-top:6px; max-width:430px; margin:0 auto;">You received this email because an account was created with this address. Didn't do this? You can safely ignore it.</div>
 </td></tr>
 <tr><td style="padding:0 48px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height:1px; line-height:1px; font-size:0; background-color:#e4ddd0;">&nbsp;</td></tr></table></td></tr>
 <tr><td align="center" style="padding:26px 48px 34px 48px;">
 <div style="font-family:'Cormorant Garamond', Georgia, serif; font-style:italic; font-size:18px; color:#C4A265; padding-bottom:14px;">With love, Luxique</div>
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#9a958b; padding-bottom:10px;"><a href="https://www.luxique.nl/voorwaarden#voorwaarden" style="color:#9a958b; text-decoration:underline;">Terms &amp; Conditions</a> &nbsp;&middot;&nbsp; <a href="https://www.luxique.nl/voorwaarden#privacy" style="color:#9a958b; text-decoration:underline;">Privacy</a></div>
 <div style="font-family:Arial, Helvetica, sans-serif; font-size:12px; line-height:19px; color:#9a958b;">Luxique &middot; <a href="https://www.luxique.nl" style="color:#9a958b; text-decoration:underline;">luxique.nl</a></div>
 </td></tr>
 </table>
 </td></tr>
</table>
</body>
</html>`
}
