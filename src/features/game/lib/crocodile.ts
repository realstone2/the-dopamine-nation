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

export function initCrocodileGame(
  players: CrocodilePlayer[],
  teethCount = DEFAULT_TEETH_COUNT,
): CrocodileState {
  return {
    teethCount,
    trapIndex: Math.floor(Math.random() * teethCount),
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
