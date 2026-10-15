import { beforeEach, describe, expect, it } from 'vitest'
import { CARE_BONUS, GROWTH_HOURS, MIN_SIGNUP_AGE } from './constants/game'
import { applyStarlightTap, applyWatering, canTapStarlight, canWaterToday } from './lib/careActions'
import { getInternationalAge, getKSTDateString } from './lib/datetime'
import { calcGrowthProgress } from './lib/growth'
import { shouldShowReturnGreeting } from './lib/sleep'
import { hasReceivedSeedToday, useSeedsStore } from './stores/seedsStore'
import type { GardenPlant } from './stores/gardenStore'

function previousDate(date: string): string {
  const [year, month, day] = date.split('-').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day))
  utc.setUTCDate(utc.getUTCDate() - 1)
  return utc.toISOString().slice(0, 10)
}

function plant(overrides: Partial<GardenPlant> = {}): GardenPlant {
  return {
    id: 'plant-1',
    userSeedId: 'useed-1',
    seedId: 'seed-1',
    location: 'garden',
    slotIndex: 0,
    speciesName: '새싹풀',
    ohangType: 'wood',
    rarity: 'normal',
    requiredHours: 48,
    plantedAt: '2026-10-14T03:00:00.000Z',
    careBonusHours: 0,
    lastWateredAt: null,
    starlightTapsToday: 0,
    starlightDate: null,
    bloomedAt: null,
    ...overrides,
  }
}

describe('일일 씨앗', () => {
  beforeEach(() => {
    useSeedsStore.getState().reset()
  })

  it('오늘 받으면 오늘은 다시 못 받고, 어제 날짜면 다시 받는다', () => {
    const today = getKSTDateString()
    const first = useSeedsStore.getState().grantDailySeed('wood')
    const second = useSeedsStore.getState().grantDailySeed('wood')

    expect(first).not.toBeNull()
    expect(second?.id).toBe(first?.id)
    expect(hasReceivedSeedToday(useSeedsStore.getState().lastReceivedDate)).toBe(true)
    expect(useSeedsStore.getState().inventory.filter((s) => s.grantSource === 'daily')).toHaveLength(1)

    useSeedsStore.setState({ lastReceivedDate: previousDate(today), todaySeed: null })
    expect(hasReceivedSeedToday(useSeedsStore.getState().lastReceivedDate)).toBe(false)

    const next = useSeedsStore.getState().grantDailySeed('fire')
    expect(next?.id).not.toBe(first?.id)
    expect(useSeedsStore.getState().lastReceivedDate).toBe(today)
    expect(useSeedsStore.getState().inventory.filter((s) => s.grantSource === 'daily')).toHaveLength(2)
  })
})

describe('복귀 연출', () => {
  it('8일 만에 접속하면 복귀 연출을 보여주고 물주기는 가능하다', () => {
    const now = new Date('2026-10-15T03:00:00.000Z')
    const last = new Date('2026-10-07T03:00:00.000Z')
    expect(shouldShowReturnGreeting(last.toISOString(), now)).toBe(true)
    expect(canWaterToday(plant(), now)).toBe(true)
  })

  it('6일 만에 접속하면 복귀 연출이 없다', () => {
    const now = new Date('2026-10-15T03:00:00.000Z')
    const last = new Date('2026-10-09T03:00:00.000Z')
    expect(shouldShowReturnGreeting(last.toISOString(), now)).toBe(false)
  })

  it('비운 동안의 시간이 성장에 모두 반영된다', () => {
    const now = new Date('2026-10-15T03:00:00.000Z')
    const plantedAt = new Date('2026-10-05T03:00:00.000Z')
    const progress = calcGrowthProgress({
      plantedAt,
      requiredHours: GROWTH_HOURS.normal,
      careBonusHours: 0,
      now,
    })
    const elapsedHours = (now.getTime() - plantedAt.getTime()) / (1000 * 60 * 60)
    expect(progress).toBeCloseTo(elapsedHours / GROWTH_HOURS.normal)
  })
})

describe('별빛', () => {
  it('하루 40탭에서 보너스가 상한에서 멈추고, 날짜가 바뀌면 다시 쌓인다', () => {
    const now = new Date('2026-10-15T03:00:00.000Z')
    let current = plant()
    let taps = 0
    while (canTapStarlight(current, now)) {
      current = applyStarlightTap(current, now)
      taps += 1
    }

    expect(taps).toBe(40)
    expect(current.careBonusHours).toBe(CARE_BONUS.starlightDailyCap)
    expect(applyStarlightTap(current, now).careBonusHours).toBe(current.careBonusHours)

    const nextDay = new Date('2026-10-16T03:00:00.000Z')
    let resumed = current
    for (let i = 0; i < 10; i += 1) resumed = applyStarlightTap(resumed, nextDay)
    expect(resumed.starlightDate).toBe(getKSTDateString(nextDay))
    expect(resumed.starlightTapsToday).toBe(10)
    expect(resumed.careBonusHours).toBe(CARE_BONUS.starlightDailyCap + CARE_BONUS.starlight)
  })
})

describe('물주기', () => {
  it('같은 KST 날짜에는 한 번만 가능하다', () => {
    const now = new Date('2026-10-15T03:00:00.000Z')
    const later = new Date('2026-10-15T10:00:00.000Z')
    const nextDay = new Date('2026-10-16T03:00:00.000Z')
    const watered = applyWatering(plant(), now)

    expect(canWaterToday(watered, later)).toBe(false)
    expect(applyWatering(watered, later).lastWateredAt).toBe(watered.lastWateredAt)
    expect(canWaterToday(watered, nextDay)).toBe(true)
  })
})

describe('온보딩 나이', () => {
  it('2015년생은 만 14세 미만이라 가입할 수 없다', () => {
    expect(getInternationalAge('2015-06-01', '2026-10-15')).toBeLessThan(MIN_SIGNUP_AGE)
    expect(getInternationalAge('2012-10-15', '2026-10-15')).toBe(MIN_SIGNUP_AGE)
  })
})
