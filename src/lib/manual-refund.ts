export function needsManualRefund(input: {
  source: 'manual' | 'online'
  status: string
  salonDepositStatus?: string | null
  depositCents?: number | null
  cancelledWithin24h?: boolean | null
}) {
  return input.source === 'manual'
    && input.status === 'cancelled'
    && input.salonDepositStatus === 'paid'
    && Number(input.depositCents || 0) > 0
    && input.cancelledWithin24h === false
}

