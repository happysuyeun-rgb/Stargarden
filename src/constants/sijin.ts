export interface SijinSlot {
  code: string
  label: string
  range: string
}

/** 시진 12칸 (목업용 정적 데이터) */
export const SIJIN_SLOTS: SijinSlot[] = [
  { code: 'ja', label: '자시', range: '23:30~01:29' },
  { code: 'chuk', label: '축시', range: '01:30~03:29' },
  { code: 'in', label: '인시', range: '03:30~05:29' },
  { code: 'myo', label: '묘시', range: '05:30~07:29' },
  { code: 'jin', label: '진시', range: '07:30~09:29' },
  { code: 'sa', label: '사시', range: '09:30~11:29' },
  { code: 'o', label: '오시', range: '11:30~13:29' },
  { code: 'mi', label: '미시', range: '13:30~15:29' },
  { code: 'shin', label: '신시', range: '15:30~17:29' },
  { code: 'yu', label: '유시', range: '17:30~19:29' },
  { code: 'sul', label: '술시', range: '19:30~21:29' },
  { code: 'hae', label: '해시', range: '21:30~23:29' },
]
