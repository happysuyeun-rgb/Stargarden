import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { applyStarlightTap, applyWatering } from '../../lib/careActions'
import { getKSTDateString } from '../../lib/datetime'
import { getTodayEnergy } from '../../constants/seeds'
import { GARDEN_START_SLOTS } from '../../constants/game'
import { TOAST } from '../../constants/strings'
import { useGardenSound } from '../../hooks/useGardenSound'
import { shouldShowReturnGreeting } from '../../lib/sleep'
import { getTimeOfDay } from '../../lib/timeOfDay'
import { useAuthStore } from '../../stores/authStore'
import {
  computePlantProgress,
  useGardenStore,
  type GardenPlant,
} from '../../stores/gardenStore'
import { hasReceivedSeedToday, useSeedsStore, type InventorySeed } from '../../stores/seedsStore'
import { useCollectionStore } from '../../stores/collectionStore'
import { useTutorialStore } from '../../stores/tutorialStore'
import { useToastStore } from '../../stores/toastStore'
import { useSoundStore } from '../../stores/soundStore'
import { BloomModal } from './BloomModal'
import { EnergyCard } from './EnergyCard'
import { PlantCarePopover } from './PlantCarePopover'
import { GreenhouseSheet } from './GreenhouseSheet'
import { SeedInventory } from './SeedInventory'
import { SeedReceiveModal } from './SeedReceiveModal'
import { TutorialOverlay } from './TutorialOverlay'
import { useGardenTick } from './useGardenTick'
import { ReturnGreetingModal } from './ReturnGreetingModal'
import './GardenPage.css'

const SoundMixer = lazy(() =>
  import('../sound/SoundMixer').then((m) => ({ default: m.SoundMixer })),
)

const STAGE_EMOJI = ['🌰', '🌱', '🌸']

