import { useEffect } from 'react'
import { computePlantProgress, useGardenStore } from '../../stores/gardenStore'

/** 성장 진행률 갱신 + 개화 대기 감지 */
export function useGardenTick() {
  const plants = useGardenStore((s) => s.plants)
  const setPendingBloom = useGardenStore((s) => s.setPendingBloom)
  const pendingBloomId = useGardenStore((s) => s.pendingBloomId)

  useEffect(() => {
    const check = () => {
      const now = new Date()
      for (const plant of plants) {
        if (plant.bloomedAt) continue
        const { progress } = computePlantProgress(plant, now)
        if (progress >= 1 && pendingBloomId !== plant.id) {
          setPendingBloom(plant.id)
          break
        }
      }
    }

    check()
    const id = setInterval(check, 5000)
    return () => clearInterval(id)
  }, [plants, pendingBloomId, setPendingBloom])
}
