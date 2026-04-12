import type { ScenarioDifficulty } from '@/data/scenarios'

export type DifficultyUiLabel = 'Easy' | 'Medium' | 'Hard'

export function difficultyUiLabel(d: ScenarioDifficulty): DifficultyUiLabel {
  switch (d) {
    case 'Beginner':
      return 'Easy'
    case 'Intermediate':
      return 'Medium'
    case 'Advanced':
      return 'Hard'
    default:
      return 'Medium'
  }
}

