import { useCallback, useEffect, useState } from 'react'
import { applyStarlightTap, applyWatering } from '../../lib/careActions'
import { getTodayEnergy } from '../../constants/seeds'
import { GARDEN_START_SLOTS } from '../../constants/game'
import { TOAST } from '../../constants/strings'
import { useGardenSound } from '../../hooks/useGardenSound'
import { shouldGardenSleep } from '../../lib/sleep'
import { getTimeOfDay } from '../../lib/timeOfDay'
import { useAuthStore } from '../../stores/authStore'
import {
  computePlantProgress,
  useGardenStore,
  type GardenPlant,
} from '../../stores/gardenStore'
import { useSeedsStore } from '../../stores/seedsStore'
import { useCollectionStore } from '../../stores/collectionStore'
import { useTutorialStore } from '../../stores/tutorialStore'
import { useToastStore } from '../../stores/toastStore'
import { useSoundStore } from '../../stores/soundStore'
import { SoundMixer } from '../sound/SoundMixer'
import { BloomModal } from './BloomModal'
import { EnergyCard } from './EnergyCard'
import { PlantCarePopover } from './PlantCarePopover'
import { SeedInventory } from './SeedInventory'
import { SeedReceiveModal } from './SeedReceiveModal'
import { TutorialOverlay } from './TutorialOverlay'
import { useGardenTick } from './useGardenTick'
import { WakeUpModal } from './WakeUpModal'
import './GardenPage.css'

const STAGE_EMOJI = ['🌰', '🌱', '🌸']

