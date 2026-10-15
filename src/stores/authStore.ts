import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OhangType } from '../constants/strings'

export interface BirthProfile {
  birthDate: string
  isLunar: boolean
  birthTimeUnknown: boolean
  birthTime: string | null
}

interface AuthState {
  isOnboarded: boolean
  ohangType: OhangType | null
  birthProfile: BirthProfile | null
  isDevMode: boolean
  devUserId: string | null
  lastActiveAt: string | null
  isGardenSleeping: boolean
  welcomeSeedGranted: boolean
  setOnboarded: (ohangType: OhangType, profile?: BirthProfile) => void
  enterDevMode: (ohangType?: OhangType) => void
  touchActive: () => void
  setGardenSleeping: (sleeping: boolean) => void
  markWelcomeSeedGranted: () => void
  reset: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isOnboarded: false,
      ohangType: null,
      birthProfile: null,
      isDevMode: false,
      devUserId: null,
      lastActiveAt: null,
      isGardenSleeping: false,
      welcomeSeedGranted: false,
      setOnboarded: (ohangType, profile) =>
        set({
          isOnboarded: true,
          ohangType,
          birthProfile: profile ?? null,
          isDevMode: false,
          devUserId: null,
          lastActiveAt: new Date().toISOString(),
        }),
      enterDevMode: (ohangType = 'water') =>
        set({
          isOnboarded: true,
          ohangType,
          isDevMode: true,
          devUserId: '00000000-0000-0000-0000-dev00000001',
          lastActiveAt: new Date().toISOString(),
          welcomeSeedGranted: true,
        }),
      touchActive: () => set({ lastActiveAt: new Date().toISOString() }),
      setGardenSleeping: (isGardenSleeping) => set({ isGardenSleeping }),
      markWelcomeSeedGranted: () => set({ welcomeSeedGranted: true }),
      reset: () =>
        set({
          isOnboarded: false,
          ohangType: null,
          birthProfile: null,
          isDevMode: false,
          devUserId: null,
          lastActiveAt: null,
          isGardenSleeping: false,
          welcomeSeedGranted: false,
        }),
    }),
    { name: 'stargarden-auth' },
  ),
)
