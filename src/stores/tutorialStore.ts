import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface TutorialState {
  completed: boolean
  active: boolean
  step: 1 | 2 | 3
  welcomeSeedId: string | null
  start: (welcomeSeedId: string) => void
  nextStep: () => void
  complete: () => void
  reset: () => void
}

export const useTutorialStore = create<TutorialState>()(
  persist(
    (set, get) => ({
      completed: false,
      active: false,
      step: 1,
      welcomeSeedId: null,
      start: (welcomeSeedId) =>
        set({ active: true, step: 1, welcomeSeedId, completed: false }),
      nextStep: () => {
        const { step } = get()
        if (step < 3) set({ step: (step + 1) as 1 | 2 | 3 })
        else get().complete()
      },
      complete: () =>
        set({ active: false, completed: true, welcomeSeedId: null, step: 1 }),
      reset: () =>
        set({ completed: false, active: false, step: 1, welcomeSeedId: null }),
    }),
    { name: 'stargarden-tutorial' },
  ),
)
