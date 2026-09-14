ALTER TABLE public.traject_boekingen
  ADD COLUMN IF NOT EXISTS traject_reminder_verzonden_op timestamptz,
  ADD COLUMN IF NOT EXISTS traject_reminder_fout text;

COMMENT ON COLUMN public.traject_boekingen.traject_reminder_verzonden_op IS
  'Atomic claim and successful-send marker for the one-time pre-course reminder.';

CREATE INDEX IF NOT EXISTS traject_boekingen_reminder_due_idx
  ON public.traject_boekingen (startdatum)
  WHERE aanbetaling_status = 'betaald' AND traject_reminder_verzonden_op IS NULL;
