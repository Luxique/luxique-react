import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer-core'
import chromium from '@sparticuz/chromium'
import { readFileSync } from 'fs'
import { join } from 'path'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

function getTemplateHtml(recipientName: string, courseName: string, dateStr: string, certificateId: string): string {
  const templatePath = join(process.cwd(), 'src', 'lib', 'certificate-template.html')
  let html = readFileSync(templatePath, 'utf-8')

  // Auto-shrink long names: reduce font-size based on character count
  const nameLength = recipientName.length
  let nameStyle = ''
  if (nameLength > 20) {
    const shrink = Math.max(0.55, 1 - (nameLength - 20) * 0.025)
    nameStyle = `<style>.name{font-size:${Math.round(72 * shrink)}px !important}</style>`
  }

  html = html
    .replace(/\{\{RECIPIENT_NAME\}\}/g, recipientName)
    .replace(/\{\{COURSE_NAME\}\}/g, courseName)
    .replace(/\{\{DATE\}\}/g, dateStr)
    .replace(/\{\{CERTIFICATE_ID\}\}/g, certificateId)

  // Inject auto-shrink style before </head>
  if (nameStyle) {
    html = html.replace('</head>', `${nameStyle}</head>`)
  }

  return html
}

function generateCertificateId(userId: string, courseId: string): string {
  // Deterministic ID from user+course — always the same for the same person+course
  const crypto = require('crypto')
  const hash = crypto.createHash('sha256').update(`${userId}:${courseId}`).digest('hex')
  // Take first 4 hex chars → convert to a number 0001-9999
  const num = (parseInt(hash.substring(0, 4), 16) % 9999) + 1
  const year = new Date().getFullYear()
  return `LXQ-${year}-${String(num).padStart(4, '0')}`
}

function formatDateEN(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId } = await request.json()

    if (!userId || !courseId) {
      return NextResponse.json({ error: 'Missing userId or courseId' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
    const supabase = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })

    // 1. Fetch user profile (name)
    let recipientName = 'Student'
    const { data: authUser } = await supabase.auth.admin.getUserById(userId)
    if (authUser?.user) {
      recipientName =
        (authUser.user.user_metadata?.full_name as string) ||
        (authUser.user.user_metadata?.first_name as string) ||
        authUser.user.email?.split('@')[0] ||
        'Student'
    }

    // 2. Fetch course title
    const { data: course } = await supabase
      .from('courses')
      .select('title')
      .eq('id', courseId)
      .single()
    const courseTitle = course?.title || 'LUXIQUE Academy Course'

    // 3. Find the exam lesson + check if passed
    const { data: examLesson } = await supabase
      .from('lessons')
      .select('id')
      .eq('course_id', courseId)
      .eq('lesson_type', 'exam')
      .single()

    let completedAt = new Date().toISOString()
    let examPassed = false

    if (examLesson) {
      const { data: progress } = await supabase
        .from('lesson_progress')
        .select('completed, completed_at')
        .eq('user_id', userId)
        .eq('lesson_id', examLesson.id)
        .single()

      examPassed = !!progress?.completed
      if (!examPassed) {
        return NextResponse.json({ error: 'Exam not passed yet' }, { status: 403 })
      }
      if (progress!.completed_at) {
        completedAt = progress!.completed_at
      }
    } else {
      // No exam lesson — check if all content lessons are completed
      const { data: contentLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('course_id', courseId)
        .neq('lesson_type', 'exam')

      if (contentLessons && contentLessons.length > 0) {
        const { data: allProgress } = await supabase
          .from('lesson_progress')
          .select('lesson_id, completed')
          .eq('user_id', userId)
          .in('lesson_id', contentLessons.map(l => l.id))

        const allDone = contentLessons.every(l =>
          allProgress?.some(p => p.lesson_id === l.id && p.completed)
        )

        if (!allDone) {
          return NextResponse.json({ error: 'Course not completed yet' }, { status: 403 })
        }

        // Use the latest completed_at as the certificate date
        const { data: latestProgress } = await supabase
          .from('lesson_progress')
          .select('completed_at')
          .eq('user_id', userId)
          .in('lesson_id', contentLessons.map(l => l.id))
          .order('completed_at', { ascending: false })
          .limit(1)
          .single()

        if (latestProgress?.completed_at) {
          completedAt = latestProgress.completed_at
        }
      }
    }

    // 4. Generate deterministic certificate ID
    const certificateId = generateCertificateId(userId, courseId)
    const dateStr = formatDateEN(completedAt)

    // 5. Build HTML
    const html = getTemplateHtml(recipientName, courseTitle, dateStr, certificateId)

    // 6. Launch Puppeteer with @sparticuz/chromium (Vercel-compatible)
    const executablePath = await chromium.executablePath()

    const browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: executablePath || undefined,
      headless: true,
      defaultViewport: { width: 1200, height: 850 },
    })

    try {
      const page = await browser.newPage()

      // Set content and wait for fonts to load
      await page.setContent(html, { waitUntil: 'load' })

      // Wait for network idle (fonts loaded from Google Fonts)
      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 10000 }).catch(() => {})

      // Wait for Google Fonts to be fully loaded
      await page.evaluate(() => {
        return (document as any).fonts.ready
      })
      // Extra small delay for font rendering
      await new Promise(r => setTimeout(r, 500))

      // Generate PDF — A4 landscape
      const pdfBuffer = await page.pdf({
        width: '297mm',
        height: '210mm',
        printBackground: true,
        preferCSSPageSize: true,
        margin: { top: 0, right: 0, bottom: 0, left: 0 },
      })

      return new NextResponse(new Uint8Array(pdfBuffer), {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="LUXIQUE-Certificate-${certificateId}.pdf"`,
          'Cache-Control': 'public, max-age=3600',
        },
      })
    } finally {
      await browser.close()
    }
  } catch (err) {
    console.error('Certificate generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate certificate', details: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