export function GardenPage() {
  const ohangType = useAuthStore((s) => s.ohangType)
  const isDevMode = useAuthStore((s) => s.isDevMode)
  const lastActiveAt = useAuthStore((s) => s.lastActiveAt)
  const welcomeSeedGranted = useAuthStore((s) => s.welcomeSeedGranted)
  const touchActive = useAuthStore((s) => s.touchActive)
  const markWelcomeSeedGranted = useAuthStore((s) => s.markWelcomeSeedGranted)
  const showToast = useToastStore((s) => s.show)

  const slots = useGardenStore((s) => s.slots)
  const plants = useGardenStore((s) => s.plants)
  const plantingMode = useGardenStore((s) => s.plantingMode)
  const pendingBloomId = useGardenStore((s) => s.pendingBloomId)
  const startPlanting = useGardenStore((s) => s.startPlanting)
  const cancelPlanting = useGardenStore((s) => s.cancelPlanting)
  const plantAtSlot = useGardenStore((s) => s.plantAtSlot)
  const moveToGreenhouse = useGardenStore((s) => s.moveToGreenhouse)
  const moveToGarden = useGardenStore((s) => s.moveToGarden)
  const updatePlant = useGardenStore((s) => s.updatePlant)
  const markBloomed = useGardenStore((s) => s.markBloomed)
  const registerBloom = useCollectionStore((s) => s.registerBloom)
  const collectionEntries = useCollectionStore((s) => s.entries)

  const inventory = useSeedsStore((s) => s.inventory)
  const lastReceivedDate = useSeedsStore((s) => s.lastReceivedDate)
  const clearStaleTodaySeed = useSeedsStore((s) => s.clearStaleTodaySeed)
  const grantDailySeed = useSeedsStore((s) => s.grantDailySeed)
  const grantWelcomeSeed = useSeedsStore((s) => s.grantWelcomeSeed)

  const tutorialActive = useTutorialStore((s) => s.active)
  const tutorialStep = useTutorialStore((s) => s.step)
  const tutorialCompleted = useTutorialStore((s) => s.completed)
  const startTutorial = useTutorialStore((s) => s.start)
  const nextTutorialStep = useTutorialStore((s) => s.nextStep)
  const completeTutorial = useTutorialStore((s) => s.complete)

  const [energyOpen, setEnergyOpen] = useState(false)
  const [inventoryOpen, setInventoryOpen] = useState(false)
  const [greenhouseOpen, setGreenhouseOpen] = useState(false)
  const [fullPromptSeedId, setFullPromptSeedId] = useState<string | null>(null)
  const [relocateSeedId, setRelocateSeedId] = useState<string | null>(null)
  const [returnPlantId, setReturnPlantId] = useState<string | null>(null)
  const [seedModalSeed, setSeedModalSeed] = useState<InventorySeed | null>(null)
  const [kstDate, setKstDate] = useState(() => getKSTDateString())
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [mixerOpen, setMixerOpen] = useState(false)
  const [showReturnGreeting, setShowReturnGreeting] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay)
  const [, setTick] = useState(0)

  const isPlaying = useSoundStore((s) => s.isPlaying)
  const { playBloomSound, startGardenSound } = useGardenSound()

  const slotCount = slots || GARDEN_START_SLOTS
  const gardenPlants = plants.filter((p) => p.location === 'garden')
  const greenhousePlants = plants.filter((p) => p.location === 'greenhouse')
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null
  const bloomPlant = plants.find((p) => p.id === pendingBloomId) ?? null
  const nextBloomCount = bloomPlant
    ? (collectionEntries.find((e) => e.seedId === bloomPlant.seedId)?.bloomCount ?? 0) + 1
    : 1

  useGardenTick()

  // 접속·잠듦/깨어남·웰컴 씨앗·튜토리얼
  useEffect(() => {
    if (shouldShowReturnGreeting(lastActiveAt)) setShowReturnGreeting(true)

    touchActive()

    if (!isDevMode && !welcomeSeedGranted && !tutorialCompleted) {
      const seed = grantWelcomeSeed(ohangType ?? 'wood')
      markWelcomeSeedGranted()
      startTutorial(seed.id)
      setTimeout(() => {
        nextTutorialStep()
        startPlanting(seed.id)
      }, 1500)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 시간대별 배경 갱신 (5분마다)
  useEffect(() => {
    const id = setInterval(() => setTimeOfDay(getTimeOfDay()), 5 * 60 * 1000)
    return () => clearInterval(id)
  }, [])

  // 성장 게이지 실시간 갱신
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000)
    return () => clearInterval(id)
  }, [])

  // 자정을 넘겨도 오늘 씨앗을 다시 판단
  useEffect(() => {
    const refresh = () => {
      setKstDate(getKSTDateString())
      clearStaleTodaySeed()
    }
    refresh()
    const id = setInterval(refresh, 60 * 1000)
    const onVisibility = () => {
      if (document.visibilityState === 'visible') refresh()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [clearStaleTodaySeed])

  // 당일 씨앗 (튜토리얼 완료 후)
  useEffect(() => {
    if (!tutorialCompleted || tutorialActive || hasReceivedSeedToday(lastReceivedDate)) return
    const timer = setTimeout(() => {
      if (hasReceivedSeedToday(useSeedsStore.getState().lastReceivedDate)) return
      const seed = grantDailySeed(getTodayEnergy())
      if (seed) setSeedModalSeed(seed)
    }, 3000)
    return () => clearTimeout(timer)
  }, [lastReceivedDate, kstDate, grantDailySeed, tutorialCompleted, tutorialActive])

  const handleReturnClose = () => {
    setShowReturnGreeting(false)
  }

  const handleTutorialSkip = () => {
    completeTutorial()
    cancelPlanting()
    showToast(TOAST.welcomeSeed)
  }

  const hasEmptySlot = gardenPlants.length < slotCount
  const bloomedInGarden = gardenPlants.filter((p) => p.bloomedAt)

  const beginPlant = (seedId: string) => {
    if (hasEmptySlot) {
      startPlanting(seedId)
      showToast('심을 자리를 선택해주세요')
      return
    }
    if (bloomedInGarden.length === 0) {
      showToast(TOAST.noBloomToMove)
      return
    }
    setFullPromptSeedId(seedId)
  }

  const handleSlotClick = useCallback(
    (index: number, plant: GardenPlant | undefined) => {
      if (relocateSeedId && plant?.bloomedAt && plant.slotIndex === index) {
        const moved = moveToGreenhouse(plant.id)
        if (!moved) return
        startPlanting(relocateSeedId)
        const planted = plantAtSlot(index)
        setRelocateSeedId(null)
        setSelectedPlantId(null)
        showToast(TOAST.movedToGreenhouse)
        if (planted) showToast('씨앗을 심었어요')
        return
      }
      if (returnPlantId && !plant) {
        const ok = moveToGarden(returnPlantId, index)
        if (!ok) return
        setReturnPlantId(null)
        showToast(TOAST.movedToGarden)
        return
      }
      if (plantingMode.active && !plant) {
        const ok = plantAtSlot(index)
        if (ok) {
          showToast('씨앗을 심었어요')
          if (tutorialActive && tutorialStep === 2) {
            nextTutorialStep()
            const planted = useGardenStore.getState().plants.find((p) => p.slotIndex === index)
            if (planted) setSelectedPlantId(planted.id)
          }
        } else {
          showToast(TOAST.gardenFull)
        }
        return
      }
      if (plant) {
        setSelectedPlantId(plant.id)
        return
      }
      if (!tutorialActive) setInventoryOpen(true)
    },
    [
      relocateSeedId,
      returnPlantId,
      moveToGreenhouse,
      moveToGarden,
      startPlanting,
      plantingMode.active,
      plantAtSlot,
      showToast,
      tutorialActive,
      tutorialStep,
      nextTutorialStep,
    ],
  )

  const handleSeedPlant = () => {
    if (!seedModalSeed) return
    beginPlant(seedModalSeed.id)
    setSeedModalSeed(null)
  }

  const handleSeedStore = () => {
    setSeedModalSeed(null)
    showToast('씨앗 주머니에 보관했어요')
  }

  const handleInventoryPlant = (userSeedId: string) => {
    setInventoryOpen(false)
    beginPlant(userSeedId)
  }

  const handleMoveToGreenhouse = () => {
    if (!selectedPlant) return
    if (!moveToGreenhouse(selectedPlant.id)) return
    setSelectedPlantId(null)
    showToast(TOAST.movedToGreenhouse)
  }

  const handleWater = () => {
    if (!selectedPlant) return
    updatePlant(selectedPlant.id, (p) => applyWatering(p))
    showToast('물을 주었어요')
    if (tutorialActive && tutorialStep === 3) {
      completeTutorial()
      showToast(TOAST.welcomeSeed)
      setSelectedPlantId(null)
    }
  }

  const handleStarlight = () => {
    if (!selectedPlant) return
    updatePlant(selectedPlant.id, (p) => applyStarlightTap(p))
  }

  const handleBloomClose = async () => {
    if (pendingBloomId && bloomPlant) {
      const bloomedAt = new Date().toISOString()
      markBloomed(pendingBloomId)
      registerBloom(bloomPlant.seedId, bloomedAt)
      showToast('도감에 등록되었어요')
    }
    await startGardenSound()
  }

  const slotItems = Array.from({ length: slotCount }, (_, i) => {
    const plant = gardenPlants.find((p) => p.slotIndex === i)
    const progress = plant ? computePlantProgress(plant) : null
    return { index: i, plant, progress }
  })

  return (
    <div className={`garden page garden--${timeOfDay}`}>
      <EnergyCard
        expanded={energyOpen}
        onToggle={() => setEnergyOpen((v) => !v)}
        userOhang={ohangType}
      />

      {(plantingMode.active || relocateSeedId || returnPlantId) && (
        <div className="garden__planting-hint" role="status">
          {relocateSeedId
            ? '온실로 옮길 꽃을 골라주세요'
            : returnPlantId
              ? '데려올 자리를 선택하세요'
              : '심을 자리를 선택하세요'}
          {!tutorialActive && (
            <button
              type="button"
              onClick={() => {
                cancelPlanting()
                setRelocateSeedId(null)
                setReturnPlantId(null)
              }}
            >
              취소
            </button>
          )}
        </div>
      )}

      <div className="garden__canvas" role="img" aria-label="정원 캔버스">
        <div className="garden__grid">
          {slotItems.map(({ index, plant, progress }) => (
            <button
              key={index}
              type="button"
              className={[
                'garden__slot',
                plant && 'garden__slot--planted',
                (plantingMode.active || returnPlantId) && !plant && 'garden__slot--highlight',
                relocateSeedId && plant?.bloomedAt && 'garden__slot--highlight',
                tutorialActive && tutorialStep === 2 && !plant && 'garden__slot--tutorial',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSlotClick(index, plant)}
              aria-label={plant ? `${plant.speciesName} 식물` : `빈 슬롯 ${index + 1}`}
            >
              {plant && progress ? (
                <span className="garden__plant" data-stage={progress.growthStage}>
                  {STAGE_EMOJI[progress.growthStage]}
                  <span className="garden__plant-name">{plant.speciesName.slice(0, 2)}</span>
                </span>
              ) : (
                <span className="garden__slot-dot" />
              )}
            </button>
          ))}
        </div>

        {gardenPlants.length === 0 && !plantingMode.active && !tutorialActive && (
          <p className="garden__empty">첫 씨앗을 심어보세요</p>
        )}
      </div>

      <button
        type="button"
        className="garden__inventory-btn"
        onClick={() => setInventoryOpen(true)}
        aria-label="씨앗 주머니"
      >
        🎒 {inventory.length > 0 && <span>{inventory.length}</span>}
      </button>

      <button
        type="button"
        className="garden__greenhouse-btn"
        onClick={() => setGreenhouseOpen(true)}
        aria-label="온실"
      >
        🏡 {greenhousePlants.length > 0 && <span>{greenhousePlants.length}</span>}
      </button>

      <button type="button" className="garden__moon" aria-label="수면 모드 (준비 중)" disabled>
        🌙
      </button>

      <button
        type="button"
        className={`garden__sound-fab${isPlaying ? ' garden__sound-fab--on' : ''}`}
        aria-label="사운드 믹서"
        onClick={() => setMixerOpen(true)}
      >
        {isPlaying ? '🔊' : '🔇'}
      </button>

      {seedModalSeed && !tutorialActive && (
        <SeedReceiveModal
          seed={seedModalSeed}
          onPlant={handleSeedPlant}
          onStore={handleSeedStore}
        />
      )}

      <GreenhouseSheet
        open={greenhouseOpen}
        plants={greenhousePlants}
        onClose={() => setGreenhouseOpen(false)}
        onReturn={(plantId) => {
          if (!hasEmptySlot) {
            showToast(TOAST.gardenFull)
            return
          }
          setGreenhouseOpen(false)
          setReturnPlantId(plantId)
        }}
      />

      {fullPromptSeedId && (
        <div className="garden-full" role="presentation">
          <div className="garden-full__card" role="dialog" aria-modal="true" aria-label="정원이 가득해요">
            <p>{TOAST.gardenFull}</p>
            <button
              type="button"
              onClick={() => {
                setRelocateSeedId(fullPromptSeedId)
                setFullPromptSeedId(null)
              }}
            >
              꽃 고르기
            </button>
            <button
              type="button"
              onClick={() => {
                setFullPromptSeedId(null)
                showToast('씨앗 주머니에 보관했어요')
              }}
            >
              주머니에 보관
            </button>
          </div>
        </div>
      )}

      <SeedInventory
        open={inventoryOpen}
        onClose={() => setInventoryOpen(false)}
        seeds={inventory}
        onPlant={handleInventoryPlant}
      />

      {selectedPlant && (
        <PlantCarePopover
          plant={selectedPlant}
          onClose={() => setSelectedPlantId(null)}
          onWater={handleWater}
          onStarlight={handleStarlight}
          onMoveToGreenhouse={handleMoveToGreenhouse}
        />
      )}

      {!showReturnGreeting && bloomPlant && !bloomPlant.bloomedAt && (
        <BloomModal
          plant={bloomPlant}
          bloomCount={nextBloomCount}
          onClose={handleBloomClose}
          onPlaySound={() => playBloomSound(bloomPlant)}
        />
      )}

      {mixerOpen && (
        <Suspense fallback={null}>
          <SoundMixer open={mixerOpen} onClose={() => setMixerOpen(false)} />
        </Suspense>
      )}
      <TutorialOverlay onSkip={handleTutorialSkip} />
      {showReturnGreeting && <ReturnGreetingModal onClose={handleReturnClose} />}
    </div>
  )
}
