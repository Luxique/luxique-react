export interface ReviewRequestCandidate {
  id: string
  source: 'online' | 'manual'
  cal_booking_uid: string
  event_type: string
  slot_start: string
  duration_minutes: number
  customer_name?: string | null
  customer_email?: string | null
  user_id?: string | null
}

export function reviewRequestEndTime(candidate: ReviewRequestCandidate): Date {
  return new Date(new Date(candidate.slot_start).getTime() + candidate.duration_minutes * 60_000)
}

export function isReviewRequestDue(candidate: ReviewRequestCandidate, now: Date): boolean {
  return reviewRequestEndTime(candidate).getTime() <= now.getTime()
}

export function dueReviewRequestCandidates(
  candidates: ReviewRequestCandidate[],
  now: Date,
): ReviewRequestCandidate[] {
  return candidates.filter((candidate) => isReviewRequestDue(candidate, now))
}

export interface ReviewRequestResult {
  id: string
  source: ReviewRequestCandidate['source']
  action: 'sent' | 'skipped' | 'error'
  error?: string
}

export async function runReviewRequestCandidates(
  candidates: ReviewRequestCandidate[],
  claim: (candidate: ReviewRequestCandidate) => Promise<boolean>,
  send: (candidate: ReviewRequestCandidate) => Promise<void>,
  release: (candidate: ReviewRequestCandidate, error: string) => Promise<void>,
): Promise<ReviewRequestResult[]> {
  const results: ReviewRequestResult[] = []

  for (const candidate of candidates) {
    try {
      if (!(await claim(candidate))) {
        results.push({ id: candidate.id, source: candidate.source, action: 'skipped' })
        continue
      }

      try {
        await send(candidate)
        results.push({ id: candidate.id, source: candidate.source, action: 'sent' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await release(candidate, message)
        results.push({ id: candidate.id, source: candidate.source, action: 'error', error: message })
      }
    } catch (error) {
      results.push({
        id: candidate.id,
        source: candidate.source,
        action: 'error',
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }

  return results
}
