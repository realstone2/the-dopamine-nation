export interface MemberStats {
  userId: string;
  nickname: string;
  avatarUrl: string | null;
  role: string;
  wins: number;
  losses: number;
  gameBalance: number;
  manualBalance: number;
  totalBalance: number;
}

interface GameParticipant {
  user_id: string;
  result: string | null;
  dopamine_change: number;
}

interface ManualEntry {
  from_user: string;
  to_user: string;
  amount: number;
}

interface Member {
  user_id: string;
  role: string;
  users: { nickname: string; avatar_url: string | null } | null;
}

export function calculateMemberStats(
  members: Member[],
  gameParticipants: GameParticipant[],
  manualEntries: ManualEntry[],
): MemberStats[] {
  // 게임 참여 데이터를 유저별로 그룹핑 (O(n) 단일 패스)
  const gameByUser = new Map<string, { wins: number; losses: number; balance: number }>();
  for (const gp of gameParticipants) {
    const entry = gameByUser.get(gp.user_id) ?? { wins: 0, losses: 0, balance: 0 };
    if (gp.result === 'win') entry.wins++;
    if (gp.result === 'lose') entry.losses++;
    entry.balance += gp.dopamine_change ?? 0;
    gameByUser.set(gp.user_id, entry);
  }

  // 수동 입력 데이터를 유저별로 그룹핑 (O(n) 단일 패스)
  const manualByUser = new Map<string, number>();
  for (const me of manualEntries) {
    const amount = me.amount ?? 0;
    manualByUser.set(me.to_user, (manualByUser.get(me.to_user) ?? 0) + amount);
    manualByUser.set(me.from_user, (manualByUser.get(me.from_user) ?? 0) - amount);
  }

  return members.map((member) => {
    const userId = member.user_id;
    const game = gameByUser.get(userId) ?? { wins: 0, losses: 0, balance: 0 };
    const manualBalance = manualByUser.get(userId) ?? 0;

    return {
      userId,
      nickname: member.users?.nickname ?? '알 수 없음',
      avatarUrl: member.users?.avatar_url ?? null,
      role: member.role,
      wins: game.wins,
      losses: game.losses,
      gameBalance: game.balance,
      manualBalance,
      totalBalance: game.balance + manualBalance,
    };
  });
}
