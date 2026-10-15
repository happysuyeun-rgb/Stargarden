import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OhangType } from '../constants/strings'

export interface BirthProfile {
  birthDate: string
  isLunar: boolean
  birthTimeUnknown: boolean
  birthTime: string | null
}

export interface ConsentRecord {
  termsVersion: string
  privacyVersion: string
  marketingOptIn: boolean
  agreedAt: string
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
  consent: ConsentRecord | null
  setOnboarded: (ohangType: OhangType, profile?: BirthProfile) => void
  setConsent: (consent: ConsentRecord) => void
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
      consent: null,
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
          devUserId: '00000000-0000-0000-0000-00000000de01',
          lastActiveAt: new Date().toISOString(),
          welcomeSeedGranted: true,
        }),
      touchActive: () => set({ lastActiveAt: new Date().toISOString() }),
      setGardenSleeping: (isGardenSleeping) => set({ isGardenSleeping }),
      markWelcomeSeedGranted: () => set({ welcomeSeedGranted: true }),
      setConsent: (consent) => set({ consent }),
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
          consent: null,
        }),
    }),
    { name: 'stargarden-auth' },
  ),
)
