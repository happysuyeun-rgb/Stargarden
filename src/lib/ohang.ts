import type { OhangType } from '../constants/strings'

const OHANG_BY_DIGIT: OhangType[] = ['wood', 'fire', 'earth', 'metal', 'water']

/** 3단계 목업용 간이 산출 — Phase 4에서 만세력 로직으로 교체 */
export function calcOhangStub(birthDate: string): OhangType {
  const day = Number.parseInt(birthDate.slice(-2), 10)
  return OHANG_BY_DIGIT[day % OHANG_BY_DIGIT.length]
}

export const OHANG_DESCRIPTIONS: Record<
  OhangType,
  { title: string; lines: string[] }
> = {
  wood: {
    title: '당신의 정원에는 나무(木)의 기운이 흐릅니다',
    lines: [
      '새로움을 향해 자라나는 힘이 당신 안에 있어요.',
      '서두르지 않아도, 작은 시작이 큰 숲이 됩니다.',
      '오늘도 한 걸음, 부드럽게 나아가 보세요.',
    ],
  },
  fire: {
    title: '당신의 정원에는 불(火)의 기운이 흐릅니다',
    lines: [
      '따뜻한 열정이 당신의 마음을 비추고 있어요.',
      '작은 불꽃 하나가 밤하늘을 밝힐 수 있습니다.',
      '오늘 하고 싶었던 일에 손을 내밀어 보세요.',
    ],
  },
  earth: {
    title: '당신의 정원에는 흙(土)의 기운이 흐릅니다',
    lines: [
      '단단한 뿌리가 당신을 지탱하고 있어요.',
      '느리게 가도 괜찮아요. 기다림도 성장의 일부입니다.',
      '오늘은 마음을 다지고 쉬어가도 좋은 날이에요.',
    ],
  },
  metal: {
    title: '당신의 정원에는 금(金)의 기운이 흐릅니다',
    lines: [
      '맑고 정돈된 기운이 당신을 감싸고 있어요.',
      '혼란 속에서도 중심을 찾을 수 있는 힘이 있습니다.',
      '오늘은 생각을 가다듬고 마음을 정리해 보세요.',
    ],
  },
  water: {
    title: '당신의 정원에는 물(水)의 기운이 흐릅니다',
    lines: [
      '고요히 흐르는 감수성이 당신의 강점이에요.',
      '유연하게 흘러가며 스스로를 돌아볼 수 있습니다.',
      '오늘 하루도 다정하게 흘러가길 바랍니다.',
    ],
  },
}