export function GardenPage() {
  const ohangType = useAuthStore((s) => s.ohangType)
  const isDevMode = useAuthStore((s) => s.isDevMode)
  const lastActiveAt = useAuthStore((s) => s.lastActiveAt)
  const isGardenSleeping = useAuthStore((s) => s.isGardenSleeping)
  const welcomeSeedGranted = useAuthStore((s) => s.welcomeSeedGranted)
  const touchActive = useAuthStore((s) => s.touchActive)
  const setGardenSleeping = useAuthStore((s) => s.setGardenSleeping)
  const markWelcomeSeedGranted = useAuthStore((s) => s.markWelcomeSeedGranted)
  const showToast = useToastStore((s) => s.show)

  const slots = useGardenStore((s) => s.slots)
  const plants = useGardenStore((s) => s.plants)
  const plantingMode = useGardenStore((s) => s.plantingMode)
  const pendingBloomId = useGardenStore((s) => s.pendingBloomId)
  const startPlanting = useGardenStore((s) => s.startPlanting)
  const cancelPlanting = useGardenStore((s) => s.cancelPlanting)
  const plantAtSlot = useGardenStore((s) => s.plantAtSlot)
  const updatePlant = useGardenStore((s) => s.updatePlant)
  const markBloomed = useGardenStore((s) => s.markBloomed)
  const applyGardenSleep = useGardenStore((s) => s.applyGardenSleep)
  const registerBloom = useCollectionStore((s) => s.registerBloom)

  const inventory = useSeedsStore((s) => s.inventory)
  const hasReceivedToday = useSeedsStore((s) => s.hasReceivedToday)
  const todaySeed = useSeedsStore((s) => s.todaySeed)
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
  const [seedModalSeed, setSeedModalSeed] = useState(todaySeed)
  const [selectedPlantId, setSelectedPlantId] = useState<string | null>(null)
  const [mixerOpen, setMixerOpen] = useState(false)
  const [showWakeModal, setShowWakeModal] = useState(false)
  const [timeOfDay, setTimeOfDay] = useState(getTimeOfDay)
  const [, setTick] = useState(0)

  const isPlaying = useSoundStore((s) => s.isPlaying)
  const { playBloomSound, startGardenSound } = useGardenSound(plants)

  const slotCount = slots || GARDEN_START_SLOTS
  const selectedPlant = plants.find((p) => p.id === selectedPlantId) ?? null
  const bloomPlant = plants.find((p) => p.id === pendingBloomId) ?? null

  useGardenTick()

  // 접속·잠듦/깨어남·웰컴 씨앗·튜토리얼
  useEffect(() => {
    const wasLongAbsent = shouldGardenSleep(lastActiveAt)

    if (wasLongAbsent && !isGardenSleeping) {
      applyGardenSleep(true)
      setGardenSleeping(true)
      setShowWakeModal(true)
    } else if (isGardenSleeping && wasLongAbsent) {
      setShowWakeModal(true)
    }

    touchActive()

    if (!isDevMode && !welcomeSeedGranted && !tutorialCompleted) {
      const seed = grantWelcomeSeed()
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

  // 당일 씨앗 (튜토리얼 완료 후)
  useEffect(() => {
    if (!tutorialCompleted || hasReceivedToday || tutorialActive) return
    const timer = setTimeout(() => {
      const seed = grantDailySeed(getTodayEnergy())
      setSeedModalSeed(seed)
    }, 3000)
    return () => clearTimeout(timer)
  }, [hasReceivedToday, grantDailySeed, tutorialCompleted, tutorialActive])

  const handleWakeClose = () => {
    applyGardenSleep(false)
    setGardenSleeping(false)
    setShowWakeModal(false)
    showToast('정원이 깨어났어요')
  }

  const handleTutorialSkip = () => {
    completeTutorial()
    cancelPlanting()
    showToast(TOAST.welcomeSeed)
  }

  const handleSlotClick = useCallback(
    (index: number, plant: GardenPlant | undefined) => {
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
    [plantingMode.active, plantAtSlot, showToast, tutorialActive, tutorialStep, nextTutorialStep],
  )

  const handleSeedPlant = () => {
    if (!seedModalSeed) return
    const emptySlots = Array.from({ length: slotCount }, (_, i) => i).filter(
      (i) => !plants.some((p) => p.slotIndex === i),
    )
    if (emptySlots.length === 0) {
      showToast(TOAST.gardenFull)
      setSeedModalSeed(null)
      return
    }
    startPlanting(seedModalSeed.id)
    setSeedModalSeed(null)
    showToast('심을 자리를 선택해주세요')
  }

  const handleSeedStore = () => {
    setSeedModalSeed(null)
    showToast('씨앗 주머니에 보관했어요')
  }

  const handleInventoryPlant = (userSeedId: string) => {
    setInventoryOpen(false)
    startPlanting(userSeedId)
    showToast('심을 자리를 선택해주세요')
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
    const plant = plants.find((p) => p.slotIndex === i)
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

      {plantingMode.active && (
        <div className="garden__planting-hint" role="status">
          심을 자리를 선택하세요
          {!tutorialActive && (
            <button type="button" onClick={cancelPlanting}>
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
                plantingMode.active && !plant && 'garden__slot--highlight',
                plant?.isSleeping && 'garden__slot--sleeping',
                tutorialActive && tutorialStep === 2 && !plant && 'garden__slot--tutorial',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => handleSlotClick(index, plant)}
              aria-label={plant ? `${plant.speciesName} 식물` : `빈 슬롯 ${index + 1}`}
            >
              {plant && progress ? (
                <span className="garden__plant" data-stage={progress.growthStage}>
                  {plant.isSleeping ? '💤' : STAGE_EMOJI[progress.growthStage]}
                  <span className="garden__plant-name">{plant.speciesName.slice(0, 2)}</span>
                </span>
              ) : (
                <span className="garden__slot-dot" />
              )}
            </button>
          ))}
        </div>

        {plants.length === 0 && !plantingMode.active && !tutorialActive && (
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
        />
      )}

      {bloomPlant && !bloomPlant.bloomedAt && (
        <BloomModal
          plant={bloomPlant}
          onClose={handleBloomClose}
          onPlaySound={() => playBloomSound(bloomPlant)}
        />
      )}

      <SoundMixer open={mixerOpen} onClose={() => setMixerOpen(false)} />
      <TutorialOverlay onSkip={handleTutorialSkip} />
      {showWakeModal && <WakeUpModal onClose={handleWakeClose} />}
    </div>
  )
}
