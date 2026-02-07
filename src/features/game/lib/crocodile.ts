const DEFAULT_TEETH_COUNT = 12;

export interface CrocodilePlayer {
  userId: string;
  nickname: string;
}

export interface CrocodileState {
  teethCount: number;
  trapIndex: number;
  pressedTeeth: Set<number>;
  currentPlayerIndex: number;
  players: CrocodilePlayer[];
  loserId: string | null;
}

/** 안전한 랜덤 인덱스 생성 (브라우저 crypto API 우선) */
export function generateTrapIndex(teethCount: number): number {
  if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] % teethCount;
  }
  return Math.floor(Math.random() * teethCount);
}

export function initCrocodileGame(
  players: CrocodilePlayer[],
  teethCount = DEFAULT_TEETH_COUNT,
  trapIndex?: number,
): CrocodileState {
  return {
    teethCount,
    trapIndex: trapIndex ?? generateTrapIndex(teethCount),
    pressedTeeth: new Set(),
    currentPlayerIndex: 0,
    players,
    loserId: null,
  };
}

export function pressTooth(
  state: CrocodileState,
  toothIndex: number,
): CrocodileState {
  if (state.loserId !== null) return state;
  if (state.pressedTeeth.has(toothIndex)) return state;

  const pressedTeeth = new Set(state.pressedTeeth);
  pressedTeeth.add(toothIndex);

  if (toothIndex === state.trapIndex) {
    return {
      ...state,
      pressedTeeth,
      loserId: state.players[state.currentPlayerIndex].userId,
    };
  }

  return {
    ...state,
    pressedTeeth,
    currentPlayerIndex: (state.currentPlayerIndex + 1) % state.players.length,
  };
}

export function isGameOver(state: CrocodileState): boolean {
  return state.loserId !== null;
}
