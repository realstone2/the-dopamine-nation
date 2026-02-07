const LOSS_MENTS = [
  '이 스테이션의 공인 호구',
  'ATM 그 자체',
  '운이 없는 쓰레기',
  '도파민 기부 천사',
  '바닥을 뚫고 지하실로',
];

const WIN_MENTS = [
  '도파민 빌런',
  '주변인 지갑 파괴자',
  '꽁짜 도파민 주입기',
  '이 스테이션의 상어',
  '도파민 왕좌의 주인',
];

const NEUTRAL_MENTS = [
  '균형의 신',
  '노는 건 좋은데 실력은 평범',
];

/** 도파민 수지에 따라 놀림 멘트를 반환 */
export function getTeaseMent(totalBalance: number): string {
  if (totalBalance < 0) {
    return LOSS_MENTS[Math.abs(totalBalance) % LOSS_MENTS.length];
  }
  if (totalBalance > 0) {
    return WIN_MENTS[totalBalance % WIN_MENTS.length];
  }
  return NEUTRAL_MENTS[0];
}

/** 도파민 수지에 따라 이모지를 반환 */
export function getTeaseEmoji(totalBalance: number): string {
  if (totalBalance < 0) return '🔥';
  if (totalBalance > 0) return '😎';
  return '⚖️';
}
