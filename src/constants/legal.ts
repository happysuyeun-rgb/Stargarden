export const LEGAL_VERSION = '2026-10-15'

export const LEGAL_DOCS = {
  terms: {
    title: '서비스 이용약관',
    version: LEGAL_VERSION,
    body: '이 문서는 자리표시자예요. 서비스 이용 조건의 최종 문안이 준비되면 이 내용을 교체합니다.',
  },
  privacy: {
    title: '개인정보 수집·이용',
    version: LEGAL_VERSION,
    body: [
      '이 문서는 자리표시자예요. 개인정보 처리방침의 최종 문안이 준비되면 이 내용을 교체합니다.',
      '',
      '수집 항목: 생년월일, 태어난 시간, 양력/음력',
      '목적: 오행 기질 산출과 맞춤 콘텐츠 제공',
      '보관 기간: 회원 탈퇴 시까지',
    ].join('\n'),
  },
  marketing: {
    title: '마케팅 정보 수신',
    version: LEGAL_VERSION,
    body: '이 문서는 자리표시자예요. 새로운 이야기와 안내를 받을지에 대한 최종 문안이 준비되면 이 내용을 교체합니다.',
  },
} as const

export type LegalDocId = keyof typeof LEGAL_DOCS
