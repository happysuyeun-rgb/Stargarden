import { BottomSheet } from '../../components/BottomSheet'
import { OhangBadge } from '../../components/OhangBadge'
import type { InventorySeed } from '../../stores/seedsStore'
import './SeedInventory.css'

interface SeedInventoryProps {
  open: boolean
  onClose: () => void
  seeds: InventorySeed[]
  onPlant: (seedId: string) => void
}

export function SeedInventory({ open, onClose, seeds, onPlant }: SeedInventoryProps) {
  return (
    <BottomSheet open={open} onClose={onClose} title="씨앗 주머니">
      {seeds.length === 0 ? (
        <p className="seed-inventory__empty">내일 새로운 씨앗이 찾아와요</p>
      ) : (
        <ul className="seed-inventory__grid">
          {seeds.map((seed) => (
            <li key={seed.id}>
              <button
                type="button"
                className="seed-inventory__item"
                onClick={() => onPlant(seed.id)}
              >
                <OhangBadge type={seed.ohangType} size="sm" />
                <span className="seed-inventory__name">{seed.speciesName}</span>
                {seed.rarity === 'rare' && (
                  <span className="seed-inventory__rare">희귀</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  )
}
