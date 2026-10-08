export const COMPLETED_MANUAL_REFUND_LABEL = 'Geannuleerd + terugbetaald'

export function completedManualRefundLabel(refundedAt: string | null | undefined): string | null {
  return refundedAt ? COMPLETED_MANUAL_REFUND_LABEL : null
}
