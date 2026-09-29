export interface QuizOption {
  id: string
  correct: boolean
}

export type QuizSelection = string | string[]

export function isMultiSelectQuestion(options: QuizOption[]): boolean {
  return options.filter(option => option.correct).length > 1
}

export function normalizeQuizSelection(selection: QuizSelection | undefined): string[] {
  if (Array.isArray(selection)) return Array.from(new Set(selection)).filter(Boolean)
  return selection ? [selection] : []
}

export function toggleQuizSelection(selection: QuizSelection | undefined, optionId: string, multiple: boolean): QuizSelection {
  if (!multiple) return optionId
  const selected = normalizeQuizSelection(selection)
  return selected.includes(optionId)
    ? selected.filter(id => id !== optionId)
    : [...selected, optionId]
}

export function isExactQuizSelectionCorrect(options: QuizOption[], selection: QuizSelection | undefined): boolean {
  const correct = options.filter(option => option.correct).map(option => option.id).sort()
  const selected = normalizeQuizSelection(selection).sort()
  return correct.length > 0 && correct.length === selected.length && correct.every((id, index) => id === selected[index])
}
