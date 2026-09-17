export interface TrajectoryReminderCandidate {
  id: string
  cursus_id: string
  cursus_naam: string
  startdatum: string
  starttijd: string
  blok_dagen: string[]
  klant_naam: string
  klant_email: string
  aanbetaling_cents: number
  restbedrag_cents: number
}

export interface TrajectoryReminderResult {
  id: string
  action: 'sent' | 'skipped' | 'error'
  error?: string
}

export async function runTrajectoryReminderCandidates(
  candidates: TrajectoryReminderCandidate[],
  claim: (id: string) => Promise<boolean>,
  send: (candidate: TrajectoryReminderCandidate) => Promise<void>,
  release: (id: string, error: string) => Promise<void>,
): Promise<TrajectoryReminderResult[]> {
  const results: TrajectoryReminderResult[] = []
  for (const candidate of candidates) {
    try {
      if (!(await claim(candidate.id))) {
        results.push({ id: candidate.id, action: 'skipped' })
        continue
      }
      try {
        await send(candidate)
        results.push({ id: candidate.id, action: 'sent' })
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        await release(candidate.id, message)
        results.push({ id: candidate.id, action: 'error', error: message })
      }
    } catch (error) {
      results.push({ id: candidate.id, action: 'error', error: error instanceof Error ? error.message : String(error) })
    }
  }
  return results
}
